const express = require("express");
const router = express.Router();
const { getAllFonts, createFont, updateFont, deleteFont } = require("../controllers/fontController");

// Public: anyone can fetch active fonts (for product pages)
router.get("/", getAllFonts);

// Admin-only mutations
router.post("/", createFont);
router.put("/:id", updateFont);
router.delete("/:id", deleteFont);

module.exports = router;
