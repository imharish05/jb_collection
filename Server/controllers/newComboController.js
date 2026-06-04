// controllers/newComboController.js
// Handles RootCombo / ChildCombo / ChildComboProduct operations.
// DOES NOT touch existing Combo, Product, Variant, Cart, Order, Auth.

const { RootCombo, ChildCombo, ChildComboProduct, Product, Variant, CartItem } = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const fs   = require("fs");

// ── helpers ────────────────────────────────────────────────────────────────────

const PRODUCT_ATTRS = ["id", "name", "price", "discount", "image", "stock", "shortDescription", "stockStatus", "warningThreshold"];
const VARIANT_ATTRS = ["id", "variantName", "mrp", "salesPrice", "stock", "attributes", "image", "stockStatus", "warningThreshold"];

function imgUrl(img) {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return img; // stored as relative path; client resolves with getImgUrl
}

// Build the full product include for child combo products
const productInclude = {
  model: Product,
  as: "product",
  attributes: PRODUCT_ATTRS,
  include: [{ model: Variant, as: "Variants", attributes: VARIANT_ATTRS }],
};
const variantInclude = {
  model: Variant,
  as: "variant",
  attributes: VARIANT_ATTRS,
  required: false,
};

// ── ROOT COMBO ─────────────────────────────────────────────────────────────────

// GET /api/combos  — all root combos, shallow
exports.getRootCombos = async (req, res) => {
  try {
    const roots = await RootCombo.findAll({
      order: [["createdAt", "DESC"]],
      include: [{
        model: ChildCombo,
        as: "children",
        attributes: ["id", "name", "is_active"],
        required: false,
      }],
    });
    res.json({ success: true, data: roots });
  } catch (err) {
    console.error("getRootCombos:", err);
    res.status(500).json({ message: "Failed to fetch combos" });
  }
};

// GET /api/combos/:id  — full root + children + products
exports.getRootComboById = async (req, res) => {
  try {
    const root = await RootCombo.findByPk(req.params.id, {
      include: [{
        model: ChildCombo,
        as: "children",
        include: [{
          model: ChildComboProduct,
          as: "comboProducts",
          include: [productInclude, variantInclude],
        }],
      }],
    });
    if (!root) return res.status(404).json({ message: "Combo not found" });
    res.json({ success: true, data: root });
  } catch (err) {
    console.error("getRootComboById:", err);
    res.status(500).json({ message: "Failed to fetch combo" });
  }
};

// POST /api/combos/root  — create root combo (multipart)
exports.createRootCombo = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const image = req.file ? `combos/${req.file.filename}` : null;
    const root = await RootCombo.create({
      name,
      image,
      isActive: isActive === "false" ? false : true,
    });
    res.status(201).json({ success: true, data: root });
  } catch (err) {
    console.error("createRootCombo:", err);
    res.status(500).json({ message: "Failed to create combo" });
  }
};

// PUT /api/combos/root/:id  — update root combo
exports.updateRootCombo = async (req, res) => {
  try {
    const root = await RootCombo.findByPk(req.params.id);
    if (!root) return res.status(404).json({ message: "Not found" });

    const { name, isActive } = req.body;
    if (name !== undefined) root.name = name;
    if (isActive !== undefined) root.isActive = isActive === "false" ? false : true;

    if (req.file) {
      // delete old image
      if (root.image) {
        const old = path.join(__dirname, "../uploads", root.image);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      root.image = `combos/${req.file.filename}`;
    }

    await root.save();
    res.json({ success: true, data: root });
  } catch (err) {
    console.error("updateRootCombo:", err);
    res.status(500).json({ message: "Failed to update combo" });
  }
};

// DELETE /api/combos/root/:id  — delete root combo (cascades via DB)
exports.deleteRootCombo = async (req, res) => {
  try {
    const root = await RootCombo.findByPk(req.params.id);
    if (!root) return res.status(404).json({ message: "Not found" });

    if (root.image) {
      const imgPath = path.join(__dirname, "../uploads", root.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await root.destroy();
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("deleteRootCombo:", err);
    res.status(500).json({ message: "Failed to delete combo" });
  }
};

// ── CHILD COMBO ────────────────────────────────────────────────────────────────

// POST /api/combos/child  — create child combo
exports.createChildCombo = async (req, res) => {
  try {
    const { rootComboId, name, description, shortDescription, fullDescription, type, originalPrice, comboPrice,
            minQty, maxQty, allowDuplicates, allowedCategoryIds, isActive } = req.body;

    if (!rootComboId || !name || !type || !comboPrice) {
      return res.status(400).json({ message: "rootComboId, name, type, comboPrice required" });
    }

    const root = await RootCombo.findByPk(rootComboId);
    if (!root) return res.status(404).json({ message: "Root combo not found" });

    const image = req.file ? `combos/${req.file.filename}` : null;

    let parsedCatIds = null;
    if (allowedCategoryIds) {
      try { parsedCatIds = JSON.parse(allowedCategoryIds); } catch { parsedCatIds = null; }
    }

    const child = await ChildCombo.create({
      rootComboId,
      name,
      description: shortDescription || description || null,
      shortDescription: shortDescription || description || null,
      fullDescription: fullDescription || null,
      image,
      type,
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      comboPrice: parseFloat(comboPrice),
      minQty: minQty ? parseInt(minQty) : null,
      maxQty: maxQty ? parseInt(maxQty) : null,
      allowDuplicates: allowDuplicates === "true",
      allowedCategoryIds: parsedCatIds,
      isActive: isActive === "false" ? false : true,
    });

    res.status(201).json({ success: true, data: child });
  } catch (err) {
    console.error("createChildCombo:", err);
    res.status(500).json({ message: "Failed to create child combo" });
  }
};

// PUT /api/combos/child/:id  — update child combo
exports.updateChildCombo = async (req, res) => {
  try {
    const child = await ChildCombo.findByPk(req.params.id);
    if (!child) return res.status(404).json({ message: "Not found" });

    const fields = ["name", "description", "shortDescription", "fullDescription", "type", "originalPrice", "comboPrice",
                    "minQty", "maxQty", "allowDuplicates", "allowedCategoryIds", "isActive"];

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (f === "isActive" || f === "allowDuplicates") {
          child[f] = req.body[f] === "true" || req.body[f] === true;
        } else if (f === "allowedCategoryIds") {
          try { child[f] = JSON.parse(req.body[f]); } catch { /* ignore */ }
        } else if (["originalPrice","comboPrice"].includes(f)) {
          child[f] = parseFloat(req.body[f]);
        } else if (["minQty","maxQty"].includes(f)) {
          child[f] = req.body[f] ? parseInt(req.body[f]) : null;
        } else {
          child[f] = req.body[f];
        }
      }
    }

    if (req.body.shortDescription !== undefined) {
      child.description = req.body.shortDescription || null;
    } else if (req.body.description !== undefined && child.shortDescription == null) {
      child.shortDescription = req.body.description || null;
    }

    if (req.file) {
      if (child.image) {
        const old = path.join(__dirname, "../uploads", child.image);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      child.image = `combos/${req.file.filename}`;
    }

    await child.save();
    res.json({ success: true, data: child });
  } catch (err) {
    console.error("updateChildCombo:", err);
    res.status(500).json({ message: "Failed to update child combo" });
  }
};

// DELETE /api/combos/child/:id
exports.deleteChildCombo = async (req, res) => {
  try {
    const child = await ChildCombo.findByPk(req.params.id);
    if (!child) return res.status(404).json({ message: "Not found" });
    await child.destroy();
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("deleteChildCombo:", err);
    res.status(500).json({ message: "Failed to delete child combo" });
  }
};

// ── CHILD COMBO PRODUCTS ───────────────────────────────────────────────────────

// POST /api/combos/child/:id/products  — add product to child combo
exports.addChildProduct = async (req, res) => {
  try {
    const { productId, variantId, quantity, isEligible } = req.body;
    if (!productId) return res.status(400).json({ message: "productId required" });

    const child = await ChildCombo.findByPk(req.params.id);
    if (!child) return res.status(404).json({ message: "Child combo not found" });

    const cp = await ChildComboProduct.create({
      childComboId: req.params.id,
      productId,
      variantId: variantId || null,
      quantity: parseInt(quantity) || 1,
      isEligible: isEligible === "true" || isEligible === true,
    });

    // Return with product + variant populated
    const populated = await ChildComboProduct.findByPk(cp.id, {
      include: [productInclude, variantInclude],
    });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error("addChildProduct:", err);
    res.status(500).json({ message: "Failed to add product" });
  }
};

// DELETE /api/combos/child/:id/products/:pid  — remove product from child combo
exports.removeChildProduct = async (req, res) => {
  try {
    const cp = await ChildComboProduct.findByPk(req.params.pid);
    if (!cp) return res.status(404).json({ message: "Not found" });
    await cp.destroy();
    res.json({ success: true, message: "Removed" });
  } catch (err) {
    console.error("removeChildProduct:", err);
    res.status(500).json({ message: "Failed to remove product" });
  }
};

// ── VALIDATE ──────────────────────────────────────────────────────────────────

// POST /api/combos/validate
// body: { childComboId, selections: [{productId, variantId, quantity}] }
exports.validateCombo = async (req, res) => {
  try {
    const { childComboId, selections } = req.body;
    if (!childComboId) return res.status(400).json({ message: "childComboId required" });

    const child = await ChildCombo.findByPk(childComboId, {
      include: [{
        model: ChildComboProduct,
        as: "comboProducts",
        include: [productInclude, variantInclude],
      }],
    });
    if (!child || !child.isActive) {
      return res.status(404).json({ message: "Combo not found or inactive" });
    }

    const errors = [];

    if (child.type === "fixed") {
      // Check every locked product has stock >= quantity
      for (const cp of child.comboProducts) {
        const v = cp.variantId ? cp.variant : null;
        const stock = v ? v.stock : cp.product?.stock ?? 0;
        if (stock < cp.quantity) {
          errors.push(`${cp.product?.name || "Product"} is out of stock`);
        }
      }
    } else {
      // mix_match validation
      if (!Array.isArray(selections) || selections.length === 0) {
        return res.status(400).json({ message: "selections required for mix_match" });
      }

      const eligibleIds = new Set(child.comboProducts.filter(cp => cp.isEligible).map(cp => String(cp.productId)));
      const totalQty = selections.reduce((s, sel) => s + (parseInt(sel.quantity) || 1), 0);

      if (child.minQty && totalQty < child.minQty) {
        errors.push(`Minimum ${child.minQty} items required, got ${totalQty}`);
      }
      if (child.maxQty && totalQty > child.maxQty) {
        errors.push(`Maximum ${child.maxQty} items allowed, got ${totalQty}`);
      }

      // Check all selected products are in eligible pool
      for (const sel of selections) {
        if (!eligibleIds.has(String(sel.productId))) {
          errors.push(`Product ${sel.productId} is not in the eligible pool`);
        }
      }

      // Check duplicates rule
      if (!child.allowDuplicates) {
        const seen = new Set();
        for (const sel of selections) {
          const key = `${sel.productId}:${sel.variantId || ""}`;
          if (seen.has(key)) {
            errors.push("Duplicate selections not allowed in this combo");
            break;
          }
          seen.add(key);
        }
      }

      // Check stock for each selection
      for (const sel of selections) {
        const cp = child.comboProducts.find(cp => String(cp.productId) === String(sel.productId));
        if (!cp) continue;
        const v = sel.variantId
          ? cp.product?.Variants?.find(v => String(v.id) === String(sel.variantId))
          : null;
        const stock = v ? v.stock : cp.product?.stock ?? 0;
        const qty   = parseInt(sel.quantity) || 1;
        if (stock < qty) {
          errors.push(`${cp.product?.name || "Product"} does not have enough stock`);
        }
      }
    }

    if (errors.length) {
      return res.status(422).json({ valid: false, errors });
    }

    // Server-side price (always use DB price, never trust client)
    const price = parseFloat(child.comboPrice);
    res.json({ valid: true, price, childComboId: child.id, type: child.type });
  } catch (err) {
    console.error("validateCombo:", err);
    res.status(500).json({ message: "Validation failed" });
  }
};

// ── CART ADD ──────────────────────────────────────────────────────────────────

// POST /api/combos/cart/add  (auth required — applied in route)
// body: { childComboId, quantity, selections (mix_match only) }
exports.addComboToCart = async (req, res) => {
  try {
    const { childComboId, quantity = 1, selections } = req.body;
    const userId = req.user.id;

    const child = await ChildCombo.findByPk(childComboId, {
      include: [
        { model: RootCombo, as: "rootCombo" },
        {
          model: ChildComboProduct,
          as: "comboProducts",
          include: [productInclude, variantInclude],
        },
      ],
    });
    if (!child || !child.isActive) {
      return res.status(404).json({ message: "Combo not found or inactive" });
    }

    // Re-run server-side validation
    const validationErrors = [];

    if (child.type === "fixed") {
      for (const cp of child.comboProducts) {
        const v = cp.variantId ? cp.variant : null;
        const stock = v ? v.stock : cp.product?.stock ?? 0;
        if (stock < cp.quantity) {
          validationErrors.push(`${cp.product?.name || "Product"} is out of stock`);
        }
      }
    } else {
      if (!Array.isArray(selections) || !selections.length) {
        return res.status(400).json({ message: "selections required for mix_match" });
      }
      const eligibleIds = new Set(child.comboProducts.filter(cp => cp.isEligible).map(cp => String(cp.productId)));
      const totalQty = selections.reduce((s, sel) => s + (parseInt(sel.quantity) || 1), 0);

      if (child.minQty && totalQty < child.minQty) validationErrors.push(`Minimum ${child.minQty} items required`);
      if (child.maxQty && totalQty > child.maxQty) validationErrors.push(`Maximum ${child.maxQty} items allowed`);

      for (const sel of selections) {
        if (!eligibleIds.has(String(sel.productId))) {
          validationErrors.push(`Product ${sel.productId} not eligible`);
        }
      }
    }

    if (validationErrors.length) {
      return res.status(422).json({ valid: false, errors: validationErrors });
    }

    const getProductFirstImage = (prod) => {
      if (!prod || !prod.image) return null;
      let img = prod.image;
      if (typeof img === "string") {
        try {
          const parsed = JSON.parse(img);
          img = Array.isArray(parsed) ? parsed : [img];
        } catch (e) {
          img = [img];
        }
      }
      return Array.isArray(img) ? img[0] || null : img || null;
    };

    // Server-calculated price (never trust client)
    const comboPrice = parseFloat(child.comboPrice);

    // Build snapshot for cart line item
    const snapshot = {
      rootComboId:  child.rootComboId,
      childComboId: child.id,
      comboName:    child.name,
      comboType:    child.type,
      comboPrice,
      originalPrice: child.originalPrice ? parseFloat(child.originalPrice) : null,
      image: child.image,
      products: child.type === "fixed"
        ? child.comboProducts.map(cp => ({
            productId: cp.productId,
            variantId: cp.variantId,
            quantity:  cp.quantity,
            name:      cp.product?.name,
            image:     getProductFirstImage(cp.product),
            variantName: cp.variant?.variantName || null,
          }))
        : selections.map(sel => {
            const cp = child.comboProducts.find(c => String(c.productId) === String(sel.productId));
            const matchedVariant = cp?.product?.Variants?.find(v => String(v.id) === String(sel.variantId));
            return {
              productId: sel.productId,
              variantId: sel.variantId,
              quantity:  sel.quantity,
              name:      cp?.product?.name || "Product",
              image:     getProductFirstImage(cp?.product),
              variantName: matchedVariant?.variantName || null,
            };
          }),
    };

    // Store as a single CartItem with comboSnapshot
    // We use the first included product as the product_id anchor (for schema compatibility)
    // Full combo data lives in comboSnapshot JSON
    const firstProduct = child.type === "fixed"
      ? child.comboProducts[0]?.productId
      : selections[0]?.productId;

    if (!firstProduct) {
      return res.status(400).json({ message: "Combo has no products" });
    }

    const cartItem = await CartItem.create({
      userId,
      productId: firstProduct,
      quantity: parseInt(quantity) || 1,
      productSnapshot: {
        ...snapshot,
        name: child.name,
        price: comboPrice,
        isCombo: true,
      },
    });

    res.status(201).json({
      success: true,
      cartItem: { id: cartItem.id, comboSnapshot: snapshot, price: comboPrice },
    });
  } catch (err) {
    console.error("addComboToCart:", err);
    res.status(500).json({ message: "Failed to add combo to cart" });
  }
};
