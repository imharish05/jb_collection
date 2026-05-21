const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Address = sequelize.define(
  "Address",
  {
    id: {
      type:         DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey:   true,
    },
    // Foreign key — links every address to exactly one user.
    // CASCADE ensures all addresses are deleted when the user is deleted.
    userId: {
      type:       DataTypes.UUID,
      allowNull:  false,
      references: { model: "users", key: "id" },
      onDelete:   "CASCADE",
    },
    addressType: {
      type:         DataTypes.ENUM("Home", "Work", "Other"),
      defaultValue: "Home",
    },
    fullName: {
      type:      DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type:      DataTypes.STRING(15),
      allowNull: false,
    },
    pincode: {
      type:      DataTypes.STRING(10),
      allowNull: false,
    },
    street: {
      type:      DataTypes.STRING(255),
      allowNull: false,
    },
    apartment: {
      type:         DataTypes.STRING(255),
      defaultValue: "",
    },
    city: {
      type:      DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type:      DataTypes.STRING(100),
      allowNull: false,
    },
    country: {
      type:         DataTypes.STRING(100),
      defaultValue: "India",
    },
    isDefault: {
      type:         DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName:  "addresses",
    timestamps: true, // adds createdAt + updatedAt columns
  }
);

module.exports = Address;