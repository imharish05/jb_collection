// controllers/dashboardController.js
const { Op } = require("sequelize");
const { Product, Variant, Category, User, Order, InventorySettings } = require("../models");

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [totalProducts, totalCustomers, recentProducts] = await Promise.all([
      Product.count({ where: { isActive: true } }),
      User.count({ where: { role: "user" } }),
      Product.findAll({
        limit: 8,
        order: [["createdAt", "DESC"]],
        where: { isActive: true },
        attributes: ["id", ["name", "productName"], "createdAt", "categoryId", "price", "discount", "stock"],
        include: [
          {
            model: Category,
            foreignKey: "category_id",
            attributes: [["label", "name"]],
            required: false,
          },
          {
            model: Variant,
            as: "Variants",
            attributes: ["id", "mrp", "salesPrice", "stock", "sku", "variantName", "attributes", "status"],
            required: false,
          },
        ],
      }),
    ]);

    const shaped = recentProducts.map((p) => {
      const row = p.toJSON();
      row.Variants = row.Variants || row.variants || [];
      delete row.variants;
      const firstVar = row.Variants?.[0];
      row.mrp = firstVar ? parseFloat(firstVar.mrp) : (parseFloat(row.price) || 0);
      row.salesPrice = firstVar ? parseFloat(firstVar.salesPrice) : (row.price ? parseFloat((row.price * (1 - (row.discount || 0) / 100)).toFixed(2)) : 0);
      return row;
    });

    return res.json({ stats: { totalProducts, totalCustomers }, recentProducts: shaped });
  } catch (err) {
    console.error("[Dashboard] getStats error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/dashboard/recent-variants ──────────────────────────────────────
const getRecentVariants = async (req, res) => {
  try {
    const settings = await InventorySettings.findOne();
    const high   = settings?.highStockThreshold   ?? 51;
    const medium = settings?.mediumStockThreshold  ?? 11;
    const low    = settings?.lowStockThreshold     ?? 1;

    const variants = await Variant.findAll({
      limit: 8,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "mrp", "salesPrice", "stock", "variantName", "attributes", "status", "createdAt"],
      include: [
        {
          model: Product,
          as: "Product",
          attributes: [["name", "productName"]],
          include: [
            {
              model: Category,
              foreignKey: "category_id",
              attributes: [["label", "name"]],
              required: false,
            },
          ],
          required: false,
        },
      ],
    });

    const shaped = variants.map(v => {
      const row = v.toJSON();
      const qty = Number(row.stock) || 0;
      let stockStatus;
      if (qty === 0)         stockStatus = "out";
      else if (qty < low)    stockStatus = "out";
      else if (qty < medium) stockStatus = "low";
      else if (qty < high)   stockStatus = "medium";
      else                   stockStatus = "high";
      return { ...row, stockStatus };
    });

    res.json({ variants: shaped, thresholds: { high, medium, low } });
  } catch (err) {
    console.error("[Dashboard] getRecentVariants error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/dashboard/monthly-orders?year=2025 ─────────────────────────────
const getMonthlyOrders = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end   = new Date(year + 1, 0, 1);
    const orders = await Order.findAll({
      where: { createdAt: { [Op.gte]: start, [Op.lt]: end } },
      attributes: ["createdAt"],
    });
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const counts = Array(12).fill(0);
    orders.forEach((o) => { counts[new Date(o.createdAt).getMonth()]++; });
    res.json(MONTHS.map((m, i) => ({ m, sales: counts[i] })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/dashboard/monthly-sales?year=2025 ──────────────────────────────
const getMonthlySales = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end   = new Date(year + 1, 0, 1);
    const orders = await Order.findAll({
      where: { createdAt: { [Op.gte]: start, [Op.lt]: end }, status: { [Op.notIn]: ["cancelled"] } },
      attributes: ["createdAt", "totalAmount"],
    });
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const amounts = Array(12).fill(0);
    orders.forEach((o) => {
      amounts[new Date(o.createdAt).getMonth()] += parseFloat(o.totalAmount) || 0;
    });
    res.json(MONTHS.map((m, i) => ({ m, amount: Math.round(amounts[i]) })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/dashboard/quarterly-sales?year=2025 ────────────────────────────
const getQuarterlySales = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end   = new Date(year + 1, 0, 1);
    const orders = await Order.findAll({
      where: { createdAt: { [Op.gte]: start, [Op.lt]: end }, status: { [Op.notIn]: ["cancelled"] } },
      attributes: ["createdAt", "totalAmount"],
    });
    const quarters = [0, 0, 0, 0];
    orders.forEach((o) => {
      const q = Math.floor(new Date(o.createdAt).getMonth() / 3);
      quarters[q] += parseFloat(o.totalAmount) || 0;
    });
    const yearly = quarters.reduce((a, b) => a + b, 0);
    const QLABELS = ["Q1", "Q2", "Q3", "Q4"];
    res.json({
      yearly: Math.round(yearly),
      quarters: quarters.map((amount, i) => ({ q: QLABELS[i], amount: Math.round(amount) })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStats, getMonthlyOrders, getMonthlySales, getQuarterlySales, getRecentVariants };