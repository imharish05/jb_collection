const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

const comboUploadDir = path.join(__dirname, "../uploads/combos");
if (!fs.existsSync(comboUploadDir)) fs.mkdirSync(comboUploadDir, { recursive: true });
const uploadCombo = multer({ storage: multer.diskStorage({
  destination: (req, file, cb) => cb(null, comboUploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
}) });


router.get("/", getNav);
router.get("/categories", getCategories);
router.get("/categories/:id", getCategoryById);
router.post("/categories", upload.single("image"), createCategory);   // ← added upload
router.patch("/categories/:id", upload.single("image"), updateCategory); // ← added upload
router.delete("/categories/:id", deleteCategory);

// ─── Events ───────────────────────────────────────────────────────────────────

router.get("/events", getEvents);
router.get("/events/:id", getEventById);
router.post("/events", uploadEvent.single("image"), createEvent);    // ← keep only these
router.patch("/events/:id", uploadEvent.single("image"), updateEvent);
router.delete("/events/:id", deleteEvent);


// Combos
router.get("/combos",      getCombos);
router.get("/combos/:id",  getComboById);
router.post("/combos",     uploadCombo.single("image"), createCombo);
router.patch("/combos/:id",uploadCombo.single("image"), updateCombo);
router.delete("/combos/:id", deleteCombo);

// ─── SubCategories ────────────────────────────────────────────────────────────
router.get("/subcategories", getAllSubCategories);
router.get("/subcategories/:id", getSubCategoryById);
router.post("/subcategories", createSubCategory);
router.patch("/subcategories/:id", updateSubCategory);
router.delete("/subcategories/:id", deleteSubCategory);

module.exports = router;