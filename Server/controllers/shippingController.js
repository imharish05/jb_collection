const axios = require("axios");

// ── In-memory Shiprocket token cache ────────────────────────────────────────
let shiprocketToken = null;
let tokenExpiry = null;

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";
const FREE_SHIPPING_THRESHOLD = 599;

// ── Get or refresh Shiprocket JWT token ────────────────────────────────────
const getShiprocketToken = async () => {
  // Return cached token if still valid
  if (shiprocketToken && tokenExpiry && Date.now() < tokenExpiry) {
    return shiprocketToken;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PWD;



  if (!email || !password) {
    throw new Error("SHIPROCKET_EMAIL and SHIPROCKET_PWD not configured");
  }

  try {
    console.log("[Shipping] Authenticating with Shiprocket...");
    const response = await axios.post(`${SHIPROCKET_API_BASE}/auth/login`, {
      email,
      password,
    });

    shiprocketToken = response.data?.token;
    if (!shiprocketToken) {
      console.error("[Shipping] Auth response missing token:", response.data);
      throw new Error("No token received from Shiprocket");
    }

    // Token valid for ~7 days; refresh after 6 days
    tokenExpiry = Date.now() + 6 * 24 * 60 * 60 * 1000;
    console.log("[Shipping] ✅ Successfully authenticated with Shiprocket");

    return shiprocketToken;
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const statusCode = error.response?.status;
    console.error(`[Shipping] ❌ Shiprocket auth failed (${statusCode}):`, errorMsg);
    console.error("[Shipping] Email:", email);
    console.error("[Shipping] Password length:", password?.length || 0);
    throw new Error(`Failed to authenticate with Shiprocket: ${JSON.stringify(errorMsg)}`);
  }
};

// ── Get pickup pincode from Shiprocket ─────────────────────────────────────
const getPickupPincode = async (token, pickupLocationName) => {
  try {
    const response = await axios.get(`${SHIPROCKET_API_BASE}/settings/company/pickup`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const pickups = response.data?.data?.pickup_locations || [];
    console.log("[Shipping] Available pickup locations from Shiprocket:", 
      pickups.map(p => ({ name: p.pickup_location, pincode: p.postal_code }))
    );

    const matching = pickups.find(
      (p) => p.pickup_location.toLowerCase() === pickupLocationName.toLowerCase()
    );

    if (!matching) {
      console.error("[Shipping] Pickup location not found. Looking for:", pickupLocationName);
      console.error("[Shipping] Available options:", pickups.map(p => p.pickup_location));
      throw new Error(
        `Pickup location "${pickupLocationName}" not found. Available: ${pickups.map(p => p.pickup_location).join(", ")}`
      );
    }

    return matching.postal_code;
  } catch (error) {
    console.error(
      "[Shipping] Failed to get pickup pincode:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// ── Check courier serviceability on Shiprocket ────────────────────────────
const checkCourierServiceability = async (token, pickupPin, deliveryPin, weight, cod) => {
  try {
    const response = await axios.get(
      `${SHIPROCKET_API_BASE}/courier/serviceability/`,
      {
        params: {
          pickup_postcode: pickupPin,
          delivery_postcode: deliveryPin,
          weight: weight || 0.5,
          cod: cod ? 1 : 0,
        },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data?.data?.available_courier_services || [];
  } catch (error) {
    console.error(
      "Serviceability check failed:",
      error.response?.data || error.message
    );
    // Not serviceable if API call fails
    return [];
  }
};

// ── Pick cheapest courier ──────────────────────────────────────────────────
const pickCheapestCourier = (services) => {
  if (!services || services.length === 0) return null;

  return services.reduce((cheapest, current) => {
    const currentRate = Number(current.rate || Infinity);
    const cheapestRate = Number(cheapest.rate || Infinity);
    return currentRate < cheapestRate ? current : cheapest;
  });
};

// ── Main serviceability check ──────────────────────────────────────────────
const checkServiceability = async (req, res, next) => {
  try {
    const pincode = String(req.query.pincode || "").trim();
    const orderValue = Number(req.query.orderValue || 0);
    const weight = Number(req.query.weight || 0.5);
    const cod = String(req.query.cod || "false") === "true";

    console.log("[Shipping] Serviceability check:", { pincode, orderValue, weight, cod });

    // Validate pincode
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        serviceable: false,
        message: "Invalid pincode format (must be 6 digits)",
      });
    }

    // Get Shiprocket token
    let token;
    try {
      token = await getShiprocketToken();
    } catch (tokenErr) {
      console.error("[Shipping] Token error:", tokenErr.message);
      return res.status(503).json({
        serviceable: false,
        message: "Shipping service temporarily unavailable. Please try again.",
        error: process.env.NODE_ENV === "development" ? tokenErr.message : undefined,
      });
    }

    // Get pickup pincode from Shiprocket
    const pickupLocationName = (process.env.SHIPROCKET_PICKUP_LOCATION || "warehouse").trim();
    
    if (!pickupLocationName) {
      console.error("[Shipping] SHIPROCKET_PICKUP_LOCATION not configured");
      return res.status(500).json({
        serviceable: false,
        message: "Pickup location not configured",
        error: process.env.NODE_ENV === "development" ? "SHIPROCKET_PICKUP_LOCATION env var is empty" : undefined,
      });
    }

    let pickupPin;
    try {
      pickupPin = await getPickupPincode(token, pickupLocationName);
      console.log("[Shipping] Resolved pickup location to pincode:", pickupPin);
    } catch (pickupErr) {
      console.error("[Shipping] Pickup location error:", pickupErr.message);
      return res.status(503).json({
        serviceable: false,
        message: "Unable to resolve pickup location. Check Shiprocket configuration.",
        error: process.env.NODE_ENV === "development" ? pickupErr.message : undefined,
      });
    }

    // Check courier serviceability
    const services = await checkCourierServiceability(
      token,
      pickupPin,
      pincode,
      weight,
      cod
    );

    console.log("[Shipping] Available services:", services.length);

    if (services.length === 0) {
      return res.json({
        serviceable: false,
        message: "Delivery not available to this pincode",
      });
    }

    // Pick cheapest courier
    const selectedCourier = pickCheapestCourier(services);
    let baseShippingCharge = Number(selectedCourier.rate || 0);

    // Apply free shipping threshold
    const shippingCharge =
      orderValue >= FREE_SHIPPING_THRESHOLD ? 0 : baseShippingCharge;

    // Check COD availability from courier
    const codAvailable = selectedCourier.is_cod === 1 ? true : false;

    // Extract estimated delivery days
    const estimatedDays = selectedCourier.estimated_delivery_days || null;

    console.log("[Shipping] Response:", {
      serviceable: true,
      courier: selectedCourier.courier_name,
      shippingCharge,
      estimatedDays,
      codAvailable,
    });

    return res.json({
      serviceable: true,
      shippingCharge,
      courier: selectedCourier.courier_name || null,
      estimatedDays,
      codAvailable,
      baseCharge: baseShippingCharge,
      weight,
    });
  } catch (error) {
    console.error("[Shipping] Unhandled error:", error.message);
    return res.status(500).json({
      serviceable: false,
      message: "Unable to check serviceability",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ── DEBUG: Get available pickup locations ──────────────────────────────────
const debugGetPickupLocations = async (req, res, next) => {
  try {
    const token = await getShiprocketToken();
    const response = await axios.get(`${SHIPROCKET_API_BASE}/settings/company/pickup`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const pickups = response.data?.data?.pickup_locations || [];
    console.log("[Shipping Debug] Available pickups:", pickups);

    const formatted = pickups.map((p) => ({
      name: p.pickup_location,
      pincode: p.postal_code,
      city: p.city || "N/A",
      state: p.state || "N/A",
    }));

    return res.json({
      message: "Available pickup locations in Shiprocket",
      pickupLocationName: process.env.SHIPROCKET_PICKUP_LOCATION || "NOT SET",
      pickups: formatted,
      instruction:
        "Set SHIPROCKET_PICKUP_LOCATION env var to one of the 'name' values above (case-insensitive)",
    });
  } catch (error) {
    console.error("[Shipping Debug] Error fetching pickups:", error.message);
    return res.status(500).json({
      error: error.message,
      message: "Failed to fetch pickup locations",
    });
  }
};

// ── DEBUG: Test Shiprocket authentication ──────────────────────────────────
const debugTestAuth = async (req, res, next) => {
  try {
    console.log("[Shipping Debug] Testing Shiprocket authentication...");
    console.log(`[Shipping Debug] Email: ${process.env.SHIPROCKET_EMAIL}`);
    console.log(`[Shipping Debug] Password length: ${process.env.SHIPROCKET_PWD?.length || 0}`);

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PWD;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing SHIPROCKET_EMAIL or SHIPROCKET_PWD env vars",
        email: email || "NOT SET",
        password: password ? "SET" : "NOT SET",
      });
    }

    const response = await axios.post(`${SHIPROCKET_API_BASE}/auth/login`, {
      email,
      password,
    });

    console.log("[Shipping Debug] ✅ Auth successful:", response.status);

    return res.json({
      success: true,
      message: "✅ Authentication successful",
      token: response.data?.token ? "received" : "MISSING",
      shiprocketResponse: response.data,
    });
  } catch (error) {
    const errorData = error.response?.data || error.message;
    const statusCode = error.response?.status;
    console.error(`[Shipping Debug] ❌ Auth failed (${statusCode}):`, errorData);

    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Authentication failed",
      statusCode,
      errorDetails: errorData,
      email: process.env.SHIPROCKET_EMAIL,
      passwordLength: process.env.SHIPROCKET_PWD?.length || 0,
    });
  }
};

module.exports = {
  checkServiceability,
  debugGetPickupLocations,
  debugTestAuth,
};

