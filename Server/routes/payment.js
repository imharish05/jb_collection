// routes/payment.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { createRazorpayOrder, createDeliveryChargeOrder, verifyPayment } = require('../controllers/paymentController');

router.use(protect); // All payment routes require authentication

router.post('/create-order', createRazorpayOrder);
router.post('/create-delivery-charge-order', createDeliveryChargeOrder);
router.post('/verify', verifyPayment);

module.exports = router;
