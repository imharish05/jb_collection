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
const roleRoutes = require("./routes/roles");
const userRoutes = require("./routes/users");
const testimonialRoutes = require("./routes/testimonials");
const shippingRoutes = require("./routes/shipping");
const newComboRoutes = require("./routes/combos");
const returnRoutes = require("./routes/returns");
const notificationRoutes    = require("./routes/notifications");
const inventorySettingsRoutes = require("./routes/inventorySettings");
const fontRoutes              = require("./routes/fonts");
const customisationFieldRoutes = require("./routes/customisationFields");

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
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/combos", newComboRoutes);
app.use("/api/customisation-fields", customisationFieldRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/notifications",     notificationRoutes);
app.use("/api/inventory-settings", inventorySettingsRoutes);
app.use("/api/fonts",             fontRoutes);

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

    // ── Safe alter users table (MySQL backward compatible) ─────────────────────
    try {
      await sequelize.query("ALTER TABLE users ADD COLUMN role_id CHAR(36) BINARY NULL;").catch(() => {});
      await sequelize.query("ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active';").catch(() => {});
      await sequelize.query("ALTER TABLE products ADD COLUMN is_partial_cod_available TINYINT(1) DEFAULT 1;").catch(() => {});
      await sequelize.query("ALTER TABLE products ADD COLUMN customisation_fields JSON NULL;").catch(() => {});
      await sequelize.query("ALTER TABLE cart_items ADD COLUMN customisation_details JSON NULL;").catch(() => {});
      await sequelize.query("ALTER TABLE order_items ADD COLUMN customisation_details JSON NULL;").catch(() => {});
      console.log("✅ Users and products table columns verified");
    } catch (alterErr) {
      console.warn("⚠️ Column alter query failed (ignoring):", alterErr.message);
    }

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;");
    await sequelize.sync();
    await models.backfillReferenceSlugs();
    console.log("✅ Models synced");
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;");

    // Seed default Super Admin role
    try {
      const { Role, User } = models;
      let superAdminRole = await Role.findOne({ where: { name: "Super Admin" } });
      if (!superAdminRole) {
        superAdminRole = await Role.create({
          name: "Super Admin",
          permissions: ["*"],
        });
        console.log("✅ Default 'Super Admin' role seeded");
      }

      // Link existing admins to Super Admin
      const adminsWithoutRoleId = await User.findAll({
        where: {
          role: "admin",
          roleId: null,
        },
      });
      for (const adminUser of adminsWithoutRoleId) {
        adminUser.roleId = superAdminRole.id;
        await adminUser.save();
        console.log(`✅ User ${adminUser.email} mapped to 'Super Admin' role`);
      }
    } catch (seedRoleErr) {
      console.error("❌ Failed to seed default roles:", seedRoleErr.message);
    }

    const { seedCoupons } = require("./controllers/couponController");
    await seedCoupons();

    // Seed default fonts
    try {
      const { Font } = models;
      const defaultFonts = [
        'Playfair Display', 'Dancing Script', 'Cinzel', 'Montserrat',
        'Lora', 'Cormorant Garamond', 'Great Vibes', 'Raleway',
        'Josefin Sans', 'Pacifico'
      ];
      for (const name of defaultFonts) {
        await Font.findOrCreate({ where: { name }, defaults: { isActive: true } });
      }
      console.log("✅ Default fonts seeded");
    } catch (fontErr) {
      console.warn("⚠️ Font seeding failed (ignoring):", fontErr.message);
    }

    const { registerWebhooks } = require('./utils/registerWebhooks');
    await registerWebhooks();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
