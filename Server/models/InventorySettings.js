const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const InventorySettings = sequelize.define("InventorySettings", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  highStockThreshold:   { type: DataTypes.INTEGER, allowNull: false, defaultValue: 51,  field: "high_stock_threshold" },
  mediumStockThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 11,  field: "medium_stock_threshold" },
  lowStockThreshold:    { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1,   field: "low_stock_threshold" },
  updatedBy: { type: DataTypes.STRING, allowNull: true, field: "updated_by" },
}, { tableName: "inventory_settings", timestamps: true });

module.exports = InventorySettings;
