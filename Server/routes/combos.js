// routes/combos.js  — ALL new combo routes under /api/combos
const express  = require("express");
const router   = express.Router();
const path     = require("path");
const fs       = require("fs");
const multer   = require("multer");
const { protect, adminOnly } = require("../middleware/auth");

const ctrl = require("../controllers/newComboController");

// ── multer for combos ─────────────────────────────────────────────────────────
const comboUploadDir = path.join(__dirname, "../uploads/combos");
if (!fs.existsSync(comboUploadDir)) fs.mkdirSync(comboUploadDir, { recursive: true });

const comboStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, comboUploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const uploadCombo = multer({
  storage: comboStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp", ".tiff", ".tif", ".ico", ".heic", ".heif", ".avif"];
    if (ok.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error("Invalid image format. Supported: JPG, JPEG, PNG, WebP, GIF, SVG, BMP, TIFF, ICO, HEIC, HEIF, AVIF"));
  },
});

// ── Root combos ───────────────────────────────────────────────────────────────
router.get(   "/",           ctrl.getRootCombos);
router.get(   "/:id",        ctrl.getRootComboById);
router.post(  "/root",       protect, adminOnly, uploadCombo.single("image"), ctrl.createRootCombo);
router.put(   "/root/:id",   protect, adminOnly, uploadCombo.single("image"), ctrl.updateRootCombo);
router.delete("/root/:id",   protect, adminOnly, ctrl.deleteRootCombo);

// ── Child combos ──────────────────────────────────────────────────────────────
router.post(  "/child",      protect, adminOnly, uploadCombo.single("image"), ctrl.createChildCombo);
router.put(   "/child/:id",  protect, adminOnly, uploadCombo.single("image"), ctrl.updateChildCombo);
router.delete("/child/:id",  protect, adminOnly, ctrl.deleteChildCombo);

// ── Child combo products ──────────────────────────────────────────────────────
router.post(  "/child/:id/products",       protect, adminOnly, ctrl.addChildProduct);
router.put(   "/child/:id/products/:pid",  protect, adminOnly, ctrl.updateChildProduct);
router.delete("/child/:id/products/:pid",  protect, adminOnly, ctrl.removeChildProduct);

// ── Public validate + Cart add ────────────────────────────────────────────────
router.post("/validate",    ctrl.validateCombo);
router.post("/cart/add",    protect, ctrl.addComboToCart);

module.exports = router;
