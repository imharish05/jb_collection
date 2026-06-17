const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StockHistory = sequelize.define("StockHistory", {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  variantId:     { type: DataTypes.INTEGER, allowNull: false, field: "variant_id" },
  previousStock: { type: DataTypes.INTEGER, allowNull: false, field: "previous_stock" },
  newStock:      { type: DataTypes.INTEGER, allowNull: false, field: "new_stock" },
  adjustment:    { type: DataTypes.INTEGER, allowNull: false },
  reason:        { type: DataTypes.STRING,  allowNull: true },
  updatedBy:     { type: DataTypes.STRING,  allowNull: true, field: "updated_by" },
}, { tableName: "stock_history", timestamps: true, updatedAt: false });

module.exports = StockHistory;
