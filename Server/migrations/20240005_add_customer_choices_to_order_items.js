'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('order_items');

    if (!tableDesc.customer_choices) {
      await queryInterface.addColumn('order_items', 'customer_choices', {
        type: Sequelize.JSON,
        allowNull: true,
      });
      console.log('[Migration] Added customer_choices column to order_items');
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('order_items');
    if (tableDesc.customer_choices) {
      await queryInterface.removeColumn('order_items', 'customer_choices');
    }
  },
};
