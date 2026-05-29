// controllers/dashboardController.js
const { Op } = require("sequelize");
const { Product, Variant, Category, User, Order } = require("../models");

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

    // Shape the recent products for the frontend
    const shaped = recentProducts.map((p) => {
      const row = p.toJSON();
      row.Variants = row.Variants || row.variants || [];
      delete row.variants;
      
      // Map base product price and discount as fallbacks for MRP and Sale Price
      row.mrp = parseFloat(row.price) || 0;
      row.salesPrice = row.price ? parseFloat((row.price * (1 - (row.discount || 0) / 100)).toFixed(2)) : 0;
      
      return row;
    });

    return res.json({
      stats: { totalProducts, totalCustomers },
      recentProducts: shaped,
    });
  } catch (err) {
    console.error("[Dashboard] getStats error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/dashboard/monthly-orders?year=2025 ─────────────────────────────
// Returns monthly order counts for a given year (defaults to current year).
// Response: [ { m: "Jan", sales: 14 }, { m: "Feb", sales: 22 }, ... ]
const getMonthlyOrders = async (req, res) => {
  try {
    const year  = parseInt(req.query.year) || new Date().getFullYear();
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end   = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const orders = await Order.findAll({
      where: {
        createdAt: { [Op.gte]: start, [Op.lt]: end },
        status:    { [Op.ne]: "cancelled" },
      },
      attributes: ["createdAt"],
    });

    const LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const counts = Array(12).fill(0);
    orders.forEach((o) => { counts[new Date(o.createdAt).getMonth()]++; });

    return res.json(LABELS.map((m, i) => ({ m, sales: counts[i] })));
  } catch (err) {
    console.error("[Dashboard] getMonthlyOrders error:", err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { getStats, getMonthlyOrders };