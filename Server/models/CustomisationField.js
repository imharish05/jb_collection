const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * CustomisationField — globally-managed customisation input templates.
 * Admin creates these in Settings → Customisation Fields.
 * Products reference them by ID via products.customisation_fields JSON column.
 */
const CustomisationField = sequelize.define(
  "CustomisationField",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // Internal unique key: "name", "font", "color", "note", or any custom key
    key: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    // Label shown to customer on PDP: "Name / Text Engraving"
    label: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    // Placeholder shown inside the input: "e.g. John Smith"
    placeholder: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    // Emoji / icon shown in the UI: "✏️"
    icon: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    // Input type: "text" | "textarea" | "color" | "font" | "select"
    inputType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "text",
      field: "input_type",
    },
    // For inputType = "select" or "font": JSON array of option strings
    options: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Is this field currently active / available to be enabled on products?
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    // Sort order for display in admin/client
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "sort_order",
    },
    // Is this field required when enabled on a product?
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_required",
    },
  },
  {
    tableName: "customisation_fields",
  }
);

module.exports = CustomisationField;
