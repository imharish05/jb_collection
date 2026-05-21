const express = require("express");
const router = express.Router();
const { getAll, getActive, create, update, remove, validate } = require("../controllers/couponController");

// Public routes
router.get("/active", getActive);       // GET /api/coupons/active  — cart page
router.post("/validate", validate);     // POST /api/coupons/validate

// Admin routes
router.get("/admin/all", getAll);
router.post("/admin/create", create);
router.put("/admin/update/:id", update);
router.delete("/admin/delete/:id", remove);

module.exports = router;
