// routes/orders.js
const express = require("express");
const router  = express.Router();
const {
  getMyOrders,
  getOrderById,
  createOrder,
  getAllOrders,
  getOrdersByStatus,
  updateOrderStatus,
  updateOrderItemStatus,
} = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

// ── Customer routes ───────────────────────────────────────────────────────────
router.post("/", createOrder);
router.get("/",  getMyOrders);

// ── Admin: static named routes MUST come before /:param routes ────────────────
// If /all came after /:status, Express would treat "all" as a status value
router.get("/all",       adminOnly, getAllOrders);
router.get("/admin/all", adminOnly, getAllOrders);

// ── Admin: dashboard order counts by status ───────────────────────────────────
// Handles: /new /confirmed /shipped /delivery /delivered /cancelled
router.get("/status/:status", adminOnly, getOrdersByStatus);

// ── Admin: update order status ────────────────────────────────────────────────
router.patch("/:orderId/items/:itemId/status", adminOnly, updateOrderItemStatus);
router.patch("/:id/status",       adminOnly, updateOrderStatus);
router.put("/admin/:id/status",   adminOnly, updateOrderStatus);

// ── Customer: single order by id ─────────────────────────────────────────────
router.get("/:id", getOrderById);

module.exports = router;
