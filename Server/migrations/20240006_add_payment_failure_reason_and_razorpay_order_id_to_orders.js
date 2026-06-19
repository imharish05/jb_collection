'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('orders');

    if (!tableDesc.payment_failure_reason) {
      await queryInterface.addColumn('orders', 'payment_failure_reason', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      });
      console.log('[Migration] Added payment_failure_reason column to orders');
    }

    if (!tableDesc.razorpay_order_id) {
      await queryInterface.addColumn('orders', 'razorpay_order_id', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      });
      console.log('[Migration] Added razorpay_order_id column to orders');
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('orders');

    if (tableDesc.payment_failure_reason) {
      await queryInterface.removeColumn('orders', 'payment_failure_reason');
      console.log('[Migration] Removed payment_failure_reason column from orders');
    }

    if (tableDesc.razorpay_order_id) {
      await queryInterface.removeColumn('orders', 'razorpay_order_id');
      console.log('[Migration] Removed razorpay_order_id column from orders');
    }
  },
};
