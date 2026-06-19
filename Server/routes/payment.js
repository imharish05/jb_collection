// routes/payment.js
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createRazorpayOrder,
  createDeliveryChargeOrder,
  verifyPayment,
  handlePaymentWebhook,
  getPaymentTransactions,
} = require('../controllers/paymentController');

// ── Public route: Razorpay webhook (no auth token — Razorpay calls this server-side)
// Signature is verified inside the controller using RAZORPAY_WEBHOOK_SECRET
router.post('/webhook', handlePaymentWebhook);

// ── Protected routes (require user auth token)
router.post('/create-order', protect, createRazorpayOrder);
router.post('/create-delivery-charge-order', protect, createDeliveryChargeOrder);
router.post('/verify', protect, verifyPayment);

// ── Admin routes (require admin privileges)
router.get('/transactions', protect, adminOnly, getPaymentTransactions);

module.exports = router;
