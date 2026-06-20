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
    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
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
    isCustomisable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_customisable",
    },
    isNonReturnable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_non_returnable',
    },
    isHotDeal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_hot_deal",
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
    stockStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "stock_status",
    },
    warningThreshold: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      field: "warning_threshold",
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
    // FK → combos.id  (UUID, matches combos table primary key)
    comboId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "combo_id",
    },

    // ── Shipping (optional; used for logistics calculation) ──────────────────
    shippingWeight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      field: "shipping_weight",
    },
    shippingDimensions: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "shipping_dimensions", // { length, breadth, height }
    },
    freeShipping: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "free_shipping",
    },
    shippingClass: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "shipping_class", // "fragile", "oversized", etc.
    },
    // ── Partial COD & Customisation ─────────────────────────────────────────────
    isPartialCodAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_partial_cod_available",
    },
    // JSON array of customisation field configs e.g. [{type:'name'},{type:'font'},{type:'color'},{type:'note'}]
    customisationFields: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "customisation_fields",
    },
  },
  {
    tableName: "products",
  }
);

module.exports = Product;
