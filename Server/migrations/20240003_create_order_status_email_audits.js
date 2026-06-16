"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("order_status_email_audits", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      previous_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      new_status: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      email_sent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      email_sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("order_status_email_audits", ["order_id"]);
    await queryInterface.addIndex("order_status_email_audits", ["new_status"]);
    await queryInterface.addIndex("order_status_email_audits", ["email_sent"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("order_status_email_audits");
  },
};
