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
      comment: "Full order value (product total). Always the true total.",
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

    // ── Partial COD v2 Fields ────────────────────────────────────────────────

    /**
     * paymentType: high-level payment mode
     *   PARTIAL_COD  — advance online, rest collected at door
     *   FULL_COD     — entire amount collected at door
     *   PREPAID      — full payment online
     */
    paymentType: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "payment_type",
    },

    /**
     * advancePaid: amount the customer paid online (Razorpay)
     * For PARTIAL_COD this is the delivery charge.
     * For PREPAID this equals totalAmount.
     * For FULL_COD this is 0 / null.
     */
    advancePaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "advance_paid",
    },

    /**
     * codAmount: amount to collect at delivery
     * = totalAmount - advancePaid  (validated: never negative)
     * Sent as `cod_amount` to Shiprocket.
     */
    codAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "cod_amount",
    },

    /**
     * razorpayPaymentId: the Razorpay payment ID (pay_xxx) for the advance
     * Used for refund lookups and audit trail.
     */
    razorpayPaymentId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "razorpay_payment_id",
    },

    /**
     * codCollected: set true by admin when delivery agent confirms COD collection
     */
    codCollected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "cod_collected",
    },

    /**
     * deliveryStatus: Shiprocket AWB / shipment delivery status
     */
    deliveryStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "delivery_status",
    },

    // ── Legacy / existing fields (kept for backward compat) ─────────────────

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
    // Legacy partial COD columns (kept; new code uses advancePaid/codAmount instead)
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
      comment: "Legacy: use codAmount instead",
    },
    inventoryProcessed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "inventory_processed",
    },
    inventoryRestored: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "inventory_restored",
    },
  },
  {
    tableName: "orders",
  }
);

module.exports = Order;