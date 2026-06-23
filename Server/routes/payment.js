// routes/payment.js
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createRazorpayOrder,
  createDeliveryChargeOrder,
  verifyPayment,
  handlePaymentWebhook,
  getPaymentTransactions,
  verifyAndCreateOrder,
  abortPendingOrder,
} = require('../controllers/paymentController');

// ── Public route: Razorpay webhook (no auth token — Razorpay calls this server-side)
// Signature is verified inside the controller using RAZORPAY_WEBHOOK_SECRET
router.post('/webhook', handlePaymentWebhook);

// ── Protected routes (require user auth token)
router.post('/create-order', protect, createRazorpayOrder);
router.post('/create-delivery-charge-order', protect, createDeliveryChargeOrder);
router.post('/verify', protect, verifyPayment);
// Atomic: verify payment + create DB order in one shot (used for prepaid orders)
// DB order is only created AFTER successful Razorpay payment — never on cancel.
router.post('/verify-and-create-order', protect, verifyAndCreateOrder);
// Called when user cancels Razorpay modal for partial_cod — deletes the pending DB order.
router.delete('/abort-pending-order/:orderId', protect, abortPendingOrder);

// ── Admin routes (require admin privileges)
router.get('/transactions', protect, adminOnly, getPaymentTransactions);

module.exports = router;
