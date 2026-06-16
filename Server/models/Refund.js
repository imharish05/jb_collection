// models/Refund.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Refund = sequelize.define(
  "Refund",
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
    razorpayRefundId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "razorpay_refund_id",
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "refund_amount",
    },
    refundStatus: {
      type: DataTypes.ENUM(
        "pending",
        "initiated",
        "completed",
        "failed",
        "manual_pending",
        "manual_completed"
      ),
      defaultValue: "pending",
      field: "refund_status",
    },
    refundMode: {
      type: DataTypes.ENUM("razorpay", "manual_offline"),
      allowNull: false,
      field: "refund_mode",
    },
    manualRefundNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "manual_refund_notes",
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "refunded_at",
    },
  },
  {
    tableName: "refunds",
    timestamps: true,
  }
);

module.exports = Refund;
