// controllers/orderController.js
const { Order, CartItem, User, Product, Variant, OrderItem } = require("../models");
const sequelize = require("../config/database");
const { sendOrderConfirmationEmail } = require("../utils/mailer");

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
};

// ─── GET /api/orders  (customer — own orders) ─────────────────────────────────
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [{ model: OrderItem, as: "items" }],
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
      include: [{ model: OrderItem, as: "items" }],
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
    const { items, totalAmount, shippingAddress, billingAddress, paymentMethod, couponCode, notes } = req.body;

    if (!items || !items.length || !totalAmount || !shippingAddress) {
      return res.status(400).json({
        message: "items, totalAmount and shippingAddress are required",
      });
    }

    // Server-side validation: compute total from items and verify against client-submitted amount
    let serverComputedTotal = 0;
    const itemsWithDetails = [];

    for (const item of items) {
      let itemPrice = 0;
      let itemData = { ...item };

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
        if (variant.stock < item.quantity) {
          await transaction.rollback();
          return res.status(400).json({ message: `Insufficient stock for variant ${variant.variantName}` });
        }
        itemPrice = parseFloat(variant.salesPrice || variant.mrp || 0);
        itemData.productName = `${product.name}${variant.variantName ? ` (${variant.variantName})` : ''}`;
        itemData.selectedVariantId = variant.id;
        itemData.selectedVariantName = variant.variantName || null;
        itemData.variantAttributes = variant.attributes || [];
        itemData.image = variant.image || product.image || [];
        itemData.mrp = variant.mrp || null;
        itemData.salesPrice = variant.salesPrice || null;
        await variant.decrement('stock', { by: item.quantity, transaction });
      } else {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) {
          await transaction.rollback();
          return res.status(404).json({ message: `Product ${item.productId} not found` });
        }
        if (product.stock < item.quantity) {
          await transaction.rollback();
          return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
        }
        itemPrice = parseFloat(item.price || product.price || 0);
        itemData.productName = product.name;
        itemData.selectedVariantId = null;
        itemData.selectedVariantName = null;
        itemData.variantAttributes = [];
        itemData.image = product.image || [];
        await product.decrement('stock', { by: item.quantity, transaction });
      }

      const itemTotal = itemPrice * item.quantity;
      serverComputedTotal += itemTotal;
      itemsWithDetails.push(itemData);
    }

    // Validate that client total is at least the items subtotal (prevents price tampering)
    // We don't validate shipping/discounts here as those are still being finalized
    const clientTotal = parseFloat(totalAmount);
    if (clientTotal < serverComputedTotal - 1) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Order total too low. Items subtotal is ₹${serverComputedTotal.toFixed(2)}, received ₹${clientTotal.toFixed(2)}`,
        expectedMinimum: serverComputedTotal,
        receivedTotal: clientTotal,
      });
    }

    const order = await Order.create({
      userId: req.user.id,
      totalAmount: parseFloat(totalAmount),
      shippingAddress,
      billingAddress: billingAddress || null,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: "pending",
      couponCode,
      notes,
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
      }, { transaction });
    }

    // Clear cart after successful order
    await CartItem.destroy({ where: { userId: req.user.id }, transaction });

    await transaction.commit();

    // Fetch the order with items to return
    const createdOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: "items" }],
    });

    // Send order confirmation email (non-blocking — don't fail order if email fails)
    try {
      const userRecord = await User.findByPk(req.user.id, { attributes: ["name", "email"] });
      if (userRecord?.email) {
        await sendOrderConfirmationEmail(createdOrder, { name: userRecord.name, email: userRecord.email });
      }
    } catch (emailErr) {
      console.error("[Mailer] Failed to send order confirmation:", emailErr.message);
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
        { model: OrderItem, as: "items" }
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
      include: [{ model: OrderItem, as: "items" }],
    });

    return res.json(orders); // array — frontend reads .length
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/orders/:id/status  (admin — update status) ───────────────────
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    await order.save();

    // Fetch the order with items to return
    const updatedOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: "items" }],
    });

    return res.json(updatedOrder);
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
};