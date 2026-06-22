const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ── Configuration ────────────────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'image/svg+xml', 'image/bmp', 'image/tiff', 'image/x-icon',
  'image/heic', 'image/heif', 'image/avif'
];
const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.svg', '.bmp', '.tiff', '.tif', '.ico',
  '.heic', '.heif', '.avif'
];

// Auto-create uploads folders
const uploadFolders = [
  '../uploads/categories',
  '../uploads/products',
  '../uploads/hero-slides',
  '../uploads/offer-banners',
  '../uploads/events',
  '../uploads/combos',
  '../uploads/testimonials',
  '../uploads/settings',
];

uploadFolders.forEach(folder => {
  const uploadDir = path.join(__dirname, folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
});

// ── Storage Configuration ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/categories");
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// ── File Filter with Professional Error Messages ─────────────
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check file extension
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Invalid file type. Supported: JPG, JPEG, PNG, WebP, GIF, SVG, BMP, TIFF, ICO, HEIC, HEIF, AVIF`), false);
  }

  // Check MIME type
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type. Supported: JPEG, PNG, WebP, GIF, SVG, BMP, TIFF, ICO, HEIC, HEIF, AVIF`), false);
  }

  cb(null, true);
};

// ── Multer Instance ──────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Max 10 files per request
  },
});

// ── Custom Error Handler Middleware ──────────────────────────
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = `File size exceeds the maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB. Please upload a smaller image.`;
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files. Maximum 10 files allowed per upload.';
    } else if (err.code === 'LIMIT_FIELD_COUNT') {
      message = 'Too many form fields.';
    } else if (err.code === 'LIMIT_PART_COUNT') {
      message = 'Too many parts.';
    }
    
    return res.status(400).json({ 
      message,
      code: err.code,
    });
  } else if (err) {
    // Custom error message from fileFilter
    return res.status(400).json({ 
      message: err.message || 'Invalid file format',
    });
  }
  
  next();
};

module.exports = { upload, handleUploadError };