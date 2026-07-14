const sequelize = require("./config/database");

async function check() {
  try {
    await sequelize.authenticate();
    console.log("DB connection successful");
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log("Tables in database:", tables);
    process.exit(0);
  } catch (err) {
    console.error("Diagnostic failed:", err);
    process.exit(1);
  }
}
check();
