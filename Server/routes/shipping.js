const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/auth");
const shippingController = require("../controllers/shippingController");

// Admin: settings
router.get("/settings", protect, adminOnly, shippingController.getSettings);
router.put("/settings", protect, adminOnly, shippingController.updateSettings);

// Admin: zones
router.get("/zones", protect, adminOnly, shippingController.listZones);
router.post("/zones", protect, adminOnly, shippingController.createZone);
router.put("/zones/:id", protect, adminOnly, shippingController.updateZone);
router.delete("/zones/:id", protect, adminOnly, shippingController.deleteZone);
router.post("/zones/:id/pincodes/import", protect, adminOnly, shippingController.importZonePincodes);

// Public-ish (protected by JWT via server.js for now): serviceability check for checkout
router.get("/serviceability", protect, shippingController.checkServiceability);

module.exports = router;

