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
    const safeParseSnap = (raw) => {
      if (!raw) return null;
      if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return null; } }
      return raw;
    };

    const enriched = await Promise.all(items.map(async (item) => {
      const snap = safeParseSnap(item.productSnapshot);
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
      customisationDetails,
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
        customisationDetails: customisationDetails || null,
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

const clearCart = async (req, res, next) => {
  try {
    await CartItem.destroy({ where: { userId: req.user.id } });
    return res.json({ message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
};

const revalidateCart = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "items array is required" });
    }

    const { ChildCombo, ChildComboProduct, Product, Variant } = require("../models");

    const results = [];
    let hasChanges = false;

    for (const item of items) {
      const { cartItemId, productId, selectedVariantId, quantity, isCombo, childComboId } = item;
      
      // 1. Combo product revalidation
      if (isCombo && childComboId) {
        const child = await ChildCombo.findByPk(childComboId, {
          include: [{
            model: ChildComboProduct,
            as: "comboProducts",
            include: [
              { model: Product, as: "product", include: [{ model: Variant, as: "Variants" }] },
              { model: Variant, as: "variant" }
            ]
          }]
        });

        if (!child || !child.isActive) {
          results.push({
            cartItemId,
            originalQty: quantity,
            adjustedQty: 0,
            status: "Unavailable",
            message: `Combo "${item.name || 'this combo'}" is no longer available.`
          });
          hasChanges = true;
          continue;
        }

        // Fixed combo stock calculation
        if (child.type === "fixed") {
          let minStock = Infinity;
          let oosItemName = "";
          
          for (const cp of child.comboProducts) {
            const v = cp.variantId ? cp.variant : null;
            const stock = v ? Number(v.stock || 0) : Number(cp.product?.stock || 0);
            const factor = Math.floor(stock / (cp.quantity || 1));
            if (factor < minStock) {
              minStock = factor;
              if (stock < (cp.quantity || 1)) {
                oosItemName = cp.product?.name || "constituent product";
              }
            }
          }

          if (minStock <= 0) {
            results.push({
              cartItemId,
              originalQty: quantity,
              adjustedQty: 0,
              status: "OOS",
              message: `Combo "${child.name}" is out of stock (due to ${oosItemName}).`
            });
            hasChanges = true;
          } else if (quantity > minStock) {
            results.push({
              cartItemId,
              originalQty: quantity,
              adjustedQty: minStock,
              status: "Adjusted",
              message: `Quantity for "${child.name}" adjusted from ${quantity} to ${minStock} due to constituent stock limits.`
            });
            hasChanges = true;
          } else {
            results.push({
              cartItemId,
              originalQty: quantity,
              adjustedQty: quantity,
              status: "OK"
            });
          }
        } else {
          // Mix & match combo validation: we need to check selected products
          const selections = item.selectedProducts || [];
          let mixMatchValid = true;
          let oosName = "";

          for (const sel of selections) {
            const cp = child.comboProducts.find(c => String(c.productId) === String(sel.productId));
            if (!cp) continue;
            
            const v = sel.variantId
              ? cp.product?.Variants?.find(x => String(x.id) === String(sel.variantId))
              : null;
            const stock = v ? Number(v.stock || 0) : Number(cp.product?.stock || 0);
            
            const neededQty = (sel.quantity || 1) * quantity;
            if (stock < neededQty) {
              mixMatchValid = false;
              oosName = cp.product?.name || "constituent product";
              break;
            }
          }

          if (!mixMatchValid) {
            let possibleQty = quantity;
            for (const sel of selections) {
              const cp = child.comboProducts.find(c => String(c.productId) === String(sel.productId));
              if (!cp) continue;
              const v = sel.variantId
                ? cp.product?.Variants?.find(x => String(x.id) === String(sel.variantId))
                : null;
              const stock = v ? Number(v.stock || 0) : Number(cp.product?.stock || 0);
              const limitPerCombo = sel.quantity || 1;
              const maxComboQty = Math.floor(stock / limitPerCombo);
              if (maxComboQty < possibleQty) {
                possibleQty = maxComboQty;
              }
            }

            if (possibleQty <= 0) {
              results.push({
                cartItemId,
                originalQty: quantity,
                adjustedQty: 0,
                status: "OOS",
                message: `Mix & Match "${child.name}" is out of stock (due to ${oosName}).`
              });
            } else {
              results.push({
                cartItemId,
                originalQty: quantity,
                adjustedQty: possibleQty,
                status: "Adjusted",
                message: `Quantity for "${child.name}" adjusted from ${quantity} to ${possibleQty} due to item stock limits.`
              });
            }
            hasChanges = true;
          } else {
            results.push({
              cartItemId,
              originalQty: quantity,
              adjustedQty: quantity,
              status: "OK"
            });
          }
        }
      }
      // 2. Variable product (variant) revalidation
      else if (selectedVariantId) {
        const variant = await Variant.findByPk(selectedVariantId, {
          include: [{ model: Product, as: "product" }]
        });

        if (!variant || variant.status === "Inactive" || variant.stockStatus === "Discontinued") {
          results.push({
            cartItemId,
            originalQty: quantity,
            adjustedQty: 0,
            status: "Discontinued",
            message: `Variant "${item.name} (${item.selectedVariantName || 'selected option'})" is discontinued or no longer available.`
          });
          hasChanges = true;
        } else if (variant.stockStatus === "Temporarily Unavailable" || variant.product?.stockStatus === "Temporarily Unavailable") {
          results.push({
            cartItemId,
            originalQty: quantity,
            adjustedQty: 0,
            status: "Unavailable",
            message: `Variant "${item.name} (${item.selectedVariantName || 'selected option'})" is temporarily unavailable.`
          });
          hasChanges = true;
        } else {
          const stock = Number(variant.stock || 0);
          if (stock <= 0) {
            results.push({
              cartItemId,
              originalQty: quantity,
              adjustedQty: 0,
              status: "OOS",
              message: `Variant "${item.name} (${item.selectedVariantName || 'selected option'})" is out of stock.`
            });
            hasChanges = true;
          } else if (quantity > stock) {
            results.push({
              cartItemId,
              originalQty: quantity,
              adjustedQty: stock,
              status: "Adjusted",
              message: `Quantity for "${item.name} (${item.selectedVariantName || 'selected option'})" adjusted to ${stock} (available stock limit).`
            });
            hasChanges = true;
          } else {
            results.push({
              cartItemId,
              originalQty: quantity,
              adjustedQty: quantity,
              status: "OK"
            });
          }
        }
      }
      // 3. Simple product revalidation
      else {
        const product = await Product.findByPk(productId);

        if (!product || !product.isActive || product.stockStatus === "Discontinued") {
          results.push({
            cartItemId,
            originalQty: quantity,
            adjustedQty: 0,
            status: "Discontinued",
            message: `Product "${item.name || 'this item'}" is discontinued or no longer available.`
          });
          hasChanges = true;
        } else if (product.stockStatus === "Temporarily Unavailable") {
          results.push({
            cartItemId,
            originalQty: quantity,
            adjustedQty: 0,
            status: "Unavailable",
            message: `Product "${product.name}" is temporarily unavailable.`
          });
          hasChanges = true;
        } else {
          const stock = Number(product.stock || 0);
          if (stock <= 0) {
            results.push({
              cartItemId,
              originalQty: quantity,
              adjustedQty: 0,
              status: "OOS",
              message: `Product "${product.name}" is out of stock.`
            });
            hasChanges = true;
          } else if (quantity > stock) {
            results.push({
              cartItemId,
              originalQty: quantity,
              adjustedQty: stock,
              status: "Adjusted",
              message: `Quantity for "${product.name}" adjusted to ${stock} (available stock limit).`
            });
            hasChanges = true;
          } else {
            results.push({
              cartItemId,
              originalQty: quantity,
              adjustedQty: quantity,
              status: "OK"
            });
          }
        }
      }
    }

    res.json({ success: true, hasChanges, items: results });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart, revalidateCart };