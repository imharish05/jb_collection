// controllers/paymentController.js
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Order, CartItem, User } = require('../models');
const sequelize = require('../config/database');
const inventoryService = require('../services/inventoryService');
const { sendOrderConfirmationEmail } = require('../utils/mailer');
const { pushOrderToShiprocket } = require('./orderController');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// Call BEFORE launching Razorpay — creates Razorpay order, returns order_id
// ─────────────────────────────────────────────────────────────────────────────
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', dbOrderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: dbOrderId ? { dbOrderId: String(dbOrderId) } : {},
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-delivery-charge-order
// Partial COD: creates Razorpay order for delivery charge ONLY
// ─────────────────────────────────────────────────────────────────────────────
const createDeliveryChargeOrder = async (req, res, next) => {
  try {
    const { deliveryCharge, currency = 'INR', dbOrderId } = req.body;

    if (!deliveryCharge || deliveryCharge <= 0) {
      return res.status(400).json({ message: 'Valid delivery charge amount is required' });
    }

    const options = {
      amount: Math.round(deliveryCharge * 100),
      currency,
      receipt: `del_${Date.now()}`,
      notes: { type: 'delivery_charge_only', dbOrderId: dbOrderId ? String(dbOrderId) : '' },
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CORE: processSuccessfulPayment(orderId, paymentId, paymentSource, isDeliveryCharge)
//
// This is the SINGLE source of truth for all online payment processing.
// Both verifyPayment() and handlePaymentWebhook() delegate here.
//
// It is fully idempotent — safe to call multiple times with the same orderId.
// ─────────────────────────────────────────────────────────────────────────────
const processSuccessfulPayment = async (orderId, paymentId, paymentSource, isDeliveryCharge = false) => {
  const transaction = await sequelize.transaction();
  let userEmail = '';
  let userId = null;

  try {
    // Step 1: Acquire exclusive write lock on the order row
    const order = await Order.findByPk(orderId, { transaction, lock: true });
    if (!order) {
      await transaction.rollback();
      return { success: false, message: 'Order not found', status: 404 };
    }

    // Step 2: Idempotency — prevent duplicate processing
    if (order.inventoryProcessed) {
      await transaction.rollback();
      return { success: true, message: 'Payment already processed', order };
    }

    userId = order.userId;

    // Step 3: Update payment identifiers on the order
    if (isDeliveryCharge) {
      order.deliveryChargePaid = true;
      order.deliveryChargeTransactionId = paymentId;
      order.paymentStatus = 'partial';
      order.paymentMethod = 'partial_cod';
    } else {
      order.paymentStatus = 'paid';
      order.paymentMethod = 'razorpay';
      order.transactionId = paymentId;
    }

    // Step 4: Attempt inventory deduction under lock
    try {
      await inventoryService.decrementOrderStock(
        orderId,
        transaction,
        isDeliveryCharge ? 'Partial COD Advance Payment' : 'Razorpay Payment Success',
        paymentSource
      );
    } catch (stockErr) {
      // Out-of-stock conflict AFTER payment — flag order as inventory_failed
      console.error('[Inventory] OOS conflict after payment for order', orderId, ':', stockErr.message);
      order.status = 'inventory_failed';
      order.paymentStatus = 'failed';
      await order.save({ transaction });
      await transaction.commit();

      // Non-blocking notifications
      setImmediate(async () => {
        try {
          const userRecord = await User.findByPk(userId, { attributes: ['name', 'email'] });
          console.error(`[Admin Alert] Order ${orderId} marked inventory_failed. Customer: ${userRecord?.email}. Reason: ${stockErr.message}`);
          // Extend here: send admin email / create refund request
        } catch (e) { /* no-op */ }
      });

      return {
        success: false,
        message: `Payment received but stock unavailable: ${stockErr.message}`,
        status: 409,
        inventoryFailed: true,
      };
    }

    // Step 5: Mark inventory as processed and order as confirmed
    order.inventoryProcessed = true;
    order.status = 'confirmed';
    await order.save({ transaction });

    // Step 6: Commit transaction
    await transaction.commit();

    // Step 7: Post-commit — clear cart, send email, push Shiprocket (all non-blocking)
    setImmediate(async () => {
      try {
        // Clear the user's cart
        await CartItem.destroy({ where: { userId } });
        console.log(`[Cart] Cart cleared for user ${userId} after payment success.`);

        // Fetch user for email
        const userRecord = await User.findByPk(userId, { attributes: ['name', 'email'] });
        userEmail = userRecord?.email || '';

        if (userEmail) {
          const freshOrder = await Order.findByPk(orderId, {
            include: [
              { model: require('../models').OrderItem, as: 'items' },
              { model: require('../models').Address, as: 'shippingAddress' },
              { model: require('../models').Address, as: 'billingAddress' },
            ],
          });
          await sendOrderConfirmationEmail(freshOrder, { name: userRecord.name, email: userEmail });
          console.log(`[Mailer] Confirmation email sent to ${userEmail}`);
        }

        // Push to Shiprocket
        await pushOrderToShiprocket(orderId, userEmail);
      } catch (postErr) {
        console.error('[Post-Payment] Error in post-commit operations:', postErr.message);
      }
    });

    return { success: true, message: 'Payment processed successfully', order };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/verify
// Called by the frontend Razorpay handler() callback.
// Verifies signature, then delegates to processSuccessfulPayment().
// ─────────────────────────────────────────────────────────────────────────────
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId, isDeliveryCharge } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !dbOrderId) {
      return res.status(400).json({ message: 'Missing required payment verification fields' });
    }

    // Verify Razorpay HMAC signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed: Invalid signature' });
    }

    // Delegate entirely to the unified processor
    const result = await processSuccessfulPayment(
      dbOrderId,
      razorpay_payment_id,
      'frontend_verify',
      isDeliveryCharge === true || isDeliveryCharge === 'true'
    );

    if (!result.success && result.status === 404) {
      return res.status(404).json({ message: result.message });
    }
    if (!result.success && result.status === 409) {
      return res.status(409).json({ message: result.message, inventoryFailed: result.inventoryFailed });
    }

    return res.json({ success: true, message: result.message, order: result.order });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/webhook
// Razorpay Backend Webhook — fires regardless of whether the frontend verified.
// Verifies webhook signature using RAZORPAY_WEBHOOK_SECRET, then delegates
// to processSuccessfulPayment().
//
// IMPORTANT: This route must be registered WITHOUT the `protect` middleware
// in server.js, since Razorpay calls it without a user auth token.
// ─────────────────────────────────────────────────────────────────────────────
const handlePaymentWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('[Webhook] RAZORPAY_WEBHOOK_SECRET is not set. Webhook processing skipped.');
      return res.status(200).json({ message: 'Webhook received but not configured' });
    }

    // Verify Razorpay webhook signature
    const receivedSignature = req.headers['x-razorpay-signature'];
    if (!receivedSignature) {
      return res.status(400).json({ message: 'Missing webhook signature header' });
    }

    // express.raw() gives us a Buffer — convert to string for HMAC + JSON parse
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    req.body = JSON.parse(rawBody); // re-parse so the rest of the handler can use req.body normally
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== receivedSignature) {
      console.error('[Webhook] Invalid signature received');
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Only handle payment captured events
    if (event !== 'payment.captured' && event !== 'order.paid') {
      return res.status(200).json({ message: `Event ${event} acknowledged but not processed` });
    }

    // Extract order and payment details
    const razorpayOrderId = payload?.payment?.entity?.order_id || payload?.order?.entity?.id;
    const razorpayPaymentId = payload?.payment?.entity?.id;

    if (!razorpayOrderId || !razorpayPaymentId) {
      console.error('[Webhook] Missing order_id or payment_id in payload');
      return res.status(400).json({ message: 'Missing order_id or payment_id in webhook payload' });
    }

    // Find the DB order by Razorpay notes or by a receipt lookup
    // The receipt is set as `receipt_${Date.now()}` or `del_${Date.now()}` when creating the Razorpay order.
    // We will find it using the Razorpay order details API.
    let rzpOrder;
    try {
      rzpOrder = await razorpay.orders.fetch(razorpayOrderId);
    } catch (fetchErr) {
      console.error('[Webhook] Failed to fetch Razorpay order:', fetchErr.message);
      return res.status(200).json({ message: 'Could not fetch Razorpay order details' });
    }

    // The DB order ID was passed in the Razorpay order notes (set by frontend before opening Razorpay)
    // or we can find it by matching the receipt. For robustness, we search order notes first.
    const dbOrderId = rzpOrder?.notes?.dbOrderId || null;

    if (!dbOrderId) {
      // Fallback: try to find order by transactionId or deliveryChargeTransactionId
      console.warn('[Webhook] dbOrderId not found in Razorpay order notes for Razorpay order:', razorpayOrderId);
      return res.status(200).json({ message: 'dbOrderId not found in notes. Skipping.' });
    }

    const isDeliveryCharge = rzpOrder?.notes?.type === 'delivery_charge_only';

    // Delegate entirely to the unified processor
    const result = await processSuccessfulPayment(
      dbOrderId,
      razorpayPaymentId,
      'webhook',
      isDeliveryCharge
    );

    console.log(`[Webhook] Processed order ${dbOrderId}: success=${result.success}, message=${result.message}`);

    // Always respond 200 to Razorpay to prevent retries
    return res.status(200).json({ received: true, success: result.success, message: result.message });
  } catch (err) {
    console.error('[Webhook] Unhandled error:', err.message);
    // Respond 200 to Razorpay even on errors to prevent endless retries
    return res.status(200).json({ received: true, success: false, message: err.message });
  }
};

module.exports = {
  createRazorpayOrder,
  createDeliveryChargeOrder,
  verifyPayment,
  handlePaymentWebhook,
  processSuccessfulPayment,
};
