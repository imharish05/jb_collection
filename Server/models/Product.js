const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sku: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    offerEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "offer_end",
    },
    isNew: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_new",
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 0,
    },
    saleCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "sale_count",
    },
    // JSON array of category slugs — ["gifts", "divine"]
    category: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    // JSON array of event/tag slugs — ["birthday", "wedding"]
    tag: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    // JSON array of variation objects
    variation: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    // JSON array of image paths
    image: {
      type: DataTypes.JSON,
      defaultValue: [],
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
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    // FK → categories.id (UUID)
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "category_id",
    },
    // FK → sub_categories.id
    subCategoryId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      field: "sub_category_id",
    },
    // FK → brands.id
    brandId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "brand_id",
    },
    // FK → combos.id  (fixed: was wrong type + wrong JS key name)
    comboId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "combo_id",
    },
  },
  {
    tableName: "products",
  }
);

module.exports = Product;