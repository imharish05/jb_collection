const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PasswordResetOtp = sequelize.define(
  "PasswordResetOtp",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "OTP verified — allows password reset in the next step",
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Brute-force guard: max 5 wrong attempts",
    },
  },
  {
    tableName: "password_reset_otps",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = PasswordResetOtp;