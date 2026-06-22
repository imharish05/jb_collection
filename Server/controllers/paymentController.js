// controllers/paymentController.js
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const { Order, CartItem, User, Refund, Return } = require('../models');
const sequelize = require('../config/database');
const inventoryService = require('../services/inventoryService');
const { sendOrderConfirmationEmail, sendAdminNewOrderEmail } = require('../utils/mailer');
const { pushOrderToShiprocket } = require('./orderController');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// Creates a Razorpay order. Amount in rupees → converted to paise.
// For PARTIAL_COD: pass the advance amount (delivery charge), not totalAmount.
// ─────────────────────────────────────────────────────────────────────────────
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', dbOrderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const options = {
      amount:   Math.round(amount * 100), // paise
      currency,
      receipt:  `receipt_${Date.now()}`,
      notes:    dbOrderId ? { dbOrderId: String(dbOrderId) } : {},
    };

    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-delivery-charge-order
// Legacy endpoint kept for backward compat.
// Prefer /create-order with { amount: advancePaid, dbOrderId } instead.
// ─────────────────────────────────────────────────────────────────────────────
const createDeliveryChargeOrder = async (req, res, next) => {
  try {
    const { deliveryCharge, currency = 'INR', dbOrderId } = req.body;

    if (!deliveryCharge || deliveryCharge <= 0) {
      return res.status(400).json({ message: 'Valid delivery charge amount is required' });
    }

    const options = {
      amount:  Math.round(deliveryCharge * 100),
      currency,
      receipt: `del_${Date.now()}`,
      notes:   { type: 'delivery_charge_only', dbOrderId: dbOrderId ? String(dbOrderId) : '' },
    };

    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CORE: processSuccessfulPayment
//
// Single source of truth for all online payment processing.
// Called by verifyPayment() (frontend) and handlePaymentWebhook() (Razorpay).
// Fully idempotent.
//
// PARTIAL_COD flow:
//   1. Order created with paymentType="PARTIAL_COD", codAmount=totalAmount-advancePaid
//   2. Customer pays advancePaid via Razorpay → verify called
//   3. This function:
//      a. Records razorpayPaymentId, marks advancePaid, paymentStatus="partial"
//      b. Decrements inventory
//      c. Status → "confirmed"
//      d. Post-commit: sends email + pushes to Shiprocket
//   4. Shiprocket receives payment_method="COD", cod_amount=order.codAmount ← THE FIX
//      (courier collects remaining balance at door)
// ─────────────────────────────────────────────────────────────────────────────
// ── Map Razorpay method string → our internal paymentMethod key ───────────────
const mapRazorpayMethod = (rzpMethod) => {
  if (!rzpMethod) return 'razorpay';
  const m = rzpMethod.toLowerCase();
  if (m === 'upi')        return 'upi';
  if (m === 'card')       return 'card';
  if (m === 'netbanking') return 'netbanking';
  if (m === 'wallet')     return 'wallet';
  if (m === 'emi')        return 'card'; // EMI is card-based
  return 'razorpay';
};

const processSuccessfulPayment = async (orderId, paymentId, paymentSource, isDeliveryCharge = false, razorpayOrderId = null) => {
  const transaction = await sequelize.transaction();
  let userEmail = '';
  let userId    = null;

  try {
    const order = await Order.findByPk(orderId, { transaction, lock: true });
    if (!order) {
      await transaction.rollback();
      return { success: false, message: 'Order not found', status: 404 };
    }

    // Idempotency guard
    if (order.inventoryProcessed) {
      await transaction.rollback();
      return { success: true, message: 'Payment already processed', order };
    }

    userId = order.userId;
    const paymentType = (order.paymentType || '').toUpperCase();

    // Save Razorpay Order ID if provided
    if (razorpayOrderId) {
      order.razorpayOrderId = razorpayOrderId;
    }

    // ── Update payment identifiers ───────────────────────────────────────────
    if (paymentType === 'PARTIAL_COD' || isDeliveryCharge) {
      // Partial COD advance payment
      order.razorpayPaymentId          = paymentId;
      order.transactionId              = paymentId; // keep legacy field in sync
      order.deliveryChargePaid         = true;       // legacy compat
      order.deliveryChargeTransactionId = paymentId; // legacy compat
      order.paymentStatus              = 'partial';
      order.paymentMethod              = 'partial_cod';
      order.paymentType                = 'PARTIAL_COD';

      // Ensure codAmount is set (guard against orders created before v2 migration)
      if (!order.codAmount && order.totalAmount && order.advancePaid) {
        const computed = parseFloat(order.totalAmount) - parseFloat(order.advancePaid);
        order.codAmount = Math.max(0, computed);
      }

      // Double-check: cod_amount must never be negative before Shiprocket push
      const codAmountCheck = parseFloat(order.codAmount || 0);
      if (codAmountCheck < 0) {
        await transaction.rollback();
        return {
          success: false,
          message: `COD amount (${codAmountCheck}) is negative. Cannot process.`,
          status: 400,
        };
      }
    } else {
      // Full prepaid payment — fetch actual method from Razorpay
      let actualMethod = 'razorpay';
      try {
        const rzpPayment = await razorpay.payments.fetch(paymentId);
        actualMethod = mapRazorpayMethod(rzpPayment.method);
        if (rzpPayment.order_id && !order.razorpayOrderId) {
          order.razorpayOrderId = rzpPayment.order_id;
        }
      } catch (fetchErr) {
        console.warn('[Payment] Could not fetch Razorpay payment method, defaulting to razorpay:', fetchErr.message);
      }
      order.razorpayPaymentId = paymentId;
      order.transactionId     = paymentId;
      order.paymentStatus     = 'paid';
      order.paymentMethod     = actualMethod;  // e.g. 'upi', 'card', 'netbanking'
      order.paymentType       = 'PREPAID';
      order.codAmount         = 0;
    }

    // ── Decrement inventory ──────────────────────────────────────────────────
    try {
      await inventoryService.decrementOrderStock(
        orderId,
        transaction,
        paymentType === 'PARTIAL_COD' || isDeliveryCharge
          ? 'Partial COD Advance Payment'
          : 'Razorpay Payment Success',
        paymentSource
      );
    } catch (stockErr) {
      console.error('[Inventory] OOS conflict after payment for order', orderId, ':', stockErr.message);
      order.status        = 'inventory_failed';
      order.paymentStatus = 'failed';
      await order.save({ transaction });
      await transaction.commit();

      setImmediate(async () => {
        try {
          const userRecord = await User.findByPk(userId, { attributes: ['name', 'email'] });
          console.error(`[Admin Alert] Order ${orderId} inventory_failed. Customer: ${userRecord?.email}. Reason: ${stockErr.message}`);
        } catch (_) {}
      });

      return {
        success: false,
        message: `Payment received but stock unavailable: ${stockErr.message}`,
        status: 409,
        inventoryFailed: true,
      };
    }

    order.inventoryProcessed = true;
    order.status = 'pending';
    await order.save({ transaction });
    await transaction.commit();

    // ── Post-commit: cart clear, confirmation email ──────────────────────────
    setImmediate(async () => {
      try {
        await CartItem.destroy({ where: { userId } });
        console.log(`[Cart] Cleared for user ${userId}`);

        const userRecord = await User.findByPk(userId, { attributes: ['name', 'email'] });
        userEmail = userRecord?.email || '';

        const freshOrder = await Order.findByPk(orderId, {
          include: [
            { model: require('../models').OrderItem, as: 'items' },
            { model: require('../models').Address, as: 'shippingAddress' },
            { model: require('../models').Address, as: 'billingAddress' },
          ],
        });

        if (userEmail) {
          await sendOrderConfirmationEmail(freshOrder, { name: userRecord.name, email: userEmail });
          console.log(`[Mailer] Confirmation sent to ${userEmail}`);
        }

        try {
          await sendAdminNewOrderEmail(freshOrder, { name: userRecord?.name, email: userEmail });
        } catch (adminEmailErr) {
          console.error('[Mailer] Failed to send admin email notification:', adminEmailErr.message);
        }

        try {
          console.log(`[Shiprocket] Auto-pushing order ${orderId} after successful payment...`);
          await pushOrderToShiprocket(orderId, userEmail);
        } catch (srErr) {
          console.error('[Shiprocket] Auto-push failed after successful payment:', srErr.message);
        }
      } catch (postErr) {
        console.error('[Post-Payment] Error in post-commit operations:', postErr.message);
      }
    });

    return { success: true, message: 'Payment processed successfully', order, actualPaymentMethod: order.paymentMethod };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/verify
// Frontend Razorpay handler() callback.
// Verifies HMAC signature → delegates to processSuccessfulPayment().
// ─────────────────────────────────────────────────────────────────────────────
const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      dbOrderId,
      isDeliveryCharge,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !dbOrderId) {
      return res.status(400).json({ message: 'Missing required payment verification fields' });
    }

    // Verify Razorpay HMAC
    const body     = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed: Invalid signature' });
    }

    const result = await processSuccessfulPayment(
      dbOrderId,
      razorpay_payment_id,
      'frontend_verify',
      isDeliveryCharge === true || isDeliveryCharge === 'true',
      razorpay_order_id
    );

    if (!result.success && result.status === 404) return res.status(404).json({ message: result.message });
    if (!result.success && result.status === 400) return res.status(400).json({ message: result.message });
    if (!result.success && result.status === 409) {
      return res.status(409).json({ message: result.message, inventoryFailed: result.inventoryFailed });
    }

    return res.json({
      success: true,
      message: result.message,
      order: result.order,
      actualPaymentMethod: result.actualPaymentMethod || result.order?.paymentMethod || 'razorpay',
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/webhook
// Razorpay backend webhook. Idempotent with processSuccessfulPayment().
// Register WITHOUT protect middleware (Razorpay has no auth token).
// ─────────────────────────────────────────────────────────────────────────────
const handlePaymentWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('[Webhook] RAZORPAY_WEBHOOK_SECRET not set. Skipped.');
      return res.status(200).json({ message: 'Webhook received but not configured' });
    }

    const receivedSignature = req.headers['x-razorpay-signature'];
    if (!receivedSignature) {
      return res.status(400).json({ message: 'Missing webhook signature header' });
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    req.body = JSON.parse(rawBody);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== receivedSignature) {
      console.error('[Webhook] Invalid signature');
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event   = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.failed') {
      const razorpayOrderId = payload?.payment?.entity?.order_id;
      const razorpayPaymentId = payload?.payment?.entity?.id;
      const failureReason = payload?.payment?.entity?.error_description || 'Payment failed';

      if (!razorpayOrderId) {
        console.error('[Webhook] Missing order_id in payment.failed payload');
        return res.status(400).json({ message: 'Missing order_id' });
      }

      let rzpOrder;
      try {
        rzpOrder = await razorpay.orders.fetch(razorpayOrderId);
      } catch (fetchErr) {
        console.error('[Webhook] Failed to fetch Razorpay order for failed payment:', fetchErr.message);
        return res.status(200).json({ message: 'Could not fetch Razorpay order' });
      }

      const dbOrderId = rzpOrder?.notes?.dbOrderId || null;
      if (!dbOrderId) {
        console.warn('[Webhook] dbOrderId not in Razorpay notes for failed payment:', razorpayOrderId);
        return res.status(200).json({ message: 'dbOrderId not in notes. Skipping.' });
      }

      const transaction = await sequelize.transaction();
      try {
        const order = await Order.findByPk(dbOrderId, { transaction, lock: true });
        if (!order) {
          await transaction.rollback();
          console.warn(`[Webhook] Order ${dbOrderId} not found for failed payment`);
          return res.status(404).json({ message: 'Order not found' });
        }

        if (order.inventoryProcessed) {
          await transaction.rollback();
          console.log(`[Webhook] Order ${dbOrderId} already processed successfully. Ignoring failure event.`);
          return res.status(200).json({ message: 'Order already processed successfully' });
        }

        order.paymentStatus = 'failed';
        order.paymentFailureReason = failureReason;
        if (razorpayPaymentId) {
          order.razorpayPaymentId = razorpayPaymentId;
          order.transactionId = razorpayPaymentId;
        }
        if (razorpayOrderId) {
          order.razorpayOrderId = razorpayOrderId;
        }
        await order.save({ transaction });
        await transaction.commit();

        console.log(`[Webhook] Recorded failed payment for order ${dbOrderId}. Reason: ${failureReason}`);
        return res.status(200).json({ received: true, success: true, message: 'Failed payment recorded' });
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    if (event === 'refund.processed') {
      const razorpayRefundId = payload?.refund?.entity?.id;
      if (razorpayRefundId) {
        const refundRecord = await Refund.findOne({ where: { razorpayRefundId } });
        if (refundRecord) {
          refundRecord.refundStatus = 'completed';
          refundRecord.refundedAt   = new Date();
          await refundRecord.save();
          if (refundRecord.returnId) {
            await Return.update(
              { status: 'refund_completed' },
              { where: { id: refundRecord.returnId } }
            );
          }
        }
      }
      return res.status(200).json({ received: true });
    }

    if (event === 'refund.failed') {
      const razorpayRefundId = payload?.refund?.entity?.id;
      if (razorpayRefundId) {
        const refundRecord = await Refund.findOne({ where: { razorpayRefundId } });
        if (refundRecord) {
          refundRecord.refundStatus = 'failed';
          await refundRecord.save();
        }
      }
      return res.status(200).json({ received: true });
    }

    if (event !== 'payment.captured' && event !== 'order.paid') {
      return res.status(200).json({ message: `Event ${event} acknowledged, not processed` });
    }

    const razorpayOrderId  = payload?.payment?.entity?.order_id || payload?.order?.entity?.id;
    const razorpayPaymentId = payload?.payment?.entity?.id;

    if (!razorpayOrderId || !razorpayPaymentId) {
      console.error('[Webhook] Missing order_id or payment_id in payload');
      return res.status(400).json({ message: 'Missing order_id or payment_id' });
    }

    let rzpOrder;
    try {
      rzpOrder = await razorpay.orders.fetch(razorpayOrderId);
    } catch (fetchErr) {
      console.error('[Webhook] Failed to fetch Razorpay order:', fetchErr.message);
      return res.status(200).json({ message: 'Could not fetch Razorpay order' });
    }

    const dbOrderId = rzpOrder?.notes?.dbOrderId || null;
    if (!dbOrderId) {
      console.warn('[Webhook] dbOrderId not in Razorpay notes for:', razorpayOrderId);
      return res.status(200).json({ message: 'dbOrderId not in notes. Skipping.' });
    }

    const isDeliveryCharge = rzpOrder?.notes?.type === 'delivery_charge_only';
    const result = await processSuccessfulPayment(dbOrderId, razorpayPaymentId, 'webhook', isDeliveryCharge, razorpayOrderId);

    console.log(`[Webhook] Processed order ${dbOrderId}: success=${result.success}`);
    return res.status(200).json({ received: true, success: result.success, message: result.message });
  } catch (err) {
    console.error('[Webhook] Unhandled error:', err.message);
    return res.status(200).json({ received: true, success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/transactions
// Fetches a paginated list of transaction logs and overall summary metrics.
// ─────────────────────────────────────────────────────────────────────────────
const getPaymentTransactions = async (req, res, next) => {
  try {
    const { status, dateRange, from, to, page = 1, limit = 10, search } = req.query;
    const limitVal = parseInt(limit, 10);
    const offsetVal = (parseInt(page, 10) - 1) * limitVal;

    const { buildDateWhere } = require('./reportController');
    const dateWhere = buildDateWhere({ dateRange, from, to });
    const whereClause = { ...dateWhere };

    if (status && status !== 'all') {
      whereClause.paymentStatus = status;
    }

    const { Op } = require('sequelize');
    const includeUser = {
      model: User,
      attributes: ['name', 'email'],
      required: false,
    };

    if (search) {
      whereClause[Op.or] = [
        { id: { [Op.like]: `%${search}%` } },
        { razorpayPaymentId: { [Op.like]: `%${search}%` } },
        { razorpayOrderId: { [Op.like]: `%${search}%` } },
        { '$User.email$': { [Op.like]: `%${search}%` } },
      ];
    }

    // Get paginated rows and total count
    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [includeUser],
      order: [['createdAt', 'DESC']],
      limit: limitVal,
      offset: offsetVal,
      distinct: true,
    });

    // Get all matching rows without pagination for calculating overall stats
    // We ignore the paymentStatus filter for overall metrics so filters on the table do not distort KPIs.
    const statsWhereClause = { ...whereClause };
    delete statsWhereClause.paymentStatus;

    const allFilteredOrders = await Order.findAll({
      where: statsWhereClause,
      include: [includeUser],
      attributes: ['totalAmount', 'paymentStatus', 'advancePaid', 'codAmount', 'paymentType'],
      raw: true,
    });

    let totalSuccessfulAmount = 0;
    let totalSuccessfulCount = 0;
    let totalFailedCount = 0;
    let totalFailedAmount = 0;

    allFilteredOrders.forEach(o => {
      const amt = parseFloat(o.totalAmount || 0);
      const adv = parseFloat(o.advancePaid || 0);
      const cod = parseFloat(o.codAmount || 0);
      const isPartialCod = o.paymentType === 'PARTIAL_COD';

      if (o.paymentStatus === 'paid') {
        totalSuccessfulAmount += amt;
        totalSuccessfulCount++;
      } else if (o.paymentStatus === 'partial') {
        // Online advance payment successful, remaining COD is pending
        totalSuccessfulAmount += adv;
        totalSuccessfulCount++;
      } else if (o.paymentStatus === 'failed') {
        if (isPartialCod && adv > 0) {
          // Online advance was successfully captured, but the cash delivery part failed
          totalSuccessfulAmount += adv;
          totalSuccessfulCount++;
          totalFailedAmount += cod;
          totalFailedCount++;
        } else {
          totalFailedAmount += amt;
          totalFailedCount++;
        }
      }
    });

    const totalAttempts = totalSuccessfulCount + totalFailedCount;
    const successRate = totalAttempts > 0 ? (totalSuccessfulCount / totalAttempts) * 100 : 0;

    const transactions = rows.map(order => ({
      orderId: order.id,
      razorpayPaymentId: order.razorpayPaymentId || '—',
      razorpayOrderId: order.razorpayOrderId || '—',
      customerName: order.User?.name || 'Guest',
      customerEmail: order.User?.email || '—',
      amount: parseFloat(order.totalAmount || 0),
      paymentMethod: order.paymentMethod || '—',
      paymentStatus: order.paymentStatus || '—',
      paymentType: order.paymentType || 'PREPAID',
      advancePaid: order.advancePaid ? parseFloat(order.advancePaid) : 0,
      codAmount: order.codAmount ? parseFloat(order.codAmount) : 0,
      codCollected: order.codCollected || false,
      paymentFailureReason: order.paymentFailureReason || null,
      createdAt: order.createdAt,
    }));

    res.json({
      success: true,
      total: count,
      page: parseInt(page, 10),
      limit: limitVal,
      totalPages: Math.ceil(count / limitVal),
      stats: {
        totalSuccessfulAmount: Math.round(totalSuccessfulAmount * 100) / 100,
        totalSuccessfulCount,
        totalFailedCount,
        totalFailedAmount: Math.round(totalFailedAmount * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
      },
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRazorpayOrder,
  createDeliveryChargeOrder,
  verifyPayment,
  handlePaymentWebhook,
  processSuccessfulPayment,
  getPaymentTransactions,
};