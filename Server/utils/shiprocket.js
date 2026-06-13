// utils/shiprocket.js
const axios = require("axios");

const BASE = "https://apiv2.shiprocket.in/v1/external";

let cachedToken = null;
let tokenExpiry = null;

async function getToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  console.log("[Shiprocket] Fetching new token...");
  const res = await axios.post(`${BASE}/auth/login`, {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PWD,
  });
  cachedToken = res.data.token;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 hours
  console.log("[Shiprocket] Token fetched and cached");
  return cachedToken;
}

async function shiprocketGet(url) {
  const token = await getToken();
  const res = await axios.get(`${BASE}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

async function shiprocketPost(url, body) {
  const token = await getToken();
  const res = await axios.post(`${BASE}${url}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

async function getPickupLocations() {
  const data = await shiprocketGet("/settings/company/pickup");
  return data?.data?.shipping_address || [];
}

async function getShippingRates({ pickupPincode, deliveryPincode, weight, cod }) {
  const data = await shiprocketGet(
    `/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=${cod ? 1 : 0}`
  );
  return data?.data?.available_courier_companies || [];
}

/**
 * resolveShiprocketPaymentMethod(order)
 *
 * Maps our internal paymentType / paymentMethod to Shiprocket's two allowed values:
 *   "COD"     — courier collects money at door
 *   "Prepaid" — no money to collect at door
 *
 * Rules:
 *   FULL_COD     → "COD",     cod_amount = totalAmount
 *   PARTIAL_COD  → "COD",     cod_amount = codAmount (remaining after advance)
 *   PREPAID      → "Prepaid", cod_amount = 0
 *   partial_cod  → "COD"  (legacy paymentMethod string fallback)
 *   cod          → "COD"
 *   razorpay     → "Prepaid"
 *
 * Returns { payment_method, cod_amount }
 */
function resolveShiprocketPaymentMethod(order) {
  const paymentType  = (order.paymentType  || "").toUpperCase();
  const paymentMethod = (order.paymentMethod || "cod").toLowerCase();

  // Prefer paymentType (new field) over legacy paymentMethod
  if (paymentType === "PARTIAL_COD") {
    const codAmount = parseFloat(order.codAmount || 0);
    if (codAmount < 0) {
      throw new Error(`[Shiprocket] cod_amount is negative (${codAmount}) for order ${order.id}. Refusing to create shipment.`);
    }
    return {
      payment_method: "COD",
      cod_amount: codAmount,
    };
  }

  if (paymentType === "FULL_COD") {
    return {
      payment_method: "COD",
      cod_amount: parseFloat(order.totalAmount || 0),
    };
  }

  if (paymentType === "PREPAID") {
    return { payment_method: "Prepaid", cod_amount: 0 };
  }

  // Legacy fallback — no paymentType set
  if (paymentMethod === "cod" || paymentMethod === "partial_cod") {
    const codAmount = paymentMethod === "partial_cod"
      ? parseFloat(order.codAmount || order.partialCodAmount || order.totalAmount || 0)
      : parseFloat(order.totalAmount || 0);
    return { payment_method: "COD", cod_amount: codAmount };
  }

  // razorpay / prepaid / anything else
  return { payment_method: "Prepaid", cod_amount: 0 };
}

module.exports = {
  getToken,
  getPickupLocations,
  getShippingRates,
  shiprocketGet,
  shiprocketPost,
  resolveShiprocketPaymentMethod,
};