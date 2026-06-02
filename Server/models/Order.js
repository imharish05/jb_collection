const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "total_amount",
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned"
      ),
      defaultValue: "pending",
    },
    shippingAddressId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "shipping_address_id",
      references: { model: "addresses", key: "id" },
      onDelete: "RESTRICT",
    },
    billingAddressId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "billing_address_id",
      references: { model: "addresses", key: "id" },
      onDelete: "SET NULL",
    },
    paymentMethod: {
      type: DataTypes.STRING,
      field: "payment_method",
      defaultValue: "cod",
    },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "paid", "failed", "refunded", "partial"),
      defaultValue: "pending",
      field: "payment_status",
    },
    couponCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "coupon_code",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    shippingCharge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "shipping_charge",
      defaultValue: 0,
    },
    estimatedDeliveryDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "estimated_delivery_days",
    },
    shiprocketOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "shiprocket_order_id",
    },
    shiprocketShipmentId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "shiprocket_shipment_id",
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "transaction_id",
    },
    // Partial COD: delivery charge paid online, product cost paid on delivery
    deliveryChargePaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "delivery_charge_paid",
    },
    deliveryChargeTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "delivery_charge_transaction_id",
    },
    partialCodAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "partial_cod_amount",
      comment: "Amount to be collected on delivery (product cost)",
    },
  },
  {
    tableName: "orders",
  }
);

module.exports = Order;
