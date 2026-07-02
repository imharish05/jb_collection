const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const { getAll, getByProduct, add, update, remove } = require("../controllers/variantController");
const { protect, adminOnly } = require("../middleware/auth");

const uploadDir = path.join(__dirname, "../uploads/variants");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`),
  }),
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg|bmp|tiff|tif|ico|heic|heif|avif/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
  // limits: { fileSize: 5 * 1024 * 1024 },
});

const maybeUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.startsWith('multipart/form-data')) {
    return upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'gallery', maxCount: 15 }
    ])(req, res, next);
  }
  return next();
};

router.get("/", getAll);
router.get("/product/:productId", getByProduct);

// Admin-only mutation routes
router.post("/add", protect, adminOnly, maybeUpload, add);
router.put("/update/:id", protect, adminOnly, maybeUpload, update);
router.delete("/:id", protect, adminOnly, remove);

module.exports = router;
