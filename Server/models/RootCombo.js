const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RootCombo = sequelize.define("RootCombo", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: "is_active",
  },
}, { tableName: "root_combos" });

module.exports = RootCombo;