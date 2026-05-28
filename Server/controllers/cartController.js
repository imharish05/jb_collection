const { CartItem, Product, Variant } = require("../models");

// ── Shared include ────────────────────────────────────────────────────────────
const cartInclude = [
  {
    model: Product,
    as: "product",
    include: [{ model: Variant, as: "Variants" }],
  },
];

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const items = await CartItem.findAll({
      where: { userId: req.user.id },
      include: cartInclude,
      order: [["createdAt", "ASC"]],
    });

    // Enrich combo items: if snapshot.products has entries with null names,
    // look up the product (and its variant) from DB so the client can display them
    const enriched = await Promise.all(items.map(async (item) => {
      const snap = item.productSnapshot;
      if (!snap?.isCombo || !Array.isArray(snap.products)) return item.toJSON();

      const needsEnrich = snap.products.some(p => !p.name || !p.image);
      if (!needsEnrich) return item.toJSON();

      const enrichedProducts = await Promise.all(snap.products.map(async (p) => {
        if (p.name && p.image) return p; // already complete
        try {
          const prod = await Product.findByPk(p.productId, {
            attributes: ["id", "name", "image"],
            include: [{ model: Variant, as: "Variants", attributes: ["id", "variantName"] }],
          });
          const matchedVariant = p.variantId && prod?.Variants
            ? prod.Variants.find(v => String(v.id) === String(p.variantId)) || null
            : null;
          // Parse image: may be JSON string or array
          let img = prod?.image || null;
          if (typeof img === "string") {
            try { const parsed = JSON.parse(img); img = Array.isArray(parsed) ? parsed[0] : img; }
            catch { /* use as-is */ }
          } else if (Array.isArray(img)) {
            img = img[0] || null;
          }
          return {
            ...p,
            name: p.name || prod?.name || null,
            image: p.image || img || null,
            variantName: p.variantName || matchedVariant?.variantName || null,
          };
        } catch {
          return p; // leave as-is if lookup fails
        }
      }));

      const plain = item.toJSON();
      plain.productSnapshot = { ...snap, products: enrichedProducts };
      return plain;
    }));

    return res.json(enriched);
  } catch (err) {
    next(err);
  }
};

// POST /api/cart/add
// Body: { productId, variantId, quantity, selectedProductColor, selectedProductSize, selectedVariantName }
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

    if (!productId) return res.status(400).json({ message: "productId is required" });

    const product = await Product.findOne({ where: { id: productId, isActive: true } });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Validate + fetch variant
    let variant = null;
    if (selectedVariantId) {
      variant = await Variant.findOne({ where: { id: selectedVariantId, productId } });
      if (!variant) return res.status(404).json({ message: "Variant not found for this product" });
      if (Number(variant.stock) < 1) return res.status(400).json({ message: "Variant out of stock" });
    }

    // ── Dedup: variant items keyed by productId + variantId + variantName ────
    let cartItem = null;
    if (selectedVariantId) {
      const candidates = await CartItem.findAll({
        where: { userId: req.user.id, productId, selectedVariantId },
      });
      const incomingName = (selectedVariantName || "").trim();
      cartItem = candidates.find(c => {
        const storedName = (c.productSnapshot?.selectedVariantName || "").trim();
        return storedName === incomingName;
      }) || null;
    } else {
      cartItem = await CartItem.findOne({
        where: {
          userId: req.user.id,
          productId,
          selectedProductColor: selectedProductColor || null,
          selectedProductSize:  selectedProductSize || null,
        },
      });
    }

    if (cartItem) {
      // Stock check before increment
      const maxStock = variant ? Number(variant.stock) : Number(product.stock ?? 999);
      if (cartItem.quantity + quantity > maxStock) {
        return res.status(400).json({ message: "Exceeds available stock" });
      }
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      const finalPrice = variant ? parseFloat(variant.salesPrice) : parseFloat(product.price);
      const finalMrp   = variant ? parseFloat(variant.mrp) : null;

      cartItem = await CartItem.create({
        userId: req.user.id,
        productId,
        quantity,
        selectedProductColor: selectedProductColor || null,
        selectedProductSize:  selectedProductSize || null,
        selectedVariantId:    selectedVariantId   || null,
        productSnapshot: {
          name:               product.name,
          price:              finalPrice,
          mrp:                finalMrp,
          discount:           variant ? 0 : (product.discount || 0), // variant price IS final
          image:              product.image,
          selectedVariantName: selectedVariantName || null,
        },
      });
    }

    const result = await CartItem.findByPk(cartItem.id, { include: cartInclude });
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

// PATCH /api/cart/increase/:cartItemId
const increaseQuantity = async (req, res, next) => {
  try {
    const item = await CartItem.findOne({
      where: { id: req.params.cartItemId, userId: req.user.id },
      include: [{ model: Product, as: "product", include: [{ model: Variant, as: "Variants" }] }],
    });
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    // Stock validation before increase
    const variant = item.selectedVariantId
      ? (item.product?.variants || []).find(v => String(v.id) === String(item.selectedVariantId))
      : null;
    const maxStock = variant ? Number(variant.stock) : Number(item.product?.stock ?? 999);
    if (item.quantity >= maxStock) {
      return res.status(400).json({ message: "Exceeds available stock" });
    }

    item.quantity += 1;
    await item.save();
    return res.json({ quantity: item.quantity });
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

module.exports = { getCart, addToCart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart };