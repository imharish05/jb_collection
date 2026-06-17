// routes/dashboard.js
const express = require("express");
const router  = express.Router();
const { getStats, getMonthlyOrders, getMonthlySales, getQuarterlySales, getRecentVariants } = require("../controllers/dashboardController");
const { salesReport, productSalesReport } = require("../controllers/reportController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/stats",            getStats);
router.get("/recent-variants",  getRecentVariants);
router.get("/monthly-orders",   getMonthlyOrders);
router.get("/monthly-sales",    getMonthlySales);
router.get("/quarterly-sales",  getQuarterlySales);

// ── Export Reports (Protected, Admin Only) ───────────────────────────────────
router.get("/reports/sales",          protect, adminOnly, salesReport);
router.get("/reports/product-sales",  protect, adminOnly, productSalesReport);

module.exports = router;