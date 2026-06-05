// models/index.js
const sequelize = require("../config/database");

const User         = require("./User");
const Product      = require("./Product");
const CartItem     = require("./CartItem");
const WishlistItem = require("./WishlistItem");
const Blog         = require("./Blog");
const HeroSlide    = require("./HeroSlide");
const Address      = require("./Address");
const { Category, Event, Combo, SubCategory }   = require("./Category");
const { OfferBanner, MarqueeMessage }       = require("./Marketing");
const Order        = require("./Order");

// New models
const Brand       = require("./Brand");
const Variant     = require("./Variant");
const Review      = require("./Review");
const Coupon      = require("./Coupon");
const Contact     = require("./Contact");
const OrderItem   = require("./OrderItem");
const Testimonial = require("./Testimonial");

// ── Password Reset OTP ────────────────────────────────────────────────────────
const PasswordResetOtp = require("./PasswordResetOtp");
User.hasMany(PasswordResetOtp, { foreignKey: "user_id", as: "passwordResetOtps", onDelete: "CASCADE" });
PasswordResetOtp.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── New Root/Child Combo models ───────────────────────────────────────────────
const RootCombo         = require("./RootCombo");
const ChildCombo        = require("./ChildCombo");
const ChildComboProduct = require("./ChildComboProduct");

// ── User ↔ Cart / Wishlist / Order ───────────────────────────────────────────────
User.hasMany(CartItem,     { foreignKey: "user_id", as: "cartItems",     onDelete: "CASCADE" });
CartItem.belongsTo(User,   { foreignKey: "user_id" });

User.hasMany(WishlistItem,     { foreignKey: "user_id", as: "wishlistItems", onDelete: "CASCADE" });
WishlistItem.belongsTo(User,   { foreignKey: "user_id" });

User.hasMany(Order,   { foreignKey: "user_id", as: "orders", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Address, { foreignKey: "userId", as: "addresses", onDelete: "CASCADE" });
Address.belongsTo(User, { foreignKey: "userId", as: "user" });

Order.belongsTo(Address, { foreignKey: "shipping_address_id", as: "shippingAddress" });
Order.belongsTo(Address, { foreignKey: "billing_address_id", as: "billingAddress" });

// ── Product ↔ Cart / Wishlist ─────────────────────────────────────────────────────
Product.hasMany(CartItem,    { foreignKey: "product_id", as: "cartEntries",     onDelete: "CASCADE" });
CartItem.belongsTo(Product,  { foreignKey: "product_id", as: "product" });

Product.hasMany(WishlistItem,    { foreignKey: "product_id", as: "wishlistEntries", onDelete: "CASCADE" });
WishlistItem.belongsTo(Product,  { foreignKey: "product_id", as: "product" });


// ── Category ↔ Product ────────────────────────────────────────────────────────
Category.hasMany(Product,    { foreignKey: "category_id", as: "products" });
Product.belongsTo(Category,  { foreignKey: "category_id" });

// ── Product ↔ SubCategory ─────────────────────────────────────────────────────
Product.belongsTo(SubCategory, { foreignKey: "sub_category_id", as: "SubCategory", constraints: false });
SubCategory.hasMany(Product,   { foreignKey: "sub_category_id", as: "products",    constraints: false });

// ── Product ↔ Combo (legacy) ───────────────────────────────────────────────────
Combo.hasMany(Product,   { foreignKey: "combo_id", as: "comboProducts", constraints: false });
Product.belongsTo(Combo, { foreignKey: "combo_id", as: "Combo",         constraints: false });

// ── Product ↔ Variant ─────────────────────────────────────────────────────────
Product.hasMany(Variant,    { foreignKey: "product_id", as: "Variants", onDelete: "CASCADE" });
Variant.belongsTo(Product,  { foreignKey: "product_id", as: "product" });

// ── Product ↔ Review ──────────────────────────────────────────────────────────
Product.hasMany(Review,    { foreignKey: "product_id", as: "reviews", onDelete: "CASCADE" });
Review.belongsTo(Product,  { foreignKey: "product_id", as: "product" });

User.hasMany(Review,    { foreignKey: "customer_id", as: "reviews", onDelete: "CASCADE" });
Review.belongsTo(User,  { foreignKey: "customer_id", as: "Customer" });

// ── Order ↔ OrderItem ────────────────────────────────────────────────────────
Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "order_id" });

// ── RootCombo ↔ ChildCombo ────────────────────────────────────────────────────
RootCombo.hasMany(ChildCombo, { foreignKey: "root_combo_id", as: "children", onDelete: "CASCADE" });
ChildCombo.belongsTo(RootCombo, { foreignKey: "root_combo_id", as: "rootCombo" });

ChildCombo.hasMany(Review, { foreignKey: "child_combo_id", as: "reviews", onDelete: "CASCADE" });
Review.belongsTo(ChildCombo, { foreignKey: "child_combo_id", as: "childCombo" });

// ── ChildCombo ↔ ChildComboProduct ───────────────────────────────────────────
ChildCombo.hasMany(ChildComboProduct, { foreignKey: "child_combo_id", as: "comboProducts", onDelete: "CASCADE" });
ChildComboProduct.belongsTo(ChildCombo, { foreignKey: "child_combo_id", as: "childCombo" });

// ── ChildComboProduct ↔ Product / Variant ─────────────────────────────────────
ChildComboProduct.belongsTo(Product, { foreignKey: "product_id", as: "product", constraints: false });
ChildComboProduct.belongsTo(Variant, { foreignKey: "variant_id", as: "variant", constraints: false });

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
  Address,
  Brand,
  Variant,
  Review,
  Coupon,
  Contact,
  OrderItem,
  Testimonial,
  // New combo models
  RootCombo,
  ChildCombo,
  ChildComboProduct,
  // Password reset
  PasswordResetOtp,
};