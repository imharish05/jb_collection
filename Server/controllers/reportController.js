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

module.exports = { salesReport, productSalesReport };