// controllers/paymentController.js
// ⚠️ TEST MODE CONFIGURATION
// Using Razorpay test keys - replace with live keys in production
// Test Card: 4111111111111111, Any future date, Any CVV

const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Order } = require('../models');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,      // rzp_test_* in dev
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order
// Call BEFORE placing order — creates Razorpay order, returns order_id

const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payment/verify
// Call AFTER Razorpay callback — verify signature, update order paymentStatus
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !dbOrderId) {
      return res.status(400).json({ message: 'Missing required payment verification fields' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed: Invalid signature' });
    }

    // Update order paymentStatus to paid
    const order = await Order.findByPk(dbOrderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = 'paid';
    order.paymentMethod = 'razorpay';
    await order.save();

    res.json({ success: true, message: 'Payment verified successfully', order });
  } catch (err) {
    next(err);
  }
};

module.exports = { createRazorpayOrder, verifyPayment };
