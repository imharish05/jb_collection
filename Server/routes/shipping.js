const express = require("express");
const router = express.Router();

const shippingController = require("../controllers/shippingController");

// Public: serviceability check for checkout
router.get("/serviceability", shippingController.checkServiceability);

// Debug: list available pickup locations (development only)
if (process.env.NODE_ENV === "development") {
  router.get("/debug/pickups", shippingController.debugGetPickupLocations);
  router.get("/debug/auth", shippingController.debugTestAuth);
}

module.exports = router;

