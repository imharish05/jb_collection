const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DeliveryZonePincode = sequelize.define(
  "DeliveryZonePincode",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    zoneId: { type: DataTypes.UUID, allowNull: false, field: "zone_id" },
    pincode: { type: DataTypes.STRING(10), allowNull: false },
    enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "delivery_zone_pincodes",
    indexes: [
      { unique: true, fields: ["zone_id", "pincode"] },
      { fields: ["pincode"] },
    ],
  }
);

module.exports = DeliveryZonePincode;

