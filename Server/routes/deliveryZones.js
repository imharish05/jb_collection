const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const { getAll, getActive, getCharge, create, update, remove } = require("../controllers/deliveryZoneController");

// Public routes (used by client at checkout)
router.get("/active", getActive);
router.get("/charge/:state", getCharge);

// Admin routes
router.get("/admin/all", protect, adminOnly, getAll);
router.post("/admin/create", protect, adminOnly, create);
router.put("/admin/update/:id", protect, adminOnly, update);
router.delete("/admin/delete/:id", protect, adminOnly, remove);

module.exports = router;
