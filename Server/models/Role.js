const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Role = sequelize.define("Role", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
}, { tableName: "roles", timestamps: true });

module.exports = Role;
