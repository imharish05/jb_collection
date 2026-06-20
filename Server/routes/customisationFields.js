const express = require("express");
const router = express.Router();
const {
  getAllFields,
  createField,
  updateField,
  deleteField,
} = require("../controllers/customisationFieldController");

// Public — any product page can fetch available fields
router.get("/", getAllFields);

// Admin-only mutations (auth enforced at server.js level if needed)
router.post("/", createField);
router.put("/:id", updateField);
router.delete("/:id", deleteField);

module.exports = router;
