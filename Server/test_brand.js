const Brand = require("./models/Brand");
const sequelize = require("./config/database");

async function run() {
  try {
    const brands = await Brand.findAll();
    console.log("Existing brands:", JSON.stringify(brands, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}
run();
