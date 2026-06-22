const express = require("express");
const router = express.Router();
const {
  getAllFields,
  createField,
  updateField,
  deleteField,
} = require("../controllers/customisationFieldController");
const { protect, adminOnly } = require("../middleware/auth");

// Public — any product page can fetch available fields
router.get("/", getAllFields);

// Admin-only mutations
router.post("/", protect, adminOnly, createField);
router.put("/:id", protect, adminOnly, updateField);
router.delete("/:id", protect, adminOnly, deleteField);

module.exports = router;
