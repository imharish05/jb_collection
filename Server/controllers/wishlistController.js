const { WishlistItem, Product } = require("../models");

// GET /api/wishlist
const getWishlist = async (req, res, next) => {
  try {
    const items = await WishlistItem.findAll({
      where: { userId: req.user.id },
      include: [{ model: Product, as: "product" }],
      order: [["createdAt", "DESC"]],
    });
    return res.json(items);
  } catch (err) {
    next(err);
  }
};

// POST /api/wishlist/add
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: "productId is required" });

    const product = await Product.findOne({ where: { id: productId, isActive: true } });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const existing = await WishlistItem.findOne({
      where: { userId: req.user.id, productId },
    });
    if (existing) {
      return res.status(409).json({ message: "Product already in wishlist" });
    }

    const item = await WishlistItem.create({ userId: req.user.id, productId });
    const result = await WishlistItem.findByPk(item.id, {
      include: [{ model: Product, as: "product" }],
    });

    return res.status(201).json({ item: result });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/wishlist/remove/:productId
const removeFromWishlist = async (req, res, next) => {
  try {
    const deleted = await WishlistItem.destroy({
      where: { userId: req.user.id, productId: req.params.productId },
    });
    if (!deleted) return res.status(404).json({ message: "Wishlist item not found" });
    return res.json({ message: "Removed from wishlist" });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/wishlist/clear
const clearWishlist = async (req, res, next) => {
  try {
    await WishlistItem.destroy({ where: { userId: req.user.id } });
    return res.json({ message: "Wishlist cleared" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };
