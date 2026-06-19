// Client/src/pages/combo/ComboDetailPage.jsx
// Matches /product/:id layout: ProductImageGallerySideThumb on left, info panel on right.
// Fixed combos: show products list + add-to-cart.
// Mix & Match: product picker grid + selected tray + progress bar.

import React, { Fragment, useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import ProductDescriptionTab from "../../wrappers/product/ProductDescriptionTab";
import { getImgUrl } from "../../helpers/imageUrl";
import { fetchComboById, addComboToCart } from "../../store/services/comboService";
import {
  addMixMatchItem, removeMixMatchItem, clearMixMatch,
} from "../../store/slices/combo-slice";
import { addToCart, addToCartSilent, replaceCart } from "../../store/slices/cart-slice";
import api from "../../api/axios";
import cogoToast from "cogo-toast";
import ProductImageGallerySideThumb from "../../components/product/ProductImageGallerySideThumb";
import { isColourKey, isHexColor } from "../../helpers/product"; // Add this import

// ── helpers ───────────────────────────────────────────────────────────────────

function parseProductImages(image) {
  if (Array.isArray(image)) return image;
  if (typeof image === "string") {
    try {
      const parsed = JSON.parse(image);
      return Array.isArray(parsed) ? parsed : [image];
    } catch {
      return [image];
    }
  }
  return [];
}

function getProductImg(p) {
  // Prefer first variant image (if variants exist and variant has image)
  if (Array.isArray(p?.Variants) && p.Variants.length > 0) {
    const firstVariantImg = p.Variants[0]?.image;
    if (firstVariantImg) return getImgUrl(firstVariantImg);
  }
  // Fall back to product image array[0]
  const imgs = parseProductImages(p?.image);
  const img = imgs[0];
  return img ? getImgUrl(img) : null;
}

function getVariantPrice(p) {
  const v = Array.isArray(p?.Variants) && p.Variants.length > 0 ? p.Variants[0] : null;
  return v
    ? { sales: parseFloat(v.salesPrice || 0), mrp: parseFloat(v.mrp || 0), variantId: v.id }
    : { sales: parseFloat(p?.price || 0), mrp: parseFloat(p?.price || 0), variantId: null };
}

function isLowStock(cp) {
  const v = cp.variant
    || (cp.variantId && Array.isArray(cp.product?.Variants)
      ? cp.product.Variants.find(x => String(x.id) === String(cp.variantId))
      : null);
  const stock = v ? v.stock : cp.product?.stock ?? 0;
  return Number(stock) <= 3 && Number(stock) > 0;
}

function isOutOfStock(cp) {
  const v = cp.variant
    || (cp.variantId && Array.isArray(cp.product?.Variants)
      ? cp.product.Variants.find(x => String(x.id) === String(cp.variantId))
      : null);
  const stock = v ? v.stock : cp.product?.stock ?? 0;
  return Number(stock) === 0;
}

// ── Variant display component (matches cart/checkout) ──────────────────────
const VariantChips = ({ attrs, fontSize = 10, swatchSize = 12 }) => {
  if (!attrs || attrs.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {attrs.map((a, i) => {
        const isCol = isColourKey(a.key);
        const hasPreview = isCol && isHexColor(a.val);
        const displayVal = hasPreview ? a.val.toUpperCase() : a.val;
        return (
          <span
            key={i}
            style={{
              fontSize,
              color: "#555",
              background: "#f5f5f7",
              border: "1px solid #e8e8e8",
              borderRadius: 5,
              padding: "2px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontWeight: 500,
            }}
          >
            <span>{a.key}:</span>
            {hasPreview ? (
              <span
                style={{
                  width: swatchSize,
                  height: swatchSize,
                  borderRadius: "50%",
                  border: "1px solid #dcdcdc",
                  backgroundColor: displayVal,
                  display: "inline-block",
                  flexShrink: 0,
                }}
                title={displayVal}
              />
            ) : (
              <span>{displayVal}</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

// ── Helper to get variant attributes (matches cart/checkout) ──────────────
const getVariantAttributes = (variant) => {
  if (!variant) return [];
  
  // If variant has attributes array
  if (Array.isArray(variant.attributes) && variant.attributes.length > 0) {
    return variant.attributes.filter(a => a.key && a.value).map(a => ({ key: a.key, val: a.value }));
  }
  
  // If variant has variantName with colon format
  if (variant.variantName && variant.variantName.includes(":")) {
    const seen = new Set();
    return variant.variantName.split("·").map(part => {
      const [k, ...rest] = part.split(":").map(s => s.trim());
      return { key: k, val: rest.join(":").trim() };
    }).filter(a => {
      if (!a.key || !a.val) return false;
      const k = a.key.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  
  // If variant has single name
  if (variant.variantName) {
    return [{ key: "Variant", val: variant.variantName }];
  }
  
  return [];
};

// ── Fixed combo: included products list
// Both desktop & mobile: native horizontal scroll, no arrows, equal-height cards
function FixedProductsList({ comboProducts }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A3A6B", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Included Products
      </div>

      <div className="fpl-scroll-track">
        {comboProducts.map(cp => (
          <div key={cp.id} className="fpl-card-wrap">
            <FixedProductCard cp={cp} />
          </div>
        ))}
      </div>

      <style>{`
        .fpl-scroll-track {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding: 2px 2px 8px;
          align-items: stretch;
        }
        .fpl-scroll-track::-webkit-scrollbar { display: none; }
        .fpl-card-wrap {
          flex: 0 0 calc(25% - 6px);
          min-width: 140px;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 767px) {
          .fpl-card-wrap {
            flex: 0 0 calc(50% - 4px);
            min-width: 130px;
          }
        }
        .fpl-card-wrap > div {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .fpl-card-wrap > div > div:last-child {
          flex: 1;
        }
      `}</style>
    </div>
  );
}

function FixedProductCard({ cp }) {
  const prod = cp.product;
  const variant = cp.variant
    || (cp.variantId && Array.isArray(prod?.Variants)
      ? prod.Variants.find(v => String(v.id) === String(cp.variantId)) || null
      : null);
  const img = getProductImg(prod);
  const low = isLowStock(cp);
  const oos = isOutOfStock(cp);
  const qty = cp.quantity || 1;
  
  // Get variant attributes for display
  const variantAttrs = variant ? getVariantAttributes(variant) : [];
  
  return (
    <div style={{
      border: `2px solid ${oos ? "#fecaca" : "#E5E7EB"}`,
      borderRadius: 10, overflow: "hidden",
      background: oos ? "#fef9f9" : "#fff",
      opacity: oos ? 0.75 : 1, position: "relative",
    }}>
      {qty > 1 && (
        <div style={{
          position: "absolute", top: 6, left: 6,
          minWidth: 20, height: 20, borderRadius: 10,
          background: "#1A3A6B", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, zIndex: 1, padding: "0 5px",
        }}>×{qty}</div>
      )}
      <div style={{ paddingTop: "75%", position: "relative", background: "#F9FAFB", overflow: "hidden" }}>
        {img
          ? <img src={img} alt={prod?.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#e5e7eb" }}>🎁</div>
        }
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E", lineHeight: 1.3, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {prod?.name}
        </div>
        {/* Display variant attributes like cart/checkout */}
        {variantAttrs.length > 0 && (
          <div style={{ marginTop: 2 }}>
            <VariantChips attrs={variantAttrs} fontSize={9} swatchSize={10} />
          </div>
        )}
        {oos && <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 600, marginTop: 2 }}>Out of stock</div>}
        {low && !oos && <div style={{ fontSize: 10, color: "#b45309", fontWeight: 600, marginTop: 2 }}>Only {cp.variant?.stock ?? cp.product?.stock} left</div>}
      </div>
    </div>
  );
}

// ── Shared drag/swipe slider — no arrows, 4 visible on desktop, 2 on mobile ──
function ProductSlider({ items, renderCard }) {
  const trackRef = React.useRef(null);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  // Use refs so drag state never triggers a re-render that blocks click events
  const dragStart = React.useRef(null);
  const offsetAtDragStart = React.useRef(0);
  const hasMoved = React.useRef(false); // true only after threshold movement

  // Determine visible count via CSS media query match
  const [visibleCount, setVisibleCount] = useState(
    typeof window !== "undefined" && window.innerWidth < 768 ? 2 : 4
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setVisibleCount(e.matches ? 2 : 4);
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const gap = 8;
  const itemWidthPct = (100 - gap * (visibleCount - 1) / visibleCount) / visibleCount;
  const maxOffset = Math.max(0, items.length - visibleCount);

  const clampOffset = (val) => Math.max(0, Math.min(maxOffset, val));

  const getStepPx = () => {
    if (!trackRef.current) return 0;
    return (trackRef.current.offsetWidth + gap) / visibleCount;
  };

  // ── Mouse drag ──
  const onMouseDown = (e) => {
    dragStart.current = e.clientX;
    offsetAtDragStart.current = offset;
    hasMoved.current = false;       // reset on every press
  };
  const onMouseMove = (e) => {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current;
    // Only start a real drag after 5 px of movement so simple clicks pass through
    if (!hasMoved.current && Math.abs(dx) < 5) return;
    if (!hasMoved.current) {
      hasMoved.current = true;
      setIsDragging(true);
    }
    const step = getStepPx();
    if (step === 0) return;
    setOffset(clampOffset(offsetAtDragStart.current - dx / step));
  };
  const onMouseUp = (e) => {
    if (!hasMoved.current) {
      // It was a plain click — don't interfere
      dragStart.current = null;
      return;
    }
    setIsDragging(false);
    hasMoved.current = false;
    const dx = e.clientX - dragStart.current;
    const step = getStepPx();
    setOffset(clampOffset(Math.round(offsetAtDragStart.current - dx / step)));
    dragStart.current = null;
  };

  // ── Touch drag ──
  const onTouchStart = (e) => {
    dragStart.current = e.touches[0].clientX;
    offsetAtDragStart.current = offset;
    hasMoved.current = false;
  };
  const onTouchMove = (e) => {
    if (dragStart.current === null) return;
    const dx = e.touches[0].clientX - dragStart.current;
    if (!hasMoved.current && Math.abs(dx) < 5) return;
    hasMoved.current = true;
    const step = getStepPx();
    if (step === 0) return;
    setOffset(clampOffset(offsetAtDragStart.current - dx / step));
  };
  const onTouchEnd = (e) => {
    if (!hasMoved.current) { dragStart.current = null; return; }
    const dx = e.changedTouches[0].clientX - dragStart.current;
    const step = getStepPx();
    setOffset(clampOffset(Math.round(offsetAtDragStart.current - dx / step)));
    hasMoved.current = false;
    dragStart.current = null;
  };

  const translatePct = offset * (itemWidthPct + gap / visibleCount);
  const dotCount = Math.max(0, items.length - visibleCount + 1);
  const dotIdx = Math.round(offset);

  return (
    <div style={{ paddingBottom: dotCount > 1 ? 28 : 0 }}>
      {/* track */}
      <div
        style={{ overflow: "hidden", cursor: isDragging ? "grabbing" : "grab", userSelect: "none" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={trackRef}
          style={{
            display: "flex",
            gap: `${gap}px`,
            transform: `translateX(calc(-${translatePct}% - ${offset * gap}px))`,
            transition: isDragging ? "none" : "transform 0.3s ease",
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                flex: `0 0 calc(${100 / visibleCount}% - ${gap * (visibleCount - 1) / visibleCount}px)`,
                minWidth: 0,
                // Only block pointer events during an actual drag (not on every mousedown)
                pointerEvents: isDragging ? "none" : "auto",
              }}
            >
              {renderCard(item)}
            </div>
          ))}
        </div>
      </div>

      {/* dot indicators */}
      {dotCount > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 12 }}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setOffset(i)}
              style={{
                width: i === dotIdx ? 16 : 6, height: 6, borderRadius: 3,
                background: i === dotIdx ? "#F15A24" : "#D1D5DB",
                border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Mix & Match product grid card ─────────────────────────────────────────────
function MixMatchCard({ cp, selected, onToggle }) {
  const prod = cp.product;
  const img  = getProductImg(prod);
  
  // Get the variant for THIS combo product entry (not just the first variant)
  const variant = cp.variant
    || (cp.variantId && Array.isArray(prod?.Variants)
      ? prod.Variants.find(v => String(v.id) === String(cp.variantId))
      : null);
  
  const variantId = cp.variantId || null;
  const oos = isOutOfStock(cp);
  
  // Get variant attributes for display
  const variantAttrs = variant ? getVariantAttributes(variant) : [];

  return (
    <div
      onClick={() => !oos && onToggle(cp, variantId)}
      style={{
        border: `2px solid ${selected ? "#F15A24" : "#E5E7EB"}`,
        borderRadius: 10, overflow: "hidden", cursor: oos ? "not-allowed" : "pointer",
        background: selected ? "#FEF0EB" : "#fff",
        opacity: oos ? 0.5 : 1,
        transition: "border-color 0.15s, background 0.15s",
        position: "relative",
      }}
    >
      {selected && (
        <div style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%", background: "#F15A24", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, zIndex: 1 }}>✓</div>
      )}
      <div style={{ paddingTop: "75%", position: "relative", background: "#F9FAFB", overflow: "hidden" }}>
        {img
          ? <img src={img} alt={prod?.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#e5e7eb" }}>🎁</div>
        }
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E", lineHeight: 1.3, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {prod?.name}
        </div>
        {/* Display variant attributes like cart/checkout */}
        {variantAttrs.length > 0 && (
          <div style={{ marginTop: 2 }}>
            <VariantChips attrs={variantAttrs} fontSize={9} swatchSize={10} />
          </div>
        )}
        {oos && <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 600, marginTop: 2 }}>Out of stock</div>}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const ComboDetailPage = () => {
  const { rootComboId } = useParams();
  const { pathname, search }    = useLocation();
  const dispatch        = useDispatch();
  const navigate        = useNavigate();

  const { currentCombo, loading, error, mixMatchSelections } = useSelector(s => s.combo || {});
  const { isAuthenticated } = useSelector(s => s.auth || {});
  const { cartItems } = useSelector(s => s.cart || { cartItems: [] });

  const [qty,        setQty]        = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [activeChild, setActiveChild] = useState(null); // selected child combo tab

  const child = activeChild || currentCombo?.children?.[0];
  const comboCartQty = useMemo(() => {
    if (!child || !cartItems) return 0;
    const match = cartItems.find(
      item => item.isCombo && String(item.childComboId) === String(child.id)
    );
    return match ? match.quantity : 0;
  }, [cartItems, child]);

  const isInCart = isAuthenticated && comboCartQty > 0;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = currentCombo?.name || child?.name || "this combo";
  const shareMessage = `Check out ${shareTitle} on Kamali Gifts — a perfect choice for your next celebration.`;
  const shareText = `${shareMessage}\n${shareUrl}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareMessage)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  // Rule 2: Combo purchasable qty = min(all child stocks) — "Lowest Stock Rule"
  const fixedMaxQty = useMemo(() => {
    if (!child || child.type !== "fixed" || !child.comboProducts?.length) return Infinity;
    const stocks = child.comboProducts.map(cp => {
      const v = cp.variant
        || (cp.variantId && Array.isArray(cp.product?.Variants)
          ? cp.product.Variants.find(x => String(x.id) === String(cp.variantId))
          : null);
      return Number(v ? v.stock : cp.product?.stock ?? 0);
    });
    return Math.min(...stocks);
  }, [child]);

  const mixMatchMaxQty = useMemo(() => {
    if (!child || child.type !== "mix_match") return Infinity;
    const mmState = mixMatchSelections?.[child.id] || { selections: [] };
    const selections = mmState.selections || [];
    if (!selections.length) return Infinity;

    const maxPerSelection = selections.map(sel => {
      const cp = (child.comboProducts || []).find(c => String(c.productId) === String(sel.productId));
      if (!cp) return 0;
      const v = cp.variant 
        || (cp.product?.Variants?.find(x => String(x.id) === String(sel.variantId)))
        || null;
      
      const stock = Number(v ? v.stock : cp.product?.stock ?? 0);
      const reqQty = Number(sel.quantity) || 1;
      
      return Math.floor(stock / reqQty);
    });

    return Math.min(...maxPerSelection);
  }, [child, mixMatchSelections]);

  const comboMaxQty = child?.type === "fixed" ? fixedMaxQty : mixMatchMaxQty;

  // Rule 4: List of OOS products for partial-OOS UI
  const oosProducts = useMemo(() => {
    if (!child || child.type !== "fixed" || !child.comboProducts?.length) return [];
    return child.comboProducts.filter(cp => isOutOfStock(cp));
  }, [child]);

  const lowStockProducts = useMemo(() => {
    if (!child || child.type !== "fixed" || !child.comboProducts?.length) return [];
    return child.comboProducts.filter(cp => isLowStock(cp));
  }, [child]);

  useEffect(() => {
    dispatch(fetchComboById(rootComboId));
  }, [rootComboId]);

  // Auto-select child combo based on URL type param or first active
  useEffect(() => {
    if (currentCombo?.children?.length && !activeChild) {
      // Check URL for type parameter (mix_match or fixed)
      const params = new URLSearchParams(search);
      const requestedType = params.get('type');
      
      let selected = null;
      if (requestedType) {
        selected = currentCombo.children.find(c => c.type === requestedType && c.isActive);
      }
      // Fallback to first active child
      if (!selected) {
        selected = currentCombo.children.find(c => c.isActive) || currentCombo.children[0];
      }
      setActiveChild(selected);
    }
  }, [currentCombo, search]);

  useEffect(() => {
    if (qty > comboMaxQty && comboMaxQty > 0) {
      setQty(comboMaxQty);
    }
  }, [comboMaxQty]);

  // When mix_match selections change, clamp qty to new stock limit
  useEffect(() => {
    if (child?.type === "mix_match" && mixMatchMaxQty < Infinity && qty > mixMatchMaxQty) {
      setQty(mixMatchMaxQty > 0 ? mixMatchMaxQty : 1);
    }
  }, [mixMatchMaxQty]);

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <LayoutOne headerTop="visible">
        <div style={{ padding: "120px 0", textAlign: "center", color: "#6B7280" }}>
          <p>Loading combo…</p>
        </div>
      </LayoutOne>
    );
  }

  if (error || !currentCombo) {
    return (
      <LayoutOne headerTop="visible">
        <div style={{ padding: "120px 0", textAlign: "center", color: "#6B7280" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>Combo not found</div>
          <Link to={`${process.env.PUBLIC_URL}/shop`} style={{ color: "#F15A24", fontWeight: 600 }}>← Back to Shop</Link>
        </div>
      </LayoutOne>
    );
  }

  if (!child) {
    return (
      <LayoutOne headerTop="visible">
        <div style={{ padding: "120px 0", textAlign: "center", color: "#6B7280" }}>
          <p>No items in this combo yet.</p>
          <Link to={`${process.env.PUBLIC_URL}/shop`} style={{ color: "#F15A24" }}>← Shop</Link>
        </div>
      </LayoutOne>
    );
  }

  const comboImgs = (() => {
    if (child.image) return [child.image];
    if (currentCombo.image) return [currentCombo.image];
    // Fall back to first included product's first variant image
    const firstCp = child.comboProducts?.[0];
    if (firstCp?.product) {
      const variants = firstCp.product.Variants;
      if (Array.isArray(variants) && variants.length > 0 && variants[0].image) {
        return [variants[0].image];
      }
      const prodImgs = firstCp.product.image;
      const imgArr = Array.isArray(prodImgs) ? prodImgs
        : typeof prodImgs === "string" ? (() => { try { return JSON.parse(prodImgs); } catch { return [prodImgs]; } })()
        : [];
      if (imgArr[0]) return [imgArr[0]];
    }
    return [];
  })();
  const originalPrice = child.originalPrice ? parseFloat(child.originalPrice) : null;
  const comboPrice    = parseFloat(child.comboPrice);
  const savings       = originalPrice && originalPrice > comboPrice
    ? Math.round(((originalPrice - comboPrice) / originalPrice) * 100)
    : 0;
  const comboShortDescription = child.shortDescription || child.description || "";
  const comboFullDescription  = child.fullDescription || child.description || child.shortDescription || "";

  // Mix & Match state for this child
  const mmState    = mixMatchSelections?.[child.id] || { selections: [] };
  const selections = mmState.selections || [];
  const totalSel   = selections.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0);
  const minQty     = child.minQty || 1;
  const maxQty     = child.maxQty || Infinity;
  const canAdd     = totalSel >= minQty;

  // ── Fixed combo OOS & stock rules ─────────────────────────────────────────
  const fixedOos = child.type === "fixed" && child.comboProducts?.some(cp => isOutOfStock(cp));

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      cogoToast.warn("Please login to add items to cart", { position: "top-center" });
      navigate(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (child.type === "mix_match" && !canAdd) {
      cogoToast.warn(`Select at least ${minQty} item${minQty > 1 ? "s" : ""}`, { position: "top-center" });
      return;
    }
    setAddingCart(true);
    try {
      const res = await addComboToCart({
        childComboId: child.id,
        quantity: qty,
        selections: child.type === "mix_match" ? selections : undefined,
      });

      if (child.type === "mix_match") dispatch(clearMixMatch(child.id));

      // Build the selectedProducts list for the cart item (same as server snapshot.products)
      const selectedProducts = child.type === "fixed"
        ? (child.comboProducts || []).map(cp => {
            // resolve variant from cp.variant OR from product.Variants[]
            const resolvedVariant = cp.variant
              || (cp.variantId && Array.isArray(cp.product?.Variants)
                ? cp.product.Variants.find(v => String(v.id) === String(cp.variantId)) || null
                : null);
            return {
              productId: cp.productId,
              variantId: cp.variantId,
              quantity: cp.quantity || 1,
              name: cp.product?.name || null,
              image: resolvedVariant?.image || getProductImg(cp.product) || null,
              variantName: resolvedVariant?.variantName || null,
            };
          })
        : selections.map(sel => {
            // look up product data from child.comboProducts
            const cp = (child.comboProducts || []).find(c => String(c.productId) === String(sel.productId));
            const matchedVariant = cp?.product?.Variants?.find(v => String(v.id) === String(sel.variantId))
              || cp?.variant || null;
            return {
              productId: sel.productId,
              variantId: sel.variantId,
              quantity: sel.quantity || 1,
              name: cp?.product?.name || null,
              image: matchedVariant?.image || getProductImg(cp?.product) || null,
              variantName: matchedVariant?.variantName || null,
            };
          });

      // Dispatch addToCart — same as single products, instant Redux update + "Added To Cart" toast
      dispatch(addToCart({
        id: child.comboProducts?.[0]?.productId || selections?.[0]?.productId || null,
        cartItemId: res?.cartItem?.id || null,
        quantity: qty,
        name: child.name,
        price: parseFloat(child.comboPrice),
        discount: 0,
        image: child.image ? [child.image] : (currentCombo.image ? [currentCombo.image] : []),
        variation: [],
        selectedVariantId: null,
        selectedVariantName: null,
        // Combo-specific
        isCombo: true,
        rootComboId: currentCombo.id,
        childComboId: child.id,
        comboType: child.type,
        selectedProducts,
      }));

      cogoToast.success("Combo added to cart!", { position: "top-center" });
    } catch (err) {
      cogoToast.error("Could not add combo to cart", { position: "top-center" });
      console.error(err);
    }
    setAddingCart(false);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      cogoToast.warn("Please login to buy items", { position: "top-center" });
      navigate(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (isInCart) {
      navigate("/cart");
      return;
    }
    if (child.type === "mix_match" && !canAdd) {
      cogoToast.warn(`Select at least ${minQty} item${minQty > 1 ? "s" : ""}`, { position: "top-center" });
      return;
    }
    setAddingCart(true);
    try {
      const res = await addComboToCart({
        childComboId: child.id,
        quantity: qty,
        selections: child.type === "mix_match" ? selections : undefined,
      });

      if (child.type === "mix_match") dispatch(clearMixMatch(child.id));

      const selectedProducts = child.type === "fixed"
        ? (child.comboProducts || []).map(cp => {
            const resolvedVariant = cp.variant
              || (cp.variantId && Array.isArray(cp.product?.Variants)
                ? cp.product.Variants.find(v => String(v.id) === String(cp.variantId)) || null
                : null);
            return {
              productId: cp.productId,
              variantId: cp.variantId,
              quantity: cp.quantity || 1,
              name: cp.product?.name || null,
              image: resolvedVariant?.image || getProductImg(cp.product) || null,
              variantName: resolvedVariant?.variantName || null,
            };
          })
        : selections.map(sel => {
            const cp = (child.comboProducts || []).find(c => String(c.productId) === String(sel.productId));
            const matchedVariant = cp?.product?.Variants?.find(v => String(v.id) === String(sel.variantId))
              || cp?.variant || null;
            return {
              productId: sel.productId,
              variantId: sel.variantId,
              quantity: sel.quantity || 1,
              name: cp?.product?.name || null,
              image: matchedVariant?.image || getProductImg(cp?.product) || null,
              variantName: matchedVariant?.variantName || null,
            };
          });

      dispatch(addToCartSilent({
        id: child.comboProducts?.[0]?.productId || selections?.[0]?.productId || null,
        cartItemId: res?.cartItem?.id || null,
        quantity: qty,
        name: child.name,
        price: parseFloat(child.comboPrice),
        discount: 0,
        image: child.image ? [child.image] : (currentCombo.image ? [currentCombo.image] : []),
        variation: [],
        selectedVariantId: null,
        selectedVariantName: null,
        isCombo: true,
        rootComboId: currentCombo.id,
        childComboId: child.id,
        comboType: child.type,
        selectedProducts,
      }));

      navigate("/cart");
    } catch (err) {
      const serverMsg = err?.response?.data?.errors?.[0] || err?.response?.data?.message || null;
      cogoToast.error(serverMsg || "Could not add combo to cart", { position: "top-center" });
      console.error(err);
    }
    setAddingCart(false);
  };

  // ── Mix & Match toggle ──────────────────────────────────────────────────────
  const handleToggle = (cp, variantId) => {
    const idx = selections.findIndex(s =>
      String(s.productId) === String(cp.productId) &&
      String(s.variantId || "") === String(variantId || "")
    );
    if (idx !== -1) {
      dispatch(removeMixMatchItem({ childComboId: child.id, index: idx }));
    } else {
      if (totalSel >= maxQty) {
        cogoToast.warn(`Maximum ${maxQty} items allowed`, { position: "top-center" });
        return;
      }
      dispatch(addMixMatchItem({
        childComboId: child.id,
        item: { productId: cp.productId, variantId: variantId || null, quantity: 1 },
      }));
    }
  };

  const progressPct = maxQty === Infinity ? Math.min(100, (totalSel / minQty) * 100) : (totalSel / maxQty) * 100;

  return (
    <Fragment>
      <SEO
        title={`${child.name} — ${currentCombo.name}`}
        titleTemplate="Customized Combo Gift Sets - Kamali Gifts"
        description={comboShortDescription || `${child.name} combo gift set — ₹${comboPrice}. Personalized bundle with laser engraving and customization options.`}
        keywords="combo gift set, customized combo, personalized bundle, gift bundle, bulk combo gifts, corporate combo gifts, wedding combo gifts"
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb pages={[
          { label: "Home",  path: process.env.PUBLIC_URL + "/" },
          { label: "Shop",  path: process.env.PUBLIC_URL + "/shop" },
          { label: currentCombo.name, path: process.env.PUBLIC_URL + pathname },
        ]} />

        {/* ── PDP-matching layout ─────────────────────────────────────────── */}
        <div className="shop-area pt-100 pb-100">
          <div className="container">
            <div className="row">

              {/* LEFT: image gallery — mirrors ProductImageDescription layout */}
              <div className="col-lg-6 col-md-6">
                <ProductImageGallerySideThumb product={{ image: comboImgs, discount: savings, new: false }} thumbPosition="left" />
              </div>

              {/* RIGHT: info panel — mirrors ProductDescriptionInfo structure */}
              <div className="col-lg-6 col-md-6">
                <div className="combo-details-content">

                  {/* Combo name + root group */}
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {currentCombo.name}
                    </span>
                  </div>
                  <h1 className = "pdp-info__name">{child.name}</h1>

                  {/* Type badge */}
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: child.type === "fixed" ? "#EFF6FF" : "#fefce8", color: child.type === "fixed" ? "#1A3A6B" : "#b45309" }}>
                      {child.type === "fixed" ? "Fixed Combo" : "Mix & Match"}
                    </span>
                  </div>

                  {/* Description */}
                  {comboShortDescription && (
                    <p style={{ color: "#6B7280", lineHeight: 1.7, marginBottom: 16, wordWrap: "break-word", overflowWrap: "anywhere" }}>{comboShortDescription}</p>
                  )}

                  {/* Price block — same classes as PDP */}
                  <div className="product-details-price" style={{ marginBottom: 16 }}>
                    <span className="final-price" style={{ fontSize: 30, fontWeight: 900, color: "#F15A24" }}>
                      ₹{comboPrice.toLocaleString("en-IN")}
                    </span>
                    {originalPrice && originalPrice > comboPrice && (
                      <span className="old-price" style={{ fontSize: 18, color: "#6B7280", textDecoration: "line-through", marginLeft: 12 }}>
                        ₹{originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                    {savings > 0 && (
                      <span style={{ marginLeft: 12, fontSize: 13, fontWeight: 800, background: "#22c55e", color: "#fff", borderRadius: 6, padding: "3px 10px" }}>
                        You Save {savings}%
                      </span>
                    )}
                  </div>

                  {savings > 0 && originalPrice && (
                    <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 600, marginBottom: 16 }}>
                      You save ₹{(originalPrice - comboPrice).toLocaleString("en-IN")} on this combo!
                    </div>
                  )}

                  {/* ── FIXED TYPE: product list ────────────────────────── */}
                  {child.type === "fixed" && (
                    <>
                      {child.comboProducts && child.comboProducts.length > 0 && (
                        <FixedProductsList comboProducts={child.comboProducts} />
                      )}

                      {/* Rule 2 — Low stock warning: remaining qty limited */}
                      {!fixedOos && comboMaxQty < Infinity && comboMaxQty <= 5 && lowStockProducts.length > 0 && (
                        <div style={{ marginTop: 10, padding: "8px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 12, color: "#92400e", fontWeight: 600 }}>
                          ⚡ Only {comboMaxQty} combo{comboMaxQty === 1 ? "" : "s"} left — limited by{" "}
                          {lowStockProducts.map(cp => cp.product?.name || "item").join(", ")}
                        </div>
                      )}
                    </>
                  )}

                  {/* ── MIX & MATCH TYPE: header + progress ─────────────── */}
                  {child.type === "mix_match" && (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1A3A6B", marginBottom: 8 }}>
                          Pick any {minQty}{maxQty !== Infinity ? `–${maxQty}` : "+"} items for ₹{comboPrice.toLocaleString("en-IN")}
                        </div>
                        {/* Progress indicator */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <div style={{ flex: 1, height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(100, progressPct)}%`, background: canAdd ? "#22c55e" : "#F15A24", borderRadius: 3, transition: "width 0.3s" }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: canAdd ? "#22c55e" : "#F15A24", flexShrink: 0 }}>
                            {totalSel} / {minQty} selected
                          </span>
                        </div>
                        {!canAdd && (
                          <div style={{ fontSize: 12, color: "#6B7280" }}>
                            Add {minQty - totalSel} more to unlock
                          </div>
                        )}
                      </div>

                      {/* Eligible products — horizontal scroll, no slider */}
                      {child.comboProducts && child.comboProducts.some(cp => cp.isEligible) && (
                        <div style={{ marginBottom: 8 }}>
                          <div className="mm-scroll" style={{
                            display: "flex",
                            gap: 8,
                            overflowX: "auto",
                            WebkitOverflowScrolling: "touch",
                            scrollbarWidth: "none",
                            paddingBottom: 6,
                            paddingTop: 2,
                          }}>
                            <style>{`.mm-scroll::-webkit-scrollbar{display:none}`}</style>
                            {child.comboProducts.filter(cp => cp.isEligible).map(cp => {
                              const isSel = selections.some(s =>
                                String(s.productId) === String(cp.productId) &&
                                String(s.variantId || "") === String(cp.variantId || "")
                              );
                              return (
                                <div key={cp.id} style={{ flex: "0 0 calc(25% - 6px)", minWidth: 120, maxWidth: 160 }}>
                                  <MixMatchCard cp={cp} selected={isSel}
                                    onToggle={(cp, vId) => handleToggle(cp, vId)} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="pdp-info__actions pdp-info__actions--combo" style={{ marginTop: 24 }}>
                    {/* Qty stepper — shown for both fixed & mix_match unless out of stock */}
                    {!fixedOos && (
                      <div className="pdp-info__actions-row pdp-info__actions-row--top">
                        <div className="pdp-qty pdp-info__combo-cell pdp-info__combo-cell--qty">
                          <button
                            className="pdp-qty__btn"
                            onClick={() => setQty(q => Math.max(1, q - 1))}
                            disabled={qty <= 1}
                          >
                            <svg width="14" height="2" viewBox="0 0 14 2">
                              <line x1="0" y1="1" x2="14" y2="1" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </button>
                          <span className="pdp-qty__count">{qty}</span>
                          <button
                            className="pdp-qty__btn"
                            onClick={() => setQty(q => {
                              // Cap at comboMaxQty for both fixed and mix_match combos (lowest stock rule)
                              return q < comboMaxQty ? q + 1 : q;
                            })}
                            disabled={qty >= comboMaxQty}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14">
                              <line x1="7" y1="0" x2="7" y2="14" stroke="currentColor" strokeWidth="2"/>
                              <line x1="0" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </button>
                        </div>
                        {/* Show lowest-stock warning for fixed combo */}
                        {comboMaxQty < Infinity && comboMaxQty <= 5 && (
                          <span className="pdp-combo-stock-note" style={{ fontSize: 11, color: comboMaxQty <= 2 ? "#dc2626" : "#f59e0b", fontWeight: 600, alignSelf: "center" }}>
                            Only {comboMaxQty} available
                          </span>
                        )}
                      </div>
                    )}

                    <div className="pdp-info__actions-row pdp-info__actions-row--bottom">
                      {fixedOos ? (
                        <button className="pdp-btn pdp-btn--disabled pdp-info__combo-cell pdp-info__combo-cell--full" disabled style={{ width: "100%" }}>
                          Out of Stock
                        </button>
                      ) : isInCart ? (
                        <>
                          <Link to={process.env.PUBLIC_URL + "/cart"} className="pdp-btn pdp-btn--success pdp-info__combo-cell pdp-info__combo-cell--primary" style={{ flex: 1 }}>
                            View Cart
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 6 }}>
                              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                            </svg>
                          </Link>
                          <button
                            className="pdp-btn pdp-btn--buy pdp-info__combo-cell pdp-info__combo-cell--secondary"
                            onClick={handleBuyNow}
                            style={{ flex: 1 }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                            Buy Now
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className={clsx("pdp-btn pdp-info__combo-cell pdp-info__combo-cell--primary", (child.type === "mix_match" && !canAdd) ? "pdp-btn--disabled" : "pdp-btn--primary")}
                            onClick={handleAddToCart}
                            disabled={addingCart || (child.type === "mix_match" && !canAdd)}
                            style={{ flex: 1 }}
                          >
                            {addingCart ? (
                              "Adding…"
                            ) : child.type === "mix_match" && !canAdd ? (
                              `Add ${minQty - totalSel} more to unlock`
                            ) : (
                              <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                                </svg>
                                Add to Cart
                              </>
                            )}
                          </button>
                          <button
                            className="pdp-btn pdp-btn--buy pdp-info__combo-cell pdp-info__combo-cell--secondary"
                            onClick={handleBuyNow}
                            disabled={addingCart || (child.type === "mix_match" && !canAdd)}
                            style={{ flex: 1 }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                            Buy Now
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stock warning */}
                  {child.type === "fixed" && child.comboProducts?.some(isLowStock) && !fixedOos && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#b45309", fontWeight: 600 }}>
                      ⚠️ Low stock on some items — order soon!
                    </div>
                  )}

                  <div className="pdp-info__divider" style={{ height: "1px", background: "#e5e7eb", margin: "22px 0" }} />

                  {/* Share section */}
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

                </div>
              </div>
            </div>
          </div>
        </div>
        <ProductDescriptionTab
          spaceBottomClass="pb-90"
          productFullDesc={comboFullDescription}
          childComboId={child.id}
          reviewTargetType="combo"
        />
      </LayoutOne>
      <style>{`
        /* ── Responsive details layout ── */
        .combo-details-content {
          margin-left: 70px;
        }
        @media (max-width: 991px) {
          .combo-details-content {
            margin-left: 0;
            margin-top: 30px;
          }
        }

        /* ── Actions row ── */
        .pdp-info__actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }
        .pdp-info__actions--combo {
          display: grid;
          grid-template-columns: minmax(150px, 170px) minmax(0, 1fr) minmax(0, 1fr);
          align-items: center;
          column-gap: 10px;
          row-gap: 12px;
        }
        .pdp-info__actions--combo .pdp-info__actions-row--top,
        .pdp-info__actions--combo .pdp-info__actions-row--bottom {
          display: contents !important;
        }
        .pdp-info__combo-cell {
          min-width: 0;
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          flex: none !important;
        }
        .pdp-info__combo-cell--qty {
          grid-column: 1;
          grid-row: 1;
          width: 100% !important;
        }
        .pdp-info__combo-cell--primary {
          grid-column: 2;
          grid-row: 1;
        }
        .pdp-info__combo-cell--secondary {
          grid-column: 3;
          grid-row: 1;
        }
        .pdp-info__combo-cell--full {
          grid-column: 1 / -1;
          grid-row: 1;
        }
        .pdp-combo-stock-note {
          grid-column: 1 / -1;
          grid-row: 2;
        }
        @media (min-width: 768px) and (max-width: 991px) {
          .pdp-info__actions--combo {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            column-gap: 12px;
            row-gap: 12px;
          }
          .pdp-info__combo-cell--qty {
            grid-column: 1;
            grid-row: 1;
          }
          .pdp-info__combo-cell--primary {
            grid-column: 1;
            grid-row: 2;
          }
          .pdp-info__combo-cell--secondary {
            grid-column: 2;
            grid-row: 2;
          }
          .pdp-info__combo-cell--full {
            grid-column: 1 / -1;
            grid-row: 2;
          }
          .pdp-combo-stock-note {
            grid-column: 2;
            grid-row: 1;
            align-self: center;
          }
        }
        @media (max-width: 767px) {
          .pdp-info__actions--combo {
            grid-template-columns: 1fr;
            row-gap: 12px;
          }
          .pdp-info__combo-cell--qty {
            grid-column: 1;
            grid-row: 1;
          }
          .pdp-info__combo-cell--primary {
            grid-column: 1;
            grid-row: 2;
          }
          .pdp-info__combo-cell--secondary {
            grid-column: 1;
            grid-row: 3;
          }
          .pdp-info__combo-cell--full {
            grid-column: 1;
            grid-row: 2;
          }
          .pdp-combo-stock-note {
            grid-column: 1;
            grid-row: 4;
          }
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
          width: 100%;
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
          min-width: 0;
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
      `}</style>
    </Fragment>
  );
};

export default ComboDetailPage;