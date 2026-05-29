const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Variant = sequelize.define("Variant", {
  id:          { type: DataTypes.INTEGER,        autoIncrement: true, primaryKey: true },
  productId:   { type: DataTypes.UUID,           allowNull: false, field: "product_id" },
  variantName: { type: DataTypes.STRING,         allowNull: false, field: "variant_name" },
  mrp:         { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  salesPrice:  { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: "sales_price" },
  stock:       { type: DataTypes.INTEGER,        defaultValue: 0 },
  stockStatus: { type: DataTypes.STRING,         allowNull: true, field: "stock_status" },
  warningThreshold: { type: DataTypes.INTEGER,   defaultValue: 5, field: "warning_threshold" },
  sku:         { type: DataTypes.STRING,         allowNull: true },
  attributes:  { type: DataTypes.JSON,           defaultValue: [], allowNull: true },
  status:      { type: DataTypes.STRING,         defaultValue: "Active" },
  image:       { type: DataTypes.STRING,         allowNull: true },

  // ── Shipping overrides (optional) ─────────────────────────────────────────
  shippingWeight: { type: DataTypes.DECIMAL(10, 3), allowNull: true, field: "shipping_weight" },
  shippingDimensions: { type: DataTypes.JSON, allowNull: true, field: "shipping_dimensions" },
  
  // Moved inside the column definitions block
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: "createdAt" 
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: "updatedAt"
  }
}, { 
  tableName: "Variants",
  timestamps: true // This tells Sequelize to manage them, but it will use our custom definitions above
});

module.exports = Variant;