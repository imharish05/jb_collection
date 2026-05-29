const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChildComboProduct = sequelize.define("ChildComboProduct", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  childComboId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "child_combo_id",
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  // true = eligible pool item (mix_match), false = fixed included product
  isEligible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: "is_eligible",
  },
}, { tableName: "child_combo_products" });

module.exports = ChildComboProduct;
