// routes/dashboard.js
const express = require("express");
const router  = express.Router();
const { getStats, getMonthlyOrders, getMonthlySales, getQuarterlySales } = require("../controllers/dashboardController");

// GET /api/dashboard/stats
router.get("/stats", getStats);

// GET /api/dashboard/monthly-orders?year=2025
router.get("/monthly-orders", getMonthlyOrders);
router.get("/monthly-sales", getMonthlySales);

// GET /api/dashboard/quarterly-sales?year=2025
router.get("/quarterly-sales", getQuarterlySales);

module.exports = router;