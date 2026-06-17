const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define("Notification", {
  id:       { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  type:     { type: DataTypes.STRING,  allowNull: false },
  title:    { type: DataTypes.STRING,  allowNull: false },
  message:  { type: DataTypes.TEXT,    allowNull: false },
  isRead:   { type: DataTypes.BOOLEAN, defaultValue: false, field: "is_read" },
  metadata: { type: DataTypes.JSON,    allowNull: true },
}, { tableName: "notifications", timestamps: true });

module.exports = Notification;
