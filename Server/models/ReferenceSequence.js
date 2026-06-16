const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ReferenceSequence = sequelize.define(
  "ReferenceSequence",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
  },
  {
    tableName: "reference_sequences",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = ReferenceSequence;
