const { Product, Variant, ChildCombo, ChildComboProduct, Order, OrderItem, InventoryLog } = require("../models");

const safeParse = (val) => {
  if (!val) return null;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (e) {
      return null;
    }
  }
  return val;
};

/**
 * Validates stock for all items in a checkout payload.
 * Throws an Error with descriptive message if validation fails.
 */
const validateOrderStock = async (orderItems, transaction = null) => {
  const tOpt = transaction ? { transaction } : {};

  for (const item of orderItems) {
    const isCombo = item.isCombo === true || item.isCombo === "true";
    const quantity = parseInt(item.quantity) || 1;

    if (isCombo) {
      if (!item.childComboId) {
        throw new Error("Invalid checkout payload: Missing childComboId for combo item.");
      }

      const child = await ChildCombo.findByPk(item.childComboId, {
        include: [{
          model: ChildComboProduct,
          as: "comboProducts",
          include: [
            { model: Product, as: "product", include: [{ model: Variant, as: "Variants" }] },
            { model: Variant, as: "variant" }
          ]
        }],
        ...tOpt
      });

      if (!child || !child.isActive) {
        throw new Error(`Combo "${item.comboName || item.name || 'Combo'}" is no longer active or available.`);
      }

      if (child.type === "fixed") {
        for (const cp of child.comboProducts) {
          if (cp.isEligible) continue; // Skip eligibility pool items for fixed combos

          const v = cp.variantId ? cp.variant : null;
          const stock = v ? Number(v.stock || 0) : Number(cp.product?.stock || 0);
          const needed = cp.quantity * quantity;

          if (stock < needed) {
            throw new Error(
              `Insufficient stock for "${cp.product?.name || 'constituent product'}" (${v ? `option ${v.variantName}` : 'simple'}). Required: ${needed}, Available: ${stock}.`
            );
          }
        }
      } else if (child.type === "mix_match") {
        const selections = safeParse(item.selectedProducts);
        if (!Array.isArray(selections) || selections.length === 0) {
          throw new Error(`Selections are required for Mix & Match combo "${child.name}".`);
        }

        const eligibleIds = new Set(child.comboProducts.filter(cp => cp.isEligible).map(cp => String(cp.productId)));
        
        // Duplicates rule validation
        if (!child.allowDuplicates) {
          const seen = new Set();
          for (const sel of selections) {
            const key = `${sel.productId}:${sel.variantId || ""}`;
            if (seen.has(key)) {
              throw new Error(`Duplicate selections are not allowed for Mix & Match combo "${child.name}".`);
            }
            seen.add(key);
          }
        }

        // Validate count/quantity limits
        const totalQty = selections.reduce((s, sel) => s + (parseInt(sel.quantity) || 1), 0);
        if (child.minQty && totalQty < child.minQty) {
          throw new Error(`Mix & Match combo "${child.name}" requires at least ${child.minQty} selected items.`);
        }
        if (child.maxQty && totalQty > child.maxQty) {
          throw new Error(`Mix & Match combo "${child.name}" allows at most ${child.maxQty} selected items.`);
        }

        for (const sel of selections) {
          if (!eligibleIds.has(String(sel.productId))) {
            throw new Error(`Selected product ${sel.productId} is not eligible for Mix & Match combo "${child.name}".`);
          }

          const cp = child.comboProducts.find(c => String(c.productId) === String(sel.productId));
          if (!cp) {
            throw new Error(`Selected product ${sel.productId} is not associated with this combo.`);
          }

          const v = sel.variantId
            ? cp.product?.Variants?.find(x => String(x.id) === String(sel.variantId)) || null
            : null;
          
          if (sel.variantId && !v) {
            throw new Error(`Selected variant ${sel.variantId} is invalid for product "${cp.product?.name}".`);
          }

          const stock = Number(v ? v.stock : cp.product?.stock ?? 0);
          const needed = (parseInt(sel.quantity) || 1) * quantity;

          if (stock < needed) {
            throw new Error(
              `Insufficient stock for "${cp.product?.name || 'selected product'}" (${v ? `option ${v.variantName}` : 'simple'}). Required: ${needed}, Available: ${stock}.`
            );
          }
        }
      }
    } else if (item.selectedVariantId) {
      const variant = await Variant.findByPk(item.selectedVariantId, tOpt);
      if (!variant) {
        throw new Error(`Variant option not found for selected item.`);
      }
      const stock = Number(variant.stock || 0);
      if (stock < quantity) {
        throw new Error(`Insufficient stock for option "${variant.variantName}". Required: ${quantity}, Available: ${stock}.`);
      }
    } else {
      const product = await Product.findByPk(item.productId, tOpt);
      if (!product) {
        throw new Error(`Product not found.`);
      }
      const stock = Number(product.stock || 0);
      if (stock < quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Required: ${quantity}, Available: ${stock}.`);
      }
    }
  }

  return { valid: true };
};

/**
 * Acquires database locks, re-checks stock, decrements inventory, and creates log entries.
 * Runs inside the provided Sequelize transaction.
 */
const decrementOrderStock = async (orderId, transaction, reason, paymentSource) => {
  if (!transaction) {
    throw new Error("decrementOrderStock requires an active database transaction.");
  }

  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: "items" }],
    transaction,
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found.`);
  }

  for (const item of order.items) {
    const isCombo = item.isCombo === true || item.isCombo === "true";
    const quantity = parseInt(item.quantity) || 1;

    if (isCombo) {
      let constituents = [];

      if (item.comboType === "fixed") {
        // Query child combo products forfixed combo
        const childProducts = await ChildComboProduct.findAll({
          where: { childComboId: item.childComboId, isEligible: false },
          include: [{ model: Product, as: "product", attributes: ["id", "name"] }],
          transaction,
        });
        constituents = childProducts.map(cp => ({
          productId: cp.productId,
          variantId: cp.variantId,
          quantity: cp.quantity,
          name: cp.product?.name || "Constituent Product",
        }));
      } else {
        // Mix & Match selections are stored in selectedProducts
        const selections = safeParse(item.selectedProducts);
        if (!Array.isArray(selections) || selections.length === 0) {
          throw new Error(`No selections recorded for Mix & Match Order Item ${item.id}.`);
        }
        constituents = selections.map(sel => ({
          productId: sel.productId,
          variantId: sel.variantId,
          quantity: parseInt(sel.quantity) || 1,
          name: sel.name || "Selected Product",
        }));
      }

      for (const constItem of constituents) {
        const needed = constItem.quantity * quantity;

        if (constItem.variantId) {
          const variant = await Variant.findByPk(constItem.variantId, { transaction, lock: true });
          if (!variant) {
            throw new Error(`Constituent variant ${constItem.variantId} not found.`);
          }
          if (Number(variant.stock) < needed) {
            throw new Error(`Insufficient stock for variant "${variant.variantName}" during lock check.`);
          }

          const stockBefore = Number(variant.stock);
          const stockAfter = stockBefore - needed;
          variant.stock = stockAfter;
          await variant.save({ transaction });

          await InventoryLog.create({
            orderId: order.id,
            productId: variant.productId,
            variantId: variant.id,
            comboId: item.childComboId,
            comboType: item.comboType,
            quantityChanged: -needed,
            stockBefore,
            stockAfter,
            reason,
            paymentSource,
          }, { transaction });
        } else {
          const product = await Product.findByPk(constItem.productId, { transaction, lock: true });
          if (!product) {
            throw new Error(`Constituent product ${constItem.productId} not found.`);
          }
          if (Number(product.stock) < needed) {
            throw new Error(`Insufficient stock for product "${product.name}" during lock check.`);
          }

          const stockBefore = Number(product.stock);
          const stockAfter = stockBefore - needed;
          product.stock = stockAfter;
          await product.save({ transaction });

          await InventoryLog.create({
            orderId: order.id,
            productId: product.id,
            variantId: null,
            comboId: item.childComboId,
            comboType: item.comboType,
            quantityChanged: -needed,
            stockBefore,
            stockAfter,
            reason,
            paymentSource,
          }, { transaction });
        }
      }
    } else if (item.selectedVariantId) {
      const variant = await Variant.findByPk(item.selectedVariantId, { transaction, lock: true });
      if (!variant) {
        throw new Error(`Variant ${item.selectedVariantId} not found.`);
      }
      if (Number(variant.stock) < quantity) {
        throw new Error(`Insufficient stock for variant "${variant.variantName}" during lock check.`);
      }

      const stockBefore = Number(variant.stock);
      const stockAfter = stockBefore - quantity;
      variant.stock = stockAfter;
      await variant.save({ transaction });

      await InventoryLog.create({
        orderId: order.id,
        productId: variant.productId,
        variantId: variant.id,
        comboId: null,
        comboType: null,
        quantityChanged: -quantity,
        stockBefore,
        stockAfter,
        reason,
        paymentSource,
      }, { transaction });
    } else {
      const product = await Product.findByPk(item.productId, { transaction, lock: true });
      if (!product) {
        throw new Error(`Product ${item.productId} not found.`);
      }
      if (Number(product.stock) < quantity) {
        throw new Error(`Insufficient stock for product "${product.name}" during lock check.`);
      }

      const stockBefore = Number(product.stock);
      const stockAfter = stockBefore - quantity;
      product.stock = stockAfter;
      await product.save({ transaction });

      await InventoryLog.create({
        orderId: order.id,
        productId: product.id,
        variantId: null,
        comboId: null,
        comboType: null,
        quantityChanged: -quantity,
        stockBefore,
        stockAfter,
        reason,
        paymentSource,
      }, { transaction });
    }
  }

  return true;
};

/**
 * Restores inventory stock for cancelled, returned, or RTO orders.
 * Safe against double restoration.
 */
const restoreOrderStock = async (orderId, transaction, reason = "Inventory Restoration") => {
  if (!transaction) {
    throw new Error("restoreOrderStock requires an active database transaction.");
  }

  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: "items" }],
    transaction,
    lock: true,
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found.`);
  }

  // Double restoration protection
  if (order.inventoryRestored) {
    return false;
  }

  // If inventory was never processed/deducted, do not restore
  if (!order.inventoryProcessed) {
    return false;
  }

  for (const item of order.items) {
    const isCombo = item.isCombo === true || item.isCombo === "true";
    const quantity = parseInt(item.quantity) || 1;

    if (isCombo) {
      let constituents = [];

      // Check saved selections or snap
      const savedSelections = safeParse(item.selectedProducts);
      if (Array.isArray(savedSelections) && savedSelections.length > 0) {
        constituents = savedSelections.map(sel => ({
          productId: sel.productId,
          variantId: sel.variantId,
          quantity: parseInt(sel.quantity) || 1,
        }));
      } else if (item.comboType === "fixed") {
        const childProducts = await ChildComboProduct.findAll({
          where: { childComboId: item.childComboId, isEligible: false },
          transaction,
        });
        constituents = childProducts.map(cp => ({
          productId: cp.productId,
          variantId: cp.variantId,
          quantity: cp.quantity,
        }));
      }

      for (const constItem of constituents) {
        const restoreQty = constItem.quantity * quantity;

        if (constItem.variantId) {
          const variant = await Variant.findByPk(constItem.variantId, { transaction, lock: true });
          if (variant) {
            const stockBefore = Number(variant.stock);
            const stockAfter = stockBefore + restoreQty;
            variant.stock = stockAfter;
            await variant.save({ transaction });

            await InventoryLog.create({
              orderId: order.id,
              productId: variant.productId,
              variantId: variant.id,
              comboId: item.childComboId,
              comboType: item.comboType,
              quantityChanged: restoreQty,
              stockBefore,
              stockAfter,
              reason,
              paymentSource: "admin_adjustment",
            }, { transaction });
          }
        } else {
          const product = await Product.findByPk(constItem.productId, { transaction, lock: true });
          if (product) {
            const stockBefore = Number(product.stock);
            const stockAfter = stockBefore + restoreQty;
            product.stock = stockAfter;
            await product.save({ transaction });

            await InventoryLog.create({
              orderId: order.id,
              productId: product.id,
              variantId: null,
              comboId: item.childComboId,
              comboType: item.comboType,
              quantityChanged: restoreQty,
              stockBefore,
              stockAfter,
              reason,
              paymentSource: "admin_adjustment",
            }, { transaction });
          }
        }
      }
    } else if (item.selectedVariantId) {
      const variant = await Variant.findByPk(item.selectedVariantId, { transaction, lock: true });
      if (variant) {
        const stockBefore = Number(variant.stock);
        const stockAfter = stockBefore + quantity;
        variant.stock = stockAfter;
        await variant.save({ transaction });

        await InventoryLog.create({
          orderId: order.id,
          productId: variant.productId,
          variantId: variant.id,
          comboId: null,
          comboType: null,
          quantityChanged: quantity,
          stockBefore,
          stockAfter,
          reason,
          paymentSource: "admin_adjustment",
      }, { transaction });
      }
    } else {
      const product = await Product.findByPk(item.productId, { transaction, lock: true });
      if (product) {
        const stockBefore = Number(product.stock);
        const stockAfter = stockBefore + quantity;
        product.stock = stockAfter;
        await product.save({ transaction });

        await InventoryLog.create({
          orderId: order.id,
          productId: product.id,
          variantId: null,
          comboId: null,
          comboType: null,
          quantityChanged: quantity,
          stockBefore,
          stockAfter,
          reason,
          paymentSource: "admin_adjustment",
        }, { transaction });
      }
    }
  }

  order.inventoryRestored = true;
  await order.save({ transaction });
  return true;
};

module.exports = {
  validateOrderStock,
  decrementOrderStock,
  restoreOrderStock,
};
