// models/ReverseShipment.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ReverseShipment = sequelize.define(
  "ReverseShipment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    returnId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "return_id",
    },
    // ── Reverse Pickup (product coming back from customer) ──────────────────
    shiprocketReturnId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "shiprocket_return_id",
    },
    awbCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "awb_code",
    },
    courierName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "courier_name",
    },
    pickupStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "pickup_status",
    },
    trackingUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "tracking_url",
    },
    // ── Replacement Forward Shipment (new product going to customer) ────────
    replacementShiprocketOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "replacement_shiprocket_order_id",
    },
    replacementAwb: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "replacement_awb",
    },
    replacementCourier: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "replacement_courier",
    },
    replacementTrackingUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "replacement_tracking_url",
    },
    replacementDispatchedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "replacement_dispatched_at",
    },
  },
  {
    tableName: "reverse_shipments",
    timestamps: true,
  }
);

module.exports = ReverseShipment;
