const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OfferBanner = sequelize.define(
  "OfferBanner",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    off: {
      type: DataTypes.STRING, // e.g. "FLAT 20% OFF", "NEW ARRIVAL"
    },
    image: {
      type: DataTypes.STRING,
    },
    link: {
      type: DataTypes.STRING,
      defaultValue: "/shop",
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "sort_order",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  { tableName: "offer_banners" }
);

const MarqueeMessage = sequelize.define(
  "MarqueeMessage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "sort_order",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  { tableName: "marquee_messages" }
);

module.exports = { OfferBanner, MarqueeMessage };
