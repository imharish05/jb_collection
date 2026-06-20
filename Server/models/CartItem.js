const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CartItem = sequelize.define(
  "CartItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "product_id",
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: { min: 1 },
    },
    selectedProductColor: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "selected_product_color",
    },
    selectedProductSize: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "selected_product_size",
    },
    selectedVariantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "selected_variant_id",
    },
    // MySQL uses JSON (not JSONB)
    productSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "product_snapshot",
    },
    customisationDetails: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "customisation_details",
    },
  },
  {
    tableName: "cart_items",
  }
);

module.exports = CartItem;
