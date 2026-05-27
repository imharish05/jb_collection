const express = require("express");
const router = express.Router();
const { getAll, create, remove, updateStatus } = require("../controllers/contactController");
const { protect, adminOnly } = require("../middleware/auth");

// Public route - customer submit contact form
router.post("/", create);

// Admin only routes
router.get("/all", protect, adminOnly, getAll);
router.delete("/:id", protect, adminOnly, remove);
router.put("/:id/status", protect, adminOnly, updateStatus);

module.exports = router;
