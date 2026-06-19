const { Op, fn, col, literal } = require("sequelize");
const XLSX = require("xlsx");
const { Order, OrderItem, Product, Variant, User } = require("../models");
const {
  getRazorpay,
  buildRazorpayDateRange,
  fetchAllRazorpayPayments,
  paymentAmount,
  getDbOrderId,
  summarizeRazorpayPayments,
  resolveDbOrderIds,
} = require("../utils/razorpayReports");

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

    const rows = orders.map(o => {
      let subtotal = 0;
      if (o.items && o.items.length) {
        subtotal = o.items.reduce((sum, item) => sum + parseFloat(item.price || 0) * item.quantity, 0);
      } else {
        subtotal = parseFloat(o.totalAmount || 0) - parseFloat(o.shippingCharge || 0) + parseFloat(o.couponDiscount || 0) - parseFloat(o.taxAmount || 0);
      }

      return {
        "Order ID":         o.id,
        "Customer Name":    o.User?.name  || "Guest",
        "Customer Email":   o.User?.email || "—",
        "Order Date":       fmtDate(o.createdAt),
        "Payment Method":   o.paymentMethod || "—",
        "Order Status":     o.status || "—",
        "Subtotal (₹)":    parseFloat(subtotal).toFixed(2),
        "Discount (₹)":    parseFloat(o.couponDiscount || 0).toFixed(2),
        "Tax (₹)":          parseFloat(o.taxAmount || 0).toFixed(2),
        "Shipping (₹)":    parseFloat(o.shippingCharge || 0).toFixed(2),
        "Final Amount (₹)": parseFloat(o.totalAmount || 0).toFixed(2),
      };
    });

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
        "isCombo",
        [fn("SUM", col("OrderItem.quantity")),                               "qtySold"],
        [fn("COUNT", fn("DISTINCT", col("OrderItem.order_id"))),             "totalOrders"],
        [fn("SUM", literal("OrderItem.quantity * COALESCE(OrderItem.sales_price, OrderItem.price, 0)")), "revenue"],
      ],
      include: [{ model: Order, attributes: [], where: orderWhere, required: true }],
      group: ["productId","selected_variant_id","productName","isCombo"],
      order: [[literal("revenue"),"DESC"]],
      raw: true,
    });

    const variantIds = [...new Set(rows.map(r => r.variantId).filter(Boolean))];
    const varMap = {};
    if (variantIds.length) {
      const vs = await Variant.findAll({ where: { id: variantIds }, attributes: ["id","variantName","stock"], raw: true });
      vs.forEach(v => { varMap[String(v.id)] = v; });
    }

    const productIds = [...new Set(rows.map(r => r.productId).filter(Boolean))];
    const prodMap = {};
    if (productIds.length) {
      const ps = await Product.findAll({ where: { id: productIds }, attributes: ["id","stock"], raw: true });
      ps.forEach(p => { prodMap[String(p.id)] = p; });
    }

    const data = rows.map(r => {
      const v = varMap[String(r.variantId)] || {};
      const p = prodMap[String(r.productId)] || {};
      
      let currentStock = "—";
      if (r.variantId) {
        currentStock = v.stock ?? "—";
      } else if (!r.isCombo) {
        currentStock = p.stock ?? "—";
      }

      return {
        "Product Name":    r.productName || "—",
        "Variant":         r.isCombo ? "Combo" : (v.variantName || "Default"),
        "Qty Sold":        parseInt(r.qtySold)     || 0,
        "Total Orders":    parseInt(r.totalOrders) || 0,
        "Revenue (₹)":    parseFloat(r.revenue     || 0).toFixed(2),
        "Current Stock":   currentStock,
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


// ── 5. Successful Payments Report (Razorpay) ─────────────────────────────────
const successfulPayments = async (req, res) => {
  try {
    const { format = "xlsx" } = req.query;
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({ message: "Razorpay is not configured" });
    }

    const range = buildRazorpayDateRange(req.query);
    const payments = await fetchAllRazorpayPayments(razorpay, range);
    const captured = payments.filter(p => p.status === "captured");
    const orderNotesMap = await resolveDbOrderIds(razorpay, captured);

    const orderIds = [...new Set(captured.map(p => getDbOrderId(p, orderNotesMap)).filter(Boolean))];
    const orderMap = {};
    if (orderIds.length) {
      const orders = await Order.findAll({
        where: { id: orderIds },
        include: [{ model: User, attributes: ["id", "name", "email", "phone"], required: false }],
      });
      orders.forEach(o => { orderMap[o.id] = o; });
    }

    const rows = captured.map(p => {
      const dbOrderId = getDbOrderId(p, orderNotesMap);
      const o = dbOrderId ? orderMap[dbOrderId] : null;
      return {
        "Payment ID":       p.id,
        "Order ID":         dbOrderId || "—",
        "Customer Name":    o?.User?.name  || "Guest",
        "Customer Email":   o?.User?.email || "—",
        "Customer Phone":   o?.User?.phone || "—",
        "Payment Date":     fmtDate(p.created_at ? p.created_at * 1000 : null),
        "Payment Method":   p.method || "—",
        "Order Status":     o?.status || "—",
        "Amount (₹)":      paymentAmount(p).toFixed(2),
        "Payment Status":   "Successful",
        "Razorpay Order ID": p.order_id || "—",
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Successful Payments");
    sendWorkbook(res, wb, "Successful Payments", `Successful_Payments_${Date.now()}`, format);
  } catch (e) {
    console.error("successfulPayments error:", e);
    res.status(500).json({ message: e.message });
  }
};

// ── 6. Failed Payments Report (Razorpay) ─────────────────────────────────────
const failedPayments = async (req, res) => {
  try {
    const { format = "xlsx" } = req.query;
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({ message: "Razorpay is not configured" });
    }

    const range = buildRazorpayDateRange(req.query);
    const payments = await fetchAllRazorpayPayments(razorpay, range);
    const failed = payments.filter(p => p.status === "failed");
    const orderNotesMap = await resolveDbOrderIds(razorpay, failed);

    const orderIds = [...new Set(failed.map(p => getDbOrderId(p, orderNotesMap)).filter(Boolean))];
    const orderMap = {};
    if (orderIds.length) {
      const orders = await Order.findAll({
        where: { id: orderIds },
        include: [{ model: User, attributes: ["id", "name", "email", "phone"], required: false }],
      });
      orders.forEach(o => { orderMap[o.id] = o; });
    }

    const rows = failed.map(p => {
      const dbOrderId = getDbOrderId(p, orderNotesMap);
      const o = dbOrderId ? orderMap[dbOrderId] : null;
      const reason = p.error_description || p.error_reason || p.description || "Payment failed";
      return {
        "Payment ID":       p.id,
        "Order ID":         dbOrderId || "—",
        "Customer Name":    o?.User?.name  || "Guest",
        "Customer Email":   o?.User?.email || "—",
        "Customer Phone":   o?.User?.phone || "—",
        "Payment Date":     fmtDate(p.created_at ? p.created_at * 1000 : null),
        "Payment Method":   p.method || "—",
        "Order Status":     o?.status || "—",
        "Amount (₹)":      paymentAmount(p).toFixed(2),
        "Payment Status":   "Failed",
        "Razorpay Order ID": p.order_id || "—",
        "Failure Reason":   reason,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Failed Payments");
    sendWorkbook(res, wb, "Failed Payments", `Failed_Payments_${Date.now()}`, format);
  } catch (e) {
    console.error("failedPayments error:", e);
    res.status(500).json({ message: e.message });
  }
};

// ── 7. Financial Summary Report (Razorpay) ─────────────────────────────────────
const financialSummary = async (req, res) => {
  try {
    const { format = "xlsx" } = req.query;
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({ message: "Razorpay is not configured" });
    }

    const range = buildRazorpayDateRange(req.query);
    const payments = await fetchAllRazorpayPayments(razorpay, range);
    const { successCount, failedCount, successAmount, failedAmount } = summarizeRazorpayPayments(payments);

    const rows = [
      { "Metric": "Successful Payments", "Count": successCount, "Amount (₹)": successAmount.toFixed(2) },
      { "Metric": "Failed Payments",     "Count": failedCount,  "Amount (₹)": failedAmount.toFixed(2) },
      { "Metric": "Net Collected",       "Count": successCount, "Amount (₹)": successAmount.toFixed(2) },
      { "Metric": "Total Attempts",      "Count": successCount + failedCount, "Amount (₹)": (successAmount + failedAmount).toFixed(2) },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financial Summary");
    sendWorkbook(res, wb, "Financial Summary", `Financial_Summary_${Date.now()}`, format);
  } catch (e) {
    console.error("financialSummary error:", e);
    res.status(500).json({ message: e.message });
  }
};

// ── 8. Payment Report ─────────────────────────────────────────
const paymentReport = async (req, res) => {
  try {
    const { format = "xlsx", status } = req.query;
    const dateWhere   = buildDateWhere(req.query);
    const statusWhere = status && status !== "all" ? { paymentStatus: status } : {};

    const orders = await Order.findAll({
      where: { ...dateWhere, ...statusWhere },
      include: [
        { model: User, attributes: ["id","name","email"], required: false },
      ],
      order: [["createdAt","DESC"]],
    });

    const rows = orders.map(o => {
      const isPrepaid = (o.paymentType || '').toUpperCase() === 'PREPAID' || o.paymentMethod !== 'partial_cod';
      const rzpPaid = o.advancePaid ? parseFloat(o.advancePaid) : (isPrepaid && o.paymentStatus === 'paid' ? parseFloat(o.totalAmount || 0) : 0);
      const codDue = o.codAmount ? parseFloat(o.codAmount) : (!isPrepaid ? parseFloat(o.totalAmount || 0) - rzpPaid : 0);

      return {
        "Order ID":         o.id,
        "Customer Name":    o.User?.name  || "Guest",
        "Customer Email":   o.User?.email || "—",
        "Payment ID (Razorpay)": o.razorpayPaymentId || "—",
        "Order Date":       fmtDate(o.createdAt),
        "Payment Method":   o.paymentMethod || "—",
        "Payment Status":   o.paymentStatus || "—",
        "Total Amount (₹)":  parseFloat(o.totalAmount || 0).toFixed(2),
        "Razorpay Paid (₹)": parseFloat(rzpPaid).toFixed(2),
        "Due on Delivery (₹)": parseFloat(Math.max(0, codDue)).toFixed(2),
        "COD Collected?":   o.codCollected ? "Yes" : "No",
        "Failure Reason":   o.paymentFailureReason || "—",
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");

    // Add separate summary sheet (xlsx only)
    if (format === "xlsx") {
      let totalSuccessfulAmount = 0;
      let totalSuccessfulCount = 0;
      let totalFailedCount = 0;
      let totalFailedAmount = 0;
      const methodStats = {};

      orders.forEach(o => {
        const amt = parseFloat(o.totalAmount || 0);
        const adv = parseFloat(o.advancePaid || 0);
        const cod = parseFloat(o.codAmount || 0);
        const isPartialCod = o.paymentType === 'PARTIAL_COD';
        const statusVal = o.paymentStatus;
        const method = o.paymentMethod || "Unknown";

        if (!methodStats[method]) {
          methodStats[method] = { successfulAmount: 0, successfulCount: 0, failedAmount: 0, failedCount: 0 };
        }

        if (statusVal === 'paid') {
          totalSuccessfulAmount += amt;
          totalSuccessfulCount++;
          methodStats[method].successfulAmount += amt;
          methodStats[method].successfulCount++;
        } else if (statusVal === 'partial') {
          // Online advance payment successful, remaining COD is pending
          totalSuccessfulAmount += adv;
          totalSuccessfulCount++;
          methodStats[method].successfulAmount += adv;
          methodStats[method].successfulCount++;
        } else if (statusVal === 'failed') {
          if (isPartialCod && adv > 0) {
            // Online advance was successfully captured, but the cash delivery part failed
            totalSuccessfulAmount += adv;
            totalSuccessfulCount++;
            methodStats[method].successfulAmount += adv;
            methodStats[method].successfulCount++;

            totalFailedAmount += cod;
            totalFailedCount++;
            methodStats[method].failedAmount += cod;
            methodStats[method].failedCount++;
          } else {
            totalFailedAmount += amt;
            totalFailedCount++;
            methodStats[method].failedAmount += amt;
            methodStats[method].failedCount++;
          }
        }
      });

      const totalAttempts = totalSuccessfulCount + totalFailedCount;
      const successRate = totalAttempts > 0 ? (totalSuccessfulCount / totalAttempts) * 100 : 0;

      const summaryRows = [
        { "Metric": "Total Successful Amount (₹)", "Value": totalSuccessfulAmount.toFixed(2) },
        { "Metric": "Total Successful Count",     "Value": totalSuccessfulCount },
        { "Metric": "Total Failed Amount (₹)",     "Value": totalFailedAmount.toFixed(2) },
        { "Metric": "Total Failed Count",         "Value": totalFailedCount },
        { "Metric": "Success Rate (%)",           "Value": successRate.toFixed(2) + "%" },
        { "Metric": "", "Value": "" },
        { "Metric": "Breakdown by Payment Method", "Value": "" }
      ];

      Object.entries(methodStats).forEach(([method, stats]) => {
        summaryRows.push({
          "Metric": `  Method: ${method} - Success Count`,
          "Value": stats.successfulCount
        });
        summaryRows.push({
          "Metric": `  Method: ${method} - Success Amount (₹)`,
          "Value": stats.successfulAmount.toFixed(2)
        });
        summaryRows.push({
          "Metric": `  Method: ${method} - Failed Count`,
          "Value": stats.failedCount
        });
        summaryRows.push({
          "Metric": `  Method: ${method} - Failed Amount (₹)`,
          "Value": stats.failedAmount.toFixed(2)
        });
      });

      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    }

    sendWorkbook(res, wb, "Payments", `Payments_Report_${Date.now()}`, format);
  } catch (e) {
    console.error("paymentReport error:", e);
    res.status(500).json({ message: e.message });
  }
};

module.exports = {
  buildDateWhere,
  salesReport,
  productSalesReport,
  reportsOverview,
  topProducts,
  reportFilters,
  successfulPayments,
  failedPayments,
  financialSummary,
  paymentReport,
};