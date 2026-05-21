const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Variant = sequelize.define("Variant", {
  id:          { type: DataTypes.INTEGER,        autoIncrement: true, primaryKey: true },
  productId:   { type: DataTypes.UUID,           allowNull: false, field: "product_id" },
  variantName: { type: DataTypes.STRING,         allowNull: false, field: "variant_name" },
  mrp:         { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  salesPrice:  { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: "sales_price" },
  stock:       { type: DataTypes.INTEGER,        defaultValue: 0 },
  sku:         { type: DataTypes.STRING,         allowNull: true },
  attributes:  { type: DataTypes.JSON,           defaultValue: [], allowNull: true },
  status:      { type: DataTypes.STRING,         defaultValue: "Active" },
  image:       { type: DataTypes.STRING,         allowNull: true },
}, { tableName: "variants" });

module.exports = Variant;
