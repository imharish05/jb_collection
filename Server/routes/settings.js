const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getSettings, updateSettings } = require("../controllers/settingsController");
const { protect, adminOnly } = require("../middleware/auth");
const { handleUploadError } = require("../middleware/upload");

// Multer storage configuration for settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/settings");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cb(null, `settings-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  // limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg|xml|bmp|tiff|tif|icon|ico|heic|heif|avif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed (supported: JPEG, PNG, WebP, GIF, SVG, BMP, TIFF, ICO, HEIC, HEIF, AVIF)"));
  },
});

// Configure upload fields for logo and aboutImage
const uploadFields = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "aboutImage", maxCount: 1 },
]);

// Route definitions
router.get("/", getSettings);
router.put("/", protect, adminOnly, uploadFields, handleUploadError, updateSettings);

module.exports = router;
