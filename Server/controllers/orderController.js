// controllers/orderController.js
const { Order, CartItem, User, Product, Variant, OrderItem, Address, Coupon } = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const { sendOrderConfirmationEmail } = require("../utils/mailer");
const { shiprocketPost } = require("../utils/shiprocket");
const inventoryService = require("../services/inventoryService");

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
    const srItems = order.items.map((item) => ({
      name: item.productName,
      sku: item.selectedVariantId || item.productId,
      units: item.quantity,
      selling_price: parseFloat(item.salesPrice || item.price),
      discount: parseFloat(item.discount || 0),
      tax: 0,
      hsn: 0,
    }));

    const srPayload = {
      order_id: order.id,
      order_date: new Date(order.createdAt).toISOString().slice(0, 19).replace("T", " "),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
      billing_customer_name: addr.fullName,
      billing_last_name: "",
      billing_address: `${addr.street}${addr.apartment ? ", " + addr.apartment : ""}`,
      billing_city: addr.city,
      billing_pincode: addr.pincode,
      billing_state: addr.state,
      billing_country: addr.country || "India",
      billing_email: userEmail || "",
      billing_phone: addr.phone,
      shipping_is_billing: true,
      order_items: srItems,
      payment_method: (order.paymentMethod || "cod").toUpperCase() === "COD" ? "COD" : "Prepaid",
      sub_total: parseFloat(order.totalAmount) - parseFloat(order.shippingCharge || 0),
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    const srResponse = await shiprocketPost("/orders/create/adhoc", srPayload);
    console.log("[Shiprocket] Order created:", srResponse?.order_id, "| Shipment:", srResponse?.shipment_id);

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
    console.error("[Shiprocket] Failed to create order:", srErr?.response?.data || srErr.message);
  }
};

// Dashboard sends these status values in the URL:
//   new | confirmed | shipped | delivery | delivered | cancelled
// But the DB ENUM stores:
//   pending | confirmed | processing | shipped | delivered | cancelled
//
// This map translates dashboard → DB
const STATUS_MAP = {
  new:       "pending",
  confirmed: "confirmed",
  shipped:   "shipped",
  delivery:  "processing",   // "Out for Delivery" in dashboard = "processing" in DB
  delivered: "delivered",
  cancelled: "cancelled",
  returned:  "returned",
};

const ORDER_ITEM_STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

// ─── GET /api/orders  (customer — own orders) ─────────────────────────────────
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        { model: OrderItem, as: "items" },
        { model: Address, as: "shippingAddress" },
        { model: Address, as: "billingAddress" },
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
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: OrderItem, as: "items" },
        { model: Address, as: "shippingAddress" },
        { model: Address, as: "billingAddress" },
      ],
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  } catch (err) {
    next(err);
  }
};

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
      couponDiscount,
      notes,
      shippingCharge,
      estimatedDeliveryDays,
    } = req.body;

    const shippingId = shippingAddressId || req.body.shippingAddress?.id;
    const billingId = billingAddressId || req.body.billingAddress?.id || null;

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

    let billingAddress = null;
    let billingAddressRef = billingId;
    if (billingAddressRef) {
      billingAddress = await Address.findOne({
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

    // 1. Validate Stock (Centralized Inventory Service)
    try {
      await inventoryService.validateOrderStock(items, transaction);
    } catch (stockErr) {
      await transaction.rollback();
      return res.status(400).json({ message: stockErr.message });
    }

    // Server-side validation: compute total from items and verify against client-submitted amount
    let serverComputedTotal = 0;
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
        itemData.productName = `${product.name}${variant.variantName ? ` (${variant.variantName})` : ''}`;
        itemData.selectedVariantId = variant.id;
        itemData.selectedVariantName = variant.variantName || null;
        itemData.variantAttributes = variant.attributes || [];
        itemData.image = variant.image || product.image || [];
        itemData.mrp = variant.mrp || null;
        itemData.salesPrice = variant.salesPrice || null;
      } else {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) {
          await transaction.rollback();
          return res.status(404).json({ message: `Product ${item.productId} not found` });
        }
        itemPrice = parseFloat(item.price || product.price || 0);
        itemData.productName = isComboItem ? (item.comboName || item.name || product.name) : product.name;
        itemData.selectedVariantId = null;
        itemData.selectedVariantName = null;
        itemData.variantAttributes = [];
        itemData.image = item.image || product.image || [];
      }

      itemData.isCombo = isComboItem;
      itemData.rootComboId = item.rootComboId || null;
      itemData.childComboId = item.childComboId || null;
      itemData.comboName = item.comboName || item.name || null;
      itemData.comboType = item.comboType || null;
      itemData.selectedProducts = item.selectedProducts || null;

      itemData.comboSnapshot = isComboItem ? {
        comboId: item.childComboId,
        comboName: item.comboName || item.name || null,
        comboType: item.comboType || null,
        selectedProducts: item.selectedProducts || null,
        quantities: item.quantity,
        pricing: itemPrice
      } : null;

      const itemTotal = itemPrice * item.quantity;
      serverComputedTotal += itemTotal;
      itemsWithDetails.push(itemData);
    }

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

      if (serverComputedTotal < parseFloat(coupon.min_order || 0)) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Minimum order of ₹${coupon.min_order} required`,
        });
      }

      serverCouponDiscount = coupon.type === "percent"
        ? (serverComputedTotal * parseFloat(coupon.value || 0)) / 100
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

    const clientTotal = parseFloat(totalAmount);
    const minimumAllowedTotal = Math.max(0, serverComputedTotal - serverCouponDiscount);
    if (clientTotal < minimumAllowedTotal - 1) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Order total too low. Expected at least ₹${minimumAllowedTotal.toFixed(2)}, received ₹${clientTotal.toFixed(2)}`,
        expectedMinimum: minimumAllowedTotal,
        receivedTotal: clientTotal,
      });
    }

    const isPartialCod = (paymentMethod || "cod") === "partial_cod";
    const isCod = (paymentMethod || "cod") === "cod";

    const order = await Order.create({
      userId: req.user.id,
      totalAmount: parseFloat(totalAmount),
      shippingAddressId: shippingAddress.id,
      billingAddressId: billingAddressRef,
      paymentMethod: isPartialCod ? "partial_cod" : (paymentMethod || "cod"),
      paymentStatus: isPartialCod ? "partial" : "pending",
      couponCode: normalizedCouponCode,
      notes,
      shippingCharge: parseFloat(shippingCharge || 0),
      estimatedDeliveryDays: estimatedDeliveryDays || null,
      partialCodAmount: isPartialCod
        ? parseFloat(totalAmount) - parseFloat(shippingCharge || 0)
        : null,
      status: isCod ? "confirmed" : "pending",
      inventoryProcessed: false,
      inventoryRestored: false,
    }, { transaction });

    // Create OrderItem records for each item
    for (const itemData of itemsWithDetails) {
      await OrderItem.create({
        orderId: order.id,
        productId: itemData.productId,
        productName: itemData.productName,
        selectedVariantId: itemData.selectedVariantId || null,
        selectedVariantName: itemData.selectedVariantName || null,
        variantAttributes: itemData.variantAttributes || null,
        quantity: itemData.quantity,
        price: itemData.price,
        mrp: itemData.mrp || null,
        salesPrice: itemData.salesPrice || null,
        discount: itemData.discount || 0,
        image: itemData.image || null,
        selectedProductColor: itemData.selectedProductColor || null,
        selectedProductSize: itemData.selectedProductSize || null,
        isCombo: itemData.isCombo || false,
        rootComboId: itemData.rootComboId || null,
        childComboId: itemData.childComboId || null,
        comboName: itemData.comboName || null,
        comboType: itemData.comboType || null,
        status: order.status || "pending",
        selectedProducts: itemData.selectedProducts || null,
        comboSnapshot: itemData.comboSnapshot || null,
      }, { transaction });
    }

    // COD stock decrement & cart cleanup inside transaction
    if (isCod) {
      await inventoryService.decrementOrderStock(order.id, transaction, "Order Placement - COD", "cod");
      order.inventoryProcessed = true;
      await order.save({ transaction });

      // Clear cart immediately for COD
      await CartItem.destroy({ where: { userId: req.user.id }, transaction });
    }

    await transaction.commit();

    // Fetch the order with items to return
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: "items" },
        { model: Address, as: "shippingAddress" },
        { model: Address, as: "billingAddress" },
      ],
    });

    // Post-commit operations for COD
    if (isCod) {
      try {
        const userRecord = await User.findByPk(req.user.id, { attributes: ["name", "email"] });
        if (userRecord?.email) {
          await sendOrderConfirmationEmail(createdOrder, { name: userRecord.name, email: userRecord.email });
        }
      } catch (emailErr) {
        console.error("[Mailer] Failed to send order confirmation:", emailErr.message);
      }

      try {
        await pushOrderToShiprocket(createdOrder.id, req.user.email);
      } catch (srErr) {
        console.error("[Shiprocket] Failed to push order:", srErr.message);
      }
    }

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
        { model: User, attributes: ["id", "name", "email", "phone"] },
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
// Dashboard.jsx calls this 6 times: /new /confirmed /shipped /delivery /delivered /cancelled
// Returns an array; dashboard counts .length client-side
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

    return res.json(orders); // array — frontend reads .length
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/orders/:id/status  (admin — update status) ───────────────────
const updateOrderStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findByPk(req.params.id, { transaction, lock: true });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    const oldStatus = order.status;
    const statusChanged = status && status !== oldStatus;

    if (status) {
      if (!ORDER_ITEM_STATUS_OPTIONS.includes(status)) {
        await transaction.rollback();
        return res.status(400).json({ message: "Invalid order status" });
      }
      order.status = status;
    }
    if (paymentStatus) order.paymentStatus = paymentStatus;

    // Restoration rules: Cancel before shipment, return approved, RTO restore stock
    const targetStatuses = ["cancelled", "returned", "rto"];
    if (statusChanged && targetStatuses.includes(status.toLowerCase())) {
      if (order.inventoryProcessed && !order.inventoryRestored) {
        await inventoryService.restoreOrderStock(order.id, transaction, `Order Status Update - ${status}`);
      }
    }

    await order.save({ transaction });

    if (status) {
      await OrderItem.update(
        { status },
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

    // Fetch the order with items to return
    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: "items" },
        { model: Address, as: "shippingAddress" },
        { model: Address, as: "billingAddress" },
      ],
    });

    return res.json(updatedOrder);
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// PATCH /api/orders/:orderId/items/:itemId/status (admin - product-wise item status)
const updateOrderItemStatus = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    if (!ORDER_ITEM_STATUS_OPTIONS.includes(status)) {
      return res.status(400).json({ message: "Invalid order item status" });
    }

    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const item = await OrderItem.findOne({ where: { id: itemId, orderId } });
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
