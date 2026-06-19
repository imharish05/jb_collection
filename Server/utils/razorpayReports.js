const Razorpay = require("razorpay");

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function buildRazorpayDateRange(query) {
  const { dateRange, from, to } = query;
  const now = new Date();
  let gte, lte;

  switch (dateRange) {
    case "today":
      gte = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      lte = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case "last7":
      gte = new Date(now - 7 * 86400000);
      lte = now;
      break;
    case "last30":
      gte = new Date(now - 30 * 86400000);
      lte = now;
      break;
    case "thisMonth":
      gte = new Date(now.getFullYear(), now.getMonth(), 1);
      lte = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case "thisYear":
      gte = new Date(now.getFullYear(), 0, 1);
      lte = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case "custom":
      if (from) gte = new Date(from);
      if (to) {
        lte = new Date(to);
        lte.setHours(23, 59, 59);
      }
      break;
    default:
      break;
  }

  const range = {};
  if (gte) range.from = Math.floor(gte.getTime() / 1000);
  if (lte) range.to   = Math.floor(lte.getTime() / 1000);
  return range;
}

async function fetchAllRazorpayPayments(razorpay, { from, to } = {}) {
  const all = [];
  let skip = 0;
  const count = 100;

  while (true) {
    const params = { count, skip };
    if (from) params.from = from;
    if (to)   params.to   = to;

    const batch = await razorpay.payments.all(params);
    const items = batch.items || [];
    all.push(...items);

    if (items.length < count) break;
    skip += count;
    if (skip >= 5000) break;
  }

  return all;
}

function paymentAmount(p) {
  return (p.amount || 0) / 100;
}

function getDbOrderId(payment, orderNotesMap = {}) {
  const fromPayment = payment.notes?.dbOrderId || payment.notes?.db_order_id;
  if (fromPayment) return String(fromPayment);
  if (payment.order_id && orderNotesMap[payment.order_id]) {
    return orderNotesMap[payment.order_id];
  }
  return null;
}

async function resolveDbOrderIds(razorpay, payments) {
  const map = {};
  const rzpOrderIds = [...new Set(payments.map(p => p.order_id).filter(Boolean))];

  await Promise.all(rzpOrderIds.map(async (rzpOrderId) => {
    try {
      const order = await razorpay.orders.fetch(rzpOrderId);
      const dbId = order.notes?.dbOrderId || order.notes?.db_order_id;
      if (dbId) map[rzpOrderId] = String(dbId);
    } catch (err) {
      console.warn(`[Razorpay] Could not fetch order ${rzpOrderId}:`, err.message);
    }
  }));

  return map;
}

function summarizeRazorpayPayments(payments) {
  const captured = payments.filter(p => p.status === "captured");
  const failed   = payments.filter(p => p.status === "failed");

  return {
    captured,
    failed,
    successCount:  captured.length,
    failedCount:   failed.length,
    successAmount: captured.reduce((s, p) => s + paymentAmount(p), 0),
    failedAmount:  failed.reduce((s, p) => s + paymentAmount(p), 0),
  };
}

async function fetchRazorpayPaymentSummary(query = {}) {
  const razorpay = getRazorpay();
  if (!razorpay) {
    return {
      captured: [], failed: [],
      successCount: 0, failedCount: 0,
      successAmount: 0, failedAmount: 0,
    };
  }

  const range = buildRazorpayDateRange(query);
  const payments = await fetchAllRazorpayPayments(razorpay, range);
  return summarizeRazorpayPayments(payments);
}

module.exports = {
  getRazorpay,
  buildRazorpayDateRange,
  fetchAllRazorpayPayments,
  paymentAmount,
  getDbOrderId,
  resolveDbOrderIds,
  summarizeRazorpayPayments,
  fetchRazorpayPaymentSummary,
};
