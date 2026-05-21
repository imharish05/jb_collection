const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const { getAll, update, remove } = require("../controllers/reviewController");

router.get("/", getAll);
router.put("/update/:id", protect, adminOnly, update);
router.delete("/:id", protect, adminOnly, remove);

module.exports = router;
