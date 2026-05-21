const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  removeFromCart,
  decreaseQuantity,
  clearCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/auth");

router.use(protect); // all cart routes require auth

router.get("/", getCart);
router.post("/add", addToCart);
router.delete("/remove/:cartItemId", removeFromCart);
router.patch("/decrease/:cartItemId", decreaseQuantity);
router.delete("/clear", clearCart);

module.exports = router;
