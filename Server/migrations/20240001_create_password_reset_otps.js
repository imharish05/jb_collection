/**
 * Migration: create_password_reset_otps
 *
 * Run manually with Sequelize CLI:
 *   npx sequelize-cli db:migrate
 *
 * Or the table is auto-created by sequelize.sync({ alter: true }) in server.js.
 * This file documents the schema for reference / manual execution.
 */

// "use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("password_reset_otps", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      otp: {
        type: Sequelize.STRING(6),
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: "OTP verified — unlocks password reset step",
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: "Brute-force guard: max 5 wrong attempts",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("password_reset_otps", ["user_id"]);
    await queryInterface.addIndex("password_reset_otps", ["expires_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("password_reset_otps");
  },
};