const sequelize = require("./config/database");

async function checkSqlMode() {
  try {
    const [result] = await sequelize.query("SELECT @@sql_mode AS sqlMode;");
    console.log("SQL Mode:", result[0].sqlMode);
  } catch (err) {
    console.error("Failed to query SQL mode:", err);
  } finally {
    await sequelize.close();
  }
}

checkSqlMode();
