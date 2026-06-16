// models/Return.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Return = sequelize.define(
  "Return",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "order_id",
    },
    orderItemId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "order_item_id",
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
    },
    returnType: {
      type: DataTypes.ENUM("refund", "replacement"),
      allowNull: false,
      field: "return_type",
    },
    reason: {
      type: DataTypes.ENUM(
        "damaged_product",
        "defective_product",
        "wrong_product",
        "different_from_description",
        "shipping_damage",
        "other"
      ),
      allowNull: false,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    returnQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "return_quantity",
    },
    status: {
      type: DataTypes.ENUM(
        "pending_review",
        "approved",
        "rejected",
        "pickup_scheduled",
        "picked_up",
        "inspection_completed",
        "refund_initiated",
        "refund_completed",
        "replacement_shipped",
        "replacement_delivered",
        "cancelled"
      ),
      defaultValue: "pending_review",
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "admin_notes",
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "approved_by",
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "approved_at",
    },
    rejectedReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "rejected_reason",
    },
  },
  {
    tableName: "returns",
    timestamps: true,
  }
);

module.exports = Return;
