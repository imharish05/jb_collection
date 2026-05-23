import PropTypes from "prop-types";
import React, { Fragment, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addToWishlistService, addToCartService } from "../../store/services";
import { useDispatch, useSelector } from "react-redux";
import { getProductCartQuantity } from "../../helpers/product";
import Rating from "./sub-components/ProductRating";
import cogoToast from "cogo-toast";
import { Icon } from "@iconify/react";

// ─── helpers ──────────────────────────────────────────────────────────────────

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

// color name → CSS hex
const COLOR_MAP = {
  // Red family
  red: "#e53935", crimson: "#c62828", maroon: "#800000",
  scarlet: "#FF2400", ruby: "#9B111E", cherry: "#DE3163", carmine: "#960018",
  orange: "#fb8c00", coral: "#ff7043", tangerine: "#F28500",
  "burnt orrgba(141, 131, 118, 1)": "#CC5500", peach: "#FFCBA4", salmon: "#FA8072", apricot: "#FBCEB1",
  yellow: "#fdd835", gold: "#ffc107", amber: "#ffb300",
  lemon: "#FFF44F", canary: "#FFEF00", saffron: "#F4C430", khaki: "#C3B091",
  green: "#43a047", olive: "#827717", lime: "#cddc39",
  emerald: "#50C878", forest: "#228B22", sage: "#BCB88A", mint: "#98FF98",
  moss: "#8A9A5B", chartreuse: "#7FFF00", jade: "#00A36C",
  teal: "#00897b", cyan: "#00bcd4", turquoise: "#26c6da",
  aquamarine: "#7FFFD4", seafoam: "#93E9BE", viridian: "#40826D",
  blue: "#1e88e5", navy: "#1a237e", skyblue: "#29b6f6", "sky blue": "#29b6f6",
  cobalt: "#0047AB", cerulean: "#007BA7", denim: "#1560BD", "royal blue": "#4169E1",
  "steel blue": "#4682B4", "powder blue": "#B0E0E6", "baby blue": "#89CFF0",
  "midnight blue": "#191970", periwinkle: "#CCCCFF",
  indigo: "#3949ab", purple: "#7b1fa2", violet: "#6a1b9a", lavender: "#b39ddb",
  magenta: "#8e24aa", lilac: "#C8A2C8", plum: "#DDA0DD",
  amethyst: "#9966CC", orchid: "#DA70D6", byzantium: "#702963",
  pink: "#e91e63", rose: "#f48fb1", blush: "#DE5D83", "hot pink": "#FF69B4",
  fuchsia: "#FF00FF", flamingo: "#FC8EAC", "rose gold": "#b76e79",
  bubblegum: "#FFC1CC", carnation: "#FF7BA9",
  white: "#ffffff", ivory: "#fffff0", cream: "#fffde7",
  "off-white": "#FAF9F6", snow: "#FFFAFA", silver: "#bdbdbd",
  grey: "#757575", gray: "#757575", charcoal: "#424242",
  black: "#212121", jet: "#343434", onyx: "#353839", ash: "#B2BEB5",
  brown: "#795548", tan: "#a1887f", beige: "#f5f5dc",
  sienna: "#A0522D", mahogany: "#C04000", chestnut: "#954535",
  coffee: "#6F4E37", caramel: "#C68642", umber: "#635147",
  walnut: "#773F1A", hazel: "#8E7618", bronze: "#CD7F32",
  multicolour: "linear-gradient(135deg,#f06,#0cf,#fc0)",
};
const LIGHT_COLORS = new Set(["white", "ivory", "cream", "yellow", "lime", "gold", "amber", "silver", "bronze"]);

function toHex(name) {
  if (!name) return null;
  const l = name.trim().toLowerCase();
  if (l.startsWith("#")) return l;
  return COLOR_MAP[l] || null;
}

// Canonical key normalisation so "Colour"/"Color" both → "Colour"
const KEY_ALIASES = { color: "Colour", colour: "Colour", size: "Size", material: "Material", finish: "Finish", capacity: "Capacity" };
function normalKey(k) { return KEY_ALIASES[k?.toLowerCase()] || k; }

// DISPLAY ORDER for attribute sections
const KEY_ORDER = ["Colour", "Size", "Material", "Finish", "Capacity"];

// ─── core logic: build grouped option map from all variants ──────────────────
// Returns: { [key]: Set<value> }  — all values that exist across variants
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

// Given current selections (partial), find which values are COMPATIBLE for a given key.
// A value is compatible if there exists at least one variant that matches all OTHER
// currently-selected keys AND this value for the given key.
function compatibleValues(variants, selections, targetKey) {
  const compatible = new Set();
  variants.forEach(v => {
    const attrs = {};
    safeAttrs(v.attributes)
      .filter(a => a.key && a.value && a.key !== "Custom Note")
      .forEach(a => {
        const k = normalKey(a.key);
        if (!attrs[k]) attrs[k] = [];
        attrs[k].push(a.value);
      });

    // Check all OTHER selected keys match this variant
    const othersMatch = Object.entries(selections).every(([k, val]) => {
      if (k === targetKey || !val) return true;
      return attrs[k] && attrs[k].includes(val);
    });
    if (othersMatch && attrs[targetKey]) {
      attrs[targetKey].forEach(val => compatible.add(val));
    }
  });
  return compatible;
}

// Find the best matching variant given current selections
function findMatchingVariant(variants, selections) {
  const entries = Object.entries(selections).filter(([, v]) => v);
  if (!entries.length) return variants[0] || null;

  // Exact match first
  const exact = variants.find(v => {
    const attrs = {};
    safeAttrs(v.attributes)
      .filter(a => a.key && a.value)
      .forEach(a => {
        const k = normalKey(a.key);
        if (!attrs[k]) attrs[k] = [];
        attrs[k].push(a.value);
      });
    return entries.every(([k, val]) => attrs[k] && attrs[k].includes(val));
  });
  if (exact) return exact;

  // Best partial match (most keys matched)
  let best = null, bestScore = -1;
  variants.forEach(v => {
    const attrs = {};
    safeAttrs(v.attributes)
      .filter(a => a.key && a.value)
      .forEach(a => {
        const k = normalKey(a.key);
        if (!attrs[k]) attrs[k] = [];
        attrs[k].push(a.value);
      });
    const score = entries.filter(([k, val]) => attrs[k] && attrs[k].includes(val)).length;
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  });
  return best;
}

// ─── styles ───────────────────────────────────────────────────────────────────
const ORANGE = "#F15A24";
const ORANGE_LIGHT = "#FEF0EB";

// ─── Custom Note display ──────────────────────────────────────────────────────
function CustomNoteSection({ variant }) {
  const attrs = safeAttrs(variant.attributes).filter(a => a.key === "Custom Note");
  if (!attrs.length) return null;
  return (
    <div style={{ marginTop: 14, padding: "10px 14px", background: "#FEF9F0", border: "1px solid #F8D9B8", borderRadius: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#8B5E1A", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        ✏️ Customisation Info
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {attrs.flatMap((attr, i) =>
          attr.value.split(",").map(p => p.trim()).filter(Boolean).map((part, j) => {
            const ci = part.indexOf(":");
            if (ci > -1) {
              const k = part.slice(0, ci).trim();
              const val = part.slice(ci + 1).trim();
              return (
                <span key={`${i}-${j}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, padding: "3px 10px", borderRadius: 5, background: "#fff", border: "1px solid #F0C080", color: "#5C3D0E", fontWeight: 500 }}>
                  <span style={{ color: "#C57D20", fontWeight: 700 }}>{k}:</span>{val}
                </span>
              );
            }
            return <span key={`${i}-${j}`} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 5, background: "#fff", border: "1px solid #F0C080", color: "#5C3D0E" }}>{part}</span>;
          })
        )}
      </div>
    </div>
  );
}

// ─── Single attribute group (one row: label + swatches/chips) ─────────────────
function AttributeGroup({ attrKey, allValues, selectedValue, compatibleSet, onSelect }) {
  const isColour = /colou?r/i.test(attrKey);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {attrKey}
        </span>
        {selectedValue && (
          <span style={{ fontSize: 12, color: ORANGE, fontWeight: 600 }}>— {selectedValue}</span>
        )}
      </div>

      {/* Swatches / chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: isColour ? 10 : 8 }}>
        {[...allValues].map(val => {
          const isSelected = selectedValue === val;
          const isDisabled = !compatibleSet.has(val);
          const hex = isColour ? toHex(val) : null;
          const isLight = LIGHT_COLORS.has(val.toLowerCase());

          if (isColour && hex) {
            // ── Color swatch circle ──────────────────────────────────────────
            return (
              <button
                key={val}
                title={val}
                disabled={isDisabled}
                onClick={() => onSelect(isSelected ? null : val)}
                style={{
                  position: "relative",
                  width: 34, height: 34, borderRadius: "50%",
                  background: hex,
                  border: isSelected
                    ? `3px solid ${ORANGE}`
                    : isLight ? "2px solid #ccc" : "2px solid transparent",
                  boxShadow: isSelected
                    ? `0 0 0 2px ${ORANGE_LIGHT}, 0 0 0 4px ${ORANGE}`
                    : "0 1px 4px rgba(0,0,0,0.18)",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  opacity: isDisabled ? 0.35 : 1,
                  transition: "box-shadow 0.15s, border 0.15s",
                  flexShrink: 0,
                  padding: 0,
                  overflow: "hidden",
                }}
              >
                {/* diagonal strikethrough for disabled */}
                {isDisabled && (
                  <span style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.25) 4px,rgba(0,0,0,0.25) 5px)",
                  }} />
                )}
                {/* checkmark for selected */}
                {isSelected && (
                  <span style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    color: isLight ? "#333" : "#fff", fontSize: 14, fontWeight: 900,
                  }}>✓</span>
                )}
              </button>
            );
          }

          // ── Text chip ────────────────────────────────────────────────────────
          return (
            <button
              key={val}
              disabled={isDisabled}
              onClick={() => onSelect(isSelected ? null : val)}
              style={{
                position: "relative",
                padding: "6px 14px",
                border: `2px solid ${isSelected ? ORANGE : isDisabled ? "#e5e7eb" : "#d1d5db"}`,
                borderRadius: 6,
                background: isSelected ? ORANGE_LIGHT : isDisabled ? "#f9fafb" : "#fff",
                color: isSelected ? ORANGE : isDisabled ? "#c0c4cc" : "#374151",
                fontWeight: isSelected ? 700 : 400,
                fontSize: 13,
                cursor: isDisabled ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                fontFamily: "inherit",
                letterSpacing: "0.01em",
                overflow: "hidden",
              }}
            >
              {/* strikethrough line for disabled */}
              {isDisabled && (
                <span style={{
                  position: "absolute", left: "50%", top: "50%",
                  transform: "translate(-50%,-50%) rotate(-15deg)",
                  width: "110%", height: 1,
                  background: "#d1d5db", pointerEvents: "none",
                }} />
              )}
              {val}
            </button>
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
  cartItems,
  wishlistItems,         // all wishlist items for this product (filtered by productId)
  onVariantImageChange,   // callback → parent lifts image for gallery
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const currencySymbol = currency?.currencySymbol || "₹";
  const hasNewVar = hasBackendVariants(product);
  const hasOldVar = !hasNewVar && hasOldVariation(product);

  // ── Backend variants: grouped attribute selection ──────────────────────────
  const optionMap = useMemo(() => hasNewVar ? buildOptionMap(product.Variants) : {}, [product]);

  // ordered keys present in this product
  const attrKeys = useMemo(() => {
    const present = Object.keys(optionMap);
    const ordered = KEY_ORDER.filter(k => present.includes(k));
    const rest = present.filter(k => !KEY_ORDER.includes(k));
    return [...ordered, ...rest];
  }, [optionMap]);

  // selections: { Colour: "Red", Size: "M", ... }
  const [selections, setSelections] = useState(() => {
    if (!hasNewVar || !product.Variants.length) return {};
    // Default to first variant's attributes
    const first = product.Variants[0];
    return Object.fromEntries(
      safeAttrs(first.attributes)
        .filter(a => a.key && a.value && a.key !== "Custom Note")
        .map(a => [normalKey(a.key), a.value])
    );
  });

  const selectedVariant = useMemo(
    () => hasNewVar ? findMatchingVariant(product.Variants, selections) : null,
    [selections, product.Variants, hasNewVar]
  );

  // ── Custom-note-only variant (no selectable attrs) ─────────────────────────
  const customNoteVariant = useMemo(() =>
    hasNewVar
      ? product.Variants.find(v =>
          safeAttrs(v.attributes).every(a => a.key === "Custom Note")
        )
      : null,
  [product.Variants, hasNewVar]);

  const handleSelect = (key, value) => {
    const next = { ...selections, [key]: value };
    if (!value) delete next[key];
    setSelections(next);
    setErrors(prev => ({ ...prev, variant: '' }));

    // if the new variant has its own image, tell the gallery
    if (onVariantImageChange) {
      const v = findMatchingVariant(product.Variants, next);
      onVariantImageChange(v?.image || null);
    }
  };

  // ── Old variation ──────────────────────────────────────────────────────────
  const [selectedProductColor, setSelectedProductColor] = useState(hasOldVar ? product.variation[0].color : "");
  const [selectedProductSize, setSelectedProductSize] = useState(hasOldVar ? product.variation[0].size[0].name : "");
  const [productStock, setProductStock] = useState(hasOldVar ? product.variation[0].size[0].stock : product.stock ?? 10);
  const [quantityCount, setQuantityCount] = useState(1);
  const [errors, setErrors] = useState({});

  const effectiveStock = selectedVariant
    ? Number(selectedVariant.stock ?? 0)
    : productStock;

  // For backend variants: qty in cart for this specific variant
  // For old variations: use helper
  const productCartQty = useMemo(() => {
    if (hasNewVar && selectedVariant) {
      // Number() normalises both sides — cart item selectedVariantId may be
      // string or integer depending on API serialization; Variant.id is INTEGER.
      const match = cartItems?.find(
        item =>
          item.id === product.id &&
          Number(item.selectedVariantId) === Number(selectedVariant.id)
      );
      return match ? match.quantity : 0;
    }
    return getProductCartQuantity(cartItems, product, selectedProductColor, selectedProductSize);
  }, [cartItems, product, selectedVariant, hasNewVar, selectedProductColor, selectedProductSize]);

  const redirectToLogin = () => {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    navigate(`${process.env.PUBLIC_URL}/login?redirect=${redirect}`);
  };

  const ErrorMsg = ({ field }) => errors[field] ? (
    <div style={{ color: '#dc2626', fontSize: 12, fontWeight: 600, marginTop: 6 }}>
      {errors[field]}
    </div>
  ) : null;

  const validateCart = () => {
    const next = {};

    if (hasNewVar) {
      // Find variants compatible with current (possibly partial) selections
      const compatibleVariants = product.Variants.filter(v => {
        const attrs = {};
        safeAttrs(v.attributes)
          .filter(a => a.key && a.value && a.key !== "Custom Note")
          .forEach(a => {
            const k = normalKey(a.key);
            if (!attrs[k]) attrs[k] = [];
            attrs[k].push(a.value);
          });
        return Object.entries(selections).every(([k, val]) => {
          if (!val) return true;
          return attrs[k] && attrs[k].includes(val);
        });
      });

      // Only require keys that actually exist in compatible variants
      const requiredKeys = new Set();
      compatibleVariants.forEach(v => {
        safeAttrs(v.attributes)
          .filter(a => a.key && a.value && a.key !== "Custom Note")
          .forEach(a => requiredKeys.add(normalKey(a.key)));
      });

      const missing = [...requiredKeys].filter(key => !selections[key]);
      if (missing.length > 0) {
        next.variant = `Please select: ${missing.join(', ')}`;
      } else if (!selectedVariant) {
        next.variant = 'Please select a valid variant';
      }
    }

    if (!quantityCount || quantityCount < 1) next.quantity = 'Please select at least 1 quantity';
    if (effectiveStock <= 0) next.quantity = 'This product is out of stock';
    if (quantityCount + productCartQty > effectiveStock) next.quantity = 'Selected quantity exceeds available stock';

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

    // Extract color & size from selected variant's attributes for server dedup
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
      ...product,
      selectedVariantId: selectedVariant?.id || null,
      selectedVariantName: selectedVariant?.variantName || null,
      selectedProductColor: variantColor,
      selectedProductSize: variantSize,
      price: selectedVariant ? parseFloat(selectedVariant.salesPrice) : (product.price || 0),
      quantity: quantityCount,
    });
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      cogoToast.warn("Please login to save to wishlist", { position: "top-center" });
      redirectToLogin();
      return;
    }
    // Pass the currently selected variant id so the wishlist entry is variant-specific
    addToWishlistService(product, selectedVariant?.id ?? null);
  };

  // Find if this specific variant (or product if no variants) is already in wishlist
  const wishlistItems_ = Array.isArray(wishlistItems) ? wishlistItems : (wishlistItems ? [wishlistItems] : []);
  const wishlistItem = wishlistItems_.find(item => {
    const a = item.selectedVariantId != null ? Number(item.selectedVariantId) : null;
    const b = selectedVariant?.id != null ? Number(selectedVariant.id) : null;
    return a === b;
  });
  const isInWishlist = wishlistItem !== undefined;

  return (
    <div className="product-details-content ml-70">
      <h2>{product.name}</h2>

      {/* ── Price ── */}
      <div className="product-details-price">
        {selectedVariant ? (
          <Fragment>
            <span>{currencySymbol}{parseFloat(selectedVariant.salesPrice).toFixed(2)}</span>
            {Number(selectedVariant.mrp) > Number(selectedVariant.salesPrice) && (
              <>{" "}<span className="old">{currencySymbol}{parseFloat(selectedVariant.mrp).toFixed(2)}</span></>
            )}
          </Fragment>
        ) : discountedPrice !== null ? (
          <Fragment>
            <span>{currencySymbol}{finalDiscountedPrice}</span>{" "}
            <span className="old">{currencySymbol}{finalProductPrice}</span>
          </Fragment>
        ) : (
          <span>{currencySymbol}{finalProductPrice}</span>
        )}
      </div>

      {/* ── Rating ── */}
      {product.rating > 0 && (
        <div className="pro-details-rating-wrap">
          <div className="pro-details-rating"><Rating ratingValue={product.rating} /></div>
        </div>
      )}

      <div className="pro-details-list">
        <p>{product.shortDescription}</p>
      </div>

      {/* ══════════════ BACKEND VARIANT SELECTOR ══════════════ */}
      {hasNewVar && (
        <div style={{ marginBottom: 20 }}>
          {attrKeys.map(key => {
            const allValues = optionMap[key];
            const compatible = compatibleValues(product.Variants, selections, key);
            return (
              <AttributeGroup
                key={key}
                attrKey={key}
                allValues={allValues}
                selectedValue={selections[key] || null}
                compatibleSet={compatible}
                onSelect={(val) => handleSelect(key, val)}
              />
            );
          })}

          {/* Stock indicator */}
          {selectedVariant && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, marginTop: -4 }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: effectiveStock > 0 ? "#16a34a" : "#dc2626",
              }} />
              <span style={{ fontSize: 13, color: effectiveStock > 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                {effectiveStock > 0 ? `In Stock` : "Out of Stock"}
              </span>
            </div>
          )}

          {/* Discount badge */}
          {selectedVariant && Number(selectedVariant.mrp) > Number(selectedVariant.salesPrice) && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ display: "inline-block", padding: "2px 10px", background: "#dcfce7", color: "#15803d", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                {Math.round((1 - selectedVariant.salesPrice / selectedVariant.mrp) * 100)}% OFF
              </span>
            </div>
          )}

          {/* Custom Note section — from selected variant */}
          {selectedVariant && <CustomNoteSection variant={selectedVariant} />}

          {/* Custom Note section — from standalone custom-note-only variant */}
          {customNoteVariant && customNoteVariant !== selectedVariant && (
            <CustomNoteSection variant={customNoteVariant} />
          )}
          <ErrorMsg field="variant" />
        </div>
      )}

      {/* ══════════════ OLD VARIATION SELECTOR ══════════════ */}
      {hasOldVar && (
        <div className="pro-details-size-color">
          <div className="pro-details-color-wrap">
            <span>Color</span>
            <div className="pro-details-color-content">
              {product.variation.map((single, key) => (
                <label className={`pro-details-color-content--single ${single.color}`} key={key}>
                  <input type="radio" value={single.color} name="product-color"
                    checked={single.color === selectedProductColor}
                    onChange={() => { setSelectedProductColor(single.color); setSelectedProductSize(single.size[0].name); setProductStock(single.size[0].stock); setQuantityCount(1); }}
                  />
                  <span className="checkmark" />
                </label>
              ))}
            </div>
          </div>
          <div className="pro-details-size">
            <span>Size</span>
            <div className="pro-details-size-content">
              {product.variation.map(single =>
                single.color === selectedProductColor
                  ? single.size.map((singleSize, key) => (
                    <label className="pro-details-size-content--single" key={key}>
                      <input type="radio" value={singleSize.name}
                        checked={singleSize.name === selectedProductSize}
                        onChange={() => { setSelectedProductSize(singleSize.name); setProductStock(singleSize.stock); setQuantityCount(1); }}
                      />
                      <span className="size-name">{singleSize.name}</span>
                    </label>
                  ))
                  : null
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add to cart ── */}
      {product.affiliateLink ? (
        <div className="pro-details-quality">
          <div className="pro-details-cart btn-hover ml-0">
            <a href={product.affiliateLink} rel="noopener noreferrer" target="_blank">Buy Now</a>
          </div>
        </div>
      ) : (
        <div className="pro-details-quality">
          <div className="cart-plus-minus">
            <button onClick={() => setQuantityCount(q => Math.max(1, q - 1))} className="dec qtybutton">-</button>
            <input className="cart-plus-minus-box" type="text" value={quantityCount} readOnly />
            <button onClick={() => setQuantityCount(q => q < effectiveStock - productCartQty ? q + 1 : q)} className="inc qtybutton">+</button>
          </div>
          <div className="pro-details-cart btn-hover">
            {effectiveStock > 0 ? (() => {
              const inCart = isAuthenticated && productCartQty > 0;
              return (
                <button
                  onClick={handleAddToCart}
                  disabled={inCart || (isAuthenticated && productCartQty >= effectiveStock)}
                  style={inCart ? { background: "#22c55e", cursor: "not-allowed" } : {}}
                >
                  {inCart ? "In Cart ✓" : "Add To Cart"}
                </button>
              );
            })() : (
              <button disabled>Out of Stock</button>
            )}
          </div>
          <ErrorMsg field="quantity" />
          <div className="pro-details-wishlist">
            <button
              className={isInWishlist ? "active" : ""}
              disabled={isAuthenticated && isInWishlist}
              title={isInWishlist ? "Added to wishlist" : "Add to wishlist"}
              onClick={handleWishlist}
            >
              <i className="pe-7s-like" />
            </button>
          </div>
        </div>
      )}

      {/* ── Category meta ── */}
      {/* {product.category?.length > 0 && (
        <div className="pro-details-meta">
          <span>Categories :</span>
          <ul>
            {product.Category ? (
              <li><Link to={process.env.PUBLIC_URL + "/shop"}>{product.Category.name || product.Category.label}</Link></li>
            ) : (
              product.category.map((single, key) => (
                <li key={key}><Link to={process.env.PUBLIC_URL + "/shop"}>{single}</Link></li>
              ))
            )}
          </ul>
        </div>
      )} */}

      {/* ── Tags meta ── */}
      {/* {product.tag?.length > 0 && (
        <div className="pro-details-meta">
          <span>Tags :</span>
          <ul>
            {product.tag.map((single, key) => (
              <li key={key}><Link to={process.env.PUBLIC_URL + "/shop"}>{single}</Link></li>
            ))}
          </ul>
        </div>
      )} */}

      <div className="pro-details-social">
        <div className="pro-details-social">
          <ul>
            <li>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank" rel="noopener noreferrer"
                title="Share on Facebook"
              >
                <i className="fa fa-facebook" />
              </a>
            </li>
<li>
  <a
    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `${product.name} ${window.location.href}`
    )}`}
    target="_blank"
    rel="noopener noreferrer"
    title="Share on X"
  >
    <Icon icon="ri:twitter-x-fill" width="18" height="18" />
  </a>
</li>
            {/* <li>
              <a
                href={`https://www.instagram.com/`}
                target="_blank" rel="noopener noreferrer"
                title="Open Instagram"
              >
                <i className="fa fa-instagram" />
              </a>
            </li> */}
            <li>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(product.name + " " + window.location.href)}`}
                target="_blank" rel="noopener noreferrer"
                title="Share on WhatsApp"
              >
                <i className="fa fa-whatsapp" />
              </a>
            </li>
          </ul>
        </div>
      </div>
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