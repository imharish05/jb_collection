const { Op, fn, col, literal } = require("sequelize");
const { Order, OrderItem } = require("./models");
const sequelize = require("./config/database");

async function testGroupProp() {
  try {
    const orderWhere = { status: { [Op.in]: ["confirmed"] } };
    
    console.log("Running query with model attribute names in GROUP BY...");
    const rows = await OrderItem.findAll({
      attributes: [
        "productId",
        ["selectedVariantId", "variantId"],
        "productName",
        "isCombo",
        [fn("SUM", col("quantity")),                               "qtySold"],
        [fn("COUNT", fn("DISTINCT", col("orderId"))),             "totalOrders"],
        [fn("SUM", literal("quantity * COALESCE(sales_price, price, 0)")), "revenue"],
      ],
      include: [{ model: Order, attributes: [], where: orderWhere, required: true }],
      group: ["productId", "selectedVariantId", "productName", "isCombo"],
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

testGroupProp();
