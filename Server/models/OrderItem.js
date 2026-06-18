const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "order_id",
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "product_id",
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "product_name",
    },
    selectedVariantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "selected_variant_id",
    },
    selectedVariantName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "selected_variant_name",
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned"
      ),
      allowNull: true,
    },
    variantAttributes: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "variant_attributes",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    salesPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "sales_price",
    },
    discount: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
    },
    image: {
      type: DataTypes.JSON,
      allowNull: true,
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
    isCombo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_combo",
    },
    rootComboId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "root_combo_id",
    },
    childComboId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "child_combo_id",
    },
    comboName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "combo_name",
    },
    comboType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "combo_type",
    },
    selectedProducts: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "selected_products",
    },
    comboSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "combo_snapshot",
    },
    customerChoices: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "customer_choices",
    },
  },
  {
    tableName: "order_items",
  }
);

module.exports = OrderItem;
