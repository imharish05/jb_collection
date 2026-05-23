const express = require("express");
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = require("../controllers/wishlistController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", getWishlist);
router.post("/add", addToWishlist);
// :wishlistItemId is the UUID of the WishlistItem row (not productId)
router.delete("/remove/:wishlistItemId", removeFromWishlist);
router.delete("/clear", clearWishlist);

module.exports = router;
