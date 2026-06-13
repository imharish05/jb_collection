'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('orders');

    if (!tableDesc.tax_amount) {
      await queryInterface.addColumn('orders', 'tax_amount', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        after: 'shipping_charge',
      });
      console.log('[Migration] Added tax_amount column to orders');
    }

    if (!tableDesc.coupon_discount) {
      await queryInterface.addColumn('orders', 'coupon_discount', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        after: 'coupon_code',
      });
      console.log('[Migration] Added coupon_discount column to orders');
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('orders');
    if (tableDesc.tax_amount) {
      await queryInterface.removeColumn('orders', 'tax_amount');
    }
    if (tableDesc.coupon_discount) {
      await queryInterface.removeColumn('orders', 'coupon_discount');
    }
  },
};