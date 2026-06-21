const { Op, fn, col, literal } = require("sequelize");
const { Order, OrderItem, Product, Variant, User } = require("./models");
const sequelize = require("./config/database");

const ACTIVE_STATUSES = ["confirmed","processing","shipped","out_for_delivery","delivered"];

async function runRealQuery() {
  try {
    const orderWhere = { status: { [Op.in]: ACTIVE_STATUSES } };
    
    console.log("Running real OrderItem query...");
    const rows = await OrderItem.findAll({
      attributes: [
        "productId",
        ["selected_variant_id", "variantId"],
        "productName",
        "isCombo",
        [fn("SUM", col("quantity")),                               "qtySold"],
        [fn("COUNT", fn("DISTINCT", col("order_id"))),             "totalOrders"],
        [fn("SUM", literal("quantity * COALESCE(sales_price, price, 0)")), "revenue"],
      ],
      include: [{ model: Order, attributes: [], where: orderWhere, required: true }],
      group: ["product_id", "selected_variant_id", "product_name", "is_combo"],
      order: [[literal("revenue"),"DESC"]],
      raw: true,
      logging: console.log,
    });
    console.log("Found rows count:", rows.length);
    if (rows.length > 0) {
      console.log("Rows:", JSON.stringify(rows, null, 2));
      
      const variantIds = [...new Set(rows.map(r => r.variantId).filter(Boolean))];
      console.log("variantIds:", variantIds);
      const varMap = {};
      if (variantIds.length) {
        const vs = await Variant.findAll({ where: { id: variantIds }, attributes: ["id","variantName","stock"], raw: true });
        vs.forEach(v => { varMap[String(v.id)] = v; });
      }
      console.log("varMap:", varMap);

      const productIds = [...new Set(rows.map(r => r.productId).filter(Boolean))];
      console.log("productIds:", productIds);
      const prodMap = {};
      if (productIds.length) {
        const ps = await Product.findAll({ where: { id: productIds }, attributes: ["id","stock"], raw: true });
        ps.forEach(p => { prodMap[String(p.id)] = p; });
      }
      console.log("prodMap:", prodMap);

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
      console.log("Spreadsheet data:", data);
    }
  } catch (err) {
    console.error("Real query failed with error:", err);
  } finally {
    await sequelize.close();
  }
}

runRealQuery();
