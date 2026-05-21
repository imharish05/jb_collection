// routes/dashboard.js
const express = require("express");
const router  = express.Router();
const { getStats, getMonthlyOrders } = require("../controllers/dashboardController");

// GET /api/dashboard/stats
router.get("/stats", getStats);

// GET /api/dashboard/monthly-orders?year=2025
router.get("/monthly-orders", getMonthlyOrders);

module.exports = router;