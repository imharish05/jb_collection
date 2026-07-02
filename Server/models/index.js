// models/index.js
const sequelize = require("../config/database");

const User         = require("./User");
const Product      = require("./Product");
const CartItem     = require("./CartItem");
const WishlistItem = require("./WishlistItem");
const Blog         = require("./Blog");
const HeroSlide    = require("./HeroSlide");
const Address      = require("./Address");
const { Category, Event, Combo, SubCategory, SubSubCategory }   = require("./Category");
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
const InventoryLog = require("./InventoryLog");
const OrderStatusEmailAudit = require("./OrderStatusEmailAudit");
const TimelineMilestone = require("./TimelineMilestone");

const Return          = require("./Return");
const ReturnMedia     = require("./ReturnMedia");
const Refund          = require("./Refund");
const ReverseShipment = require("./ReverseShipment");
const ReferenceSequence = require("./ReferenceSequence");
const { attachReferenceSlugs, backfillReferenceSlugs } = require("../utils/referenceSlugs");

// ── Password Reset OTP ────────────────────────────────────────────────────────
const PasswordResetOtp    = require("./PasswordResetOtp");
const InventorySettings   = require("./InventorySettings");
const Notification        = require("./Notification");
const StockHistory        = require("./StockHistory");
const Role                = require("./Role");
const Font                = require("./Font");
const SiteSetting         = require("./SiteSetting");
const DeliveryZone        = require("./DeliveryZone");

User.belongsTo(Role, { foreignKey: "roleId", as: "roleRecord" });
Role.hasMany(User, { foreignKey: "roleId", as: "users" });

User.hasMany(PasswordResetOtp, { foreignKey: "user_id", as: "passwordResetOtps", onDelete: "CASCADE" });
PasswordResetOtp.belongsTo(User, { foreignKey: "user_id", as: "user" });



// ── Inventory Log Associations ───────────────────────────────────────────────
InventoryLog.belongsTo(Order, { foreignKey: "order_id", as: "order", constraints: false });
Order.hasMany(InventoryLog, { foreignKey: "order_id", as: "inventoryLogs", constraints: false });
InventoryLog.belongsTo(Product, { foreignKey: "product_id", as: "product", constraints: false });
InventoryLog.belongsTo(Variant, { foreignKey: "variant_id", as: "variant", constraints: false });
OrderStatusEmailAudit.belongsTo(Order, { foreignKey: "order_id", as: "order", constraints: false });
Order.hasMany(OrderStatusEmailAudit, { foreignKey: "order_id", as: "statusEmailAudits", constraints: false });

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

// ── Product ↔ SubSubCategory ──────────────────────────────────────────────────
Product.belongsTo(SubSubCategory, { foreignKey: "sub_sub_category_id", as: "SubSubCategory", constraints: false });
SubSubCategory.hasMany(Product,   { foreignKey: "sub_sub_category_id", as: "products",    constraints: false });


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
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product", constraints: false });
OrderItem.belongsTo(Variant, { foreignKey: "selectedVariantId", as: "variant", constraints: false });


// ── Returns module associations ───────────────────────────────────────────────
Return.belongsTo(Order,           { foreignKey: 'order_id',      as: 'order',           constraints: false });
Return.belongsTo(OrderItem,       { foreignKey: 'order_item_id', as: 'orderItem',       constraints: false });
Return.belongsTo(User,            { foreignKey: 'user_id',       as: 'user',            constraints: false });
Return.hasMany(ReturnMedia,       { foreignKey: 'return_id',     as: 'media',           onDelete: 'CASCADE' });
Return.hasOne(Refund,             { foreignKey: 'return_id',     as: 'refund',          onDelete: 'CASCADE' });
Return.hasOne(ReverseShipment,    { foreignKey: 'return_id',     as: 'reverseShipment', onDelete: 'CASCADE' });
ReturnMedia.belongsTo(Return,     { foreignKey: 'return_id',     as: 'return' });
Refund.belongsTo(Return,          { foreignKey: 'return_id',     as: 'return' });
ReverseShipment.belongsTo(Return, { foreignKey: 'return_id',     as: 'return' });
Order.hasMany(Return,             { foreignKey: 'order_id',      as: 'returns',         constraints: false });
OrderItem.hasMany(Return,         { foreignKey: 'order_item_id', as: 'returns',         constraints: false });
User.hasMany(Return,              { foreignKey: 'user_id',       as: 'returns',         constraints: false });
Order.hasMany(Refund,             { foreignKey: 'order_id',      as: 'refunds',         constraints: false });
Refund.belongsTo(Order,           { foreignKey: 'order_id',      as: 'order',           constraints: false });

const models = {
  sequelize,
  User,
  Product,
  CartItem,
  WishlistItem,
  Blog,
  HeroSlide,
  Category,
  SubCategory,
  SubSubCategory,
  Event,
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
  // Password reset
  PasswordResetOtp,
  // Inventory settings + notifications
  InventorySettings,
  Notification,
  Role,
  StockHistory,
  // Inventory log
  InventoryLog,
  // Order status email audit
  OrderStatusEmailAudit,
  Return,
  ReturnMedia,
  Refund,
  ReverseShipment,
  ReferenceSequence,
  Font,
  SiteSetting,
  TimelineMilestone,
  DeliveryZone,
};

attachReferenceSlugs(models);

models.backfillReferenceSlugs = () => backfillReferenceSlugs(models);

module.exports = models;
