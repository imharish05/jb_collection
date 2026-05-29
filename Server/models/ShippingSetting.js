const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * Singleton row (id=1) holding logistics provider configuration.
 * Stored server-side; never send secrets to the client.
 */
const ShippingSetting = sequelize.define(
  "ShippingSetting",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },

    provider: {
      type: DataTypes.ENUM("shiprocket"),
      allowNull: false,
      defaultValue: "shiprocket",
    },

    shiprocketEmail: { type: DataTypes.STRING, allowNull: true, field: "shiprocket_email" },
    shiprocketToken: { type: DataTypes.TEXT, allowNull: true, field: "shiprocket_token" },

    autoCreateShipment: { type: DataTypes.BOOLEAN, defaultValue: true, field: "auto_create_shipment" },
    autoAssignCourier: { type: DataTypes.BOOLEAN, defaultValue: true, field: "auto_assign_courier" },
    autoGenerateAwb: { type: DataTypes.BOOLEAN, defaultValue: true, field: "auto_generate_awb" },

    defaultWeight: { type: DataTypes.DECIMAL(10, 3), allowNull: false, defaultValue: 0.5, field: "default_weight" },
    defaultDimensions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { length: 10, breadth: 10, height: 10 },
      field: "default_dimensions",
    },

    defaultPickupLocation: { type: DataTypes.STRING, allowNull: true, field: "default_pickup_location" },
  },
  { tableName: "shipping_settings" }
);

module.exports = ShippingSetting;

