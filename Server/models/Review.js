const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Review = sequelize.define("Review", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  productId: { type: DataTypes.UUID, allowNull: true, field: "product_id" },
  customerId: { type: DataTypes.UUID, allowNull: true, field: "customer_id" },
  guestName: { type: DataTypes.STRING, allowNull: true, field: "guest_name" },
  feedback: { type: DataTypes.TEXT, allowNull: false },
  rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 0 },
  status: { type: DataTypes.ENUM("Pending", "Approved", "Rejected"), defaultValue: "Pending" },
}, { tableName: "reviews" });

module.exports = Review;
