"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "shiprocket_order_id", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("orders", "shiprocket_shipment_id", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "shiprocket_order_id");
    await queryInterface.removeColumn("orders", "shiprocket_shipment_id");
  },
};
