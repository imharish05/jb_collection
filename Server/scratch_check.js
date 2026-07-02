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
    const [variants] = await sequelize.query(`
      SELECT v.id, v.variant_name, v.mrp, v.sales_price, v.gst_mode, v.gst_rate, p.name 
      FROM Variants v
      JOIN Products p ON v.product_id = p.id
      WHERE p.name LIKE '%sample 1%'
    `);
    console.log("Variants for sample 1:");
    console.log(JSON.stringify(variants, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Database query failed:", err);
    process.exit(1);
  }
}

run();
