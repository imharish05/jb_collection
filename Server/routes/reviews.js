const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const { getAll, getByProduct, create, update, remove } = require("../controllers/reviewController");

// Public — no auth needed
router.get("/product/:productId", getByProduct);   // GET approved reviews for a product
router.post("/", create);                           // POST submit review (guest or logged-in)

// Admin only
router.get("/", protect, adminOnly, getAll);
router.put("/update/:id", protect, adminOnly, update);
router.delete("/:id", protect, adminOnly, remove);

module.exports = router;