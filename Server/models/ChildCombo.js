const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChildCombo = sequelize.define("ChildCombo", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  rootComboId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "root_combo_id",
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  shortDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: "short_description",
  },
  fullDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: "full_description",
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM("fixed", "mix_match"),
    allowNull: false,
    defaultValue: "fixed",
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: "original_price",
  },
  comboPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: "combo_price",
  },
  minQty: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: "min_qty",
  },
  maxQty: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: "max_qty",
  },
  allowDuplicates: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: "allow_duplicates",
  },
  allowedCategoryIds: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    field: "allowed_category_ids",
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: "is_active",
  },
}, { tableName: "child_combos" });

module.exports = ChildCombo;
