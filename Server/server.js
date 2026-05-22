require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const { sequelize } = require("./models");
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

// New routes
const categoryRoutes = require("./routes/categories");
const navRoutes = require("./routes/nav");
const brandRoutes = require("./routes/brands");
const variantRoutes = require("./routes/variants");
const reviewRoutes = require("./routes/reviews");
const couponRoutes = require("./routes/coupons");
const contactRoutes = require("./routes/contact");
const customerRoutes = require("./routes/customers");
const dashboardRoutes = require("./routes/dashboard");

const { protect } = require("./middleware/auth");
const seed = require("./seeders/seed");


const app = express();

// ── Middleware ────────────────────────────────────────────────
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "http://localhost:3000",
//     credentials: true,
//   })
// );

app.use(cors())

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// ── Routes ────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api", categoryRoutes);
app.use("/api/nav", navRoutes);
app.use("/api/products", productRoutes);
app.use("/api/address", protect, addressRoutes);
app.use("/api/cart", protect, cartRoutes);
app.use("/api/wishlist", protect, wishlistRoutes);
app.use("/api/compare", protect, compareRoutes);
app.use("/api/blogs", protect, blogRoutes);
app.use("/api/orders", protect, orderRoutes);
app.use("/api/payment", protect, paymentRoutes);

// New routes (no auth needed for admin panel — admin login handles it)
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Marketing routes: /api/hero-slides, /api/offer-banners, /api/marquee
app.use("/api", marketingRoutes);

// Health check
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", service: "Kamali Gifts API", db: "MySQL" })
);

// 404 handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));


// Global error handler
app.use(errorHandler);

// ── DB + Server ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
// seed()

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL database connected");

    await sequelize.sync();
    console.log("✅ Models synced");

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
