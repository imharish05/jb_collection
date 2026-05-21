const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Coupon = sequelize.define("Coupon", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  type: { type: DataTypes.ENUM("percent", "flat"), defaultValue: "percent" },
  value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  min_order: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  max_discount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  expires_at: { type: DataTypes.DATE, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: "coupons" });

module.exports = Coupon;
