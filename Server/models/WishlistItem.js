const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WishlistItem = sequelize.define(
  "WishlistItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "product_id",
    },
    // variantId: INTEGER (matches Variant.id which is INTEGER)
    // NULL means "no variant selected" (product has no variants)
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "variant_id",
    },
  },
  {
    tableName: "wishlist_items",
    indexes: [
      {
        // unique per user × product × variant
        // Two NULL variant_ids are treated as distinct by MySQL so products
        // without variants still get a unique row per user.
        unique: true,
        fields: ["user_id", "product_id", "variant_id"],
        name: "wishlist_user_product_variant_unique",
      },
    ],
  }
);

module.exports = WishlistItem;
