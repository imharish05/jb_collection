/**
 * Migration: add payment_failure_reason and razorpay_order_id columns to orders table
 * Run once: node Server/seeders/add-payment-failure-reason-and-razorpay-order-id-to-orders.js
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
        if (e.message.includes('Duplicate column') || e.message.includes('already exists')) {
          console.log(`– ${label} already exists`);
        } else throw e;
      }
    };

    await addCol('payment_failure_reason', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    }, 'payment_failure_reason');

    await addCol('razorpay_order_id', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    }, 'razorpay_order_id');

    console.log('\nMigration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
