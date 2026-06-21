const { Op, fn, col, literal } = require("sequelize");
const { Order, OrderItem } = require("./models");
const sequelize = require("./config/database");

async function testGroupQualified() {
  try {
    const orderWhere = { status: { [Op.in]: ["confirmed"] } };
    
    console.log("Running query with qualified columns in GROUP BY...");
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
      group: [
        col("OrderItem.product_id"),
        col("OrderItem.selected_variant_id"),
        col("OrderItem.product_name"),
        col("OrderItem.is_combo")
      ],
      raw: true,
      logging: console.log,
    });
    console.log("Query completed successfully!");
  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    await sequelize.close();
  }
}

testGroupQualified();
