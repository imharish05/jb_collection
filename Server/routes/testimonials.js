const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const testimonialController = require("../controllers/testimonialController");
const { protect, adminOnly } = require("../middleware/auth");

// ── Testimonial image upload ─────────────────────────────────
const testimonialUploadDir = path.join(__dirname, "../uploads/testimonials");
if (!fs.existsSync(testimonialUploadDir)) fs.mkdirSync(testimonialUploadDir, { recursive: true });

const testimonialStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, testimonialUploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const uploadTestimonial = multer({
  storage: testimonialStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif', '.ico', '.heic', '.heif', '.avif'];
    if (!allowed.includes(ext)) {
      return cb(new Error('Only image files are allowed (supported: JPG, JPEG, PNG, WebP, GIF, SVG, BMP, TIFF, ICO, HEIC, HEIF, AVIF)'), false);
    }
    cb(null, true);
  },
  // limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

const router = express.Router();

// Get all testimonials
router.get("/", testimonialController.getTestimonials);

// Get single testimonial
router.get("/:id", testimonialController.getTestimonial);

// Create testimonial (with image upload)
router.post(
  "/",
  protect,
  adminOnly,
  uploadTestimonial.single("image"),
  testimonialController.createTestimonial
);

// Update testimonial (with optional image upload)
router.put(
  "/:id",
  protect,
  adminOnly,
  uploadTestimonial.single("image"),
  testimonialController.updateTestimonial
);

// Delete testimonial
router.delete("/:id", protect, adminOnly, testimonialController.deleteTestimonial);

module.exports = router;
