// controllers/reportController.js
const { Op, fn, col, literal } = require("sequelize");
const XLSX = require("xlsx");
const { Order, OrderItem, Product, Variant, User } = require("../models");

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build WHERE clause for order.createdAt based on dateRange / from / to */
function buildDateWhere(query) {
  const { dateRange, from, to } = query;
  const now = new Date();
  let gte, lte;

  switch (dateRange) {
    case "today":
      gte = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      lte = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case "last7":
      gte = new Date(now - 7 * 24 * 60 * 60 * 1000);
      lte = now;
      break;
    case "last30":
      gte = new Date(now - 30 * 24 * 60 * 60 * 1000);
      lte = now;
      break;
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
    default:
      break; // no date filter
  }

  if (gte || lte) {
    const clause = {};
    if (gte) clause[Op.gte] = gte;
    if (lte) clause[Op.lte] = lte;
    return { createdAt: clause };
  }
  return {};
}

/** Send the workbook as xlsx or csv */
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

/** Format a JS Date to "DD/MM/YYYY HH:MM" */
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
}

/** Format month from "YYYY-M" → "Jan 2025" */
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtMonth(ym) {
  const [y, m] = String(ym).split("-");
  return `${MONTH_NAMES[(parseInt(m) - 1)]} ${y}`;
}

const ACTIVE_STATUSES = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"];

// ── 1. Sales Report ──────────────────────────────────────────────────────────
const salesReport = async (req, res) => {
  try {
    const { format = "xlsx", orderStatus, productId } = req.query;
    const dateWhere = buildDateWhere(req.query);
    const statusWhere = orderStatus && orderStatus !== "all"
      ? { status: orderStatus }
      : {};

    const orders = await Order.findAll({
      where: { ...dateWhere, ...statusWhere },
      include: [
        { model: User, attributes: ["id", "name", "email"], required: false },
        {
          model: OrderItem, as: "items",
          where: productId && productId !== "all" ? { productId } : undefined,
          required: productId && productId !== "all" ? true : false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const rows = orders.map(o => ({
      "Order ID":        o.id,
      "Customer Name":   o.User?.name || "Guest",
      "Customer Email":  o.User?.email || "—",
      "Order Date":      fmtDate(o.createdAt),
      "Payment Method":  o.paymentMethod || "—",
      "Order Status":    o.status || "—",
      "Subtotal (₹)":   parseFloat(o.subtotal || 0).toFixed(2),
      "Discount (₹)":   parseFloat(o.discount || 0).toFixed(2),
      "Tax (₹)":         parseFloat(o.tax || 0).toFixed(2),
      "Shipping (₹)":   parseFloat(o.shippingCharge || o.shippingCost || 0).toFixed(2),
      "Final Amount (₹)": parseFloat(o.totalAmount || o.total || 0).toFixed(2),
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

// ── 2. Product Sales Report ──────────────────────────────────────────────────
const productSalesReport = async (req, res) => {
  try {
    const { format = "xlsx", productId } = req.query;
    const dateWhere = buildDateWhere(req.query);

    const orderWhere = { status: { [Op.in]: ACTIVE_STATUSES }, ...dateWhere };
    const itemWhere = productId && productId !== "all" ? { productId } : {};

    // Aggregate: group by productId + selectedVariantId
    const rows = await OrderItem.findAll({
      attributes: [
        "productId",
        ["selected_variant_id", "variantId"],
        "productName",
        [fn("SUM", col("OrderItem.quantity")), "qtySOLD"],
        [fn("COUNT", fn("DISTINCT", col("OrderItem.order_id"))), "totalOrders"],
        [fn("SUM", literal("OrderItem.quantity * OrderItem.sales_price")), "revenue"],
      ],
      where: itemWhere,
      include: [{
        model: Order,
        attributes: [],
        where: orderWhere,
        required: true,
      }],
      group: ["productId", "selected_variant_id", "productName"],
      order: [[literal("revenue"), "DESC"]],
      raw: true,
    });

    // Fetch variant details for sku + current stock
    const variantIds = [...new Set(rows.map(r => r.variantId).filter(Boolean))];
    const variants = variantIds.length
      ? await Variant.findAll({ where: { id: variantIds }, attributes: ["id", "sku", "stock", "variantName"], raw: true })
      : [];
    const varMap = {};
    variants.forEach(v => { varMap[String(v.id)] = v; });

    const data = rows.map(r => {
      const v = varMap[String(r.variantId)] || {};
      return {
        "Product Name":      r.productName || "—",
        "Variant":           v.variantName || "Default",
        "SKU":               v.sku || "—",
        "Qty Sold":          parseInt(r.qtySOLD) || 0,
        "Current Stock":     v.stock ?? "—",
        "Revenue (₹)":      parseFloat(r.revenue || 0).toFixed(2),
        "Total Orders":      parseInt(r.totalOrders) || 0,
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

// ── 3. Best Selling Products Report ─────────────────────────────────────────
const bestSellersReport = async (req, res) => {
  try {
    const { format = "xlsx" } = req.query;
    const dateWhere = buildDateWhere(req.query);
    const orderWhere = { status: { [Op.in]: ACTIVE_STATUSES }, ...dateWhere };

    const rows = await OrderItem.findAll({
      attributes: [
        "productId",
        "productName",
        ["selected_variant_id", "variantId"],
        [fn("SUM", col("OrderItem.quantity")), "qtySOLD"],
        [fn("SUM", literal("OrderItem.quantity * OrderItem.sales_price")), "revenue"],
      ],
      include: [{
        model: Order,
        attributes: [],
        where: orderWhere,
        required: true,
      }],
      group: ["productId", "selected_variant_id", "productName"],
      order: [[literal("qtySOLD"), "DESC"]],
      limit: 100,
      raw: true,
    });

    // Fetch current stock
    const variantIds = [...new Set(rows.map(r => r.variantId).filter(Boolean))];
    const variantMap = {};
    if (variantIds.length) {
      const vrs = await Variant.findAll({ where: { id: variantIds }, attributes: ["id", "stock"], raw: true });
      vrs.forEach(v => { variantMap[String(v.id)] = v.stock; });
    }

    const data = rows.map((r, idx) => ({
      "Rank":              idx + 1,
      "Product Name":      r.productName || "—",
      "Qty Sold":          parseInt(r.qtySOLD) || 0,
      "Revenue (₹)":      parseFloat(r.revenue || 0).toFixed(2),
      "Stock Remaining":   r.variantId ? (variantMap[String(r.variantId)] ?? "—") : "—",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Best Sellers");
    sendWorkbook(res, wb, "Best Sellers", `Best_Sellers_Report_${Date.now()}`, format);
  } catch (e) {
    console.error("bestSellersReport error:", e);
    res.status(500).json({ message: e.message });
  }
};

// ── 4. Monthly Sales Report ───────────────────────────────────────────────────
const monthlySalesReport = async (req, res) => {
  try {
    const { format = "xlsx" } = req.query;
    const dateWhere = buildDateWhere(req.query);
    const orderWhere = { status: { [Op.in]: ACTIVE_STATUSES }, ...dateWhere };

    const rows = await Order.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "month"],
        [fn("COUNT", col("Order.id")), "totalOrders"],
        [fn("SUM", col("total_amount")), "revenue"],
        [fn("AVG", col("total_amount")), "avgOrderValue"],
      ],
      where: orderWhere,
      group: [literal("month")],
      order: [[literal("month"), "ASC"]],
      raw: true,
    });

    const data = rows.map(r => ({
      "Month":              fmtMonth(r.month),
      "Total Orders":       parseInt(r.totalOrders) || 0,
      "Revenue (₹)":       parseFloat(r.revenue || 0).toFixed(2),
      "Avg Order Value (₹)": parseFloat(r.avgOrderValue || 0).toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Sales");
    sendWorkbook(res, wb, "Monthly Sales", `Monthly_Sales_Report_${Date.now()}`, format);
  } catch (e) {
    console.error("monthlySalesReport error:", e);
    res.status(500).json({ message: e.message });
  }
};

// ── 5. Inventory Report ───────────────────────────────────────────────────────
const inventoryReport = async (req, res) => {
  try {
    const { format = "xlsx", productId } = req.query;

    const variantWhere = productId && productId !== "all" ? { productId } : {};
    const variants = await Variant.findAll({
      where: variantWhere,
      include: [{ model: Product, as: "product", attributes: ["id", "name"], required: false }],
      order: [["productId", "ASC"], ["createdAt", "ASC"]],
    });

    // Get sold quantities in one aggregation
    const vIds = variants.map(v => v.id);
    const soldRows = vIds.length
      ? await OrderItem.findAll({
          attributes: [
            ["selected_variant_id", "variantId"],
            [fn("SUM", col("OrderItem.quantity")), "totalSold"],
          ],
          include: [{
            model: Order,
            attributes: [],
            where: { status: { [Op.in]: ACTIVE_STATUSES } },
            required: true,
          }],
          where: { selected_variant_id: { [Op.in]: vIds } },
          group: ["selected_variant_id"],
          raw: true,
        })
      : [];

    const soldMap = {};
    soldRows.forEach(r => { if (r.variantId) soldMap[String(r.variantId)] = parseInt(r.totalSold) || 0; });

    function stockStatus(stock) {
      if (stock <= 0) return "Out of Stock";
      if (stock <= 10) return "Low Stock";
      return "In Stock";
    }

    const data = variants.map(v => {
      const sold = soldMap[String(v.id)] || 0;
      return {
        "Product Name":   v.product?.name || "—",
        "Variant":        v.variantName || "Default",
        "SKU":            v.sku || "—",
        "Current Stock":  v.stock ?? 0,
        "Sold Quantity":  sold,
        "Stock Status":   stockStatus(v.stock ?? 0),
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    sendWorkbook(res, wb, "Inventory", `Inventory_Report_${Date.now()}`, format);
  } catch (e) {
    console.error("inventoryReport error:", e);
    res.status(500).json({ message: e.message });
  }
};

module.exports = { salesReport, productSalesReport, bestSellersReport, monthlySalesReport, inventoryReport };
