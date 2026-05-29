import api from "../../api/axios";

export const inventoryStore = {
  /**
   * Revalidate list of items against the backend database.
   */
  async revalidateInventory(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: true, hasChanges: false, items: [] };
    }

    try {
      const payload = {
        items: items.map((item) => ({
          cartItemId: item.cartItemId,
          productId: item.id || item.productId,
          selectedVariantId: item.selectedVariantId || null,
          quantity: item.quantity,
          name: item.name,
          selectedVariantName: item.selectedVariantName || null,
          isCombo: item.isCombo || false,
          childComboId: item.childComboId || null,
          selectedProducts: item.selectedProducts || null,
        })),
      };
      const res = await api.post("/cart/revalidate", payload);
      return res.data;
    } catch (err) {
      console.error("Inventory revalidation failed:", err);
      throw err;
    }
  },

  /**
   * Client-side Cartesian variant helper.
   * Given active variants and current selections, computes valid options
   * and identifies out-of-stock options in O(n) lookup time.
   */
  checkVariantAvailability(activeVariants, selections, allKeys) {
    const optionMap = {};
    activeVariants.forEach((v) => {
      let attrs = [];
      if (Array.isArray(v.attributes)) attrs = v.attributes;
      else if (typeof v.attributes === "string") {
        try {
          attrs = JSON.parse(v.attributes) || [];
        } catch {
          attrs = [];
        }
      }
      attrs.forEach((a) => {
        if (!a.key || !a.value || a.key === "Custom Note") return;
        const k = a.key.trim();
        if (!optionMap[k]) optionMap[k] = new Set();
        optionMap[k].add(a.value);
      });
    });

    const variantIndex = activeVariants.map((v) => {
      let attrs = [];
      if (Array.isArray(v.attributes)) attrs = v.attributes;
      else if (typeof v.attributes === "string") {
        try {
          attrs = JSON.parse(v.attributes) || [];
        } catch {
          attrs = [];
        }
      }
      return {
        variant: v,
        attrMap: Object.fromEntries(
          attrs
            .filter((a) => a.key && a.value && a.key !== "Custom Note")
            .map((a) => [a.key.trim(), a.value])
        ),
      };
    });

    const compatMap = {};
    const oosMap = {};

    allKeys.forEach((key) => {
      const compatible = new Set();
      const oos = new Set();
      const inStock = new Set();

      variantIndex.forEach(({ variant, attrMap }) => {
        const othersMatch = Object.entries(selections).every(([k, val]) => {
          if (k === key || !val) return true;
          return attrMap[k] === val;
        });

        if (othersMatch && attrMap[key] !== undefined) {
          compatible.add(attrMap[key]);
          const stock = Number(variant.stock ?? 0);
          if (stock > 0) inStock.add(attrMap[key]);
          else oos.add(attrMap[key]);
        }
      });

      inStock.forEach((v) => oos.delete(v));

      compatMap[key] = compatible;
      oosMap[key] = oos;
    });

    return { compatMap, oosMap, optionMap };
  },

  /**
   * Client-side lookup to see if a selected variant is exactly matching
   * and in-stock.
   */
  findMatchingVariant(activeVariants, selections, allKeys) {
    let attrsList = activeVariants.map((v) => {
      let attrs = [];
      if (Array.isArray(v.attributes)) attrs = v.attributes;
      else if (typeof v.attributes === "string") {
        try {
          attrs = JSON.parse(v.attributes) || [];
        } catch {
          attrs = [];
        }
      }
      return {
        variant: v,
        attrMap: Object.fromEntries(
          attrs
            .filter((a) => a.key && a.value && a.key !== "Custom Note")
            .map((a) => [a.key.trim(), a.value])
        ),
      };
    });

    const entries = Object.entries(selections).filter(([, val]) => val);
    if (!entries.length) {
      return activeVariants.find((v) => Number(v.stock ?? 0) > 0) || activeVariants[0] || null;
    }

    const isExact = ({ attrMap }) => entries.every(([k, val]) => attrMap[k] === val);
    const isInStock = ({ variant }) => Number(variant.stock ?? 0) > 0;

    const exactInStock = attrsList.find((e) => isExact(e) && isInStock(e));
    if (exactInStock) return exactInStock.variant;

    const exact = attrsList.find((e) => isExact(e));
    if (exact) return exact.variant;

    // Partial/Weighted matching
    const getScore = ({ attrMap }) => {
      let score = 0;
      entries.forEach(([k, val]) => {
        if (attrMap[k] === val) {
          const keyIdx = allKeys.indexOf(k);
          const weight = keyIdx > -1 ? Math.pow(10, allKeys.length - 1 - keyIdx) : 1;
          score += weight;
        }
      });
      return score;
    };

    let bestInStock = null,
      bestInStockScore = -1;
    let bestAny = null,
      bestAnyScore = -1;

    attrsList.forEach((e) => {
      const s = getScore(e);
      if (isInStock(e) && s > bestInStockScore) {
        bestInStockScore = s;
        bestInStock = e.variant;
      }
      if (s > bestAnyScore) {
        bestAnyScore = s;
        bestAny = e.variant;
      }
    });

    return bestInStock || bestAny;
  },
};
