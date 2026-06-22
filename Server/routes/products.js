const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const { protect, adminOnly } = require("../middleware/auth");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  seedStockTestProducts,
} = require("../controllers/productController");

// ensure upload dir exists
const uploadDir = path.join(__dirname, "../uploads/products");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
  }),
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg|bmp|tiff|tif|ico|heic|heif|avif/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Public ───────────────────────────────────────────────────────────────────
// GET /api/products          — list with optional filters
// GET /api/products/:id      — single product
router.get("/",    getAllProducts);
router.get("/:id", getProductById);
router.post("/seed-stock-test", seedStockTestProducts);

// ── Admin ────────────────────────────────────────────────────────────────────
// POST   /api/products/add         — create
// PUT    /api/products/update/:id  — update
// DELETE /api/products/:id         — soft delete
// upload.any() accepts: images[], variantImage_0, variantImage_1, …
router.post(  "/add",        protect, adminOnly, upload.any(), createProduct);
router.put(   "/update/:id", protect, adminOnly, upload.any(), updateProduct);
router.delete ("/:id",       protect, adminOnly, deleteProduct);

// Legacy paths (keep so existing admin frontend calls don't break)
router.post("/",    protect, adminOnly, upload.any(), createProduct);
router.put( "/:id", protect, adminOnly, upload.any(), updateProduct);

module.exports = router;