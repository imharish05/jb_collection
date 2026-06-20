const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Font = sequelize.define(
  "Font",
  {
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
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  {
    tableName: "fonts",
  }
);

module.exports = Font;
