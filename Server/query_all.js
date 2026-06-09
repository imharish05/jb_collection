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
    const [cats] = await sequelize.query("SELECT id, label, image FROM categories LIMIT 5");
    console.log("Categories in DB:");
    console.log(cats);

    const [events] = await sequelize.query("SELECT id, label, image FROM events LIMIT 5");
    console.log("Events in DB:");
    console.log(events);

    const [combos] = await sequelize.query("SELECT id, name, image FROM root_combos LIMIT 5");
    console.log("Combos in DB:");
    console.log(combos);

    process.exit(0);
  } catch (err) {
    console.error("Database query failed:", err);
    process.exit(1);
  }
}

run();
