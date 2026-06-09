const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const InventoryLog = sequelize.define(
  "InventoryLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "order_id",
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "product_id",
    },
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "variant_id",
    },
    comboId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "combo_id",
    },
    comboType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "combo_type",
    },
    quantityChanged: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "quantity_changed",
    },
    stockBefore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "stock_before",
    },
    stockAfter: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "stock_after",
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    paymentSource: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "payment_source",
    },
  },
  {
    tableName: "inventory_logs",
    timestamps: true,
  }
);

module.exports = InventoryLog;
