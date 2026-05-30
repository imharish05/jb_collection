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
import { getImgUrl } from "../../helpers/imageUrl";
import { fetchComboById, addComboToCart } from "../../store/services/comboService";
import {
  addMixMatchItem, removeMixMatchItem, clearMixMatch,
} from "../../store/slices/combo-slice";
import { addToCart, addToCartSilent, replaceCart } from "../../store/slices/cart-slice";
import api from "../../api/axios";
import cogoToast from "cogo-toast";
import ProductImageGallerySideThumb from "../../components/product/ProductImageGallerySideThumb";

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

// ComboImageGallery removed in favor of ProductImageGallerySideThumb

// ── Fixed combo: included products list (card-grid, same style as Mix & Match) ─
function FixedProductsList({ comboProducts }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A3A6B", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Included Products
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
        {comboProducts.map(cp => {
          const prod = cp.product;
          const variant = cp.variant
            || (cp.variantId && Array.isArray(prod?.Variants)
              ? prod.Variants.find(v => String(v.id) === String(cp.variantId)) || null
              : null);
          const img = getProductImg(prod);
          const low = isLowStock(cp);
          const oos = isOutOfStock(cp);
          const qty = cp.quantity || 1;
          const sales = variant ? parseFloat(variant.salesPrice || 0) : parseFloat(prod?.price || 0);
          const mrp   = variant ? parseFloat(variant.mrp || 0)        : parseFloat(prod?.price || 0);
          return (
            <div
              key={cp.id}
              style={{
                border: `2px solid ${oos ? "#fecaca" : "#E5E7EB"}`,
                borderRadius: 10,
                overflow: "hidden",
                background: oos ? "#fef9f9" : "#fff",
                opacity: oos ? 0.75 : 1,
                position: "relative",
              }}
            >
              {/* Qty badge */}
              {qty > 1 && (
                <div style={{
                  position: "absolute", top: 6, left: 6,
                  minWidth: 20, height: 20, borderRadius: 10,
                  background: "#1A3A6B", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, zIndex: 1, padding: "0 5px",
                }}>×{qty}</div>
              )}
              {/* Image */}
              <div style={{ paddingTop: "75%", position: "relative", background: "#F9FAFB", overflow: "hidden" }}>
                {img
                  ? <img src={img} alt={prod?.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#e5e7eb" }}>🎁</div>
                }
              </div>
              {/* Info */}
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E", lineHeight: 1.3, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {prod?.name}
                </div>
                {variant && (
                  <div style={{ fontSize: 9, color: "#db1a5d", fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>
                    {variant.variantName}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                  {sales > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#F15A24" }}>₹{sales.toLocaleString("en-IN")}</span>}
                  {mrp > sales && sales > 0 && <span style={{ fontSize: 10, color: "#6B7280", textDecoration: "line-through" }}>₹{mrp.toLocaleString("en-IN")}</span>}
                </div>
                {oos && <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 600, marginTop: 2 }}>Out of stock</div>}
                {low && !oos && <div style={{ fontSize: 10, color: "#b45309", fontWeight: 600, marginTop: 2 }}>Only {cp.variant?.stock ?? cp.product?.stock} left</div>}
              </div>
            </div>
          );
        })}
      </div>
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
  
  // Use variant's price if available, otherwise use product price
  const sales = variant ? parseFloat(variant.salesPrice || 0) : parseFloat(prod?.price || 0);
  const mrp = variant ? parseFloat(variant.mrp || 0) : parseFloat(prod?.price || 0);
  const variantId = cp.variantId || null;
  
  const oos = isOutOfStock(cp);

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
        {variant && (
          <div style={{ fontSize: 9, color: "#db1a5d", fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>
            {variant.variantName}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#F15A24" }}>₹{sales.toLocaleString("en-IN")}</span>
          {mrp > sales && <span style={{ fontSize: 10, color: "#6B7280", textDecoration: "line-through" }}>₹{mrp.toLocaleString("en-IN")}</span>}
        </div>
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

  const comboImgs     = child.image ? [child.image] : (currentCombo.image ? [currentCombo.image] : []);
  const originalPrice = child.originalPrice ? parseFloat(child.originalPrice) : null;
  const comboPrice    = parseFloat(child.comboPrice);
  const savings       = originalPrice && originalPrice > comboPrice
    ? Math.round(((originalPrice - comboPrice) / originalPrice) * 100)
    : 0;

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
              image: getProductImg(cp.product) || null,
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
              image: getProductImg(cp?.product) || null,
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
              image: getProductImg(cp.product) || null,
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
              image: getProductImg(cp?.product) || null,
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
      cogoToast.error("Could not add combo to cart", { position: "top-center" });
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
        titleTemplate={`${child.name} — ${currentCombo.name}`}
        description={child.description || `${child.name} combo — ₹${comboPrice}`}
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
                  <h2 style={{ marginBottom: 12 }}>{child.name}</h2>

                  {/* Type badge */}
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: child.type === "fixed" ? "#EFF6FF" : "#fefce8", color: child.type === "fixed" ? "#1A3A6B" : "#b45309" }}>
                      {child.type === "fixed" ? "Fixed Combo" : "Mix & Match"}
                    </span>
                  </div>

                  {/* Description */}
                  {child.description && (
                    <p style={{ color: "#6B7280", lineHeight: 1.7, marginBottom: 16 }}>{child.description}</p>
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

                      {/* Rule 1 — Hard OOS: one or more items are zero-stock */}
                      {fixedOos && oosProducts.length > 0 && (
                        <div style={{ marginTop: 10, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
                          <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 700, marginBottom: 6 }}>
                            ⚠️ Combo Unavailable — out of stock item{oosProducts.length > 1 ? "s" : ""}:
                          </div>
                          {oosProducts.map((cp, i) => (
                            <div key={i} style={{ fontSize: 12, color: "#991b1b", display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#dc2626", flexShrink: 0, display: "inline-block" }} />
                              {cp.product?.name || `Product #${cp.productId}`}
                              {cp.variant?.variantName ? ` — ${cp.variant.variantName}` : ""}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rule 2 — Low stock warning: remaining qty limited */}
                      {!fixedOos && fixedMaxQty < Infinity && fixedMaxQty <= 5 && lowStockProducts.length > 0 && (
                        <div style={{ marginTop: 10, padding: "8px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 12, color: "#92400e", fontWeight: 600 }}>
                          ⚡ Only {fixedMaxQty} combo{fixedMaxQty === 1 ? "" : "s"} left — limited by{" "}
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

                      {/* Eligible products grid */}
                      {child.comboProducts && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginBottom: 8 }}>
                          {child.comboProducts.filter(cp => cp.isEligible).map(cp => {
                            const isSel = selections.some(s =>
                              String(s.productId) === String(cp.productId) &&
                              String(s.variantId || "") === String(cp.variantId || "")
                            );
                            return (
                              <MixMatchCard key={cp.id} cp={cp} selected={isSel}
                                onToggle={(cp, vId) => handleToggle(cp, vId)} />
                            );
                          })}
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
                              // Cap at fixedMaxQty for fixed combos (lowest stock rule)
                              const cap = child.type === "fixed" ? fixedMaxQty : Infinity;
                              return q < cap ? q + 1 : q;
                            })}
                            disabled={child.type === "fixed" && qty >= fixedMaxQty}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14">
                              <line x1="7" y1="0" x2="7" y2="14" stroke="currentColor" strokeWidth="2"/>
                              <line x1="0" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </button>
                        </div>
                        {/* Show lowest-stock warning for fixed combo */}
                        {child.type === "fixed" && fixedMaxQty < Infinity && fixedMaxQty <= 5 && (
                          <span className="pdp-combo-stock-note" style={{ fontSize: 11, color: fixedMaxQty <= 2 ? "#dc2626" : "#f59e0b", fontWeight: 600, alignSelf: "center" }}>
                            Only {fixedMaxQty} available
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
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                        target="_blank" rel="noopener noreferrer" title="Facebook"
                        className="pdp-share-btn pdp-share-btn--fb"
                      >
                        <i className="fa fa-facebook" />
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(child.name + " " + window.location.href)}`}
                        target="_blank" rel="noopener noreferrer" title="X / Twitter"
                        className="pdp-share-btn pdp-share-btn--x"
                      >
                        <Icon icon="ri:twitter-x-fill" width="15" height="15" />
                      </a>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(child.name + " " + window.location.href)}`}
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
