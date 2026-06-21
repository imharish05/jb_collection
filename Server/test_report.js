const { Op, fn, col, literal } = require("sequelize");
const { Order, OrderItem, Product, Variant, User } = require("./models");
const sequelize = require("./config/database");

const ACTIVE_STATUSES = ["pending", "confirmed","processing","shipped","out_for_delivery","delivered"];

async function testQuery() {
  try {
    // Enable ONLY_FULL_GROUP_BY for this session
    await sequelize.query("SET SESSION sql_mode = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';");
    console.log("SQL Mode set to ONLY_FULL_GROUP_BY!");

    const orderWhere = { status: { [Op.in]: ACTIVE_STATUSES } };
    
    console.log("Running OrderItem query...");
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
    console.log("Success! Found rows:", rows.length);
  } catch (err) {
    console.error("Query failed under ONLY_FULL_GROUP_BY:", err);
  } finally {
    await sequelize.close();
  }
}

testQuery();
