// controllers/orderController.js
const {
  Order,
  CartItem,
  User,
  Product,
  Variant,
  OrderItem,
  Address,
  Coupon,
  OrderStatusEmailAudit,
  Role,
} = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const { sendOrderConfirmationEmail, sendOrderStatusEmail, sendAdminNewOrderEmail } = require("../utils/mailer");
const { shiprocketPost, resolveShiprocketPaymentMethod } = require("../utils/shiprocket");
const inventoryService = require("../services/inventoryService");
const { referenceWhere, getDisplayReference } = require("../utils/referenceSlugs");
const { createOrderNotification } = require("../services/inventoryService");

// ─── KGF Order Number Generator ──────────────────────────────────────────────
// Generates a unique, sequential order number like KGF-000001.
// Uses MAX() on existing order_number values so it is race-safe for low-to-medium
// traffic sites; no separate counter table needed.
// ─────────────────────────────────────────────────────────────────────────────
// pushOrderToShiprocket
//
// Called AFTER payment is verified (or immediately for pure COD).
// Determines payment_method and cod_amount based on order.paymentType:
//
//   PARTIAL_COD → payment_method="COD", cod_amount = order.codAmount
//                 (customer pays remaining balance at door)
//   FULL_COD    → payment_method="COD", cod_amount = order.totalAmount
//   PREPAID     → payment_method="Prepaid", cod_amount = 0
//
// sub_total is ALWAYS the full order value (Shiprocket uses it for declared value).
// ─────────────────────────────────────────────────────────────────────────────
const pushOrderToShiprocket = async (orderId, userEmail = "") => {
  try {
    const order = await Order.findByPk(orderId, {
      include: [
        { model: OrderItem, as: "items" },
        { model: Address, as: "shippingAddress" },
      ],
    });

    if (!order || !order.shippingAddress) {
      console.warn(`[Shiprocket] Order or shipping address not found for order ${orderId}`);
      return;
    }

    const addr = order.shippingAddress;
    const orderRef = getDisplayReference(order, order.id);

    // Build line items for Shiprocket
    const srItems = order.items.map((item) => ({
      name: item.productName,
      sku: String(item.selectedVariantId || item.productId),
      units: item.quantity,
      selling_price: parseFloat(item.salesPrice || item.price || 0),
      discount: parseFloat(item.discount || 0),
      tax: 0,
      hsn: 0,
    }));

    // ── KEY FIX: resolve payment method + COD amount ──────────────────────────
    const { payment_method, cod_amount } = resolveShiprocketPaymentMethod(order);

    console.log(
      `[Shiprocket] Order ${orderRef} | paymentType=${order.paymentType} | ` +
      `payment_method=${payment_method} | cod_amount=${cod_amount} | ` +
      `sub_total=${order.totalAmount}`
    );

    // sub_total = full order value (NOT just what was paid online).
    // Shiprocket uses this for insurance / declared value.
    // For COD/Partial COD, this is the full product cost.
    const subTotal = parseFloat(order.totalAmount) - parseFloat(order.shippingCharge || 0);

    const srPayload = {
      order_id: String(orderRef),
      order_date: new Date(order.createdAt).toISOString().slice(0, 19).replace("T", " "),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",

      // Billing details
      billing_customer_name: addr.firstName || addr.fullName || "",
      billing_last_name: addr.lastName || "",
      billing_address: `${addr.street}${addr.apartment ? ", " + addr.apartment : ""}`,
      billing_city: addr.city,
      billing_pincode: String(addr.pincode),
      billing_state: addr.state,
      billing_country: addr.country || "India",
      billing_email: userEmail || "",
      billing_phone: String(addr.phone),

      // Shipping = billing (same address)
      shipping_is_billing: true,

      // Order items
      order_items: srItems,

      // ── CRITICAL: COD fields ──────────────────────────────────────────────
      payment_method,          // "COD" or "Prepaid"
      sub_total: subTotal,     // Full declared value of goods

      // cod_amount: amount courier will collect at delivery.
      //   PARTIAL_COD → remaining balance (totalAmount - advancePaid)
      //   FULL_COD    → full totalAmount
      //   PREPAID     → 0 (omitted / not collected)
      ...(payment_method === "COD" && { cod_amount: cod_amount }),

      // Package dimensions (defaults — update per product category if needed)
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    const srResponse = await shiprocketPost("/orders/create/adhoc", srPayload);
    console.log(
      "[Shiprocket] Order created | SR order_id:", srResponse?.order_id,
      "| shipment_id:", srResponse?.shipment_id,
      "| channel_order_id:", srResponse?.channel_order_id
    );

    if (srResponse?.order_id) {
      await Order.update(
        {
          shiprocketOrderId: String(srResponse.order_id),
          shiprocketShipmentId: srResponse.shipment_id ? String(srResponse.shipment_id) : null,
        },
        { where: { id: order.id } }
      );
    }
  } catch (srErr) {
    // Log full Shiprocket error response for debugging
    console.error(
      "[Shiprocket] Failed to create order:",
      srErr?.response?.data || srErr.message
    );
  }
};

// Dashboard status map: dashboard param → DB ENUM
const STATUS_MAP = {
  new:       "pending",
  confirmed: "confirmed",
  shipped:   "shipped",
  delivery:  "processing",
  delivered: "delivered",
  cancelled: "cancelled",
  returned:  "returned",
};

const ORDER_ITEM_STATUS_OPTIONS = [
  "pending", "confirmed", "processing", "shipped",
  "delivered", "cancelled", "returned",
];

const findOrderForUser = (identifier, userId, options = {}) =>
  Order.findOne({
    ...options,
    where: {
      userId,
      ...referenceWhere(identifier),
      ...(options.where || {}),
    },
  });

const findOrderAny = (identifier, options = {}) =>
  Order.findOne({
    ...options,
    where: {
      ...referenceWhere(identifier),
      ...(options.where || {}),
    },
  });

const recordOrderStatusEmailAudit = async ({
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
    console.error("[Audit] Failed to record order status email audit:", auditErr.message);
  }
};

// ─── GET /api/orders  (customer — own orders) ─────────────────────────────────
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            { model: require("../models").Product, as: "product", attributes: ["id", "referenceSlug", "sku", "isNonReturnable", "isCustomisable"] },
            { model: require("../models").Return, as: "returns" }
          ]
        },
        { model: Address, as: "shippingAddress" },
        { model: Address, as: "billingAddress" },
        { model: require("../models").Refund, as: "refunds" }
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.json(orders);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/orders/:id  (customer — single order) ──────────────────────────
const getOrderById = async (req, res, next) => {
  try {
    const order = await findOrderForUser(req.params.id, req.user.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            { model: require("../models").Product, as: "product", attributes: ["id", "referenceSlug", "sku", "isNonReturnable", "isCustomisable"] },
            { model: require("../models").Return, as: "returns" }
          ]
        },
        { model: Address, as: "shippingAddress" },
        { model: Address, as: "billingAddress" },
        { model: require("../models").Refund, as: "refunds" }
      ],
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/orders  (customer — create order) ──────────────────────────────
//
// Partial COD flow:
//   1. Frontend sends paymentMethod="partial_cod", advancePaid=<delivery charge>
//   2. We compute codAmount = totalAmount - advancePaid (validated >= 0)
//   3. Order saved with paymentType="PARTIAL_COD", status="pending"
//   4. Frontend then calls /api/payment/create-order with amount=advancePaid
//   5. After Razorpay callback, /api/payment/verify is called
//   6. paymentController.processSuccessfulPayment() updates order + calls pushOrderToShiprocket
//   7. Shiprocket receives payment_method="COD", cod_amount=codAmount ← THE FIX
//
// ─── POST /api/orders  (customer — create order) ──────────────────────────────
const createOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      items,
      totalAmount,
      shippingAddressId,
      billingAddressId,
      paymentMethod,
      couponCode,
      couponDiscount,    // ← receive from frontend
      taxAmount,         // ← NEW: receive tax from frontend (also accept gstAmount)
      gstAmount,         // ← NEW: alias
      notes,
      shippingCharge,
      estimatedDeliveryDays,
      advancePaid: clientAdvancePaid,
    } = req.body;

    // Accept either taxAmount or gstAmount (frontend uses gstAmount)
    const receivedTax = parseFloat(taxAmount ?? gstAmount ?? 0) || 0;

    const shippingId = shippingAddressId || req.body.shippingAddress?.id;
    const billingId  = billingAddressId  || req.body.billingAddress?.id || null;

    if (!items || !items.length || !totalAmount || !shippingId) {
      await transaction.rollback();
      return res.status(400).json({
        message: "items, totalAmount and shippingAddressId are required",
      });
    }

    const shippingAddress = await Address.findOne({
      where: { id: shippingId, userId: req.user.id },
      transaction,
    });
    if (!shippingAddress) {
      await transaction.rollback();
      return res.status(404).json({ message: "Shipping address not found" });
    }

    let billingAddressRef = billingId;
    if (billingAddressRef) {
      const billingAddress = await Address.findOne({
        where: { id: billingAddressRef, userId: req.user.id },
        transaction,
      });
      if (!billingAddress) {
        await transaction.rollback();
        return res.status(404).json({ message: "Billing address not found" });
      }
    } else {
      billingAddressRef = shippingAddress.id;
    }

    // ── STOCK VALIDATION: check BEFORE creating order ────────────────────────
    // This prevents checkout session creation for out-of-stock products.
    // Returns 400 with "Product is out of stock" so frontend can show correct message.
    try {
      await inventoryService.validateOrderStock(items, transaction);
    } catch (stockErr) {
      await transaction.rollback();
      // Normalize message for out-of-stock vs other validation errors
      const msg = stockErr.message;
      const isOOS = /insufficient stock|out of stock|stock.*0|available.*0/i.test(msg);
      return res.status(400).json({
        success: false,
        message: isOOS ? "Product is out of stock" : msg,
        outOfStock: isOOS,
      });
    }

    // Compute server-side total and enrich items
    let serverComputedSubtotal = 0;
    const itemsWithDetails = [];

    for (const item of items) {
      let itemPrice = 0;
      let itemData = { ...item };
      const isComboItem = item.isCombo === true || item.isCombo === "true";

      if (item.selectedVariantId) {
        const variant = await Variant.findByPk(item.selectedVariantId, { transaction });
        const product = await Product.findByPk(item.productId, { transaction });
        if (!variant) {
          await transaction.rollback();
          return res.status(404).json({ message: `Variant ${item.selectedVariantId} not found` });
        }
        if (!product) {
          await transaction.rollback();
          return res.status(404).json({ message: `Product ${item.productId} not found` });
        }
        itemPrice = parseFloat(variant.salesPrice || variant.mrp || 0);
        itemData.productName = product.name;
        itemData.selectedVariantId   = variant.id;
        itemData.selectedVariantName = variant.variantName || null;
        itemData.variantAttributes   = variant.attributes || [];
        itemData.image    = variant.image || product.image || [];
        itemData.mrp      = variant.mrp || null;
        itemData.salesPrice = variant.salesPrice || null;
      } else {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) {
          await transaction.rollback();
          return res.status(404).json({ message: `Product ${item.productId} not found` });
        }
        itemPrice = parseFloat(item.price || product.price || 0);
        itemData.productName        = isComboItem ? (item.comboName || item.name || product.name) : product.name;
        itemData.selectedVariantId   = null;
        itemData.selectedVariantName = null;
        itemData.variantAttributes   = [];
        itemData.image = item.image || product.image || [];
      }

      itemData.isCombo      = isComboItem;
      itemData.rootComboId  = item.rootComboId  || null;
      itemData.childComboId = item.childComboId || null;
      itemData.comboName    = item.comboName || item.name || null;
      itemData.comboType    = item.comboType || null;
      itemData.selectedProducts = item.selectedProducts || null;
      itemData.customerChoices = item.customerChoices || null;
      itemData.comboSnapshot = isComboItem ? {
        comboId: item.childComboId,
        comboName: item.comboName || item.name || null,
        comboType: item.comboType || null,
        selectedProducts: item.selectedProducts || null,
        quantities: item.quantity,
        pricing: itemPrice,
      } : null;

      serverComputedSubtotal += itemPrice * item.quantity;
      itemsWithDetails.push(itemData);
    }

    // Coupon validation
    let serverCouponDiscount = 0;
    let normalizedCouponCode = couponCode || null;

    if (normalizedCouponCode) {
      const coupon = await Coupon.findOne({
        where: { code: normalizedCouponCode, is_active: true },
        transaction,
      });
      if (!coupon) {
        await transaction.rollback();
        return res.status(400).json({ message: "Invalid coupon code" });
      }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        await transaction.rollback();
        return res.status(400).json({ message: "Coupon has expired" });
      }
      if (serverComputedSubtotal < parseFloat(coupon.min_order || 0)) {
        await transaction.rollback();
        return res.status(400).json({ message: `Minimum order of ₹${coupon.min_order} required` });
      }
      serverCouponDiscount = coupon.type === "percent"
        ? (serverComputedSubtotal * parseFloat(coupon.value || 0)) / 100
        : parseFloat(coupon.value || 0);
      if (coupon.max_discount) {
        serverCouponDiscount = Math.min(serverCouponDiscount, parseFloat(coupon.max_discount));
      }
      serverCouponDiscount = parseFloat(serverCouponDiscount.toFixed(2));
      normalizedCouponCode = coupon.code;
    } else if (parseFloat(couponDiscount || 0) > 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Coupon code is required for a discount" });
    }

    // ── Server-side total validation ─────────────────────────────────────────
    const clientTotal      = parseFloat(totalAmount);
    const minimumAllowedTotal = Math.max(0, serverComputedSubtotal - serverCouponDiscount);
    if (clientTotal < minimumAllowedTotal - 1) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Order total too low. Expected ₹${minimumAllowedTotal.toFixed(2)}, got ₹${clientTotal.toFixed(2)}`,
        expectedMinimum: minimumAllowedTotal,
        receivedTotal: clientTotal,
      });
    }

    // ── Resolve payment type and COD amounts ─────────────────────────────────
    const pm = (paymentMethod || "cod").toLowerCase();
    const isPartialCod = pm === "partial_cod";
    const isCod        = pm === "cod";

    let resolvedPaymentType = "FULL_COD";
    let resolvedAdvancePaid = null;
    let resolvedCodAmount   = null;

    if (isPartialCod) {
      resolvedPaymentType = "PARTIAL_COD";
      resolvedAdvancePaid = parseFloat(clientAdvancePaid || shippingCharge || 0);
      resolvedCodAmount   = parseFloat(totalAmount) - resolvedAdvancePaid;

      if (resolvedCodAmount < 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Invalid Partial COD: advance paid (₹${resolvedAdvancePaid}) exceeds total (₹${totalAmount}).`,
          advancePaid: resolvedAdvancePaid,
          totalAmount: parseFloat(totalAmount),
          codAmount: resolvedCodAmount,
        });
      }
    } else if (isCod) {
      resolvedPaymentType = "FULL_COD";
      resolvedCodAmount   = parseFloat(totalAmount);
    } else {
      resolvedPaymentType = "PREPAID";
      resolvedAdvancePaid = parseFloat(totalAmount);
      resolvedCodAmount   = 0;
    }

    // ── Generate KGF order number ─────────────────────────────────────────────
    // ── Create the order ─────────────────────────────────────────────────────
    const order = await Order.create(
      {
        userId:            req.user.id,
        totalAmount:       parseFloat(totalAmount),
        shippingAddressId: shippingAddress.id,
        billingAddressId:  billingAddressRef,
        paymentMethod:     pm,
        paymentStatus:     isPartialCod ? "partial" : (isCod ? "pending" : "pending"),
        paymentType:       resolvedPaymentType,
        advancePaid:       resolvedAdvancePaid,
        codAmount:         resolvedCodAmount,
        couponCode:        normalizedCouponCode,
        couponDiscount:    serverCouponDiscount,     // ← save coupon rupee amount
        taxAmount:         receivedTax,              // ← save tax amount
        notes,
        shippingCharge:    parseFloat(shippingCharge || 0),
        estimatedDeliveryDays: estimatedDeliveryDays || null,
        partialCodAmount:  isPartialCod ? resolvedCodAmount : null, // legacy
        status:            "pending",
        inventoryProcessed: false,
        inventoryRestored:  false,
      },
      { transaction }
    );

    // Create OrderItem records
    for (const itemData of itemsWithDetails) {
      await OrderItem.create(
        {
          orderId:             order.id,
          productId:           itemData.productId,
          productName:         itemData.productName,
          selectedVariantId:   itemData.selectedVariantId   || null,
          selectedVariantName: itemData.selectedVariantName || null,
          variantAttributes:   itemData.variantAttributes   || null,
          quantity:            itemData.quantity,
          price:               itemData.price,
          mrp:                 itemData.mrp        || null,
          salesPrice:          itemData.salesPrice || null,
          discount:            itemData.discount   || 0,
          image:               itemData.image      || null,
          selectedProductColor: itemData.selectedProductColor || null,
          selectedProductSize:  itemData.selectedProductSize  || null,
          isCombo:     itemData.isCombo     || false,
          rootComboId: itemData.rootComboId || null,
          childComboId: itemData.childComboId || null,
          comboName:   itemData.comboName  || null,
          comboType:   itemData.comboType  || null,
          status:      order.status        || "pending",
          selectedProducts: itemData.selectedProducts || null,
          comboSnapshot:    itemData.comboSnapshot    || null,
          customerChoices:  itemData.customerChoices  || null,
          customisationDetails: itemData.customisationDetails || null,
        },
        { transaction }
      );
    }

    // For pure COD: decrement stock + clear cart immediately
    if (isCod) {
      await inventoryService.decrementOrderStock(order.id, transaction, "Order Placement - COD", "cod");
      order.inventoryProcessed = true;
      await order.save({ transaction });
      await CartItem.destroy({ where: { userId: req.user.id }, transaction });
    }

    await transaction.commit();

    const createdOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: "items" },
        { model: Address, as: "shippingAddress" },
        { model: Address, as: "billingAddress" },
      ],
    });

    // Post-commit for pure COD only
    if (isCod) {
      try {
        const userRecord = await User.findByPk(req.user.id, { attributes: ["name", "email"] });
        if (userRecord?.email) {
          await sendOrderConfirmationEmail(createdOrder, { name: userRecord.name, email: userRecord.email });
        }
        try {
          await sendAdminNewOrderEmail(createdOrder, { name: userRecord?.name, email: userRecord?.email || "" });
        } catch (adminMailErr) {
          console.error("[Mailer] Failed to send admin email notification:", adminMailErr.message);
        }
      } catch (emailErr) {
        console.error("[Mailer] Failed to send confirmation:", emailErr.message);
      }
    }

    // Fire order notification (non-blocking)
    createOrderNotification(createdOrder).catch(e => console.error("[Notif] order notif error:", e.message));

    return res.status(201).json(createdOrder);
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
// ─── GET /api/orders/all  (admin — all orders) ────────────────────────────────
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          attributes: ["id", "referenceSlug", "name", "email", "phone", "role"],
          include: [{ model: Role, as: "roleRecord", attributes: ["id", "name"] }]
        },
        { model: OrderItem, as: "items" },
        { model: Address, as: "shippingAddress" },
        { model: Address, as: "billingAddress" },
      ],
    });
    return res.json({ orders });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/orders/:status  (admin — dashboard order counts) ────────────────
const getOrdersByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const dbStatus = STATUS_MAP[status];
    if (!dbStatus) {
      return res.status(400).json({
        message: `Invalid status "${status}". Valid: ${Object.keys(STATUS_MAP).join(", ")}`,
      });
    }
    const orders = await Order.findAll({
      where: { status: dbStatus },
      order: [["createdAt", "DESC"]],
      include: [
        { model: OrderItem, as: "items" },
        { model: Address, as: "shippingAddress" },
        { model: Address, as: "billingAddress" },
      ],
    });
    return res.json(orders);
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/orders/:id/status  (admin — update status) ───────────────────
const updateOrderStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  let transactionCommitted = false;
  try {
    const { status, paymentStatus, trackingDetails, codCollected } = req.body;
    const order = await findOrderAny(req.params.id, { transaction, lock: true });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = order.status;
    const newStatus = status;
    const statusChanged = Boolean(newStatus && newStatus !== previousStatus);

    if (newStatus) {
      if (!ORDER_ITEM_STATUS_OPTIONS.includes(newStatus)) {
        await transaction.rollback();
        return res.status(400).json({ message: "Invalid order status" });
      }
      order.status = newStatus;
    }
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (req.body.paymentFailureReason !== undefined) {
      order.paymentFailureReason = req.body.paymentFailureReason;
    }
    if (codCollected !== undefined) {
      order.codCollected = Boolean(codCollected);
      if (order.codCollected && !paymentStatus) {
        order.paymentStatus = "paid";
      }
    }

    const targetStatuses = ["cancelled", "returned", "rto"];
    if (statusChanged && targetStatuses.includes(newStatus.toLowerCase())) {
      if (order.inventoryProcessed && !order.inventoryRestored) {
        await inventoryService.restoreOrderStock(order.id, transaction, `Order Status Update - ${newStatus}`);
      }
    }

    await order.save({ transaction });

    if (newStatus) {
      await OrderItem.update(
        { status: newStatus },
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
    }

    await transaction.commit();
    transactionCommitted = true;

    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: "items" },
        { model: Address, as: "shippingAddress" },
        { model: Address, as: "billingAddress" },
      ],
    });

    if (statusChanged) {
      const audit = {
        orderId: order.id,
        previousStatus,
        newStatus,
        emailSent: false,
        emailSentAt: null,
        errorMessage: null,
      };

      try {
        const userRecord = await User.findByPk(order.userId, {
          attributes: ["name", "email"],
        });
        const incomingTrackingDetails = typeof trackingDetails === "string"
          ? { trackingUrl: trackingDetails }
          : (trackingDetails || {});
        const emailResult = await sendOrderStatusEmail({
          order: updatedOrder,
          user: {
            name: userRecord?.name,
            email: userRecord?.email,
          },
          status: newStatus,
          trackingDetails: {
            ...incomingTrackingDetails,
            trackingUrl: req.body.trackingUrl || req.body.tracking_url || incomingTrackingDetails.trackingUrl,
            shiprocketTrackingUrl:
              req.body.shiprocketTrackingUrl ||
              req.body.shiprocket_tracking_url ||
              incomingTrackingDetails.shiprocketTrackingUrl,
            shiprocketOrderId: updatedOrder.shiprocketOrderId,
            shiprocketShipmentId: updatedOrder.shiprocketShipmentId,
          },
        });

        audit.emailSent = Boolean(emailResult?.sent);
        audit.emailSentAt = emailResult?.sentAt || null;
        audit.errorMessage = audit.emailSent ? null : (emailResult?.reason || "Email not sent");
      } catch (emailErr) {
        audit.errorMessage = emailErr?.message || "Failed to send status email";
        console.error("[Mailer] Failed to send order status email:", audit.errorMessage);
      }

      await recordOrderStatusEmailAudit(audit);

      // Push to Shiprocket if confirming for the first time
      if (newStatus === "confirmed" && !updatedOrder.shiprocketOrderId) {
        try {
          const userRecord = await User.findByPk(order.userId, { attributes: ["email"] });
          await pushOrderToShiprocket(order.id, userRecord?.email || "");
          const freshOrder = await Order.findByPk(order.id, { attributes: ["shiprocketOrderId", "shiprocketShipmentId"] });
          if (freshOrder) {
            updatedOrder.shiprocketOrderId = freshOrder.shiprocketOrderId;
            updatedOrder.shiprocketShipmentId = freshOrder.shiprocketShipmentId;
          }
        } catch (srErr) {
          console.error("[Shiprocket] Failed to push order on status confirmation:", srErr.message);
        }
      }
    }

    return res.json(updatedOrder);
  } catch (err) {
    if (!transactionCommitted) {
      await transaction.rollback();
    }
    next(err);
  }
};

// PATCH /api/orders/:orderId/items/:itemId/status
const updateOrderItemStatus = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;
    if (!ORDER_ITEM_STATUS_OPTIONS.includes(status)) {
      return res.status(400).json({ message: "Invalid order item status" });
    }
    const order = await findOrderAny(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const item = await OrderItem.findOne({
      where: {
        orderId: order.id,
        ...referenceWhere(itemId),
      },
    });
    if (!item) return res.status(404).json({ message: "Order item not found" });
    item.status = status;
    await item.save();
    return res.json(item);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
  createOrder,
  getAllOrders,
  getOrdersByStatus,
  updateOrderStatus,
  updateOrderItemStatus,
  pushOrderToShiprocket,
};
