const { Product } = require("../models");

// POST /api/compare/add
// Returns the product so the frontend can add it to Redux state
const addToCompare = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: "productId is required" });

    const product = await Product.findOne({ where: { id: productId, isActive: true } });
    if (!product) return res.status(404).json({ message: "Product not found" });

    return res.json({ item: product });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/compare/remove/:productId
// Frontend removes from Redux; this is a no-op confirmation endpoint
const removeFromCompare = async (req, res) => {
  return res.json({ message: "Removed from compare", productId: req.params.productId });
};

module.exports = { addToCompare, removeFromCompare };
