// routes/dashboard.js
const express = require("express");
const router  = express.Router();
const { getStats, getMonthlyOrders, getMonthlySales, getQuarterlySales } = require("../controllers/dashboardController");
const { salesReport, productSalesReport, bestSellersReport, monthlySalesReport, inventoryReport } = require("../controllers/reportController");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/dashboard/stats
router.get("/stats", getStats);

// GET /api/dashboard/monthly-orders?year=2025
router.get("/monthly-orders", getMonthlyOrders);
router.get("/monthly-sales", getMonthlySales);

// GET /api/dashboard/quarterly-sales?year=2025
router.get("/quarterly-sales", getQuarterlySales);

// ── Export Reports (Protected, Admin Only) ───────────────────────────────────
router.get("/reports/sales", protect, adminOnly, salesReport);
router.get("/reports/product-sales", protect, adminOnly, productSalesReport);
router.get("/reports/best-sellers", protect, adminOnly, bestSellersReport);
router.get("/reports/monthly-sales", protect, adminOnly, monthlySalesReport);
router.get("/reports/inventory", protect, adminOnly, inventoryReport);

module.exports = router;