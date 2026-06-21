const { Order, OrderItem } = require("./models");
const sequelize = require("./config/database");

async function checkData() {
  try {
    const orders = await Order.findAll({ limit: 5, raw: true });
    console.log("Orders count:", await Order.count());
    console.log("Orders:", orders);

    const items = await OrderItem.findAll({ limit: 5, raw: true });
    console.log("OrderItem count:", await OrderItem.count());
    console.log("OrderItems:", items);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sequelize.close();
  }
}

checkData();
