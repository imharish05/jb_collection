const express = require("express");
const router = express.Router();
const { getAllFonts, createFont, updateFont, deleteFont } = require("../controllers/fontController");
const { protect, adminOnly } = require("../middleware/auth");

// Public: anyone can fetch active fonts (for product pages)
router.get("/", getAllFonts);

// Admin-only mutations
router.post("/", protect, adminOnly, createFont);
router.put("/:id", protect, adminOnly, updateFont);
router.delete("/:id", protect, adminOnly, deleteFont);

module.exports = router;
