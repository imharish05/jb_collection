/**
 * Migration: add partial COD columns to orders table
 * Run once: node Server/seeders/add-partial-cod-to-orders.js
 */
const sequelize = require('../config/database');

(async () => {
  try {
    await sequelize.authenticate();
    const qi = sequelize.getQueryInterface();

    // Add delivery_charge_paid
    try {
      await qi.addColumn('orders', 'delivery_charge_paid', {
        type: require('sequelize').DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
      console.log('✓ delivery_charge_paid added');
    } catch (e) {
      if (e.message.includes('Duplicate column')) {
        console.log('– delivery_charge_paid already exists');
      } else throw e;
    }

    // Add delivery_charge_transaction_id
    try {
      await qi.addColumn('orders', 'delivery_charge_transaction_id', {
        type: require('sequelize').DataTypes.STRING,
        allowNull: true,
      });
      console.log('✓ delivery_charge_transaction_id added');
    } catch (e) {
      if (e.message.includes('Duplicate column')) {
        console.log('– delivery_charge_transaction_id already exists');
      } else throw e;
    }

    // Add partial_cod_amount
    try {
      await qi.addColumn('orders', 'partial_cod_amount', {
        type: require('sequelize').DataTypes.DECIMAL(10, 2),
        allowNull: true,
      });
      console.log('✓ partial_cod_amount added');
    } catch (e) {
      if (e.message.includes('Duplicate column')) {
        console.log('– partial_cod_amount already exists');
      } else throw e;
    }

    // Alter payment_status ENUM to include 'partial'
    try {
      await sequelize.query(
        "ALTER TABLE orders MODIFY COLUMN payment_status ENUM('pending','paid','failed','refunded','partial') DEFAULT 'pending'"
      );
      console.log('✓ payment_status ENUM updated');
    } catch (e) {
      console.log('– payment_status ENUM update failed (may need manual alter):', e.message);
    }

    console.log('\nMigration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
