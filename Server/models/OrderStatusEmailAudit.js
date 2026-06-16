const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrderStatusEmailAudit = sequelize.define(
  "OrderStatusEmailAudit",
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
    previousStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "previous_status",
    },
    newStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "new_status",
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "email_sent",
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "email_sent_at",
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "error_message",
    },
  },
  {
    tableName: "order_status_email_audits",
    timestamps: true,
  }
);

module.exports = OrderStatusEmailAudit;
