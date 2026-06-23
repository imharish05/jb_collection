const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

async function run() {
  try {
    const [orders] = await sequelize.query("SELECT * FROM orders WHERE reference_slug = 'KGF001176'");
    console.log("Order KGF001176:");
    console.log(orders);

    if (orders.length > 0) {
      const [items] = await sequelize.query(`SELECT id, order_id, product_name, customisation_details FROM order_items WHERE order_id = '${orders[0].id}'`);
      console.log("Order items for KGF001176:");
      console.log(items);
    }

    process.exit(0);
  } catch (err) {
    console.error("Database query failed:", err);
    process.exit(1);
  }
}

run();
