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
    const [count] = await sequelize.query("SELECT COUNT(*) as count FROM notifications");
    console.log("Total notifications count:", count);
    process.exit(0);
  } catch (err) {
    console.error("Database query failed:", err);
    process.exit(1);
  }
}

run();
