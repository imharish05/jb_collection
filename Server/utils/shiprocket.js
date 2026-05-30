const axios = require("axios");

const BASE = "https://apiv2.shiprocket.in/v1/external";

let cachedToken = null;
let tokenExpiry = null;

async function getToken() {
  // Return cached token if still valid
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

module.exports = {
  getToken,
  getPickupLocations,
  getShippingRates,
  shiprocketGet,
  shiprocketPost,
};