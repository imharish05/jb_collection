// routes/payment.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { createRazorpayOrder, verifyPayment } = require('../controllers/paymentController');

router.use(protect); // All payment routes require authentication

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyPayment);

module.exports = router;
