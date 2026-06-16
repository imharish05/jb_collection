// models/ReturnMedia.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ReturnMedia = sequelize.define(
  "ReturnMedia",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    returnId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "return_id",
    },
    mediaType: {
      type: DataTypes.ENUM("video", "image"),
      allowNull: false,
      field: "media_type",
    },
    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "media_url",
    },
  },
  {
    tableName: "return_media",
    timestamps: true,
  }
);

module.exports = ReturnMedia;
