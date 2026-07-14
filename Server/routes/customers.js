const express = require("express");
const router = express.Router();
const { getAll } = require("../controllers/customerController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", protect, adminOnly, getAll);

module.exports = router;

