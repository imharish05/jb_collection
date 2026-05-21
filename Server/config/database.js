const { Sequelize } = require("sequelize");
const dotenv = require("dotenv")
dotenv.config()
console.log("--- DATABASE DEBUG ---");
console.log("USER:", process.env.DB_USER);
console.log("PASS:", process.env.DB_PASSWORD ? "PROVIDED" : "MISSING");
console.log("----------------------");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  }
);

module.exports = sequelize;
