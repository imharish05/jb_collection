module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "transaction_id", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "transaction_id");
  },
};
