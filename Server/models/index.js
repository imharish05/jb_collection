// models/index.js
const sequelize = require("../config/database");

const User         = require("./User");
const Product      = require("./Product");
const CartItem     = require("./CartItem");
const WishlistItem = require("./WishlistItem");
const Blog         = require("./Blog");
const HeroSlide    = require("./HeroSlide");
const { Category, Event, Combo, SubCategory }   = require("./Category");
const { OfferBanner, MarqueeMessage }       = require("./Marketing");
const Order        = require("./Order");

// New models
const Brand       = require("./Brand");
const Variant     = require("./Variant");
const Review      = require("./Review");
const Coupon      = require("./Coupon");
const Contact     = require("./Contact");

// ── User ↔ Cart / Wishlist / Order ───────────────────────────────────────────
User.hasMany(CartItem,     { foreignKey: "user_id", as: "cartItems",     onDelete: "CASCADE" });
CartItem.belongsTo(User,   { foreignKey: "user_id" });

User.hasMany(WishlistItem,     { foreignKey: "user_id", as: "wishlistItems", onDelete: "CASCADE" });
WishlistItem.belongsTo(User,   { foreignKey: "user_id" });

User.hasMany(Order,   { foreignKey: "user_id", as: "orders", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "user_id" });

// ── Product ↔ Cart / Wishlist ─────────────────────────────────────────────────
Product.hasMany(CartItem,    { foreignKey: "product_id", as: "cartEntries",     onDelete: "CASCADE" });
CartItem.belongsTo(Product,  { foreignKey: "product_id", as: "product" });

Product.hasMany(WishlistItem,    { foreignKey: "product_id", as: "wishlistEntries", onDelete: "CASCADE" });
WishlistItem.belongsTo(Product,  { foreignKey: "product_id", as: "product" });


// ── Category ↔ Product ────────────────────────────────────────────────────────
// Product has a `category_id` FK column — wire it up so dashboard can include Category
Category.hasMany(Product,    { foreignKey: "category_id", as: "products" });
Product.belongsTo(Category,  { foreignKey: "category_id" });   // no alias — use default

// ── Product ↔ SubCategory ─────────────────────────────────────────────────────
Product.belongsTo(SubCategory, { foreignKey: "sub_category_id", as: "SubCategory", constraints: false });
SubCategory.hasMany(Product,   { foreignKey: "sub_category_id", as: "products",    constraints: false });

// ── Product ↔ Variant ─────────────────────────────────────────────────────────
Product.hasMany(Variant,    { foreignKey: "product_id", as: "variants", onDelete: "CASCADE" });
Variant.belongsTo(Product,  { foreignKey: "product_id", as: "product" });

// ── Product ↔ Review ──────────────────────────────────────────────────────────
Product.hasMany(Review,    { foreignKey: "product_id", as: "reviews", onDelete: "CASCADE" });
Review.belongsTo(Product,  { foreignKey: "product_id", as: "product" });

User.hasMany(Review,    { foreignKey: "customer_id", as: "reviews", onDelete: "CASCADE" });
Review.belongsTo(User,  { foreignKey: "customer_id", as: "Customer" });

module.exports = {
  sequelize,
  User,
  Product,
  CartItem,
  WishlistItem,
  Blog,
  HeroSlide,
  Category,
  SubCategory,
  Event,
  Combo,
  OfferBanner,
  MarqueeMessage,
  Order,
  Category,
  Brand,
  Variant,
  Review,
  Coupon,
  Contact,
};