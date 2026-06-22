// middleware/uploadReturn.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ── Auto-create upload folders ────────────────────────────────────────────────
const RETURN_DIRS = [
  path.join(__dirname, "../uploads/returns/images"),
  path.join(__dirname, "../uploads/returns/videos"),
];
RETURN_DIRS.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Storage for Images ────────────────────────────────────────────────────────
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/returns/images"));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

// ── Storage for Videos ────────────────────────────────────────────────────────
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/returns/videos"));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

// ── Combined storage (routes by fieldname) ────────────────────────────────────
const combinedStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "video") {
      cb(null, path.join(__dirname, "../uploads/returns/videos"));
    } else {
      cb(null, path.join(__dirname, "../uploads/returns/images"));
    }
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

// ── File filter ───────────────────────────────────────────────────────────────
const ALLOWED_IMAGE_MIMES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "image/svg+xml", "image/bmp", "image/tiff", "image/x-icon",
  "image/heic", "image/heif", "image/avif"
];
const ALLOWED_VIDEO_MIMES = ["video/mp4", "video/quicktime"];
const ALLOWED_IMAGE_EXTS  = [
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
  ".svg", ".bmp", ".tiff", ".tif", ".ico",
  ".heic", ".heif", ".avif"
];
const ALLOWED_VIDEO_EXTS  = [".mp4", ".mov"];

const returnFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "video") {
    if (!ALLOWED_VIDEO_EXTS.includes(ext) || !ALLOWED_VIDEO_MIMES.includes(file.mimetype)) {
      return cb(new Error("Video must be MP4 or MOV format"), false);
    }
  } else if (file.fieldname === "images") {
    if (!ALLOWED_IMAGE_EXTS.includes(ext) || !ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
      return cb(new Error("Images must be a supported image format (JPEG, PNG, WebP, GIF, SVG, BMP, TIFF, ICO, HEIC, HEIF, AVIF)"), false);
    }
  } else {
    return cb(new Error("Invalid field name. Use 'video' or 'images'"), false);
  }

  cb(null, true);
};

// ── Multer instance ───────────────────────────────────────────────────────────
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB per image
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50 MB for video

// We use a single multer instance with fields() — limits apply per file
const uploadReturn = multer({
  storage: combinedStorage,
  fileFilter: returnFileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Max per individual file; image size enforced in controller
    files: 11,                // max 1 video + 10 images
  },
}).fields([
  { name: "video",  maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

// ── Custom error handler ──────────────────────────────────────────────────────
const handleReturnUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = "File upload error";
    if (err.code === "LIMIT_FILE_SIZE")  message = "File too large. Video max 50MB, Images max 5MB each.";
    if (err.code === "LIMIT_FILE_COUNT") message = "Too many files. Max 1 video + 10 images.";
    return res.status(400).json({ message, code: err.code });
  }
  if (err) return res.status(400).json({ message: err.message || "Invalid file format" });
  next();
};

module.exports = { uploadReturn, handleReturnUploadError };
