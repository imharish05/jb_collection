import PropTypes from "prop-types";
import React, { Fragment, useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addToWishlistService, addToCartService, addToCartSilentService } from "../../store/services";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { createBuyNowCheckout, replaceCheckoutItems } from "../../store/slices/checkout-slice";
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
  magenta: "#8e24aa", lilac: "#C8A2C8", atio: "#DDA0DD", amethyst: "#9966CC",
  orchid: "#DA70D6", byzantium: "#702963", pink: "#e91e63", rose: "#f48fb1",
  blush: "#DE5D83", "hot pink": "#FF69B4", fuchsia: "#FF00FF", flamingo: "#FC8EAC",
  "rose gold": "#b76e79", bubblegum: "#FFC1CC", carnation: "#FF7BA9",
  white: "#ffffff", ivory: "#fffff0", cream: "#fffde7", "off-white": "#FAF9F6",
  snow: "#FFFAFA", silver: "#bdbdbd", grey: "#757575", gray: "#757575",
  charcoal: "#424242", black: "#212121", jet: "#343434", onyx: "#353839",
  ash: "#B2BEB5", brown: "#795548", tan: "#a1887f", beige: "#f5f5dc",
  sienna: "#A0522D", mahogany: "#C04000", chestnut: "#954535", coffee: "#6F4E37",
  bronze: "#CD7F32",
  multicolour: "linear-gradient(135deg,#f06,#0cf,#fc0)",
  all: "linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)",
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

function parseVariantNameAttrs(variantName) {
  if (!variantName) return [];
  const seen = new Set();
  return String(variantName)
    .split(/\s*(?:·|\||,|\/)\s*/)
    .map(part => {
      const idx = part.indexOf(":");
      if (idx === -1) return null;
      const key = normalKey(part.slice(0, idx).trim());
      const value = part.slice(idx + 1).trim();
      return key && value ? { key, value } : null;
    })
    .filter(attr => {
      if (!attr || attr.key === "Custom Note") return false;
      const key = attr.key.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function variantAttrs(variant) {
  const attrs = safeAttrs(variant?.attributes)
    .filter(a => a.key && a.value && a.key !== "Custom Note")
    .map(a => ({ ...a, key: normalKey(a.key) }));
  return attrs.length ? attrs : parseVariantNameAttrs(variant?.variantName);
}

function buildOptionMap(variants) {
  const map = {};
  variants.forEach(v => {
    variantAttrs(v).forEach(a => {
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
      variantAttrs(v).map(a => [normalKey(a.key), a.value])
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

  // Always pick the very first active variant automatically
  const target = activeVariants[0];
  return Object.fromEntries(
    variantAttrs(target).map(a => [normalKey(a.key), a.value])
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
                  <span style={{ color: "#de1a67", fontWeight: 700 }}>{k}:</span>{val}
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
        {/* {selectedValue && (
          <span className="pdp-attr-selected">— {selectedValue}</span>
        )} */}
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
            <Link key={p.id} to={`${process.env.PUBLIC_URL}/product/${p.slug || p.id}`} className="pdp-combo__item">
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
  // Read current checkout session to support quantity merging on repeated Buy Now
  const checkoutSession = useSelector((state) => state.checkout);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = localProduct?.name || product?.name || "this product";
  const shareMessage = `Check out ${shareTitle} on Kamali Gifts — a perfect pick for every special moment.`;
  const shareText = `${shareMessage}\n${shareUrl}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareMessage)}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

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
            // cogoToast.info("Inventory updated in real-time!", { position: "top-center" });
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

  const currencySymbol = "₹";
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

  // Sync selections when product ID changes, or when activeVariants loads for the first time
  const lastProductIdRef = useRef(null);
  const wasEmptyRef = useRef(true);

  useEffect(() => {
    const idChanged = lastProductIdRef.current !== localProduct.id;
    const justLoaded = wasEmptyRef.current && activeVariants.length > 0;

    if (idChanged || justLoaded) {
      if (hasNewVar && activeVariants.length > 0) {
        setSelections(buildInitialSelections(activeVariants));
      } else {
        setSelections({});
      }
      lastProductIdRef.current = localProduct.id;
      wasEmptyRef.current = activeVariants.length === 0;
    }
  }, [localProduct.id, activeVariants, hasNewVar]);

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

  // Notify parent of selected variant image when it changes
  const lastImageRef = useRef(null);
  useEffect(() => {
    if (onVariantImageChange && selectedVariant?.image !== lastImageRef.current) {
      onVariantImageChange(selectedVariant?.image || null);
      lastImageRef.current = selectedVariant?.image || null;
    }
  }, [selectedVariant, onVariantImageChange]);

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
      variantAttrs(matched)
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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  // Customisation fields state — driven by product.customisationFields
  const [customisationDetails, setCustomisationDetails] = useState({});
  const [availableFonts, setAvailableFonts] = useState([]);
  const [customisationTemplates, setCustomisationTemplates] = useState([]);

  const parsedCustomisationFields = useMemo(() => {
    let cf = localProduct?.customisationFields;
    if (typeof cf === 'string') {
      try { return JSON.parse(cf); } catch { return {}; }
    }
    return cf || {};
  }, [localProduct?.customisationFields]);

  useEffect(() => {
    api.get('/customisation-fields?active=true')
      .then(r => {
        const fields = Array.isArray(r.data) ? r.data : [];
        const parsed = fields.map(f => {
          let opts = f.options;
          if (typeof opts === 'string') {
            try { opts = JSON.parse(opts); } catch { opts = null; }
          }
          return { ...f, options: opts };
        });
        setCustomisationTemplates(parsed);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (localProduct?.isCustomisable) {
      api.get('/fonts').then(r => setAvailableFonts(r.data || [])).catch(() => {});
    }
  }, [localProduct?.id, localProduct?.isCustomisable]);

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
        variantAttrs(v)
          .forEach(a => { const k = normalKey(a.key); if (!attrs[k]) attrs[k] = []; attrs[k].push(a.value); });
        return Object.entries(selections).every(([k, val]) => {
          if (!val) return true;
          return attrs[k] && attrs[k].includes(val);
        });
      });
      const requiredKeys = new Set();
      compatibleVariants.forEach(v => {
        variantAttrs(v)
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
    if (localProduct?.isCustomisable) {
      const activeFields = customisationTemplates.filter(t => !!parsedCustomisationFields[t.key]);
      activeFields.forEach(field => {
        if (field.isRequired && (!customisationDetails[field.key] || !String(customisationDetails[field.key]).trim())) {
          next[field.key] = `${field.label} is required`;
        }
      });
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAddToCart = async () => {
    if (isAddingToCart || isBuyingNow) return; // double-click protection
    if (!isAuthenticated) {
      cogoToast.warn("Please login to add items to cart", { position: "top-center" });
      redirectToLogin();
      return;
    }
    if (!validateCart()) return;
    
    setIsAddingToCart(true);
    try {
      let variantColor = selectedProductColor || null;
      let variantSize = selectedProductSize || null;
      if (selectedVariant) {
        variantAttrs(selectedVariant).forEach(a => {
          if (!a.key || !a.value) return;
          const k = normalKey(a.key);
          if (k === "Colour") variantColor = a.value;
          if (k === "Size") variantSize = a.value;
        });
      }
      await addToCartService(dispatch, {
        ...localProduct,
        selectedVariantId: selectedVariant?.id || null,
        selectedVariantName: selectedVariant?.variantName || null,
        selectedProductColor: variantColor,
        selectedProductSize: variantSize,
        price: selectedVariant ? parseFloat(selectedVariant.salesPrice) : (localProduct.price || 0),
        quantity: quantityCount,
        customisationDetails: localProduct?.isCustomisable ? customisationDetails : null,
      });
    } catch (err) {
      console.error("Failed to add to cart:", err);
    } finally {
      setIsAddingToCart(false);
    }
  };

const handleBuyNow = async () => {
  if (isAddingToCart || isBuyingNow) return; // double-click protection

  const currentStock = selectedVariant
    ? Number(selectedVariant.stock ?? 0)
    : Number(localProduct.stock ?? 0);

  if (currentStock <= 0) {
    cogoToast.error(
      "This product is currently out of stock. Please check back later.",
      { position: "top-center" }
    );
    return;
  }

  if (!isAuthenticated) {
    cogoToast.warn("Please login to buy items", { position: "top-center" });
    redirectToLogin();
    return;
  }
  if (!validateCart()) return;

    setIsBuyingNow(true);
    try {
      let variantColor = selectedProductColor || null;
      let variantSize = selectedProductSize || null;
      if (selectedVariant) {
        variantAttrs(selectedVariant).forEach(a => {
          if (!a.key || !a.value) return;
          const k = normalKey(a.key);
          if (k === "Colour") variantColor = a.value;
          if (k === "Size") variantSize = a.value;
        });
      }

      // ── LIVE STOCK CHECK: always fetch fresh stock before Buy Now ────────
      // This prevents the stale-Redux-stock bug where:
      //   1. User orders product (stock: 1 → 0)
      //   2. Order confirmation runs but product slice still has stock: 1
      //   3. User clicks Buy Now again — resolvedStock = 1 (stale) → passes
      //   4. Checkout opens with an item that's already out of stock
      // We call the API directly here to get authoritative current stock.
      let liveStock = 0;
      try {
        const variantIdParam = selectedVariant?.id ? `?variantId=${selectedVariant.id}` : "";
        const stockRes = await api.get(`/products/${localProduct.id}/stock${variantIdParam}`);
        liveStock = Number(stockRes.data?.stock ?? 0);
      } catch (stockErr) {
        // Fallback to Redux cached stock if API is unreachable
        console.warn("[BuyNow] Live stock check failed, using cached value:", stockErr.message);
        liveStock = selectedVariant ? Number(selectedVariant.stock ?? 0) : Number(localProduct.stock ?? 0);
      }

      if (liveStock <= 0) {
        cogoToast.error("This product is out of stock.", { position: "top-center" });
        setIsBuyingNow(false);
        // Also update Redux so the UI immediately reflects OOS
        try {
          const { refreshProductStock } = await import("../../store/services/productService");
          await refreshProductStock(localProduct.id);
        } catch (_) { /* no-op */ }
        return;
      }

      const resolvedStock = liveStock;
      const resolvedPrice = selectedVariant ? parseFloat(selectedVariant.salesPrice) : (localProduct.price || 0);
      const selectedVariantId = selectedVariant?.id || null;

      // ── Quantity Merge: if the same product+variant is already in an active
      //    Buy Now session, just update the quantity instead of creating a new session.
      const existingSession = checkoutSession;
      const isActiveBuyNow =
        existingSession?.source === "buy_now" &&
        Array.isArray(existingSession.items) &&
        existingSession.items.length === 1 &&
        existingSession.expiresAt &&
        Date.now() < existingSession.expiresAt;

      if (isActiveBuyNow) {
        const existing = existingSession.items[0];
        const sameProduct = String(existing.id) === String(localProduct.id);
        const sameVariant = existing.selectedVariantId === null
          ? selectedVariantId === null
          : Number(existing.selectedVariantId) === Number(selectedVariantId);

        if (sameProduct && sameVariant) {
          const newQty = Math.min(existing.quantity + quantityCount, resolvedStock);
          const merged = { ...existing, quantity: newQty };
          dispatch(replaceCheckoutItems([merged]));
          cogoToast.success(`Quantity updated to ${newQty}. Adding..`, { position: "top-center" });
          await new Promise((resolve) => setTimeout(resolve, 300));
          navigate(`${process.env.PUBLIC_URL}/checkout`);
          return;
        }
      }

      // ── Fresh Buy Now session ────────────────────────────────────────────
      const buyNowItem = {
        id: localProduct.id,
        cartItemId: "buynow-" + uuidv4(),
        quantity: quantityCount,
        selectedProductColor: variantColor,
        selectedProductSize: variantSize,
        selectedVariantId,
        selectedVariantName: selectedVariant?.variantName || null,
        selectedVariant: selectedVariant || null,
        name: localProduct.name,
        price: resolvedPrice,
        discount: selectedVariant ? 0 : (localProduct.discount || 0),
        image: selectedVariant?.image || localProduct.image || [],
        variation: localProduct.variation || [],
        stock: resolvedStock,
        Variants: localProduct.Variants || [],
        isPartialCodAvailable: localProduct.isPartialCodAvailable !== false,
        customisationDetails: localProduct?.isCustomisable ? customisationDetails : null,
        customisationFields: parsedCustomisationFields || null,
      };

      dispatch(createBuyNowCheckout(buyNowItem));
      await new Promise((resolve) => setTimeout(resolve, 300));
      navigate(`${process.env.PUBLIC_URL}/checkout`);
    } catch (err) {
      console.error("Failed to execute Buy Now:", err);
      setIsBuyingNow(false);
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
      {/* <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span className={`status-pill ${stockState.badgeClass}`}>
          {stockState.label}
        </span>
        {stockState.showDeliveryEstimate && (
          <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
            <span>🚚</span> Delivered in 3–5 business days
          </span>
        )}
      </div> */}

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
      {false && stockState.allowNotify && (
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
<button
  onClick={handleBuyNow}
  disabled={!stockState.isPurchasable || isBuyingNow}
  className={`btn-buy-now ${!stockState.isPurchasable ? "disabled" : ""}`}
  title={!stockState.isPurchasable ? "Out of Stock" : ""}
>
  {!stockState.isPurchasable ? "Out of Stock" : (isBuyingNow ? "Processing..." : "Buy Now")}
</button>
      ) : (
        <>
        {/* ── Customisation Fields Panel ── */}
        {(() => {
          if (!localProduct.isCustomisable || !parsedCustomisationFields) return null;
          const activeFields = customisationTemplates.filter(t => !!parsedCustomisationFields[t.key]);
          if (activeFields.length === 0) return null;

          return (
            <div style={{
              margin: '0 0 18px 0', padding: '16px 18px',
              background: 'linear-gradient(135deg, #fff7ed 0%, #fef0e8 100%)',
              borderRadius: 12, border: '1px solid #fed7aa',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9a3412', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                🎨 Personalise Your Product
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeFields.map(field => {
                  const errorKey = field.key;
                  return (
                    <div key={field.key}>
                      {field.inputType === 'text' && (
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                            {field.icon && <span style={{ marginRight: 4 }}>{field.icon}</span>}
                            {field.label}
                            {field.isRequired && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                          </label>
                          <input
                            type="text"
                            placeholder={field.placeholder || "Enter details..."}
                            value={customisationDetails[field.key] || ''}
                            onChange={e => setCustomisationDetails(prev => ({ ...prev, [field.key]: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      )}

                      {field.inputType === 'textarea' && (
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                            {field.icon && <span style={{ marginRight: 4 }}>{field.icon}</span>}
                            {field.label}
                            {field.isRequired && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                          </label>
                          <textarea
                            placeholder={field.placeholder || "Any special instructions..."}
                            value={customisationDetails[field.key] || ''}
                            onChange={e => setCustomisationDetails(prev => ({ ...prev, [field.key]: e.target.value }))}
                            rows={2}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                          />
                        </div>
                      )}

                      {field.inputType === 'color' && (
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                            {field.icon && <span style={{ marginRight: 4 }}>{field.icon}</span>}
                            {field.label}
                            {field.isRequired && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                          </label>

                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                            {/* Color Picker box */}
                            <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 8, overflow: 'hidden', border: '1px solid #d1d5db', cursor: 'pointer', flexShrink: 0 }}>
                              <input
                                type="color"
                                value={customisationDetails[field.key] && customisationDetails[field.key].startsWith('#') ? customisationDetails[field.key] : '#f15a24'}
                                onChange={e => setCustomisationDetails(prev => ({ ...prev, [field.key]: e.target.value }))}
                                style={{ position: 'absolute', top: -5, left: -5, width: 50, height: 50, border: 0, padding: 0, cursor: 'pointer' }}
                              />
                            </div>
                            <input
                              type="text"
                              placeholder={field.placeholder || "Choose a color or enter code (e.g. #ff0000)"}
                              value={customisationDetails[field.key] || ''}
                              onChange={e => setCustomisationDetails(prev => ({ ...prev, [field.key]: e.target.value }))}
                              style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>

                          {Array.isArray(field.options) && field.options.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                              {field.options.map(opt => {
                                const hexVal = toHex(opt) || opt;
                                const isSelected = customisationDetails[field.key] === hexVal || customisationDetails[field.key] === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setCustomisationDetails(prev => ({ ...prev, [field.key]: hexVal }))}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '5px 10px',
                                      border: isSelected ? '2px solid #F15A24' : '1px solid #d1d5db',
                                      borderRadius: 20,
                                      background: isSelected ? '#FEF0EB' : '#fff',
                                      color: isSelected ? '#F15A24' : '#374151',
                                      fontSize: 12,
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                    }}
                                  >
                                    {toHex(opt) && (
                                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: toHex(opt), border: '1px solid rgba(0,0,0,0.1)' }} />
                                    )}
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {field.inputType === 'font' && (
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                            {field.icon && <span style={{ marginRight: 4 }}>{field.icon}</span>}
                            {field.label}
                            {field.isRequired && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                          </label>
                          <select
                            value={customisationDetails[field.key] || ''}
                            onChange={e => setCustomisationDetails(prev => ({ ...prev, [field.key]: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                          >
                            <option value="">-- Select a font --</option>
                            {availableFonts.map(f => (
                              <option key={f.id} value={f.name} style={{ fontFamily: f.name }}>{f.name}</option>
                            ))}
                          </select>
                          {customisationDetails[field.key] && (
                            <div style={{ marginTop: 6, padding: '6px 10px', background: '#fff', borderRadius: 6, border: '1px solid #e5e7eb', fontFamily: customisationDetails[field.key], fontSize: 16 }}>
                              {(() => {
                                const textField = activeFields.find(f => f.inputType === 'text');
                                const previewText = textField ? (customisationDetails[textField.key] || '') : '';
                                return previewText || 'Font Preview';
                              })()}
                            </div>
                          )}
                        </div>
                      )}

                      {field.inputType === 'select' && (
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                            {field.icon && <span style={{ marginRight: 4 }}>{field.icon}</span>}
                            {field.label}
                            {field.isRequired && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                          </label>
                          <select
                            value={customisationDetails[field.key] || ''}
                            onChange={e => setCustomisationDetails(prev => ({ ...prev, [field.key]: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                          >
                            <option value="">{field.placeholder || "-- Select an option --"}</option>
                            {Array.isArray(field.options) && field.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <ErrorMsg field={errorKey} />
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: '#9a3412', marginTop: 8, opacity: 0.8 }}>
                * Customisation details will be added to your order. Our team will confirm via WhatsApp before production.
              </div>
            </div>
          );
        })()}
        <div className={`pdp-info__actions pdp-info__actions--product${stockState.state === STOCK_STATES.DISCONTINUED ? " is-discontinued" : ""}`}>
          {/* Quantity & Wishlist Row */}
          {stockState.state !== STOCK_STATES.DISCONTINUED && (
            <div className="pdp-product-actions-top" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
              {/* Quantity Selector */}
              <div className="pdp-qty pdp-info__purchase-cell pdp-info__purchase-cell--qty" style={{ display: "flex", alignItems: "center", border: "1.5px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#fff", height: "46px", maxWidth: "140px", transition: "all 0.2s ease" }}>
                <button
                  className="pdp-qty__btn"
                  onClick={() => setQuantityCount(q => Math.max(1, q - 1))}
                  disabled={quantityCount <= 1 || !stockState.isPurchasable}
                  style={{ width: "40px", height: "100%", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", transition: "all 0.2s ease" }}
                  title="Decrease quantity"
                >
                  <svg width="14" height="2" viewBox="0 0 14 2">
                    <line x1="0" y1="1" x2="14" y2="1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                <span className="pdp-qty__count" style={{ minWidth: "50px", textAlign: "center", fontSize: "15px", fontWeight: 600, color: "#111827", borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flex: 1, background: "#fafbfc" }}>
                  {stockState.isPurchasable ? quantityCount : 0}
                </span>
                <button
                  className="pdp-qty__btn"
                  onClick={() => {
                    const maxStock = stockState.maxQty !== undefined ? stockState.maxQty : effectiveStock;
                    setQuantityCount(q => q < maxStock - productCartQty ? q + 1 : q);
                  }}
                  disabled={!stockState.isPurchasable || quantityCount >= (stockState.maxQty !== undefined ? stockState.maxQty : effectiveStock) - productCartQty}
                  style={{ width: "40px", height: "100%", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", transition: "all 0.2s ease" }}
                  title="Increase quantity"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <line x1="7" y1="0" x2="7" y2="14" stroke="currentColor" strokeWidth="2"/>
                    <line x1="0" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </div>

              {/* Wishlist Button */}
              <button
                className={`pdp-btn pdp-btn--wishlist pdp-info__purchase-cell pdp-info__purchase-cell--wishlist${isInWishlist ? " is-active" : ""}`}
                onClick={handleWishlist}
                disabled={isAuthenticated && isInWishlist}
                title={isInWishlist ? "In your wishlist" : "Add to wishlist"}
                style={{ width: "46px", height: "46px", padding: "0", borderRadius: "8px", background: "#fff", color: isInWishlist ? "#de1a67" : "#9ca3af", border: "1.5px solid " + (isInWishlist ? "#fbcfe8" : "#e5e7eb"), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease", flexShrink: 0 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>
          )}

          {/* CTA Buttons Row - Bootstrap 5 Grid */}
          <div className="row g-2 pdp-product-actions-ctas">
            {stockState.isPurchasable ? (
              <>
                {isAuthenticated && productCartQty > 0 ? (
                  <>
                  <div className="col-12 pdp-info__purchase-cell pdp-info__purchase-cell--primary">
                    <Link to="/cart" style={{ width: "100%", height: "46px", background: "#111827", color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", textDecoration: "none", borderRadius: "8px", transition: "all 0.2s ease", border: "none" }} onMouseEnter={(e) => e.currentTarget.style.background = "#1f2937"} onMouseLeave={(e) => e.currentTarget.style.background = "#111827"}>
                      View Cart
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </Link>
                  </div>
                  <div className="col-12 col-sm-6 pdp-info__purchase-cell pdp-info__purchase-cell--secondary">
                    <button
                      onClick={handleBuyNow}
                      disabled={isAddingToCart || isBuyingNow || (isAuthenticated && productCartQty >= (stockState.maxQty !== undefined ? stockState.maxQty : effectiveStock))}
                      style={{ width: "100%", height: "46px", background: "#f16e35", color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", textDecoration: "none", borderRadius: "8px", transition: "all 0.2s ease", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(241,110,53,0.2)" }}
                      title="Buy this product now"
                    >
                      {isBuyingNow ? (
                        <>
                          <span style={{ display: "inline-block", width: "15px", height: "15px", border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />
                          Going to Checkout...
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                          Buy Now
                        </>
                      )}
                    </button>
                  </div>
                  </>
                ) : (
                  <>
                    <div className="col-12 col-sm-6 pdp-info__purchase-cell pdp-info__purchase-cell--primary">
                      <button
                        onClick={handleAddToCart}
                        disabled={isAddingToCart || isBuyingNow || (isAuthenticated && productCartQty >= (stockState.maxQty !== undefined ? stockState.maxQty : effectiveStock))}
                        style={{ width: "100%", height: "46px", background: "#de1a67", color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", textDecoration: "none", borderRadius: "8px", transition: "all 0.2s ease", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(222,26,103,0.2)" }}
                        title="Add this product to your cart"
                      >
                        {isAddingToCart ? (
                          <>
                            <span style={{ display: "inline-block", width: "15px", height: "15px", border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />
                            Adding...
                          </>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                            </svg>
                            Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                    <div className="col-12 col-sm-6 pdp-info__purchase-cell pdp-info__purchase-cell--secondary">
                      <button
                        onClick={handleBuyNow}
                        disabled={isAddingToCart || isBuyingNow || (isAuthenticated && productCartQty >= (stockState.maxQty !== undefined ? stockState.maxQty : effectiveStock))}
                        style={{ width: "100%", height: "46px", background: "#f16e35", color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", textDecoration: "none", borderRadius: "8px", transition: "all 0.2s ease", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(241,110,53,0.2)" }}
                        title="Buy this product now"
                      >
                        {isBuyingNow ? (
                          <>
                            <span style={{ display: "inline-block", width: "15px", height: "15px", border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />
                            Going to Checkout...
                          </>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                            Buy Now
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="col-12 pdp-info__purchase-cell pdp-info__purchase-cell--full">
                <button style={{ width: "100%", height: "46px", background: "#e5e7eb", color: "#9ca3af", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "none", cursor: "not-allowed" }}>
                  {stockState.buttonText}
                </button>
              </div>
            )}
          </div>

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </>
      )}

      <ErrorMsg field="quantity" />

      <div className="pdp-info__divider" />

      {/* ── Share ── */}
      <div className="pdp-info__share">
        <span className="pdp-info__share-label">Share:</span>
        <div className="pdp-info__share-links">
          <a
            href={facebookShareUrl}
            target="_blank" rel="noopener noreferrer" title="Facebook"
            className="pdp-share-btn pdp-share-btn--fb"
          >
            <i className="fa fa-facebook" />
          </a>
          <a
            href={twitterShareUrl}
            target="_blank" rel="noopener noreferrer" title="X / Twitter"
            className="pdp-share-btn pdp-share-btn--x"
          >
            <Icon icon="ri:twitter-x-fill" width="15" height="15" />
          </a>
          <a
            href={whatsappShareUrl}
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
        @media (max-width: 1023px) {
          .pdp-info {
            padding-left: 0;
            margin-top: 28px;
          }
        }
        @media (max-width: 767px) {
          .pdp-info {
            padding-left: 0;
            margin-top: 20px;
          }
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
          color: #fff;
          background: #de1a67;
          border-radius: 6px;
          padding: 2px 8px;
        }

        /* ── Price ── */
        .pdp-info__price-block {
          display: flex;
          align-items: baseline;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .pdp-info__price {
          font-size: 22px;
          font-weight: 800;
          color: #de1a67;
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
          color: #de1a67;
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
          outline: 2px solid #de1a67;
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
          border-color: #de1a67;
          color: #de1a67;
          background: #fdf2f5;
        }
        .pdp-chip.is-selected {
          border-color: #de1a67;
          background: #fdf2f5;
          color: #de1a67;
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
          border-color: #de1a67;
          color: #de1a67;
          background: #fdf2f5;
        }
        .pdp-size-chip.is-selected {
          border-color: #de1a67;
          background: #de1a67;
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
          gap: 18px;
          width: 100%;
        }
        .pdp-info__affiliate-btn {
          width: 100%;
        }
        .pdp-info__actions--product {
          display: grid;
          grid-template-columns: minmax(150px, 170px) minmax(0, 1fr) minmax(0, 1fr) 46px;
          align-items: center;
          column-gap: 10px;
          row-gap: 12px;
        }
        .pdp-info__actions--product .pdp-product-actions-top,
        .pdp-info__actions--product .pdp-product-actions-ctas {
          display: contents !important;
        }
        .pdp-info__actions--product .pdp-info__purchase-cell {
          min-width: 0;
          width: auto !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          flex: none !important;
        }
        .pdp-info__actions--product .pdp-info__purchase-cell--qty {
          grid-column: 1;
          grid-row: 1;
          width: 100% !important;
          max-width: none !important;
        }
        .pdp-info__actions--product .pdp-info__purchase-cell--primary {
          grid-column: 2;
          grid-row: 1;
        }
        .pdp-info__actions--product .pdp-info__purchase-cell--secondary {
          grid-column: 3;
          grid-row: 1;
        }
        .pdp-info__actions--product .pdp-info__purchase-cell--wishlist {
          grid-column: 4;
          grid-row: 1;
          justify-self: end;
          width: 46px !important;
        }
        .pdp-info__actions--product .pdp-info__purchase-cell--full {
          grid-column: 2 / 4;
          grid-row: 1;
        }
        .pdp-info__actions--product.is-discontinued .pdp-info__purchase-cell--full {
          grid-column: 1 / -1;
        }
        .pdp-info__actions--product .pdp-info__purchase-cell--qty.pdp-qty,
        .pdp-info__actions--product .pdp-info__purchase-cell .pdp-btn,
        .pdp-info__actions--product .pdp-info__purchase-cell > .pdp-btn,
        .pdp-info__actions--product .pdp-info__purchase-cell > a,
        .pdp-info__actions--product .pdp-info__purchase-cell:not(.pdp-qty) > button {
          width: 100% !important;
        }
        .pdp-info__actions--product .pdp-btn--wishlist {
          width: 46px !important;
        }
        @media (min-width: 768px) and (max-width: 991px) {
          .pdp-info__actions--product {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            column-gap: 12px;
            row-gap: 12px;
          }
          .pdp-info__actions--product .pdp-info__purchase-cell--qty {
            grid-column: 1;
            grid-row: 1;
          }
          .pdp-info__actions--product .pdp-info__purchase-cell--wishlist {
            grid-column: 2;
            grid-row: 1;
            justify-self: center;
          }
          .pdp-info__actions--product .pdp-info__purchase-cell--primary {
            grid-column: 1;
            grid-row: 2;
          }
          .pdp-info__actions--product .pdp-info__purchase-cell--secondary {
            grid-column: 2;
            grid-row: 2;
          }
          .pdp-info__actions--product .pdp-info__purchase-cell--full {
            grid-column: 1 / -1;
            grid-row: 2;
          }
        }
        @media (max-width: 767px) {
          .pdp-info__actions--product {
            grid-template-columns: minmax(0, 1fr) 46px;
            column-gap: 10px;
            row-gap: 12px;
          }
          .pdp-info__actions--product .pdp-info__purchase-cell--qty {
            grid-column: 1;
            grid-row: 1;
          }
          .pdp-info__actions--product .pdp-info__purchase-cell--wishlist {
            grid-column: 2;
            grid-row: 1;
            justify-self: end;
          }
          .pdp-info__actions--product .pdp-info__purchase-cell--primary {
            grid-column: 1 / -1;
            grid-row: 2;
          }
          .pdp-info__actions--product .pdp-info__purchase-cell--secondary {
            grid-column: 1 / -1;
            grid-row: 3;
          }
          .pdp-info__actions--product .pdp-info__purchase-cell--full {
            grid-column: 1 / -1;
            grid-row: 2;
          }
        }
        .pdp-info__actions-row {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        .pdp-info__actions-row--top {
          display: flex;
          align-items: center;
          gap: 14px;
          justify-content: flex-start;
          flex-wrap: nowrap;
        }
        .pdp-info__actions-row--top .pdp-qty {
          flex: 0 0 auto;
        }
        .pdp-info__actions-row--top .pdp-btn--wishlist {
          flex-shrink: 0;
          margin-left: auto;
        }
        .pdp-info__actions-row--bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          width: 100%;
        }
        .pdp-info__actions-row--bottom .pdp-btn {
          width: 100%;
        }
        .pdp-info__actions-row--bottom .pdp-btn--disabled {
          grid-column: 1 / -1;
          width: 100%;
        }

        @media (max-width: 767px) {
          .pdp-info__actions {
            gap: 16px;
          }
          .pdp-info__actions-row--top {
            gap: 12px;
          }
          .pdp-info__actions-row--bottom {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .pdp-info__actions-row--bottom .pdp-btn {
            width: 100%;
          }
        }

        /* ── Qty stepper ── */
        .pdp-qty {
          display: inline-flex;
          align-items: center;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
          height: 46px;
          justify-content: space-between;
          transition: all 0.2s ease;
        }
        .pdp-qty:hover {
          border-color: #d1d5db;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
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
          color: #6b7280;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex: 0 0 auto;
        }
        .pdp-qty__btn:hover:not(:disabled) {
          background: #f9fafb;
          color: #de1a67;
        }
        .pdp-qty__btn:active:not(:disabled) {
          background: #f3f4f6;
          transform: scale(0.95);
        }
        .pdp-qty__btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .pdp-qty__count {
          min-width: 50px;
          text-align: center;
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          background: #fafbfc;
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
        .pdp-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        /* Add to Cart - Deep Pink */
        .pdp-btn--primary {
          background: #de1a67;
          color: #fff;
          box-shadow: 0 4px 12px rgba(222,26,103,0.2);
          flex: 1;
          min-width: 0;
        }
        .pdp-btn--primary:hover:not(:disabled) {
          background: #c41654;
          box-shadow: 0 6px 18px rgba(222,26,103,0.3);
          transform: translateY(-2px);
        }
        .pdp-btn--primary:disabled {
          background: #e5e7eb;
          color: #9ca3af;
          box-shadow: none;
          cursor: not-allowed;
          transform: none;
        }

        /* Buy Now - Vibrant Coral/Orange */
        .pdp-btn--buy {
          background: #f16e35;
          color: #fff;
          box-shadow: 0 4px 12px rgba(241,110,53,0.2);
          flex: 1;
          min-width: 0;
        }
        .pdp-btn--buy:hover:not(:disabled) {
          background: #e05c24;
          box-shadow: 0 6px 18px rgba(241,110,53,0.3);
          transform: translateY(-2px);
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
        .pdp-btn--success:hover {
          background: #1f2937;
          color: #fff;
          transform: translateY(-2px);
        }

        .pdp-btn--disabled {
          background: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
          flex: 1;
        }

        /* Wishlist Button */
        .pdp-btn--wishlist {
          width: 46px;
          height: 46px;
          padding: 0;
          border-radius: 8px;
          background: #fff;
          color: #9ca3af;
          border: 1.5px solid #e5e7eb;
          flex-shrink: 0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pdp-btn--wishlist:hover:not(:disabled) {
          border-color: #de1a67;
          color: #de1a67;
          background: #fff;
          box-shadow: 0 4px 12px rgba(222,26,103,0.15);
          transform: scale(1.05);
        }
        .pdp-btn--wishlist:active:not(:disabled) {
          transform: scale(0.95);
        }
        .pdp-btn--wishlist.is-active {
          background: #fff5f7;
          color: #de1a67;
          border-color: #fbcfe8;
        }

        /* ── Loading spinner for buttons ── */
        @keyframes pdp-spin {
          to { transform: rotate(360deg); }
        }
        .pdp-btn-spinner {
          display: inline-block;
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: pdp-spin 0.65s linear infinite;
          flex-shrink: 0;
        }

        /* ── Share section ── */
        .pdp-info__share {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-top: 18px;
          margin-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .pdp-info__share-label {
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        .pdp-info__share-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pdp-share-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border: none;
          padding: 0;
        }
        .pdp-share-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        .pdp-share-btn:active {
          transform: scale(0.95);
        }
        .pdp-share-btn--fb { background: #1877f2; }
        .pdp-share-btn--x  { background: #1f2937; }
        .pdp-share-btn--wa { background: #25d366; }
        .pdp-btn.is-loading {
          opacity: 0.85;
          cursor: not-allowed;
          pointer-events: none;
        }

        /* ── Combo ── */
        .pdp-combo {
          margin-bottom: 22px;
          border: 1px solid #de1a67;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(222,26,103,0.08);
        }
        .pdp-combo__header {
          background: #de1a67;
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
          background: #de1a67;
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
        .pdp-combo__item-price { font-size: 12px; color: #de1a67; font-weight: 600; }

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