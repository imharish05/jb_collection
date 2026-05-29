import PropTypes from "prop-types";
import React, { Fragment, useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addToWishlistService, addToCartService, addToCartSilentService } from "../../store/services";
import { useDispatch, useSelector } from "react-redux";
import { getProductCartQuantity } from "../../helpers/product";
import Rating from "./sub-components/ProductRating";
import cogoToast from "cogo-toast";
import { Icon } from "@iconify/react";
import { getImgUrl } from "../../helpers/imageUrl";
import api from "../../api/axios";
import { getProductStockState, STOCK_STATES } from "../../helpers/productStock";

// ─── helpers ─────────────────────────────────────────────────────────────────

function safeAttrs(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}

const hasBackendVariants = (p) =>
  Array.isArray(p.Variants) && p.Variants.length > 0;

const hasOldVariation = (p) =>
  Array.isArray(p.variation) && p.variation.length > 0 && p.variation[0].color !== undefined;

const COLOR_MAP = {
  red: "#e53935", crimson: "#c62828", maroon: "#800000", scarlet: "#FF2400", ruby: "#9B111E",
  cherry: "#DE3163", carmine: "#960018", orange: "#fb8c00", coral: "#ff7043",
  tangerine: "#F28500", peach: "#FFCBA4", salmon: "#FA8072", apricot: "#FBCEB1",
  yellow: "#fdd835", gold: "#ffc107", amber: "#ffb300", lemon: "#FFF44F",
  canary: "#FFEF00", saffron: "#F4C430", khaki: "#C3B091",
  green: "#43a047", olive: "#827717", lime: "#cddc39", emerald: "#50C878",
  forest: "#228B22", sage: "#BCB88A", mint: "#98FF98", moss: "#8A9A5B",
  chartreuse: "#7FFF00", jade: "#00A36C", teal: "#00897b", cyan: "#00bcd4",
  turquoise: "#26c6da", aquamarine: "#7FFFD4", seafoam: "#93E9BE", viridian: "#40826D",
  blue: "#1e88e5", navy: "#1a237e", skyblue: "#29b6f6", "sky blue": "#29b6f6",
  cobalt: "#0047AB", cerulean: "#007BA7", denim: "#1560BD", "royal blue": "#4169E1",
  "steel blue": "#4682B4", "powder blue": "#B0E0E6", "baby blue": "#89CFF0",
  "midnight blue": "#191970", periwinkle: "#CCCCFF",
  indigo: "#3949ab", purple: "#7b1fa2", violet: "#6a1b9a", lavender: "#b39ddb",
  magenta: "#8e24aa", lilac: "#C8A2C8", plum: "#DDA0DD", amethyst: "#9966CC",
  orchid: "#DA70D6", byzantium: "#702963", pink: "#e91e63", rose: "#f48fb1",
  blush: "#DE5D83", "hot pink": "#FF69B4", fuchsia: "#FF00FF", flamingo: "#FC8EAC",
  "rose gold": "#b76e79", bubblegum: "#FFC1CC", carnation: "#FF7BA9",
  white: "#ffffff", ivory: "#fffff0", cream: "#fffde7", "off-white": "#FAF9F6",
  snow: "#FFFAFA", silver: "#bdbdbd", grey: "#757575", gray: "#757575",
  charcoal: "#424242", black: "#212121", jet: "#343434", onyx: "#353839",
  ash: "#B2BEB5", brown: "#795548", tan: "#a1887f", beige: "#f5f5dc",
  sienna: "#A0522D", mahogany: "#C04000", chestnut: "#954535", coffee: "#6F4E37",
  caramel: "#C68642", umber: "#635147", walnut: "#773F1A", hazel: "#8E7618",
  bronze: "#CD7F32",
  multicolour: "linear-gradient(135deg,#f06,#0cf,#fc0)",
};
const LIGHT_COLORS = new Set(["white","ivory","cream","yellow","lime","gold","amber","silver","bronze","lemon","canary"]);

function toHex(name) {
  if (!name) return null;
  const l = name.trim().toLowerCase();
  if (l.startsWith("#")) return l;
  return COLOR_MAP[l] || null;
}

const KEY_ALIASES = { color: "Colour", colour: "Colour", size: "Size", material: "Material", finish: "Finish", capacity: "Capacity" };
function normalKey(k) { return KEY_ALIASES[k?.toLowerCase()] || k; }
const KEY_ORDER = ["Colour", "Size", "Material", "Finish", "Capacity"];

function buildOptionMap(variants) {
  const map = {};
  variants.forEach(v => {
    safeAttrs(v.attributes).forEach(a => {
      if (!a.key || !a.value || a.key === "Custom Note") return;
      const k = normalKey(a.key);
      if (!map[k]) map[k] = new Set();
      map[k].add(a.value);
    });
  });
  return map;
}

/**
 * Build a pre-computed index: for each variant build a Map keyed by
 * normalized attribute key/value pairs — enables O(n) compat lookups.
 */
function buildVariantIndex(variants) {
  return variants.map(v => ({
    variant: v,
    attrMap: Object.fromEntries(
      safeAttrs(v.attributes)
        .filter(a => a.key && a.value && a.key !== "Custom Note")
        .map(a => [normalKey(a.key), a.value])
    ),
  }));
}

/**
 * Returns the Set of valid values for `targetKey` given current selections.
 */
function compatibleValues(index, selections, targetKey) {
  const compatible = new Set();
  index.forEach(({ attrMap }) => {
    const othersMatch = Object.entries(selections).every(([k, val]) => {
      if (k === targetKey || !val) return true;
      return attrMap[k] === val;
    });
    if (othersMatch && attrMap[targetKey] !== undefined) {
      compatible.add(attrMap[targetKey]);
    }
  });
  return compatible;
}

function oosValues(index, selections, targetKey) {
  const oos = new Set();
  const inStock = new Set();
  index.forEach(({ variant, attrMap }) => {
    const othersMatch = Object.entries(selections).every(([k, val]) => {
      if (k === targetKey || !val) return true;
      return attrMap[k] === val;
    });
    if (othersMatch && attrMap[targetKey] !== undefined) {
      const stock = Number(variant.stock ?? 0);
      if (stock > 0) inStock.add(attrMap[targetKey]);
      else oos.add(attrMap[targetKey]);
    }
  });
  inStock.forEach(v => oos.delete(v));
  return oos;
}

function buildAvailabilityMaps(index, selections, allKeys) {
  const compatMap = {};
  const oosMap = {};
  allKeys.forEach(key => {
    compatMap[key] = compatibleValues(index, selections, key);
    oosMap[key] = oosValues(index, selections, key);
  });
  return { compatMap, oosMap };
}

/**
 * Find the best matching variant for a given selection.
 *
 * Priority:
 *  1. Exact match (all keys) that is IN STOCK
 *  2. Exact match (all keys) regardless of stock (OOS but valid combo)
 *  3. Highest-score partial match that is IN STOCK
 *  4. Highest-score partial match regardless of stock
 *
 * This ensures we always prefer in-stock when recovering from an invalid selection.
 */
function findMatchingVariant(index, selections, allKeys = []) {
  const entries = Object.entries(selections).filter(([, v]) => v);
  if (!entries.length) {
    // Return first in-stock variant, fallback to first variant
    return index.find(({ variant }) => Number(variant.stock ?? 0) > 0)?.variant
      || index[0]?.variant
      || null;
  }

  const isExact = ({ attrMap }) => entries.every(([k, val]) => attrMap[k] === val);
  const isInStock = ({ variant }) => Number(variant.stock ?? 0) > 0;

  // 1. Exact + in-stock
  const exactInStock = index.find(e => isExact(e) && isInStock(e));
  if (exactInStock) return exactInStock.variant;

  // 2. Exact (any stock)
  const exact = index.find(e => isExact(e));
  if (exact) return exact.variant;

  // 3. Best-score + in-stock (weighted matching score based on priority/order in allKeys)
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

  let bestInStock = null, bestInStockScore = -1;
  let bestAny = null, bestAnyScore = -1;
  index.forEach(e => {
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
}

/**
 * Build the initial selections object.
 * Prefers the first IN-STOCK variant; falls back to first variant.
 * Auto-selects all attributes when only one option exists per key.
 */
function buildInitialSelections(activeVariants) {
  if (!activeVariants.length) return {};

  const oMap = buildOptionMap(activeVariants);
  const keys = Object.keys(oMap);

  // All keys have a single option → auto-select everything
  const allSingle = keys.length > 0 && keys.every(k => oMap[k].size === 1);
  if (allSingle) return Object.fromEntries(keys.map(k => [k, [...oMap[k]][0]]));

  // Pick first in-stock variant; fallback to first overall
  const target = activeVariants.find(v => Number(v.stock ?? 0) > 0) || activeVariants[0];
  return Object.fromEntries(
    safeAttrs(target.attributes)
      .filter(a => a.key && a.value && a.key !== "Custom Note")
      .map(a => [normalKey(a.key), a.value])
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CustomNoteSection({ variant }) {
  const attrs = safeAttrs(variant.attributes).filter(a => a.key === "Custom Note");
  if (!attrs.length) return null;
  return (
    <div style={{ marginTop: 14, padding: "14px 18px", background: "#fdf8f5", border: "1px solid #f5e4db", borderRadius: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9c4a22", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <span>✏️</span> Customisation Info
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {attrs.flatMap((attr, i) =>
          attr.value.split(",").map(p => p.trim()).filter(Boolean).map((part, j) => {
            const ci = part.indexOf(":");
            if (ci > -1) {
              const k = part.slice(0, ci).trim();
              const val = part.slice(ci + 1).trim();
              return (
                <span key={`${i}-${j}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, padding: "4px 12px", borderRadius: 8, background: "#fff", border: "1px solid #ebd1c5", color: "#6e3316", fontWeight: 500 }}>
                  <span style={{ color: "#db1a5d", fontWeight: 700 }}>{k}:</span>{val}
                </span>
              );
            }
            return <span key={`${i}-${j}`} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 8, background: "#fff", border: "1px solid #ebd1c5", color: "#6e3316" }}>{part}</span>;
          })
        )}
      </div>
    </div>
  );
}

const SIZE_KEYS = /^size$/i;
const COMPACT_SIZE_VALS = /^(xs|s|sm|m|md|l|lg|xl|xxl|2xl|3xl|4xl|5xl|6xl)$/i;

function AttributeGroup({ attrKey, allValues, selectedValue, compatibleSet, oosSet, onSelect }) {
  const isColour = /colou?r/i.test(attrKey);
  const isSize   = SIZE_KEYS.test(attrKey);
  const isSingle = allValues.size === 1;

  // For sizes: use compact square chips if all values are standard abbreviations
  const allCompact = isSize && [...allValues].every(v => COMPACT_SIZE_VALS.test(v));

  return (
    <div className="pdp-attr-group">
      <div className="pdp-attr-label">
        <span className="pdp-attr-key">{attrKey}</span>
        {selectedValue && (
          <span className="pdp-attr-selected">— {selectedValue}</span>
        )}
      </div>
      <div className={`pdp-attr-options${isColour ? " is-colour" : ""}${allCompact ? " is-size" : ""}`}>
        {[...allValues].map(val => {
          const isSelected = selectedValue === val;
          // invalid = combination doesn't exist at all
          const isInvalid  = !compatibleSet.has(val);
          // oos = combination exists but stock = 0
          const isOos      = !isInvalid && oosSet.has(val);
          const isDisabled = false; // Visually styled as disabled via class, but clickable to allow selection transitions
          const hex = isColour ? toHex(val) : null;
          const isLight = LIGHT_COLORS.has(val.toLowerCase());

          if (isColour && hex) {
            return (
              <button
                key={val}
                title={isInvalid ? `${val} — unavailable` : isOos ? `${val} — out of stock` : val}
                disabled={isDisabled}
                onClick={() => onSelect(isSelected ? null : val)}
                className={`pdp-swatch${isSelected ? " is-selected" : ""}${isInvalid ? " is-disabled" : ""}${isOos ? " is-oos" : ""}${isLight ? " is-light" : ""}${isSingle ? " is-single" : ""}`}
                style={{ "--swatch-color": hex }}
              >
                {isInvalid && <span className="pdp-swatch__cross" />}
                {isOos && !isInvalid && <span className="pdp-swatch__oos" />}
                {isSelected && (
                  <span className="pdp-swatch__check" style={{ color: isLight ? "#333" : "#fff" }}>✓</span>
                )}
              </button>
            );
          }

          const chipClass = allCompact ? "pdp-size-chip" : "pdp-chip";
          return (
            <button
              key={val}
              disabled={isDisabled}
              onClick={() => onSelect(isSelected ? null : val)}
              title={isInvalid ? `${val} — unavailable` : isOos ? `${val} — out of stock` : val}
              className={`${chipClass}${isSelected ? " is-selected" : ""}${isInvalid ? " is-disabled" : ""}${isOos ? " is-oos" : ""}${isSingle ? " is-single" : ""}`}
            >
              {isInvalid && <span className="pdp-chip__line" />}
              {val}
              {isOos && !isInvalid && <span className="pdp-chip__oos-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ComboProductsSection({ combo, allProducts }) {
  if (!combo) return null;
  const productIds = Array.isArray(combo.productIds) ? combo.productIds : [];
  const comboProducts = productIds.length > 0
    ? productIds.map(id => allProducts.find(p => String(p.id) === String(id))).filter(Boolean)
    : allProducts.filter(p => p.comboId && String(p.comboId) === String(combo.id));
  if (!comboProducts.length) return null;
  const discounted = combo.discountedPrice && parseFloat(combo.discountedPrice) > 0;
  const saving = discounted ? Math.round(((parseFloat(combo.price) - parseFloat(combo.discountedPrice)) / parseFloat(combo.price)) * 100) : null;

  return (
    <div className="pdp-combo">
      <div className="pdp-combo__header">
        <div className="pdp-combo__title">
          <span>🎁</span>
          <span>{combo.name || combo.label} — Combo Pack</span>
          <span className="pdp-combo__count">{comboProducts.length} items</span>
        </div>
        <div className="pdp-combo__price">
          {discounted ? (
            <>
              <span className="pdp-combo__price-old">₹{parseFloat(combo.price).toLocaleString("en-IN")}</span>
              <span className="pdp-combo__price-new">₹{parseFloat(combo.discountedPrice).toLocaleString("en-IN")}</span>
              {saving > 0 && <span className="pdp-combo__saving">{saving}% OFF</span>}
            </>
          ) : (
            <span className="pdp-combo__price-new">₹{parseFloat(combo.price).toLocaleString("en-IN")}</span>
          )}
        </div>
      </div>
      {combo.description && <div className="pdp-combo__desc">{combo.description}</div>}
      <div className="pdp-combo__grid">
        {comboProducts.map((p, idx) => {
          const img = Array.isArray(p.image) ? p.image[0] : p.image;
          const variants = Array.isArray(p.Variants) ? p.Variants : [];
          const price = variants.length > 0 ? parseFloat(variants[0].salesPrice || 0) : parseFloat(p.price || 0);
          return (
            <Link key={p.id} to={`${process.env.PUBLIC_URL}/product/${p.id}`} className="pdp-combo__item">
              <div className="pdp-combo__item-num">{idx + 1}</div>
              <div className="pdp-combo__item-img">
                {img ? (
                  <img src={getImgUrl(img)} alt={p.name} onError={e => { e.target.style.display = "none"; }} />
                ) : <span>🎁</span>}
              </div>
              <div className="pdp-combo__item-name">{p.name}</div>
              {price > 0 && <div className="pdp-combo__item-price">₹{price.toLocaleString("en-IN")}</div>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const ProductDescriptionInfo = ({
  product,
  discountedPrice,
  currency,
  finalDiscountedPrice,
  finalProductPrice,
  cartItems: cartItemsProp,
  wishlistItems,
  onVariantImageChange,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const allProducts = useSelector((state) => state.product.products || []);
  const cartItemsFromStore = useSelector((state) => state.cart.cartItems);
  const cartItems = cartItemsFromStore || cartItemsProp || [];

  // Real-time inventory sync & polling
  const [localProduct, setLocalProduct] = useState(product);

  useEffect(() => {
    setLocalProduct(product);
  }, [product]);

  useEffect(() => {
    let active = true;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/products/${product.id}`);
        if (res.data && active) {
          const changed =
            res.data.stock !== localProduct.stock ||
            res.data.stockStatus !== localProduct.stockStatus ||
            JSON.stringify(res.data.Variants || []) !== JSON.stringify(localProduct.Variants || []);
          if (changed) {
            cogoToast.info("Inventory updated in real-time!", { position: "top-center" });
            setLocalProduct(res.data);
          }
        }
      } catch (err) {
        console.warn("Polling failed:", err);
      }
    }, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [product.id, localProduct]);

  const currencySymbol = currency?.currencySymbol || "₹";
  const hasNewVar = hasBackendVariants(localProduct);
  const hasOldVar = !hasNewVar && hasOldVariation(localProduct);

  // Only show Active variants on the client — Inactive ones are hidden from selection
  const activeVariants = useMemo(
    () => hasNewVar
      ? (localProduct.Variants || []).filter(v => (v.status || 'Active') === 'Active')
      : [],
    [localProduct, hasNewVar]
  );

  const optionMap = useMemo(() => hasNewVar ? buildOptionMap(activeVariants) : {}, [activeVariants, hasNewVar]);
  // Pre-computed index for O(1) per-variant attribute lookups
  const variantIndex = useMemo(() => hasNewVar ? buildVariantIndex(activeVariants) : [], [activeVariants, hasNewVar]);
  const attrKeys = useMemo(() => {
    const present = Object.keys(optionMap);
    const ordered = KEY_ORDER.filter(k => present.includes(k));
    const rest = present.filter(k => !KEY_ORDER.includes(k));
    return [...ordered, ...rest];
  }, [optionMap]);

  const [selections, setSelections] = useState(() =>
    hasNewVar ? buildInitialSelections(activeVariants) : {}
  );

  // Memoize compat/OOS maps for ALL attribute keys in a single pass per render
  const { compatMap, oosMap } = useMemo(
    () => buildAvailabilityMaps(variantIndex, selections, attrKeys),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variantIndex, selections, attrKeys.join("|")] // attrKeys is stable shape; join avoids array-ref churn
  );

  const selectedVariant = useMemo(
    () => hasNewVar ? findMatchingVariant(variantIndex, selections, attrKeys) : null,
    [selections, variantIndex, hasNewVar, attrKeys]
  );

  // Notify parent of auto-selected variant image on mount
  useEffect(() => {
    if (onVariantImageChange && selectedVariant?.image) {
      onVariantImageChange(selectedVariant.image);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customNoteVariant = useMemo(() =>
    hasNewVar ? activeVariants.find(v => safeAttrs(v.attributes).every(a => a.key === "Custom Note")) : null,
    [activeVariants, hasNewVar]
  );

  const handleSelect = (key, value) => {
    // Deselecting: reset to the first in-stock variant
    if (!value) {
      const reset = buildInitialSelections(activeVariants);
      setSelections(reset);
      setErrors(prev => ({ ...prev, variant: "" }));
      if (onVariantImageChange) {
        const v = findMatchingVariant(variantIndex, reset, attrKeys);
        onVariantImageChange(v?.image || null);
      }
      return;
    }

    // ── Intelligent selection recovery ──────────────────────────────────────
    // Strategy:
    //  1. The newly clicked key MUST be honoured (highest priority).
    //  2. For each other currently-selected key, keep its value if a valid
    //     variant exists that includes BOTH the new key=value AND the old value.
    //     If not, drop it so findMatchingVariant can recover gracefully.
    //  3. findMatchingVariant then picks the best in-stock variant satisfying
    //     as many of the remaining selections as possible.

    // Start with the mandatory new key
    const mandatory = { [key]: value };

    // For every other key currently selected, test if the value is still reachable
    // alongside the new key choice (at least one variant satisfies both)
    const preserved = {};
    Object.entries(selections).forEach(([k, val]) => {
      if (k === key || !val) return;
      const reachable = variantIndex.some(({ attrMap }) =>
        attrMap[key] === value && attrMap[k] === val
      );
      if (reachable) preserved[k] = val;
    });

    const preferred = { ...preserved, ...mandatory };
    const matched = findMatchingVariant(variantIndex, preferred, attrKeys);

    // Sync ALL keys from the matched variant (keeps the UI fully consistent)
    const next = {};
    if (matched) {
      safeAttrs(matched.attributes)
        .filter(a => a.key && a.value && a.key !== "Custom Note")
        .forEach(a => { next[normalKey(a.key)] = a.value; });
    } else {
      // No matching variant at all — commit just the clicked key
      Object.assign(next, selections, mandatory);
    }

    setSelections(next);
    setErrors(prev => ({ ...prev, variant: "" }));
    if (onVariantImageChange) {
      const v = findMatchingVariant(variantIndex, next, attrKeys);
      onVariantImageChange(v?.image || null);
    }
  };

  const [selectedProductColor, setSelectedProductColor] = useState(hasOldVar ? localProduct.variation[0].color : "");
  const [selectedProductSize, setSelectedProductSize] = useState(hasOldVar ? localProduct.variation[0].size[0].name : "");
  const [productStock, setProductStock] = useState(hasOldVar ? localProduct.variation[0].size[0].stock : localProduct.stock ?? 10);
  const [quantityCount, setQuantityCount] = useState(1);
  const [errors, setErrors] = useState({});

  const effectiveStock = selectedVariant ? Number(selectedVariant.stock ?? 0) : productStock;

  const productCartQty = useMemo(() => {
    if (hasNewVar && selectedVariant) {
      const match = cartItems?.find(
        item => String(item.id) === String(localProduct.id) && Number(item.selectedVariantId) === Number(selectedVariant.id)
      );
      return match ? match.quantity : 0;
    }
    return getProductCartQuantity(cartItems, localProduct, selectedProductColor, selectedProductSize);
  }, [cartItems, localProduct, selectedVariant, hasNewVar, selectedProductColor, selectedProductSize]);

  const stockState = useMemo(() => {
    if (hasNewVar) {
      return getProductStockState(localProduct, selectedVariant);
    }
    if (hasOldVar) {
      return getProductStockState({ ...localProduct, stock: productStock });
    }
    return getProductStockState(localProduct);
  }, [localProduct, selectedVariant, hasNewVar, hasOldVar, productStock]);

  // Adjust quantity Count if stock limits change
  useEffect(() => {
    const maxStock = stockState.maxQty !== undefined ? stockState.maxQty : (stockState.isPurchasable ? effectiveStock : 0);
    const availableToPurchase = Math.max(0, maxStock - productCartQty);

    if (stockState.isPurchasable && availableToPurchase > 0) {
      if (quantityCount > availableToPurchase) {
        setQuantityCount(availableToPurchase);
        cogoToast.warn(`Selected quantity adjusted to match available stock limit (${availableToPurchase}).`, { position: "bottom-left" });
      }
    } else {
      if (quantityCount !== 1) {
        setQuantityCount(1);
      }
    }
  }, [localProduct, selectedVariant, stockState, productCartQty]);

  const redirectToLogin = () => {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    navigate(`${process.env.PUBLIC_URL}/login?redirect=${redirect}`);
  };

  const ErrorMsg = ({ field }) => errors[field] ? (
    <div style={{ color: "#e11d48", fontSize: 12, fontWeight: 600, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
      <span>⚠</span> {errors[field]}
    </div>
  ) : null;

  const validateCart = () => {
    const next = {};
    if (hasNewVar) {
      const compatibleVariants = activeVariants.filter(v => {
        const attrs = {};
        safeAttrs(v.attributes).filter(a => a.key && a.value && a.key !== "Custom Note")
          .forEach(a => { const k = normalKey(a.key); if (!attrs[k]) attrs[k] = []; attrs[k].push(a.value); });
        return Object.entries(selections).every(([k, val]) => {
          if (!val) return true;
          return attrs[k] && attrs[k].includes(val);
        });
      });
      const requiredKeys = new Set();
      compatibleVariants.forEach(v => {
        safeAttrs(v.attributes).filter(a => a.key && a.value && a.key !== "Custom Note")
          .forEach(a => requiredKeys.add(normalKey(a.key)));
      });
      const missing = [...requiredKeys].filter(key => !selections[key]);
      if (missing.length > 0) next.variant = `Please select: ${missing.join(", ")}`;
      else if (!selectedVariant) next.variant = "Please select a valid variant";
    }
    if (!quantityCount || quantityCount < 1) {
      next.quantity = "Please select at least 1 quantity";
    } else if (!stockState.isPurchasable) {
      next.quantity = stockState.message || "This product is not available for purchase";
    } else {
      const maxStock = stockState.maxQty !== undefined ? stockState.maxQty : effectiveStock;
      if (quantityCount + productCartQty > maxStock) {
        const remaining = Math.max(0, maxStock - productCartQty);
        next.quantity = remaining > 0 
          ? `Selected quantity exceeds available stock (${remaining} more allowed)`
          : "You already have all available stock in your cart";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      cogoToast.warn("Please login to add items to cart", { position: "top-center" });
      redirectToLogin();
      return;
    }
    if (!validateCart()) return;
    let variantColor = selectedProductColor || null;
    let variantSize = selectedProductSize || null;
    if (selectedVariant) {
      safeAttrs(selectedVariant.attributes).forEach(a => {
        if (!a.key || !a.value) return;
        const k = normalKey(a.key);
        if (k === "Colour") variantColor = a.value;
        if (k === "Size") variantSize = a.value;
      });
    }
    addToCartService(dispatch, {
      ...localProduct,
      selectedVariantId: selectedVariant?.id || null,
      selectedVariantName: selectedVariant?.variantName || null,
      selectedProductColor: variantColor,
      selectedProductSize: variantSize,
      price: selectedVariant ? parseFloat(selectedVariant.salesPrice) : (localProduct.price || 0),
      quantity: quantityCount,
    });
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      cogoToast.warn("Please login to buy items", { position: "top-center" });
      redirectToLogin();
      return;
    }
    if (productCartQty > 0) {
      navigate("/cart");
      return;
    }
    if (!validateCart()) return;
    let variantColor = selectedProductColor || null;
    let variantSize = selectedProductSize || null;
    if (selectedVariant) {
      safeAttrs(selectedVariant.attributes).forEach(a => {
        if (!a.key || !a.value) return;
        const k = normalKey(a.key);
        if (k === "Colour") variantColor = a.value;
        if (k === "Size") variantSize = a.value;
      });
    }
    const success = await addToCartSilentService(dispatch, {
      ...localProduct,
      selectedVariantId: selectedVariant?.id || null,
      selectedVariantName: selectedVariant?.variantName || null,
      selectedProductColor: variantColor,
      selectedProductSize: variantSize,
      price: selectedVariant ? parseFloat(selectedVariant.salesPrice) : (localProduct.price || 0),
      quantity: quantityCount,
    });
    if (success) {
      navigate("/cart");
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      cogoToast.warn("Please login to save to wishlist", { position: "top-center" });
      redirectToLogin();
      return;
    }
    addToWishlistService(product, selectedVariant?.id ?? null);
  };

  const wishlistItems_ = Array.isArray(wishlistItems) ? wishlistItems : (wishlistItems ? [wishlistItems] : []);
  const wishlistItem = wishlistItems_.find(item => {
    const a = item.selectedVariantId != null ? Number(item.selectedVariantId) : null;
    const b = selectedVariant?.id != null ? Number(selectedVariant.id) : null;
    return a === b;
  });
  const isInWishlist = wishlistItem !== undefined;

  // ── Price display ──────────────────────────────────────────────────────────
  const currentPrice = selectedVariant
    ? parseFloat(selectedVariant.salesPrice)
    : (discountedPrice !== null ? finalDiscountedPrice : finalProductPrice);
  const oldPrice = selectedVariant && Number(selectedVariant.mrp) > Number(selectedVariant.salesPrice)
    ? parseFloat(selectedVariant.mrp)
    : (discountedPrice !== null ? finalProductPrice : null);
  const savePct = selectedVariant && Number(selectedVariant.mrp) > Number(selectedVariant.salesPrice)
    ? Math.round((1 - selectedVariant.salesPrice / selectedVariant.mrp) * 100)
    : (product.discount > 0 ? product.discount : null);

  return (
    <div className="pdp-info">

      {/* ── Product name ── */}
      <h1 className="pdp-info__name">{product.name}</h1>

      {/* ── Rating ── */}
      {product.rating > 0 && (
        <div className="pdp-info__rating">
          <Rating ratingValue={product.rating} />
          <span className="pdp-info__rating-num">{Number(product.rating).toFixed(1)}</span>
        </div>
      )}

      {/* ── Price block ── */}
      <div className="pdp-info__price-block">
        <span className="pdp-info__price">
          {currencySymbol}{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        {oldPrice && (
          <span className="pdp-info__price-old">
            {currencySymbol}{oldPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
        {savePct > 0 && (
          <span className="pdp-info__save-badge">{savePct}% OFF</span>
        )}
      </div>

      {/* ── Short description ── */}
      {product.shortDescription && (
        <p className="pdp-info__short-desc">{product.shortDescription}</p>
      )}

      <div className="pdp-info__divider" />

      {/* ── Combo ── */}
      {product.Combo && <ComboProductsSection combo={product.Combo} allProducts={allProducts} />}

      {/* ── Backend variant selector ── */}
      {hasNewVar && (
        <div className="pdp-info__variants">
          {attrKeys.map(key => (
            <AttributeGroup
              key={key}
              attrKey={key}
              allValues={optionMap[key]}
              selectedValue={selections[key] || null}
              compatibleSet={compatMap[key] || new Set()}
              oosSet={oosMap[key] || new Set()}
              onSelect={(val) => handleSelect(key, val)}
            />
          ))}

          {/* Custom note */}
          {selectedVariant && <CustomNoteSection variant={selectedVariant} />}
          {customNoteVariant && customNoteVariant !== selectedVariant && (
            <CustomNoteSection variant={customNoteVariant} />
          )}
          <ErrorMsg field="variant" />
        </div>
      )}

      {/* ── Old variation selector ── */}
      {hasOldVar && (
        <div className="pdp-info__variants">
          <div className="pdp-attr-group">
            <div className="pdp-attr-label">
              <span className="pdp-attr-key">Colour</span>
              {selectedProductColor && <span className="pdp-attr-selected">— {selectedProductColor}</span>}
            </div>
            <div className="pdp-attr-options is-colour">
              {product.variation.map((single, key) => {
                const hex = toHex(single.color);
                const isLight = LIGHT_COLORS.has(single.color?.toLowerCase());
                const isSelected = single.color === selectedProductColor;
                return hex ? (
                  <button
                    key={key}
                    title={single.color}
                    onClick={() => { setSelectedProductColor(single.color); setSelectedProductSize(single.size[0].name); setProductStock(single.size[0].stock); setQuantityCount(1); }}
                    className={`pdp-swatch${isSelected ? " is-selected" : ""}${isLight ? " is-light" : ""}`}
                    style={{ "--swatch-color": hex }}
                  >
                    {isSelected && <span className="pdp-swatch__check" style={{ color: isLight ? "#333" : "#fff" }}>✓</span>}
                  </button>
                ) : (
                  <button
                    key={key}
                    onClick={() => { setSelectedProductColor(single.color); setSelectedProductSize(single.size[0].name); setProductStock(single.size[0].stock); setQuantityCount(1); }}
                    className={`pdp-chip${isSelected ? " is-selected" : ""}`}
                  >
                    {single.color}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pdp-attr-group">
            <div className="pdp-attr-label">
              <span className="pdp-attr-key">Size</span>
              {selectedProductSize && <span className="pdp-attr-selected">— {selectedProductSize}</span>}
            </div>
            <div className="pdp-attr-options">
              {product.variation.map(single =>
                single.color === selectedProductColor
                  ? single.size.map((singleSize, key) => (
                    <button
                      key={key}
                      onClick={() => { setSelectedProductSize(singleSize.name); setProductStock(singleSize.stock); setQuantityCount(1); }}
                      className={`pdp-chip${singleSize.name === selectedProductSize ? " is-selected" : ""}`}
                    >
                      {singleSize.name}
                    </button>
                  ))
                  : null
              )}
            </div>
          </div>
        </div>
      )}

      <div className="pdp-info__divider" />

      {/* Stock status display */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span className={`status-pill ${stockState.badgeClass}`}>
          {stockState.label}
        </span>
        {stockState.showDeliveryEstimate && (
          <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
            <span>🚚</span> Delivered in 3–5 business days
          </span>
        )}
      </div>

      {stockState.message && (
        <div style={{ 
          fontSize: 13, 
          fontWeight: 600, 
          padding: "8px 12px", 
          borderRadius: 8, 
          marginBottom: 16, 
          background: stockState.state === STOCK_STATES.LOW_STOCK ? "#fff7ed" : stockState.state === STOCK_STATES.IN_STOCK ? "#f0fdf4" : "#fef2f2",
          color: stockState.state === STOCK_STATES.LOW_STOCK ? "#ea580c" : stockState.state === STOCK_STATES.IN_STOCK ? "#15803d" : "#b91c1c",
          border: `1px solid ${stockState.state === STOCK_STATES.LOW_STOCK ? "#ffedd5" : stockState.state === STOCK_STATES.IN_STOCK ? "#dcfce7" : "#fee2e2"}`
        }}>
          {stockState.state === STOCK_STATES.LOW_STOCK ? "⚡ " : stockState.state === STOCK_STATES.IN_STOCK ? "✓ " : "⚠️ "}
          {stockState.message}
        </div>
      )}

      {/* Notify Me subscription */}
      {stockState.allowNotify && (
        <div style={{ marginTop: 10, marginBottom: 20, padding: "14px 18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>✉️</span> Notify Me When Available
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const emailInput = e.target.elements.notifyEmail;
            const email = emailInput?.value || "";
            if (!email || !email.includes("@")) {
              cogoToast.error("Please enter a valid email address.", { position: "top-center" });
              return;
            }
            cogoToast.success("Thanks! We will notify you when this item is back in stock.", { position: "top-center" });
            if (emailInput) emailInput.value = "";
          }} style={{ display: "flex", gap: 8 }}>
            <input
              name="notifyEmail"
              type="email"
              placeholder="Enter your email"
              required
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
                outline: "none"
              }}
            />
            <button type="submit" className="pdp-btn pdp-btn--primary" style={{ height: "40px", padding: "0 18px", fontSize: 13 }}>
              Subscribe
            </button>
          </form>
        </div>
      )}

      {/* ── Add to cart / Affiliate ── */}
      {localProduct.affiliateLink ? (
        <div className="pdp-info__actions">
          <a href={localProduct.affiliateLink} rel="noopener noreferrer" target="_blank" className="pdp-btn pdp-btn--primary">
            Buy Now
          </a>
        </div>
      ) : (
        <div className="pdp-info__actions">
          {/* Render Qty & Wishlist row if NOT discontinued */}
          {stockState.state !== STOCK_STATES.DISCONTINUED && (
            <div className="pdp-info__actions-row pdp-info__actions-row--top">
              {/* Qty */}
              <div className="pdp-qty">
                <button
                  className="pdp-qty__btn"
                  onClick={() => setQuantityCount(q => Math.max(1, q - 1))}
                  disabled={quantityCount <= 1 || !stockState.isPurchasable}
                >
                  <svg width="14" height="2" viewBox="0 0 14 2">
                    <line x1="0" y1="1" x2="14" y2="1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                <span className="pdp-qty__count">{stockState.isPurchasable ? quantityCount : 0}</span>
                <button
                  className="pdp-qty__btn"
                  onClick={() => {
                    const maxStock = stockState.maxQty !== undefined ? stockState.maxQty : effectiveStock;
                    setQuantityCount(q => q < maxStock - productCartQty ? q + 1 : q);
                  }}
                  disabled={
                    !stockState.isPurchasable ||
                    quantityCount >= (stockState.maxQty !== undefined ? stockState.maxQty : effectiveStock) - productCartQty
                  }
                >
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <line x1="7" y1="0" x2="7" y2="14" stroke="currentColor" strokeWidth="2"/>
                    <line x1="0" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </div>

              {/* Wishlist */}
              <button
                className={`pdp-btn pdp-btn--wishlist${isInWishlist ? " is-active" : ""}`}
                disabled={isAuthenticated && isInWishlist}
                title={isInWishlist ? "In your wishlist" : "Add to wishlist"}
                onClick={handleWishlist}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>
          )}

          <div className="pdp-info__actions-row pdp-info__actions-row--bottom">
            {stockState.isPurchasable ? (
              <>
                {isAuthenticated && productCartQty > 0 ? (
                  <Link to="/cart" className="pdp-btn pdp-btn--success">
                    View Cart
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </Link>
                ) : (
                  <button
                    className="pdp-btn pdp-btn--primary"
                    onClick={handleAddToCart}
                    disabled={
                      isAuthenticated && 
                      productCartQty >= (stockState.maxQty !== undefined ? stockState.maxQty : effectiveStock)
                    }
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Add to Cart
                  </button>
                )}

                <button
                  className="pdp-btn pdp-btn--buy"
                  onClick={handleBuyNow}
                  disabled={
                    isAuthenticated && 
                    productCartQty >= (stockState.maxQty !== undefined ? stockState.maxQty : effectiveStock)
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                  Buy Now
                </button>
              </>
            ) : (
              <button className="pdp-btn pdp-btn--disabled" disabled style={{ width: "100%" }}>
                {stockState.buttonText}
              </button>
            )}
          </div>
        </div>
      )}

      <ErrorMsg field="quantity" />

      <div className="pdp-info__divider" />

      {/* ── Share ── */}
      <div className="pdp-info__share">
        <span className="pdp-info__share-label">Share:</span>
        <div className="pdp-info__share-links">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
            target="_blank" rel="noopener noreferrer" title="Facebook"
            className="pdp-share-btn pdp-share-btn--fb"
          >
            <i className="fa fa-facebook" />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(product.name + " " + window.location.href)}`}
            target="_blank" rel="noopener noreferrer" title="X / Twitter"
            className="pdp-share-btn pdp-share-btn--x"
          >
            <Icon icon="ri:twitter-x-fill" width="15" height="15" />
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(product.name + " " + window.location.href)}`}
            target="_blank" rel="noopener noreferrer" title="WhatsApp"
            className="pdp-share-btn pdp-share-btn--wa"
          >
            <i className="fa fa-whatsapp" />
          </a>
        </div>
      </div>

      {/* ── Styles ── */}
      <style>{`
        /* ── Info panel ── */
        .pdp-info {
          padding-left: 32px;
        }
        @media (max-width: 767px) {
          .pdp-info { padding-left: 0; margin-top: 28px; }
        }

        .pdp-info__name {
          font-size: clamp(22px, 2.5vw, 30px);
          font-weight: 700;
          color: #111827;
          line-height: 1.25;
          margin: 0 0 12px;
          letter-spacing: -0.01em;
        }

        .pdp-info__rating {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
        }
        .pdp-info__rating-num {
          font-size: 13px;
          font-weight: 700;
          color: #db1a5d;
          background: #fdf2f5;
          border-radius: 6px;
          padding: 2px 8px;
        }

        /* ── Price ── */
        .pdp-info__price-block {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .pdp-info__price {
          font-size: 28px;
          font-weight: 800;
          color: #db1a5d;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .pdp-info__price-old {
          font-size: 16px;
          color: #9ca3af;
          text-decoration: line-through;
          font-weight: 500;
        }
        .pdp-info__save-badge {
          display: inline-flex;
          align-items: center;
          background: #10b981;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 6px;
          letter-spacing: 0.02em;
        }

        .pdp-info__short-desc {
          font-size: 14px;
          line-height: 1.65;
          color: #4b5563;
          margin: 0 0 4px;
        }

        .pdp-info__divider {
          height: 1px;
          background: #e5e7eb;
          margin: 22px 0;
        }

        /* ── Variants ── */
        .pdp-info__variants {
          margin-bottom: 4px;
        }

        /* ── Attribute group ── */
        .pdp-attr-group {
          margin-bottom: 20px;
        }
        .pdp-attr-label {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 10px;
        }
        .pdp-attr-key {
          font-size: 11px;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pdp-attr-selected {
          font-size: 12px;
          color: #db1a5d;
          font-weight: 600;
        }
        .pdp-attr-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pdp-attr-options.is-colour {
          gap: 10px;
        }

        /* ── Color swatch ── */
        .pdp-swatch {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--swatch-color);
          border: 2px solid transparent;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1);
          cursor: pointer;
          padding: 0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          overflow: hidden;
        }
        .pdp-swatch:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.15);
        }
        .pdp-swatch.is-light {
          border-color: #d1d5db;
        }
        .pdp-swatch.is-selected {
          border-color: #fff !important;
          outline: 2px solid #db1a5d;
          box-shadow: 0 4px 10px rgba(219,26,93,0.25);
        }
        .pdp-swatch.is-disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .pdp-swatch__cross {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.2) 4px,rgba(0,0,0,0.2) 5px);
        }
        .pdp-swatch__check {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 900;
        }

        /* ── Auto-selected badge ── */
        .pdp-attr-auto-tag {
          font-size: 10px;
          font-weight: 600;
          color: #10b981;
          background: #d1fae5;
          border-radius: 4px;
          padding: 1px 7px;
          letter-spacing: 0.02em;
          text-transform: lowercase;
        }

        /* ── Text chip ── */
        .pdp-chip {
          position: relative;
          padding: 8px 18px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          color: #374151;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
          overflow: hidden;
        }
        .pdp-chip:hover:not(:disabled) {
          border-color: #db1a5d;
          color: #db1a5d;
          background: #fdf2f5;
        }
        .pdp-chip.is-selected {
          border-color: #db1a5d;
          background: #fdf2f5;
          color: #db1a5d;
          font-weight: 600;
        }
        .pdp-chip.is-disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: #f9fafb;
        }
        .pdp-chip.is-single {
          cursor: default;
        }

        /* ── Size chip (compact square) ── */
        .pdp-attr-options.is-size { gap: 6px; }
        .pdp-size-chip {
          position: relative;
          min-width: 44px;
          height: 40px;
          padding: 0 10px;
          border: 1.5px solid #d1d5db;
          border-radius: 6px;
          background: #fff;
          color: #374151;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .pdp-size-chip:hover:not(:disabled) {
          border-color: #db1a5d;
          color: #db1a5d;
          background: #fdf2f5;
        }
        .pdp-size-chip.is-selected {
          border-color: #db1a5d;
          background: #db1a5d;
          color: #fff;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(219,26,93,0.25);
        }
        .pdp-size-chip.is-disabled {
          opacity: 0.35;
          cursor: not-allowed;
          background: #f9fafb;
        }
        .pdp-size-chip.is-single {
          cursor: default;
        }
        /* Single-option swatches: no cursor change */
        .pdp-swatch.is-single { cursor: default; }
        .pdp-chip__line {
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%,-50%) rotate(-15deg);
          width: 120%; height: 1px;
          background: #9ca3af;
          pointer-events: none;
        }
        /* OOS — amber state: combination exists but stock = 0 */
        .pdp-chip.is-oos {
          border-color: #f59e0b;
          color: #92400e;
          background: #fffbeb;
          opacity: 0.8;
          position: relative;
        }
        .pdp-chip.is-oos:hover:not(:disabled) {
          border-color: #d97706;
          background: #fef3c7;
        }
        .pdp-size-chip.is-oos {
          border-color: #f59e0b;
          color: #92400e;
          background: #fffbeb;
          opacity: 0.85;
        }
        .pdp-chip__oos-dot {
          display: inline-block;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #f59e0b;
          margin-left: 5px;
          vertical-align: middle;
          flex-shrink: 0;
        }
        .pdp-swatch.is-oos {
          opacity: 0.75;
          outline: 2px dashed #f59e0b;
          outline-offset: 2px;
        }
        .pdp-swatch__oos {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 5px,
            rgba(245,158,11,0.35) 5px,
            rgba(245,158,11,0.35) 6px
          );
        }

        /* ── Stock ── */
        .pdp-info__stock {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: -4px;
          margin-bottom: 12px;
          padding: 4px 12px;
          border-radius: 6px;
          background: #f3f4f6;
        }
        .pdp-info__stock-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pdp-info__stock-dot.is-in  { background: #10b981; }
        .pdp-info__stock-dot.is-out { background: #ef4444; }
        .pdp-info__stock-label { font-size: 12px; font-weight: 600; }
        .pdp-info__stock-label.is-in  { color: #065f46; }
        .pdp-info__stock-label.is-out { color: #991b1b; }

        /* ── Actions row ── */
        .pdp-info__actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }
        .pdp-info__actions-row {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        .pdp-info__actions-row--top .pdp-qty {
          flex: 1;
          max-width: 140px;
        }
        .pdp-info__actions-row--top .pdp-btn--wishlist {
          flex-shrink: 0;
        }
        .pdp-info__actions-row--bottom .pdp-btn {
          flex: 1;
          min-width: 0;
        }
        .pdp-info__actions-row--bottom .pdp-btn--disabled {
          flex: 1;
          width: 100%;
        }

        @media (max-width: 767px) {
          .pdp-info__actions-row--top .pdp-qty {
            max-width: none;
          }
        }

        /* ── Qty stepper ── */
        .pdp-qty {
          display: inline-flex;
          align-items: center;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
          height: 46px;
          justify-content: space-between;
        }
        .pdp-qty__btn {
          width: 40px;
          height: 100%;
          border: none;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4b5563;
          transition: all 0.15s;
          flex: 1;
        }
        .pdp-qty__btn:hover:not(:disabled) { background: #f3f4f6; color: #db1a5d; }
        .pdp-qty__btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .pdp-qty__count {
          min-width: 40px;
          text-align: center;
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          border-left: 1px solid #d1d5db;
          border-right: 1px solid #d1d5db;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1.5;
        }

        /* ── Buttons ── */
        .pdp-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 46px;
          padding: 0 26px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          white-space: nowrap;
          font-family: inherit;
        }
        .pdp-btn--primary {
          background: #db1a5d;
          color: #fff;
          box-shadow: 0 4px 12px rgba(219,26,93,0.2);
          flex: 1;
          min-width: 0;
        }
        .pdp-btn--primary:hover {
          background: #be1249;
          box-shadow: 0 6px 16px rgba(219,26,93,0.3);
          transform: translateY(-1px);
          color: #fff;
        }
        .pdp-btn--buy {
          background: #F15A24;
          color: #fff;
          box-shadow: 0 4px 12px rgba(241,90,36,0.2);
          flex: 1;
          min-width: 0;
        }
        .pdp-btn--buy:hover:not(:disabled) {
          background: #df4e1b;
          box-shadow: 0 6px 16px rgba(241,90,36,0.3);
          transform: translateY(-1px);
          color: #fff;
        }
        .pdp-btn--buy:disabled {
          background: #e5e7eb;
          color: #9ca3af;
          box-shadow: none;
          cursor: not-allowed;
          transform: none;
        }
        .pdp-btn--success {
          background: #111827;
          color: #fff;
          flex: 1;
          min-width: 0;
        }
        .pdp-btn--success:hover { background: #1f2937; color: #fff; transform: translateY(-1px); }
        .pdp-btn--disabled {
          background: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
          flex: 1;
        }
        .pdp-btn--wishlist {
          width: 46px;
          height: 46px;
          padding: 0;
          border-radius: 8px;
          background: #fff;
          color: #9ca3af;
          border: 1px solid #d1d5db;
          flex-shrink: 0;
        }
        .pdp-btn--wishlist:hover:not(:disabled) {
          background: #fdf2f5;
          color: #db1a5d;
          border-color: #fbcfe8;
        }
        .pdp-btn--wishlist.is-active {
          background: #fdf2f5;
          color: #db1a5d;
          border-color: #fbcfe8;
        }

        /* ── Share ── */
        .pdp-info__share {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pdp-info__share-label {
          font-size: 11px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pdp-info__share-links {
          display: flex;
          gap: 8px;
        }
        .pdp-share-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .pdp-share-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.12); }
        .pdp-share-btn--fb { background: #1877f2; }
        .pdp-share-btn--x  { background: #1f2937; }
        .pdp-share-btn--wa { background: #25d366; }

        /* ── Combo ── */
        .pdp-combo {
          margin-bottom: 22px;
          border: 1px solid #db1a5d;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(219,26,93,0.04);
        }
        .pdp-combo__header {
          background: #db1a5d;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pdp-combo__title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-weight: 600;
          font-size: 14px;
        }
        .pdp-combo__count {
          background: rgba(255,255,255,0.2);
          color: #fff;
          font-size: 11px;
          font-weight: 500;
          border-radius: 4px;
          padding: 1px 6px;
        }
        .pdp-combo__price {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pdp-combo__price-old {
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          text-decoration: line-through;
        }
        .pdp-combo__price-new {
          color: #fff;
          font-weight: 700;
          font-size: 16px;
        }
        .pdp-combo__saving {
          background: #10b981;
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          border-radius: 4px;
          padding: 1px 6px;
        }
        .pdp-combo__desc {
          padding: 10px 16px;
          background: #fdf2f5;
          font-size: 13px;
          color: #9d174d;
          border-bottom: 1px solid #fbcfe8;
        }
        .pdp-combo__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
          gap: 1px;
          background: #e5e7eb;
        }
        .pdp-combo__item {
          background: #fff;
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          transition: all 0.2s ease;
          min-height: 140px;
        }
        .pdp-combo__item:hover { background: #fdf2f5; }
        .pdp-combo__item-num {
          align-self: flex-start;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #db1a5d;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pdp-combo__item-img {
          width: 64px;
          height: 64px;
          border-radius: 6px;
          overflow: hidden;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .pdp-combo__item-img img { width: 100%; height: 100%; object-fit: cover; }
        .pdp-combo__item-name {
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          text-align: center;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          width: 100%;
        }
        .pdp-combo__item-price { font-size: 12px; color: #db1a5d; font-weight: 600; }

        /* ── Status Pills ── */
        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 50px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid transparent;
        }
        .status-pill.is-in {
          background: #ecfdf5;
          color: #10b981;
          border-color: #a7f3d0;
        }
        .status-pill.is-low {
          background: #fff7ed;
          color: #f97316;
          border-color: #fed7aa;
        }
        .status-pill.is-out {
          background: #fef2f2;
          color: #ef4444;
          border-color: #fecaca;
        }
        .status-pill.is-unavailable {
          background: #f3f4f6;
          color: #6b7280;
          border-color: #e5e7eb;
        }
        .status-pill.is-discontinued {
          background: #fef2f2;
          color: #6b7280;
          border-color: #e5e7eb;
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
};

ProductDescriptionInfo.propTypes = {
  cartItems: PropTypes.array,
  currency: PropTypes.shape({}),
  discountedPrice: PropTypes.number,
  finalDiscountedPrice: PropTypes.number,
  finalProductPrice: PropTypes.number,
  product: PropTypes.shape({}),
  wishlistItems: PropTypes.array,
  onVariantImageChange: PropTypes.func,
};

export default ProductDescriptionInfo;