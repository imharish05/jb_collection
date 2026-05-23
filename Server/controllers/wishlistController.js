const { WishlistItem, Product, Variant } = require("../models");

// ── shared include for GET responses ─────────────────────────────────────────
const wishlistInclude = [
  {
    model: Product,
    as: "product",
    include: [{ model: Variant, as: "variants" }],
  },
];

// GET /api/wishlist
const getWishlist = async (req, res, next) => {
  try {
    const items = await WishlistItem.findAll({
      where: { userId: req.user.id },
      include: wishlistInclude,
      order: [["createdAt", "DESC"]],
    });
    return res.json(items);
  } catch (err) {
    next(err);
  }
};

// POST /api/wishlist/add
// Body: { productId, variantId? }
const addToWishlist = async (req, res, next) => {
  try {
    const { productId, variantId = null } = req.body;
    if (!productId) return res.status(400).json({ message: "productId is required" });

    // Validate product
    const product = await Product.findOne({ where: { id: productId, isActive: true } });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Validate variant belongs to product (if provided)
    if (variantId != null) {
      const variant = await Variant.findOne({ where: { id: variantId, productId } });
      if (!variant) return res.status(404).json({ message: "Variant not found for this product" });
    }

    // Dedup: same user + product + variant
    const where = { userId: req.user.id, productId, variantId };
    const existing = await WishlistItem.findOne({ where });
    if (existing) {
      return res.status(409).json({ message: "Already in wishlist" });
    }

    const item = await WishlistItem.create({ userId: req.user.id, productId, variantId });
    const result = await WishlistItem.findByPk(item.id, { include: wishlistInclude });

    return res.status(201).json({ item: result });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/wishlist/remove/:wishlistItemId   (wishlist row UUID)
const removeFromWishlist = async (req, res, next) => {
  try {
    const deleted = await WishlistItem.destroy({
      where: { id: req.params.wishlistItemId, userId: req.user.id },
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
