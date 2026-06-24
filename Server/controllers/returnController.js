// controllers/returnController.js
const Razorpay = require("razorpay");
const {
  Return,
  ReturnMedia,
  Refund,
  ReverseShipment,
  Order,
  OrderItem,
  Product,
  User,
  Address,
  OrderStatusEmailAudit,
} = require("../models");
const { Op } = require("sequelize");
const { shiprocketPost, getPickupLocations } = require("../utils/shiprocket");
const { sendReturnNotificationEmail, sendOrderStatusEmail } = require("../utils/mailer");
const { referenceWhere } = require("../utils/referenceSlugs");
const { syncRefunds } = require("../utils/refundSync");

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const hoursSince = (date) => (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
const daysSince  = (date) => hoursSince(date) / 24;

const VALID_RETURN_STATUSES = [
  "pending_review", "approved", "rejected", "pickup_scheduled",
  "picked_up", "inspection_completed", "refund_initiated",
  "refund_completed", "replacement_shipped", "replacement_delivered",
  "cancelled",
];

const returnInclude = [
  { model: Order,           as: "order",           attributes: ["id","status","totalAmount","paymentType","paymentMethod","razorpayPaymentId","advancePaid","codAmount","shippingCharge","couponDiscount","taxAmount","createdAt","updatedAt","referenceSlug"] },
  { model: OrderItem,       as: "orderItem",        attributes: ["id","productId","productName","image","quantity","price","salesPrice","selectedVariantName","variantAttributes","customerChoices"] },
  { model: User,            as: "user",             attributes: ["id","name","email","phone"] },
  { model: ReturnMedia,     as: "media" },
  { model: Refund,          as: "refund" },
  { model: ReverseShipment, as: "reverseShipment" },
];

// ── POST /api/returns — Customer: create return request ──────────────────────
const createReturnRequest = async (req, res, next) => {
  try {
    const {
      orderId,
      orderItemId,
      returnType,
      reason,
      comments,
      return_quantity,
    } = req.body;

    // 1. Find order owned by this user
    const order = await Order.findOne({ where: { ...referenceWhere(orderId), userId: req.user.id } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 2. Order must be delivered
    if (order.status !== "delivered")
      return res.status(400).json({ message: "Returns are only accepted for delivered orders" });

    // 3. Return window check
    if (reason === "shipping_damage") {
      if (hoursSince(order.updatedAt) > 48)
        return res.status(400).json({ message: "Shipping damage claim window expired (48 hours from delivery)" });
    } else {
      if (daysSince(order.updatedAt) > 3)
        return res.status(400).json({ message: "Return window expired (3 days from delivery)" });
    }

    // 4. Find the specific order item
    const orderItem = await OrderItem.findOne({ where: { id: orderItemId, orderId: order.id } });
    if (!orderItem) return res.status(404).json({ message: "Order item not found" });

    // 5. Check product eligibility
    const product = await Product.findByPk(orderItem.productId);
    if (product && (product.isNonReturnable || product.isCustomisable))
      return res.status(400).json({ message: "This product is not eligible for return" });

    // 6. No existing active return for this item
    const existingReturn = await Return.findOne({
      where: {
        orderItemId,
        status: { [Op.notIn]: ["rejected"] },
      },
    });
    if (existingReturn)
      return res.status(400).json({ message: "A return request already exists for this item" });

    // 7. Proof upload validation
    const hasVideo  = req.files && req.files.video  && req.files.video.length  > 0;
    const hasImages = req.files && req.files.images && req.files.images.length > 0;
    if (!hasVideo && !hasImages)
      return res.status(400).json({ message: "At least one proof upload required (video or images)" });

    // 8. Quantity validation
    const qty = parseInt(return_quantity, 10);
    if (!qty || qty < 1 || qty > orderItem.quantity)
      return res.status(400).json({ message: `Return quantity must be between 1 and ${orderItem.quantity}` });

    // ── Create Return record ─────────────────────────────────────────────────
    const returnRequest = await Return.create({
      orderId: order.id,
      orderItemId,
      userId: req.user.id,
      returnType,
      reason,
      comments: comments || null,
      returnQuantity: qty,
      status: "pending_review",
    });

    // ── Create ReturnMedia records ───────────────────────────────────────────
    const mediaRecords = [];
    if (hasVideo) {
      for (const file of req.files.video) {
        mediaRecords.push({
          returnId: returnRequest.id,
          mediaType: "video",
          mediaUrl: `/uploads/returns/videos/${file.filename}`,
        });
      }
    }
    if (hasImages) {
      for (const file of req.files.images) {
        // enforce 5MB per image
        if (file.size > 5 * 1024 * 1024) {
          // skip oversized — multer limit already handles this but guard here too
          continue;
        }
        mediaRecords.push({
          returnId: returnRequest.id,
          mediaType: "image",
          mediaUrl: `/uploads/returns/images/${file.filename}`,
        });
      }
    }
    if (mediaRecords.length > 0) await ReturnMedia.bulkCreate(mediaRecords);

    // ── Fetch full return with associations for response/email ───────────────
    const fullReturn = await Return.findByPk(returnRequest.id, { include: returnInclude });

    // ── Send notification email ──────────────────────────────────────────────
    try {
      const userRecord = await User.findByPk(req.user.id, { attributes: ["name", "email"] });
      await sendReturnNotificationEmail({
        returnRequest: fullReturn,
        user: userRecord,
        order,
        orderItem,
        status: "return_submitted",
      });
    } catch (emailErr) {
      console.error("[Return Email] Failed:", emailErr.message);
    }

    return res.status(201).json(fullReturn);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/returns — Customer: my returns ───────────────────────────────────
const getMyReturns = async (req, res, next) => {
  try {
    const returns = await Return.findAll({
      where: { userId: req.user.id },
      include: returnInclude,
      order: [["createdAt", "DESC"]],
    });

    // Sync refund status from Razorpay in case webhook was missed (e.g. localhost, delay)
    await syncRefunds(returns);

    return res.json(returns);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/returns/:id — Customer: single return ────────────────────────────
const getReturnById = async (req, res, next) => {
  try {
    const returnRequest = await Return.findOne({
      where: referenceWhere(req.params.id),
      include: returnInclude,
    });
    if (!returnRequest) return res.status(404).json({ message: "Return not found" });
    if (returnRequest.userId !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    // Sync refund status from Razorpay in case webhook was missed
    await syncRefunds(returnRequest);

    return res.json(returnRequest);
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/returns/cancel-order/:orderId — Customer: cancel order ─────────
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { ...referenceWhere(req.params.orderId), userId: req.user.id },
      include: [{ model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }],
    });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Within 24 hours
    if (hoursSince(order.createdAt) > 24)
      return res.status(400).json({ message: "Cancellation window expired (24 hours from placement)" });

    // Status check
    const nonCancellableStatuses = ["confirmed", "shipped", "processing", "delivered", "cancelled"];
    if (nonCancellableStatuses.includes(order.status))
      return res.status(400).json({ message: "Order cannot be cancelled at this stage" });

    // Customised items
    if (order.status !== "pending" && order.items) {
      const hasCustom = order.items.some(
        (item) => 
          (item.product && item.product.isCustomisable) ||
          (item.customisationDetails && Object.keys(item.customisationDetails).length > 0)
      );
      if (hasCustom)
        return res.status(400).json({ message: "Customised items in production cannot be cancelled" });
    }

    // Update order status
    order.status = "cancelled";
    await order.save();

    // ── Refund based on payment type ─────────────────────────────────────────
    const paymentType = (order.paymentType || "").toUpperCase();
    if (paymentType === "PREPAID" && order.razorpayPaymentId) {
      try {
        const rzpRefund = await razorpay.payments.refund(order.razorpayPaymentId, {
          amount: Math.round(parseFloat(order.totalAmount) * 100),
          notes: { reason: "Order Cancelled by Customer", orderId: order.id },
        });
        await Refund.create({
          orderId:          order.id,
          returnId:         null, // order-level refund, no return record
          razorpayRefundId: rzpRefund.id,
          refundAmount:     parseFloat(order.totalAmount),
          refundStatus:     "initiated",
          refundMode:       "razorpay",
          manualRefundNotes: null,
        });
      } catch (rzpErr) {
        console.error("[Razorpay] Cancellation refund failed:", rzpErr.message);
        await Refund.create({
          orderId:          order.id,
          returnId:         null,
          razorpayRefundId: null,
          refundAmount:     parseFloat(order.totalAmount),
          refundStatus:     "failed",
          refundMode:       "razorpay",
          manualRefundNotes: `Automatic refund failed: ${rzpErr.message}`,
        });
      }
    } else if (paymentType === "PARTIAL_COD" && order.razorpayPaymentId) {
      try {
        const advancePaid = parseFloat(order.advancePaid || 0);
        const rzpRefund = await razorpay.payments.refund(order.razorpayPaymentId, {
          amount: Math.round(advancePaid * 100),
          notes: { reason: "Order Cancelled — Advance Refund", orderId: order.id },
        });
        await Refund.create({
          orderId:           order.id,
          returnId:          null,
          razorpayRefundId:  rzpRefund.id,
          refundAmount:      advancePaid,
          refundStatus:      "initiated",
          refundMode:        "razorpay",
          manualRefundNotes: "Order cancelled before delivery. Advance paid online was refunded. Remaining product value COD amount was never collected, so no offline refund is required.",
        });
      } catch (rzpErr) {
        console.error("[Razorpay] Partial COD cancellation refund failed:", rzpErr.message);
        await Refund.create({
          orderId:           order.id,
          returnId:          null,
          razorpayRefundId:  null,
          refundAmount:      parseFloat(order.advancePaid || 0),
          refundStatus:      "failed",
          refundMode:        "razorpay",
          manualRefundNotes: `Automatic refund failed: ${rzpErr.message}`,
        });
      }
    } else {
      // FULL_COD — manual offline
      await Refund.create({
        orderId:           order.id,
        returnId:          null,
        razorpayRefundId:  null,
        refundAmount:      0,
        refundStatus:      "manual_completed",
        refundMode:        "manual_offline",
        manualRefundNotes: "Cancelled before delivery — no payment collected, nothing to refund.",
      });
    }

    return res.json({ message: "Order cancelled successfully", order });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/returns/admin/all — Admin: all returns ───────────────────────────
const getAllReturns = async (req, res, next) => {
  try {
    const { status, return_type, type, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    
    const targetType = type || return_type;
    if (targetType && targetType !== 'all') {
      where.returnType = targetType;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate)   where.createdAt[Op.lte] = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    if (search) {
      const q = `%${search}%`;
      where[Op.or] = [
        { id: { [Op.like]: q } },
        { referenceSlug: { [Op.like]: q } },
        { '$user.name$': { [Op.like]: q } },
        { '$user.email$': { [Op.like]: q } },
        { '$order.reference_slug$': { [Op.like]: q } },
        { '$order.id$': { [Op.like]: q } },
      ];
    }

    // Compute stats for return statuses
    const statsQuery = await Return.findAll({
      attributes: [
        'status',
        [Return.sequelize.fn('COUNT', Return.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    const stats = {};
    statsQuery.forEach(item => {
      stats[item.status] = parseInt(item.get('count') || 0);
    });

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Return.findAndCountAll({
      where,
      include: [
        ...returnInclude,
      ],
      order: [["createdAt", "DESC"]],
      limit:  parseInt(limit),
      offset,
      distinct: true,
      subQuery: false,
    });

    // Sync refund status from Razorpay in case webhook was missed (e.g. localhost, delay)
    await syncRefunds(rows);

    return res.json({ returns: rows, total: count, page: parseInt(page), limit: parseInt(limit), stats });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/returns/admin/:id — Admin: return detail ────────────────────────
const getReturnByIdAdmin = async (req, res, next) => {
  try {
    const returnRequest = await Return.findOne({
      where: referenceWhere(req.params.id),
      include: [
        {
          model: Order, as: "order",
          include: [
            { model: Address, as: "shippingAddress" },
            { model: Address, as: "billingAddress" },
          ],
        },
        {
          model: OrderItem, as: "orderItem",
          include: [
            { model: Product, as: "product", attributes: ["id","name","sku","isNonReturnable","isCustomisable"] },
          ],
        },
        { model: User,            as: "user",           attributes: ["id","name","email","phone"] },
        { model: ReturnMedia,     as: "media" },
        { model: Refund,          as: "refund" },
        { model: ReverseShipment, as: "reverseShipment" },
      ],
    });
    if (!returnRequest) return res.status(404).json({ message: "Return not found" });

    // Sync refund status from Razorpay in case webhook was missed
    await syncRefunds(returnRequest);

    return res.json(returnRequest);
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/returns/admin/:id/status — Admin: update status ───────────────
const updateReturnStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const admin_notes = req.body.admin_notes || req.body.adminNote || req.body.adminNotes;

    if (status && !VALID_RETURN_STATUSES.includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const returnRequest = await Return.findByPk(req.params.id, { include: returnInclude });
    if (!returnRequest) return res.status(404).json({ message: "Return not found" });

    if (status)      returnRequest.status     = status;
    if (admin_notes) returnRequest.adminNotes = admin_notes;
    if (status === "rejected" && admin_notes) {
      returnRequest.rejectedReason = admin_notes;
    }
    await returnRequest.save();

    // If marked as refund_completed, update any associated manual offline refund status to manual_completed
    if (status === "refund_completed") {
      try {
        const refund = await Refund.findOne({ where: { returnId: returnRequest.id } });
        if (refund && refund.refundMode === "manual_offline") {
          refund.refundStatus = "manual_completed";
          refund.refundedAt = new Date();
          await refund.save();
        }
      } catch (refundErr) {
        console.error("[Return Status Update] Failed to complete associated manual refund:", refundErr.message);
      }
    }

    if (status === "refund_completed" || status === "replacement_delivered") {
      try {
        if (returnRequest.order) {
          returnRequest.order.status = "returned";
          await returnRequest.order.save();
        }
      } catch (orderErr) {
        console.error("[Return Status Update] Failed to update parent order status:", orderErr.message);
      }
    }

    // Send email if status changed
    if (status) {
      try {
        const user = await User.findByPk(returnRequest.userId, { attributes: ["name","email"] });
        await sendReturnNotificationEmail({
          returnRequest,
          user,
          order:     returnRequest.order,
          orderItem: returnRequest.orderItem,
          status,
          extra:     status === "rejected" ? { rejectedReason: admin_notes } : {},
        });
      } catch (emailErr) {
        console.error("[Return Email] Status update email failed:", emailErr.message);
      }
    }

    const updated = await Return.findByPk(req.params.id, { include: returnInclude });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

const resolveRefundStatus = (rzpRefund) =>
  rzpRefund?.status === 'processed' ? 'completed' : 'initiated';

// ── POST /api/returns/admin/:id/refund — Admin: approve refund ───────────────
const approveRefund = async (req, res, next) => {
  try {
    const returnRequest = await Return.findByPk(req.params.id, {
      include: [
        { model: Order,    as: "order"    },
        { model: OrderItem,as: "orderItem" },
        { model: Refund,   as: "refund"   },
      ],
    });
    if (!returnRequest) return res.status(404).json({ message: "Return not found" });
    if (returnRequest.refund)
      return res.status(400).json({ message: "Refund already processed for this return" });

    const order     = returnRequest.order;
    const orderItem = returnRequest.orderItem;
    if (!order) {
      return res.status(409).json({
        message: "This return's order record is missing or corrupted. Fix the order_id link before processing."
      });
    }
    const paymentType = (order.paymentType || "").toUpperCase();

    const productPrice = parseFloat(orderItem.salesPrice || orderItem.price || 0);
    const productValue = productPrice * returnRequest.returnQuantity;

    let refundRecord;

    if (paymentType === "PREPAID" && order.razorpayPaymentId) {
      const rzpRefund = await razorpay.payments.refund(order.razorpayPaymentId, {
        amount: Math.round(productValue * 100),
        notes:  { reason: "Return Approved", returnId: returnRequest.id },
      });
      refundRecord = await Refund.create({
        orderId:          order.id,
        returnId:         returnRequest.id,
        razorpayRefundId: rzpRefund.id,
        refundAmount:     productValue,
        refundStatus:     resolveRefundStatus(rzpRefund),
        refundedAt:       rzpRefund?.status === 'processed' ? new Date() : null,
        refundMode:       "razorpay",
      });
    } else if (paymentType === "PARTIAL_COD") {
      // PARTIAL_COD — advance is shipping charges (non-refundable), product refund must be manual offline
      refundRecord = await Refund.create({
        orderId:           order.id,
        returnId:          returnRequest.id,
        razorpayRefundId:  null,
        refundAmount:      productValue,
        refundStatus:      "manual_pending",
        refundMode:        "manual_offline",
        manualRefundNotes: req.body.manual_refund_notes || `Partial COD — Advance was shipping charges (non-refundable). Full product value ₹${productValue.toFixed(2)} must be refunded manually offline.`,
      });
    } else {
      // FULL_COD or no payment ID
      refundRecord = await Refund.create({
        orderId:           order.id,
        returnId:          returnRequest.id,
        razorpayRefundId:  null,
        refundAmount:      productValue,
        refundStatus:      "manual_pending",
        refundMode:        "manual_offline",
        manualRefundNotes: req.body.manual_refund_notes || "Full COD — manual refund required",
      });
    }

    returnRequest.status = refundRecord.refundStatus === 'completed'
      ? 'refund_completed'
      : 'refund_initiated';
    await returnRequest.save();

    if (returnRequest.status === "refund_completed") {
      try {
        order.status = "returned";
        await order.save();
      } catch (orderErr) {
        console.error("[Approve Refund] Failed to update parent order status:", orderErr.message);
      }
    }

    // Email
    try {
      const user = await User.findByPk(returnRequest.userId, { attributes: ["name","email"] });
      await sendReturnNotificationEmail({
        returnRequest,
        user,
        order,
        orderItem,
        status: returnRequest.status,
        extra:  { refundAmount: refundRecord.refundAmount, refundMode: refundRecord.refundMode },
      });
    } catch (emailErr) {
      console.error("[Return Email] Refund email failed:", emailErr.message);
    }

    const updated = await Return.findByPk(req.params.id, { include: returnInclude });
    return res.json({ message: "Refund initiated successfully", return: updated, refund: refundRecord });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/returns/admin/:id/replacement — Admin: approve replacement ──────
const approveReplacement = async (req, res, next) => {
  try {
    const returnRequest = await Return.findByPk(req.params.id, {
      include: [
        {
          model: Order, as: "order",
          include: [{ model: Address, as: "shippingAddress" }],
        },
        { model: OrderItem, as: "orderItem" },
        { model: User,      as: "user",     attributes: ["id","name","email","phone"] },
        { model: ReverseShipment, as: "reverseShipment" },
      ],
    });
    if (!returnRequest) return res.status(404).json({ message: "Return not found" });

    const order     = returnRequest.order;
    const orderItem = returnRequest.orderItem;
    const user      = returnRequest.user;

    if (!order) {
      return res.status(409).json({
        message: "This return's order record is missing or corrupted. Fix the order_id link before processing."
      });
    }
    if (!orderItem) {
      return res.status(409).json({ message: "Order item record is missing for this return." });
    }
    if (!user) {
      return res.status(409).json({ message: "User record is missing for this return." });
    }

    const address   = order.shippingAddress || {};

    const productPrice = parseFloat(orderItem.salesPrice || orderItem.price || 0);
    const subTotal     = productPrice * returnRequest.returnQuantity;

    let shipmentRecord = returnRequest.reverseShipment;

    try {
      // Step 1: Create Shiprocket forward order for replacement
      const srPayload = {
        order_id:                 `REPL-${returnRequest.id.slice(0, 8)}`,
        order_date:               new Date().toISOString().slice(0, 19).replace("T", " "),
        pickup_location:          process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
        channel_id:               "",
        comment:                  `Replacement for Return ${returnRequest.id}`,
        billing_customer_name:    address.firstName || address.fullName || user.name || "",
        billing_last_name:        address.lastName  || "",
        billing_address:          `${address.street || ""}${address.apartment ? ", " + address.apartment : ""}`,
        billing_city:             address.city     || "",
        billing_pincode:          String(address.pincode || ""),
        billing_state:            address.state    || "",
        billing_country:          address.country  || "India",
        billing_email:            user.email       || "",
        billing_phone:            String(address.phone || ""),
        shipping_is_billing:      true,
        order_items: [{
          name:          orderItem.productName,
          sku:           String(orderItem.selectedVariantId || orderItem.productId),
          units:         returnRequest.returnQuantity,
          selling_price: productPrice,
          discount:      0,
          tax:           0,
        }],
        payment_method: "Prepaid", // Kamali Gifts pays
        sub_total:      subTotal,
        length:         10,
        breadth:        10,
        height:         10,
        weight:         0.5,
      };

      const srResponse = await shiprocketPost("/orders/create/adhoc", srPayload);

      // Step 2: Assign AWB
      let awbCode        = null;
      let courierName    = null;
      let replacementTracking = null;

      if (srResponse?.shipment_id) {
        try {
          const awbResponse = await shiprocketPost("/courier/assign/awb", {
            shipment_id: String(srResponse.shipment_id),
          });
          awbCode     = awbResponse?.response?.data?.awb_code || null;
          courierName = awbResponse?.response?.data?.courier_name || null;
          replacementTracking = awbCode ? `https://shiprocket.co/tracking/${awbCode}` : null;

          // Step 3: Generate pickup
          await shiprocketPost("/courier/generate/pickup", {
            shipment_id: [String(srResponse.shipment_id)],
          });
        } catch (awbErr) {
          console.error("[Shiprocket] AWB assignment failed:", awbErr.message);
        }
      }

      // Step 4: Save to ReverseShipment
      if (shipmentRecord) {
        shipmentRecord.replacementShiprocketOrderId = srResponse?.order_id ? String(srResponse.order_id) : null;
        shipmentRecord.replacementAwb               = awbCode;
        shipmentRecord.replacementCourier           = courierName;
        shipmentRecord.replacementTrackingUrl       = replacementTracking;
        shipmentRecord.replacementDispatchedAt      = new Date();
        await shipmentRecord.save();
      } else {
        shipmentRecord = await ReverseShipment.create({
          returnId:                     returnRequest.id,
          replacementShiprocketOrderId: srResponse?.order_id ? String(srResponse.order_id) : null,
          replacementAwb:               awbCode,
          replacementCourier:           courierName,
          replacementTrackingUrl:       replacementTracking,
          replacementDispatchedAt:      new Date(),
        });
      }

      // Update return status
      returnRequest.status = "replacement_shipped";
      if (req.body.admin_notes) returnRequest.adminNotes = req.body.admin_notes;
      await returnRequest.save();

      // Email
      try {
        await sendReturnNotificationEmail({
          returnRequest,
          user,
          order,
          orderItem,
          status: "replacement_shipped",
          extra:  { replacementAwb: awbCode, replacementTrackingUrl: replacementTracking },
        });
      } catch (emailErr) {
        console.error("[Return Email] Replacement email failed:", emailErr.message);
      }
    } catch (srErr) {
      console.error("[Shiprocket] Replacement order failed:", srErr?.response?.data || srErr.message);
      return res.status(500).json({ message: "Failed to create replacement shipment in Shiprocket", error: srErr.message });
    }

    const updated = await Return.findByPk(req.params.id, { include: returnInclude });
    return res.json({ message: "Replacement shipment created and status updated", return: updated });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/returns/admin/:id/reject — Admin: reject return ─────────────────
const rejectReturn = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: "Rejection reason is required" });

    const returnRequest = await Return.findByPk(req.params.id, { include: returnInclude });
    if (!returnRequest) return res.status(404).json({ message: "Return not found" });

    returnRequest.status         = "rejected";
    returnRequest.rejectedReason = reason;
    await returnRequest.save();

    // Email
    try {
      const user = await User.findByPk(returnRequest.userId, { attributes: ["name","email"] });
      await sendReturnNotificationEmail({
        returnRequest,
        user,
        order:     returnRequest.order,
        orderItem: returnRequest.orderItem,
        status:    "return_rejected",
        extra:     { rejectedReason: reason },
      });
    } catch (emailErr) {
      console.error("[Return Email] Rejection email failed:", emailErr.message);
    }

    const updated = await Return.findByPk(req.params.id, { include: returnInclude });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/returns/admin/:id/reverse-pickup — Admin: create reverse pickup ─
const createReversePickup = async (req, res, next) => {
  try {
    const returnRequest = await Return.findByPk(req.params.id, {
      include: [
        {
          model: Order, as: "order",
          include: [{ model: Address, as: "shippingAddress" }],
        },
        { model: OrderItem,       as: "orderItem" },
        { model: ReverseShipment, as: "reverseShipment" },
      ],
    });
    if (!returnRequest) return res.status(404).json({ message: "Return not found" });

    const order     = returnRequest.order;
    const orderItem = returnRequest.orderItem;
    if (!order) {
      return res.status(409).json({
        message: "This return's order record is missing or corrupted. Fix the order_id link before processing."
      });
    }
    const address   = order.shippingAddress || {};

    const productPrice = parseFloat(orderItem.salesPrice || orderItem.price || 0);

    let product = null;
    try {
      product = await require("../models").Product.findByPk(orderItem.productId, { attributes: ["sku","name","shippingWeight","shippingDimensions"] });
    } catch (_) {}

    let variant = null;
    if (orderItem.selectedVariantId) {
      try {
        variant = await require("../models").Variant.findByPk(orderItem.selectedVariantId, { attributes: ["id","sku","shippingWeight","shippingDimensions"] });
      } catch (_) {}
    }

    const weight = parseFloat(variant?.shippingWeight) || parseFloat(product?.shippingWeight) || 0.5;
    let dims = variant?.shippingDimensions || product?.shippingDimensions;
    if (typeof dims === "string") {
      try { dims = JSON.parse(dims); } catch (_) { dims = null; }
    }
    const length = dims?.length ? parseFloat(dims.length) : 10;
    const breadth = dims?.breadth ? parseFloat(dims.breadth) : 10;
    const height = dims?.height ? parseFloat(dims.height) : 10;

    let whAddress = process.env.WAREHOUSE_ADDRESS;
    let whCity    = process.env.WAREHOUSE_CITY;
    let whPincode = process.env.WAREHOUSE_PINCODE;
    let whState   = process.env.WAREHOUSE_STATE;
    let whPhone   = process.env.WAREHOUSE_PHONE;
    let whEmail   = process.env.WAREHOUSE_EMAIL;

    if (!whAddress || !whCity || !whPincode || !whState || !whPhone || !whEmail) {
      try {
        console.log("[Shiprocket] Warehouse variables missing from env, fetching from account...");
        const locations = await getPickupLocations();
        const targetName = (process.env.SHIPROCKET_PICKUP_LOCATION || "").toLowerCase();
        const match = locations.find(loc => (loc.pickup_location || "").toLowerCase() === targetName) ||
                      locations.find(loc => loc.is_primary_location === 1) ||
                      locations[0];
        if (match) {
          if (!whAddress) whAddress = `${match.address}${match.address_2 ? ", " + match.address_2 : ""}`;
          if (!whCity) whCity = match.city;
          if (!whPincode) whPincode = match.pin_code;
          if (!whState) whState = match.state;
          if (!whPhone) whPhone = match.phone;
          if (!whEmail) whEmail = match.email;
          console.log(`[Shiprocket] Resolved warehouse location dynamically: ${whAddress}, ${whCity} (${whPincode}), Phone: ${whPhone}, Email: ${whEmail}`);
        }
      } catch (locErr) {
        console.error("[Shiprocket] Dynamic warehouse resolution failed:", locErr.message);
      }
    }

    const srPayload = {
      order_id:   returnRequest.id,
      order_date: new Date(returnRequest.createdAt).toISOString().slice(0, 19).replace("T", " "),
      pickup_customer_name: `${address.firstName || ""} ${address.lastName || ""}`.trim() || address.fullName || "Customer",
      pickup_phone:         String(address.phone || ""),
      pickup_address:       `${address.street || ""}${address.apartment ? ", " + address.apartment : ""}`,
      pickup_city:          address.city    || "",
      pickup_state:         address.state   || "",
      pickup_pincode:       String(address.pincode || ""),
      pickup_country:       "India",
      shipping_customer_name: "Kamali Gifts",
      shipping_address:     whAddress || "",
      shipping_city:        whCity || "",
      shipping_pincode:     String(whPincode || ""),
      shipping_state:       whState || "",
      shipping_country:     "India",
      shipping_phone:       String(whPhone || "6382488167"),
      shipping_email:       whEmail || "harishsangaran96@gmail.com",
      payment_method:       "Prepaid", // Always Prepaid for reverse pickups — no COD collection
                                    // happens on returns regardless of the original order payment type.
      sub_total:            productPrice * returnRequest.returnQuantity,
      order_items: [{
        name:          orderItem.productName,
        sku:           String(product?.sku || orderItem.productId),
        units:         returnRequest.returnQuantity,
        selling_price: productPrice,
      }],
      length: Math.round(length),
      breadth: Math.round(breadth),
      height: Math.round(height),
      weight: parseFloat(weight.toFixed(3)),
    };

    const srResponse = await shiprocketPost("/orders/create/return", srPayload);

    // Save or update ReverseShipment
    let awbCode     = srResponse?.awb_code || null;
    let courierName = srResponse?.courier_name || null;

    if (srResponse?.shipment_id && !awbCode) {
      try {
        console.log(`[Shiprocket] Auto-assigning AWB for reverse pickup shipment ${srResponse.shipment_id}...`);
        const awbResponse = await shiprocketPost("/courier/assign/awb", {
          shipment_id: String(srResponse.shipment_id),
        });
        awbCode     = awbResponse?.response?.data?.awb_code || null;
        courierName = awbResponse?.response?.data?.courier_name || null;
        console.log(`[Shiprocket] Reverse pickup AWB auto-assigned: ${awbCode} via ${courierName}`);
      } catch (awbErr) {
        console.error("[Shiprocket] Reverse pickup AWB assignment failed:", awbErr.message);
      }
    }

    let shipmentRecord = returnRequest.reverseShipment;
    const newData = {
      shiprocketReturnId: srResponse?.order_id ? String(srResponse.order_id) : null,
      awbCode:            awbCode,
      courierName:        courierName,
      pickupStatus:       "scheduled",
      trackingUrl:        awbCode
        ? `https://shiprocket.co/tracking/${awbCode}`
        : null,
    };

    if (shipmentRecord) {
      Object.assign(shipmentRecord, newData);
      await shipmentRecord.save();
    } else {
      await ReverseShipment.create({ returnId: returnRequest.id, ...newData });
    }

    returnRequest.status = "pickup_scheduled";
    await returnRequest.save();

    // Email
    try {
      const user = await User.findByPk(returnRequest.userId, { attributes: ["name","email"] });
      await sendReturnNotificationEmail({
        returnRequest,
        user,
        order,
        orderItem,
        status: "pickup_scheduled",
        extra:  { awbCode: newData.awbCode, courierName: newData.courierName },
      });
    } catch (emailErr) {
      console.error("[Return Email] Pickup scheduled email failed:", emailErr.message);
    }

    const updated = await Return.findByPk(req.params.id, { include: returnInclude });
    return res.json({ message: "Reverse pickup created successfully", return: updated });
  } catch (err) {
    console.error("[Shiprocket Reverse Pickup] Error:", err?.response?.data || err.message);
    next(err);
  }
};

// ── POST /api/returns/webhook/shiprocket-return — Shiprocket auto-webhook ─────
const mapShiprocketStatusToOrderStatus = (srStatus) => {
  if (!srStatus) return null;
  const statusLower = srStatus.toLowerCase();

  // "delivered" -> delivered
  if (statusLower.includes("delivered")) {
    return "delivered";
  }

  // "out for delivery" or "out_for_delivery" -> processing (which displays as "Out for Delivery" in Admin UI)
  if (statusLower.includes("out for delivery") || statusLower.includes("out_for_delivery")) {
    return "processing";
  }

  // "shipped", "dispatched", "picked up", "picked_up", "in transit", "in_transit", "pickup done" -> shipped
  if (
    statusLower.includes("shipped") ||
    statusLower.includes("dispatched") ||
    statusLower.includes("picked up") ||
    statusLower.includes("picked_up") ||
    statusLower.includes("in transit") ||
    statusLower.includes("in_transit") ||
    statusLower.includes("pickup done")
  ) {
    return "shipped";
  }

  // "cancelled" or "canceled" -> cancelled
  if (statusLower.includes("cancelled") || statusLower.includes("canceled")) {
    return "cancelled";
  }

  // "rto" or "returned" -> returned
  if (statusLower.includes("rto") || statusLower.includes("returned")) {
    return "returned";
  }

  return null;
};

const recordOrderStatusEmailAuditHelper = async ({
  orderId,
  previousStatus,
  newStatus,
  emailSent,
  emailSentAt = null,
  errorMessage = null,
}) => {
  try {
    await OrderStatusEmailAudit.create({
      orderId,
      previousStatus,
      newStatus,
      emailSent,
      emailSentAt,
      errorMessage,
    });
  } catch (auditErr) {
    console.error("[Audit Webhook] Failed to record order status email audit:", auditErr.message);
  }
};

// ── POST /api/returns/webhook/shiprocket-return — Shiprocket auto-webhook ─────
const handleShiprocketReturnWebhook = async (req, res) => {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const awb           = body?.awb || body?.data?.awb;
    const shiprocketStatus = body?.current_status || body?.data?.current_status || "";
    const shiprocketOrderId = body?.order_id || body?.data?.order_id;

    // Find the ReverseShipment by AWB or Shiprocket Return/Order ID (check both reverse and replacement fields)
    const shipment = await ReverseShipment.findOne({
      where: {
        [Op.or]: [
          awb ? { awbCode: awb } : null,
          awb ? { replacementAwb: awb } : null,
          shiprocketOrderId ? { shiprocketReturnId: String(shiprocketOrderId) } : null,
          shiprocketOrderId ? { replacementShiprocketOrderId: String(shiprocketOrderId) } : null,
        ].filter(Boolean),
      },
    });
    
    if (shipment) {
      const isReplacement = (awb && shipment.replacementAwb === awb) || 
                            (shiprocketOrderId && shipment.replacementShiprocketOrderId === String(shiprocketOrderId));

      if (isReplacement) {
        if (awb && shipment.replacementAwb !== awb) {
          shipment.replacementAwb = awb;
          shipment.replacementTrackingUrl = `https://shiprocket.co/tracking/${awb}`;
        }
        const courier = body?.courier_name || body?.data?.courier_name;
        if (courier && shipment.replacementCourier !== courier) {
          shipment.replacementCourier = courier;
        }
        await shipment.save();

        const returnRequest = await Return.findByPk(shipment.returnId, {
          include: [
            { model: Order,    as: "order"    },
            { model: OrderItem,as: "orderItem" },
          ],
        });
        if (!returnRequest) return res.status(200).json({ received: true });

        const statusLower = shiprocketStatus.toLowerCase();
        let newStatus = null;

        if (statusLower.includes("delivered")) {
          newStatus = "replacement_delivered";
        } else if (
          statusLower.includes("shipped") ||
          statusLower.includes("dispatched") ||
          statusLower.includes("picked up") ||
          statusLower.includes("picked_up") ||
          statusLower.includes("in transit") ||
          statusLower.includes("in_transit") ||
          statusLower.includes("pickup done")
        ) {
          newStatus = "replacement_shipped";
        }

        if (newStatus && newStatus !== returnRequest.status) {
          returnRequest.status = newStatus;
          await returnRequest.save();

          try {
            const user = await User.findByPk(returnRequest.userId, { attributes: ["name","email"] });
            await sendReturnNotificationEmail({
              returnRequest,
              user,
              order:     returnRequest.order,
              orderItem: returnRequest.orderItem,
              status:    newStatus,
            });
          } catch (emailErr) {
            console.error("[Replacement Email] Webhook email failed:", emailErr.message);
          }
        }
        return res.status(200).json({ received: true, type: "replacement_shipment", returnId: returnRequest.id });
      }

      // If we matched by shiprocketReturnId and awbCode was not yet set, update it now
      if (awb && shipment.awbCode !== awb) {
        shipment.awbCode = awb;
        shipment.trackingUrl = `https://shiprocket.co/tracking/${awb}`;
      }
      const courier = body?.courier_name || body?.data?.courier_name;
      if (courier && shipment.courierName !== courier) {
        shipment.courierName = courier;
      }

      const returnRequest = await Return.findByPk(shipment.returnId, {
        include: [
          { model: Order,    as: "order"    },
          { model: OrderItem,as: "orderItem" },
        ],
      });
      if (!returnRequest) return res.status(200).json({ received: true });

      // Update pickup status on shipment
      shipment.pickupStatus = shiprocketStatus;
      await shipment.save();

      // Map Shiprocket status to return status
      const statusLower = shiprocketStatus.toLowerCase();
      let newStatus = null;

      if (statusLower.includes("pickup done") || statusLower.includes("picked up") || statusLower.includes("picked_up") || statusLower.includes("pickup_done"))
        newStatus = "picked_up";
      else if (statusLower.includes("delivered") || statusLower.includes("rto delivered") || statusLower.includes("rto_delivered"))
        newStatus = "inspection_completed";
      else if (statusLower.includes("in transit") || statusLower.includes("in_transit"))
        newStatus = returnRequest.status === "picked_up" ? null : "picked_up";

      if (newStatus && newStatus !== returnRequest.status) {
        returnRequest.status = newStatus;
        await returnRequest.save();

        // Email
        try {
          const user = await User.findByPk(returnRequest.userId, { attributes: ["name","email"] });
          await sendReturnNotificationEmail({
            returnRequest,
            user,
            order:     returnRequest.order,
            orderItem: returnRequest.orderItem,
            status:    newStatus,
          });
        } catch (emailErr) {
          console.error("[Return Email] Webhook email failed:", emailErr.message);
        }
      }

      return res.status(200).json({ received: true, type: "reverse_shipment", returnId: returnRequest.id });
    }

    // ── Forward Shipment (Order) Handling ──
    const shiprocketShipmentId = body?.shipment_id || body?.data?.shipment_id;

    if (!shiprocketOrderId && !shiprocketShipmentId) {
      return res.status(200).json({ received: true, message: "No identifiers found for forward shipment" });
    }

    // Find the Order by shiprocketOrderId or shiprocketShipmentId
    const order = await Order.findOne({
      where: {
        [Op.or]: [
          shiprocketOrderId ? { shiprocketOrderId: String(shiprocketOrderId) } : null,
          shiprocketShipmentId ? { shiprocketShipmentId: String(shiprocketShipmentId) } : null,
        ].filter(Boolean),
      },
    });

    if (!order) {
      return res.status(200).json({ received: true, message: "Order not found" });
    }

    // Map shiprocketStatus to Order.status
    const mappedStatus = mapShiprocketStatusToOrderStatus(shiprocketStatus);
    const previousStatus = order.status;

    // Update deliveryStatus if available
    if (shiprocketStatus) {
      order.deliveryStatus = shiprocketStatus;
    }
    if (awb && order.awbCode !== awb) {
      order.awbCode = awb;
    }
    const courierName = body?.courier_name || body?.data?.courier_name;
    if (courierName && order.courier !== courierName) {
      order.courier = courierName;
    }

    // Save if changed but no status update (otherwise status update transaction below will save it)
    const statusChanged = mappedStatus && mappedStatus !== previousStatus;
    if (!statusChanged && order.changed()) {
      await order.save();
    }

    // Helper: determine if order is a COD order
    const isCodOrderCheck = (ord, webhookBody) => {
      const paymentType = (ord.paymentType || "").toUpperCase();
      const paymentMethod = (ord.paymentMethod || "").toLowerCase();
      const webhookPaymentMethod = (webhookBody?.payment_method || webhookBody?.data?.payment_method || "").toUpperCase();
      return (
        paymentType === "FULL_COD" ||
        paymentType === "PARTIAL_COD" ||
        paymentMethod === "cod" ||
        paymentMethod === "partial_cod" ||
        webhookPaymentMethod === "COD"
      );
    };

    // Edge case: Shiprocket says "delivered" but order was ALREADY delivered manually —
    // still auto-mark COD as collected if not already done.
    if (
      mappedStatus === "delivered" &&
      previousStatus === "delivered" &&
      !order.codCollected &&
      isCodOrderCheck(order, body)
    ) {
      order.codCollected = true;
      order.paymentStatus = "paid";
      await order.save();
      console.log(`[Webhook] Auto-marked COD as collected for already-delivered order ${order.id}`);
      return res.status(200).json({ received: true, type: "forward_shipment_cod_collected", orderId: order.id });
    }

    // If mappedStatus matches one of our allowed order statuses and is different from current status
    if (mappedStatus && mappedStatus !== previousStatus) {
      const transaction = await Order.sequelize.transaction();
      let transactionCommitted = false;
      try {
        order.status = mappedStatus;

        // If COD/Partial COD order is delivered, mark paymentStatus as paid and codCollected as true
        if (mappedStatus === "delivered" && isCodOrderCheck(order, body)) {
          order.codCollected = true;
          order.paymentStatus = "paid";
        }

        // Handle inventory restoration if status changed to cancelled / returned / rto
        const targetStatuses = ["cancelled", "returned", "rto"];
        if (targetStatuses.includes(mappedStatus.toLowerCase())) {
          if (order.inventoryProcessed && !order.inventoryRestored) {
            const inventoryService = require("../services/inventoryService");
            await inventoryService.restoreOrderStock(order.id, transaction, `Order Status Update (Auto) - ${mappedStatus}`);
          }
        }

        await order.save({ transaction });

        // Also update all OrderItem statuses
        await OrderItem.update(
          { status: mappedStatus },
          {
            where: {
              orderId: order.id,
              [Op.or]: [
                { status: { [Op.notIn]: ["cancelled", "returned"] } },
                { status: { [Op.is]: null } },
              ],
            },
            transaction,
          }
        );

        await transaction.commit();
        transactionCommitted = true;
      } catch (dbErr) {
        if (!transactionCommitted) {
          await transaction.rollback();
        }
        throw dbErr;
      }

      // Fetch updated order for email notification
      const updatedOrder = await Order.findByPk(order.id, {
        include: [
          { model: OrderItem, as: "items" },
          { model: Address, as: "shippingAddress" },
          { model: Address, as: "billingAddress" },
        ],
      });

      // Send Status Email Notification
      const audit = {
        orderId: order.id,
        previousStatus,
        newStatus: mappedStatus,
        emailSent: false,
        emailSentAt: null,
        errorMessage: null,
      };

      try {
        const userRecord = await User.findByPk(order.userId, {
          attributes: ["name", "email"],
        });

        const trackingUrl = `https://shiprocket.co/tracking/${awb || ""}`;

        const emailResult = await sendOrderStatusEmail({
          order: updatedOrder,
          user: {
            name: userRecord?.name,
            email: userRecord?.email,
          },
          status: mappedStatus,
          trackingDetails: {
            trackingUrl: trackingUrl,
            shiprocketTrackingUrl: trackingUrl,
            shiprocketOrderId: updatedOrder.shiprocketOrderId,
            shiprocketShipmentId: updatedOrder.shiprocketShipmentId,
          },
        });

        audit.emailSent = Boolean(emailResult?.sent);
        audit.emailSentAt = emailResult?.sentAt || null;
        audit.errorMessage = audit.emailSent ? null : (emailResult?.reason || "Email not sent");
      } catch (emailErr) {
        audit.errorMessage = emailErr?.message || "Failed to send status email";
        console.error("[Mailer] Failed to send order status email on webhook auto-update:", audit.errorMessage);
      }

      await recordOrderStatusEmailAuditHelper(audit);
    } else {
      // If status didn't map to a new value but we updated deliveryStatus
      await order.save();
    }

    return res.status(200).json({ received: true, type: "forward_shipment", orderId: order.id });
  } catch (err) {
    console.error("[Shiprocket Return Webhook] Error:", err.message);
    return res.status(200).json({ received: true }); // Always 200 to prevent Shiprocket retries
  }
};

module.exports = {
  createReturnRequest,
  getMyReturns,
  getReturnById,
  cancelOrder,
  getAllReturns,
  getReturnByIdAdmin,
  updateReturnStatus,
  approveRefund,
  approveReplacement,
  rejectReturn,
  createReversePickup,
  handleShiprocketReturnWebhook,
};
