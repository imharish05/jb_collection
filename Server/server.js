require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const models = require("./models");
const { sequelize } = models;
const errorHandler = require("./middleware/errorHandler");

// Route imports
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const wishlistRoutes = require("./routes/wishlist");
const compareRoutes = require("./routes/compare");
const blogRoutes = require("./routes/blogs");
const marketingRoutes = require("./routes/marketing");
const orderRoutes = require("./routes/orders");
const addressRoutes = require("./routes/addressRoutes");
const paymentRoutes = require("./routes/payment");
const categoryRoutes = require("./routes/categories");
const navRoutes = require("./routes/nav");
const brandRoutes = require("./routes/brands");
const variantRoutes = require("./routes/variants");
const reviewRoutes = require("./routes/reviews");
const couponRoutes = require("./routes/coupons");
const contactRoutes = require("./routes/contact");
const customerRoutes = require("./routes/customers");
const dashboardRoutes = require("./routes/dashboard");
const testimonialRoutes = require("./routes/testimonials");
const shippingRoutes = require("./routes/shipping");
const newComboRoutes = require("./routes/combos");
const returnRoutes = require("./routes/returns");
const notificationRoutes    = require("./routes/notifications");
const inventorySettingsRoutes = require("./routes/inventorySettings");

const { protect } = require("./middleware/auth");
const seed = require("./seeders/seed");

const app = express();

app.use(cors());

// ── Webhook raw-body parser (MUST be before express.json())
// Razorpay webhook signature verification requires the raw, unparsed request body.
app.use("/api/payment/webhook", express.raw({ type: "*/*" }));
app.use("/api/returns/webhook/shiprocket-return", express.raw({ type: "*/*" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/nav", navRoutes);
app.use("/api/products", productRoutes);
app.use("/api/address", protect, addressRoutes);
app.use("/api/cart", protect, cartRoutes);
app.use("/api/wishlist", protect, wishlistRoutes);
app.use("/api/compare", protect, compareRoutes);
app.use("/api/blogs", protect, blogRoutes);
app.use("/api/orders", protect, orderRoutes);
// Payment routes: webhook is public; create-order & verify are protected per-route inside payment.js
app.use("/api/payment", paymentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/combos", newComboRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/notifications",     notificationRoutes);
app.use("/api/inventory-settings", inventorySettingsRoutes);

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", service: "Kamali Gifts API", db: "MySQL" })
);

app.use("/api", categoryRoutes);
app.use("/api", marketingRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use(errorHandler);

// ── DB + Server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL database connected");

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;");
    await sequelize.sync({alter : true});
    await models.backfillReferenceSlugs();
    console.log("✅ Models synced");
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;");

    const { seedCoupons } = require("./controllers/couponController");
    await seedCoupons();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
