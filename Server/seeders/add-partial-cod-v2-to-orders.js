/**
 * Migration: Partial COD v2 — proper advance/COD amount tracking
 * Adds: advance_paid, cod_amount, payment_type, cod_collected
 *
 * Run once: node Server/seeders/add-partial-cod-v2-to-orders.js
 */
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

(async () => {
  try {
    await sequelize.authenticate();
    const qi = sequelize.getQueryInterface();

    const addCol = async (col, def, label) => {
      try {
        await qi.addColumn('orders', col, def);
        console.log(`✓ ${label} added`);
      } catch (e) {
        if (e.message.includes('Duplicate column')) {
          console.log(`– ${label} already exists`);
        } else throw e;
      }
    };

    // advance_paid: what the customer paid online via Razorpay
    await addCol('advance_paid', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Amount paid online via Razorpay (advance)',
    }, 'advance_paid');

    // cod_amount: remaining balance to collect at delivery
    await addCol('cod_amount', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Amount to collect as COD at delivery (total - advance)',
    }, 'cod_amount');

    // payment_type: PARTIAL_COD | FULL_COD | PREPAID
    await addCol('payment_type', {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
      comment: 'PARTIAL_COD | FULL_COD | PREPAID',
    }, 'payment_type');

    // razorpay_payment_id: the actual Razorpay payment ID (pmt_xxx)
    // Note: transaction_id column already exists — we reuse it.
    // This column is just an alias/explicit field for Partial COD tracking.
    await addCol('razorpay_payment_id', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      comment: 'Razorpay payment ID for the advance payment',
    }, 'razorpay_payment_id');

    // cod_collected: flag set when delivery agent collects COD amount
    await addCol('cod_collected', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'True when COD amount has been collected on delivery',
    }, 'cod_collected');

    // delivery_status: track Shiprocket delivery lifecycle
    await addCol('delivery_status', {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
      comment: 'Shiprocket delivery status (PENDING, SHIPPED, DELIVERED, etc.)',
    }, 'delivery_status');

    console.log('\n✅ Partial COD v2 migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
})();