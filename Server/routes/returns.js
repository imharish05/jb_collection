// routes/returns.js
const express = require("express");
const router  = express.Router();
const {
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
} = require("../controllers/returnController");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadReturn, handleReturnUploadError } = require("../middleware/uploadReturn");

// ── Public route (Shiprocket Webhook) ─────────────────────────────────────────
// MUST NOT have protect or adminOnly middleware!
router.post("/webhook/shiprocket-return", handleShiprocketReturnWebhook);

// ── Customer routes (protected) ───────────────────────────────────────────────
router.post("/", protect, uploadReturn, handleReturnUploadError, createReturnRequest);
router.get("/",  protect, getMyReturns);
router.get("/:id", protect, getReturnById);
router.patch("/cancel-order/:orderId", protect, cancelOrder);

// ── Admin routes (protect + adminOnly) ─────────────────────────────────────────
router.get("/admin/all",                protect, adminOnly, getAllReturns);
router.get("/admin/:id",                protect, adminOnly, getReturnByIdAdmin);
router.patch("/admin/:id/status",        protect, adminOnly, updateReturnStatus);
router.post("/admin/:id/refund",        protect, adminOnly, approveRefund);
router.post("/admin/:id/replacement",   protect, adminOnly, approveReplacement);
router.post("/admin/:id/reject",        protect, adminOnly, rejectReturn);
router.post("/admin/:id/reverse-pickup",protect, adminOnly, createReversePickup);

module.exports = router;
