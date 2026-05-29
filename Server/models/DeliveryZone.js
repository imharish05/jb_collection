const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DeliveryZone = sequelize.define(
  "DeliveryZone",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },

    enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    priority: { type: DataTypes.INTEGER, defaultValue: 100 }, // lower number = higher priority

    countries: { type: DataTypes.JSON, allowNull: false, defaultValue: ["India"] },
    states: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    cities: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },

    shippingCharge: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, field: "shipping_charge" },
    freeShippingAbove: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: "free_shipping_above" },

    codAvailable: { type: DataTypes.BOOLEAN, defaultValue: true, field: "cod_available" },
    estimatedDays: { type: DataTypes.STRING, allowNull: true, field: "estimated_days" }, // "2-4"

    // optional: remote surcharge / notes for admin
    remoteSurcharge: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: "remote_surcharge" },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "delivery_zones" }
);

module.exports = DeliveryZone;

