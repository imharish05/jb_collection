// controllers/orderController.js
const { Order, CartItem, User } = require("../models");

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
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/orders  (customer — create order) ──────────────────────────────
const createOrder = async (req, res, next) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || !items.length || !totalAmount || !shippingAddress) {
      return res.status(400).json({
        message: "items, totalAmount and shippingAddress are required",
      });
    }

    const order = await Order.create({
      userId: req.user.id,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || "cod",
      notes,
    });

    await CartItem.destroy({ where: { userId: req.user.id } });

    return res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/orders/all  (admin — all orders) ────────────────────────────────
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      order: [["createdAt", "DESC"]],
      include: [{ model: User, attributes: ["id", "name", "email", "phone"] }],
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
      attributes: ["id", "status", "totalAmount", "createdAt"],
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

    return res.json(order);
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