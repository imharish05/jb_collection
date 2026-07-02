const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// ─── Category ────────────────────────────────────────────────────────────────

const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "sort_order",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  { tableName: "categories" }
);

// ─── Event ────────────────────────────────────────────────────────────────────

const Event = sequelize.define(
  "Event",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {                        // ← add this
      type: DataTypes.STRING,
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "sort_order",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  { tableName: "events" }
);

// ─── Combo ────────────────────────────────────────────────────────────────────

const Combo = sequelize.define(
  "Combo",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Display name shown in UI, e.g. "Birthday Gifts"
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Nav label, e.g. "Birthday Combo"
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Nav slug/filter value, e.g. "birthday-combo"
    value: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Array of Product UUIDs stored as JSON
    productIds: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: "product_ids",
      validate: {
        isArray(val) {
          if (!Array.isArray(val)) {
            throw new Error("productIds must be an array");
          }
        },
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discountedPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "discounted_price",
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "sort_order",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  { tableName: "combos" }
);


// ─── SubCategory ──────────────────────────────────────────────────────────────

const SubCategory = sequelize.define(
  "SubCategory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "category_id",
      references: { model: "categories", key: "id" },
      onDelete: "CASCADE",
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "sort_order",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  { tableName: "subcategories" }
);

// ─── SubSubCategory ───────────────────────────────────────────────────────────

const SubSubCategory = sequelize.define(
  "SubSubCategory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    subCategoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "sub_category_id",
      references: { model: "subcategories", key: "id" },
      onDelete: "CASCADE",
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "sort_order",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  { tableName: "subsubcategories" }
);

// Associations
Category.hasMany(SubCategory, { foreignKey: "category_id", as: "subcategories", onDelete: "CASCADE" });
SubCategory.belongsTo(Category, { foreignKey: "category_id", as: "category" });

SubCategory.hasMany(SubSubCategory, { foreignKey: "sub_category_id", as: "subsubcategories", onDelete: "CASCADE" });
SubSubCategory.belongsTo(SubCategory, { foreignKey: "sub_category_id", as: "subcategory" });

module.exports = { Category, Event, Combo, SubCategory, SubSubCategory };
