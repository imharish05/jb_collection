const { Op, fn, col, literal } = require("sequelize");
const { Order, OrderItem } = require("./models");
const sequelize = require("./config/database");

async function testDateQuery() {
  try {
    // Mock req.query with dateRange: "thisMonth"
    const query = { dateRange: "thisMonth" };
    
    // buildDateWhere
    const now = new Date();
    const gte = new Date(now.getFullYear(), now.getMonth(), 1);
    const lte = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const dateWhere = { createdAt: { [Op.gte]: gte, [Op.lte]: lte } };

    const orderWhere = { status: { [Op.in]: ["confirmed"] }, ...dateWhere };
    
    console.log("Running query with dateWhere inside include...");
    const rows = await OrderItem.findAll({
      attributes: [
        "productId",
        ["selected_variant_id", "variantId"],
        "productName",
        "isCombo",
      ],
      include: [{ model: Order, attributes: [], where: orderWhere, required: true }],
      group: ["product_id", "selected_variant_id", "product_name", "is_combo"],
      raw: true,
      logging: console.log,
    });
    console.log("Successfully completed date query!");
  } catch (err) {
    console.error("Date query failed:", err);
  } finally {
    await sequelize.close();
  }
}

testDateQuery();
