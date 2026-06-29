const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const timelineController = require("../controllers/timelineController");
const { protect, adminOnly } = require("../middleware/auth");

// ── Timeline image upload directory ─────────────────────────────
const timelineUploadDir = path.join(__dirname, "../uploads/timeline");
if (!fs.existsSync(timelineUploadDir)) {
  fs.mkdirSync(timelineUploadDir, { recursive: true });
}

const timelineStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, timelineUploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const uploadTimeline = multer({
  storage: timelineStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif', '.ico', '.heic', '.heif', '.avif'];
    if (!allowed.includes(ext)) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
  // limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

const router = express.Router();

// Get all milestones
router.get("/", timelineController.getMilestones);

// Get single milestone
router.get("/:id", protect, adminOnly, timelineController.getMilestone);

// Create milestone (with image upload)
router.post(
  "/",
  protect,
  adminOnly,
  uploadTimeline.single("image"),
  timelineController.createMilestone
);

// Update milestone (with optional image upload)
router.put(
  "/:id",
  protect,
  adminOnly,
  uploadTimeline.single("image"),
  timelineController.updateMilestone
);

// Delete milestone
router.delete("/:id", protect, adminOnly, timelineController.deleteMilestone);

module.exports = router;
