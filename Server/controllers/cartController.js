const { CartItem, Product } = require("../models");

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const items = await CartItem.findAll({
      where: { userId: req.user.id },
      include: [{ model: Product, as: "product" }],
      order: [["createdAt", "ASC"]],
    });
    return res.json(items);
  } catch (err) {
    next(err);
  }
};

// POST /api/cart/add
const addToCart = async (req, res, next) => {
  try {
    const {
      productId,
      quantity = 1,
      selectedProductColor,
      selectedProductSize,
      selectedVariantId,
      selectedVariantName,
    } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const product = await Product.findOne({ where: { id: productId, isActive: true } });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // For backend variants: deduplicate by selectedVariantId
    // For old-style variations: deduplicate by color + size
    const whereClause = {
      userId: req.user.id,
      productId,
    };

    if (selectedVariantId) {
      whereClause.selectedVariantId = selectedVariantId;
    } else {
      whereClause.selectedProductColor = selectedProductColor || null;
      whereClause.selectedProductSize = selectedProductSize || null;
    }

    let cartItem = await CartItem.findOne({ where: whereClause });

    if (cartItem) {
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        userId: req.user.id,
        productId,
        quantity,
        selectedProductColor: selectedProductColor || null,
        selectedProductSize: selectedProductSize || null,
        selectedVariantId: selectedVariantId || null,
        productSnapshot: {
          name: product.name,
          price: product.price,
          discount: product.discount,
          image: product.image,
          selectedVariantName: selectedVariantName || null,
        },
      });
    }

    // Return with product details
    const result = await CartItem.findByPk(cartItem.id, {
      include: [{ model: Product, as: "product" }],
    });

    return res.status(201).json({ cartItem: result });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cart/remove/:cartItemId
const removeFromCart = async (req, res, next) => {
  try {
    const item = await CartItem.findOne({
      where: { id: req.params.cartItemId, userId: req.user.id },
    });
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    await item.destroy();
    return res.json({ message: "Item removed from cart" });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/cart/decrease/:cartItemId
const decreaseQuantity = async (req, res, next) => {
  try {
    const item = await CartItem.findOne({
      where: { id: req.params.cartItemId, userId: req.user.id },
    });
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    if (item.quantity <= 1) {
      await item.destroy();
      return res.json({ message: "Item removed from cart" });
    }

    item.quantity -= 1;
    await item.save();
    return res.json(item);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cart/clear
const clearCart = async (req, res, next) => {
  try {
    await CartItem.destroy({ where: { userId: req.user.id } });
    return res.json({ message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, removeFromCart, decreaseQuantity, clearCart };
