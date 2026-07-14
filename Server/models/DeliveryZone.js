const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DeliveryZone = sequelize.define("DeliveryZone", {
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  state:          { type: DataTypes.STRING(100), allowNull: true },
  pincode:        { type: DataTypes.TEXT, allowNull: true },
  deliveryCharge: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  status:         { type: DataTypes.ENUM("Active", "Inactive"), defaultValue: "Active" },
}, { tableName: "delivery_zones" });

module.exports = DeliveryZone;
