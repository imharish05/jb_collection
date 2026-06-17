const { Op, fn, col, literal } = require("sequelize");
const XLSX = require("xlsx");
const { Order, OrderItem, Product, Variant, User } = require("../models");

function buildDateWhere(query) {
  const { dateRange, from, to } = query;
  const now = new Date();
  let gte, lte;
  switch (dateRange) {
    case "today":
      gte = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      lte = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case "last7":  gte = new Date(now - 7  * 86400000); lte = now; break;
    case "last30": gte = new Date(now - 30 * 86400000); lte = now; break;
    case "thisMonth":
      gte = new Date(now.getFullYear(), now.getMonth(), 1);
      lte = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case "thisYear":
      gte = new Date(now.getFullYear(), 0, 1);
      lte = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case "custom":
      if (from) gte = new Date(from);
      if (to) { lte = new Date(to); lte.setHours(23, 59, 59); }
      break;
    default: break;
  }
  if (gte || lte) {
    const clause = {};
    if (gte) clause[Op.gte] = gte;
    if (lte) clause[Op.lte] = lte;
    return { createdAt: clause };
  }
  return {};
}

function sendWorkbook(res, wb, sheetName, filename, format) {
  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
    return res.send(csv);
  }
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
  return res.send(buf);
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
}

const ACTIVE_STATUSES = ["confirmed","processing","shipped","out_for_delivery","delivered"];

// ── 1. Sales Report ──────────────────────────────────────────────────────────
const salesReport = async (req, res) => {
  try {
    const { format = "xlsx", orderStatus } = req.query;
    const dateWhere   = buildDateWhere(req.query);
    const statusWhere = orderStatus && orderStatus !== "all" ? { status: orderStatus } : {};

    const orders = await Order.findAll({
      where: { ...dateWhere, ...statusWhere },
      include: [
        { model: User, attributes: ["id","name","email"], required: false },
        { model: OrderItem, as: "items", required: false },
      ],
      order: [["createdAt","DESC"]],
    });

    const rows = orders.map(o => ({
      "Order ID":         o.id,
      "Customer Name":    o.User?.name  || "Guest",
      "Customer Email":   o.User?.email || "—",
      "Order Date":       fmtDate(o.createdAt),
      "Payment Method":   o.paymentMethod || "—",
      "Order Status":     o.status || "—",
      "Subtotal (₹)":    parseFloat(o.subtotal      || 0).toFixed(2),
      "Discount (₹)":    parseFloat(o.discount      || 0).toFixed(2),
      "Tax (₹)":          parseFloat(o.tax           || 0).toFixed(2),
      "Shipping (₹)":    parseFloat(o.shippingCharge || o.shippingCost || 0).toFixed(2),
      "Final Amount (₹)": parseFloat(o.totalAmount   || o.total || 0).toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    sendWorkbook(res, wb, "Sales Report", `Sales_Report_${Date.now()}`, format);
  } catch (e) {
    console.error("salesReport error:", e);
    res.status(500).json({ message: e.message });
  }
};

// ── 2. Product-wise Sales Report ─────────────────────────────────────────────
const productSalesReport = async (req, res) => {
  try {
    const { format = "xlsx" } = req.query;
    const dateWhere  = buildDateWhere(req.query);
    const orderWhere = { status: { [Op.in]: ACTIVE_STATUSES }, ...dateWhere };

    const rows = await OrderItem.findAll({
      attributes: [
        "productId",
        ["selected_variant_id", "variantId"],
        "productName",
        [fn("SUM", col("OrderItem.quantity")),                               "qtySold"],
        [fn("COUNT", fn("DISTINCT", col("OrderItem.order_id"))),             "totalOrders"],
        [fn("SUM", literal("OrderItem.quantity * OrderItem.sales_price")),   "revenue"],
      ],
      include: [{ model: Order, attributes: [], where: orderWhere, required: true }],
      group: ["productId","selected_variant_id","productName"],
      order: [[literal("revenue"),"DESC"]],
      raw: true,
    });

    const variantIds = [...new Set(rows.map(r => r.variantId).filter(Boolean))];
    const varMap = {};
    if (variantIds.length) {
      const vs = await Variant.findAll({ where: { id: variantIds }, attributes: ["id","variantName","stock"], raw: true });
      vs.forEach(v => { varMap[String(v.id)] = v; });
    }

    const data = rows.map(r => {
      const v = varMap[String(r.variantId)] || {};
      return {
        "Product Name":    r.productName || "—",
        "Variant":         v.variantName || "Default",
        "Qty Sold":        parseInt(r.qtySold)     || 0,
        "Total Orders":    parseInt(r.totalOrders) || 0,
        "Revenue (₹)":    parseFloat(r.revenue     || 0).toFixed(2),
        "Current Stock":   v.stock ?? "—",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Product Sales");
    sendWorkbook(res, wb, "Product Sales", `Product_Sales_Report_${Date.now()}`, format);
  } catch (e) {
    console.error("productSalesReport error:", e);
    res.status(500).json({ message: e.message });
  }
};


// ── 3. Reports Overview ───────────────────────────────────────────────────────
const reportsOverview = async (req, res) => {
  try {
    const dateWhere = buildDateWhere(req.query);

    const [allOrders, cancelledCount, returnedCount, itemsAgg] = await Promise.all([
      Order.findAll({
        where: { ...dateWhere, status: { [Op.notIn]: ['cancelled', 'returned'] } },
        attributes: ['totalAmount'],
        raw: true,
      }),
      Order.count({ where: { ...dateWhere, status: 'cancelled' } }),
      Order.count({ where: { ...dateWhere, status: 'returned' } }),
      OrderItem.findAll({
        attributes: [[require('sequelize').fn('SUM', require('sequelize').col('quantity')), 'totalQty']],
        include: [{
          model: Order,
          attributes: [],
          where: { ...dateWhere, status: { [Op.notIn]: ['cancelled', 'returned'] } },
          required: true,
        }],
        raw: true,
      }),
    ]);

    const totalRevenue = allOrders.reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0);
    const totalOrders  = allOrders.length;
    const productsSold = parseInt(itemsAgg[0]?.totalQty || 0);
    const aov          = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      totalRevenue:    Math.round(totalRevenue * 100) / 100,
      totalOrders,
      productsSold,
      aov:             Math.round(aov * 100) / 100,
      cancelledOrders: cancelledCount,
      returnedOrders:  returnedCount,
    });
  } catch (e) {
    console.error('reportsOverview error:', e);
    res.status(500).json({ message: e.message });
  }
};

// ── 4. Top 10 Selling Variants ────────────────────────────────────────────────
const topProducts = async (req, res) => {
  try {
    const { fn, col, literal, Op } = require('sequelize');
    const dateWhere  = buildDateWhere(req.query);
    const orderWhere = { status: { [Op.in]: ACTIVE_STATUSES }, ...dateWhere };

    // optional product/variant filters
    const itemWhere = {};
    if (req.query.productId) itemWhere.productId = req.query.productId;
    if (req.query.variantId) itemWhere.selected_variant_id = req.query.variantId;

    // if category filter — get productIds first
    if (req.query.categoryId) {
      const { Product } = require('../models');
      const products = await Product.findAll({
        where: { category_id: req.query.categoryId },
        attributes: ['id'],
        raw: true,
      });
      itemWhere.productId = { [Op.in]: products.map(p => p.id) };
    }

    const rows = await OrderItem.findAll({
      where: itemWhere,
      attributes: [
        'productId',
        ['selected_variant_id', 'variantId'],
        'productName',
        [fn('SUM', col('OrderItem.quantity')),                              'qtySold'],
        [fn('SUM', literal('OrderItem.quantity * OrderItem.sales_price')), 'revenue'],
      ],
      include: [{ model: Order, attributes: [], where: orderWhere, required: true }],
      group: ['productId', 'selected_variant_id', 'productName'],
      order: [[literal('qtySold'), 'DESC']],
      limit: 10,
      raw: true,
    });

    const variantIds = [...new Set(rows.map(r => r.variantId).filter(Boolean))];
    const varMap = {};
    if (variantIds.length) {
      const vs = await Variant.findAll({
        where: { id: variantIds },
        attributes: ['id', 'variantName', 'sku', 'stock'],
        raw: true,
      });
      vs.forEach(v => { varMap[String(v.id)] = v; });
    }

    const data = rows.map((r, i) => {
      const v = varMap[String(r.variantId)] || {};
      return {
        rank:        i + 1,
        productName: r.productName || '—',
        variantName: v.variantName || 'Default',
        sku:         v.sku        || '—',
        qtySold:     parseInt(r.qtySold)  || 0,
        revenue:     Math.round(parseFloat(r.revenue || 0) * 100) / 100,
        currentStock: v.stock ?? '—',
      };
    });

    res.json({ data });
  } catch (e) {
    console.error('topProducts error:', e);
    res.status(500).json({ message: e.message });
  }
};

// ── 5. Filter options (categories + products + variants) ─────────────────────
const reportFilters = async (req, res) => {
  try {
    const { Product, Variant } = require('../models');
    const { Category } = require('../models');

    const [categories, products, variants] = await Promise.all([
      Category.findAll({ attributes: ['id', 'label'], where: { type: 'category' }, raw: true }).catch(() =>
        Category.findAll({ attributes: ['id', 'label'], raw: true })
      ),
      Product.findAll({ attributes: ['id', 'name'], where: { isActive: true }, raw: true }),
      Variant.findAll({ attributes: ['id', 'variantName', 'productId', 'sku'], raw: true }),
    ]);

    res.json({ categories, products, variants });
  } catch (e) {
    console.error('reportFilters error:', e);
    res.status(500).json({ message: e.message });
  }
};

module.exports = { salesReport, productSalesReport, reportsOverview, topProducts, reportFilters };