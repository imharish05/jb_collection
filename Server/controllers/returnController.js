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
    if (product && product.isNonReturnable)
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
            { model: Product, as: "product", attributes: ["id","name","sku","isNonReturnable"] },
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

    const awbCode = `REPL-AWB-${returnRequest.id.slice(0, 8).toUpperCase()}`;
    const courierName = "Standard Shipping";
    const replacementTracking = null;

    // Save to ReverseShipment
    if (shipmentRecord) {
      shipmentRecord.replacementShiprocketOrderId = null;
      shipmentRecord.replacementAwb               = awbCode;
      shipmentRecord.replacementCourier           = courierName;
      shipmentRecord.replacementTrackingUrl       = replacementTracking;
      shipmentRecord.replacementDispatchedAt      = new Date();
      await shipmentRecord.save();
    } else {
      shipmentRecord = await ReverseShipment.create({
        returnId:                     returnRequest.id,
        replacementShiprocketOrderId: null,
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
};
