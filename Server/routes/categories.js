const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect, adminOnly } = require("../middleware/auth");

const { getNav, getCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
        getEvents, getEventById, createEvent, updateEvent, deleteEvent,
        getCombos, getComboById, createCombo, updateCombo, deleteCombo } = require("../controllers/categoryController");
const {
  getAllSubCategories, getSubCategoryById, createSubCategory, updateSubCategory, deleteSubCategory
} = require("../controllers/subCategoryController");


// Auto-create folder if missing
const uploadDir = path.join(__dirname, "../uploads/categories");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Add at the top with other upload dirs
const eventUploadDir = path.join(__dirname, "../uploads/events");
if (!fs.existsSync(eventUploadDir)) fs.mkdirSync(eventUploadDir, { recursive: true });

const eventStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, eventUploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const uploadEvent = multer({ storage: eventStorage });

// Add at the top with other upload dirs
const comboUploadDir = path.join(__dirname, "../uploads/combos");
if (!fs.existsSync(comboUploadDir)) fs.mkdirSync(comboUploadDir, { recursive: true });

const comboStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, comboUploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const uploadCombo = multer({ storage: comboStorage });

router.get("/", getNav);
router.get("/categories", getCategories);
router.get("/categories/:id", getCategoryById);
router.post("/categories", protect, adminOnly, upload.single("image"), createCategory);
router.patch("/categories/:id", protect, adminOnly, upload.single("image"), updateCategory);
router.delete("/categories/:id", protect, adminOnly, deleteCategory);

// ─── Events ───────────────────────────────────────────────────────────────────

router.get("/events", getEvents);
router.get("/events/:id", getEventById);
router.post("/events", protect, adminOnly, uploadEvent.single("image"), createEvent);
router.patch("/events/:id", protect, adminOnly, uploadEvent.single("image"), updateEvent);
router.delete("/events/:id", protect, adminOnly, deleteEvent);


// Combos
router.get("/combos",      getCombos);
router.get("/combos/:id",  getComboById);
router.post("/combos", protect, adminOnly, uploadCombo.single("image"), createCombo);
router.patch("/combos/:id", protect, adminOnly, uploadCombo.single("image"), updateCombo);
router.delete("/combos/:id", protect, adminOnly, deleteCombo);

// ─── SubCategories ────────────────────────────────────────────────────────────
router.get("/subcategories", getAllSubCategories);
router.get("/subcategories/:id", getSubCategoryById);
router.post("/subcategories", protect, adminOnly, createSubCategory);
router.patch("/subcategories/:id", protect, adminOnly, updateSubCategory);
router.delete("/subcategories/:id", protect, adminOnly, deleteSubCategory);

module.exports = router;