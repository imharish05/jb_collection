'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add the column (nullable so existing rows are not broken)
    await queryInterface.addColumn('orders', 'order_number', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'id',
    });

    // 2. Back-fill existing orders — assign KGF-XXXXXX in creation order
    const [orders] = await queryInterface.sequelize.query(
      'SELECT id FROM orders ORDER BY created_at ASC'
    );

    for (let i = 0; i < orders.length; i++) {
      const num = String(i + 1).padStart(6, '0');
      const orderId = orders[i].id;
      await queryInterface.sequelize.query(
        'UPDATE orders SET order_number = :num WHERE id = :id AND order_number IS NULL',
        { replacements: { num: 'KGF-' + num, id: orderId } }
      );
    }

    // 3. Add unique index
    await queryInterface.addIndex('orders', ['order_number'], {
      unique: true,
      name: 'orders_order_number_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('orders', 'orders_order_number_unique');
    await queryInterface.removeColumn('orders', 'order_number');
  },
};
