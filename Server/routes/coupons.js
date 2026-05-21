const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const { getAll, getActive, create, update, remove, validate } = require("../controllers/couponController");

// Public routes
router.get("/active", getActive);       // GET /api/coupons/active  — cart page
router.post("/validate", validate);     // POST /api/coupons/validate

// Admin routes
router.get("/admin/all", protect, adminOnly, getAll);
router.post("/admin/create", protect, adminOnly, create);
router.put("/admin/update/:id", protect, adminOnly, update);
router.delete("/admin/delete/:id", protect, adminOnly, remove);

module.exports = router;
