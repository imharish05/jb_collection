const express = require("express");
const router = express.Router();
const { getAll, getByProduct, add, update, remove } = require("../controllers/variantController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", getAll);
router.get("/product/:productId", getByProduct);

// Admin-only mutation routes
router.post("/add", protect, adminOnly, add);
router.put("/update/:id", protect, adminOnly, update);
router.delete("/:id", protect, adminOnly, remove);

module.exports = router;
