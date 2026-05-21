const express = require("express");
const router = express.Router();
const { getNav } = require("../controllers/categoryController");

// This will result in: GET /api/nav/categories
router.get("/categories", getNav);

module.exports = router;