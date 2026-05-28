// Client/src/pages/combo/ComboDetailPage.jsx
// Matches /product/:id layout: ProductImageGallerySideThumb on left, info panel on right.
// Fixed combos: show products list + add-to-cart.
// Mix & Match: product picker grid + selected tray + progress bar.

import React, { Fragment, useState, useEffect } from "react";
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
import { replaceCart } from "../../store/slices/cart-slice";
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
  const v = cp.variant;
  const stock = v ? v.stock : cp.product?.stock ?? 0;
  return stock <= 3 && stock > 0;
}

function isOutOfStock(cp) {
  const v = cp.variant;
  const stock = v ? v.stock : cp.product?.stock ?? 0;
  return stock === 0;
}

// ComboImageGallery removed in favor of ProductImageGallerySideThumb

// ── Fixed combo: included products list ──────────────────────────────────────
function FixedProductsList({ comboProducts }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A3A6B", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Included Products
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {comboProducts.map(cp => {
          const prod = cp.product;
          const variant = cp.variant;
          const img = getProductImg(prod);
          const low = isLowStock(cp);
          const oos = isOutOfStock(cp);
          return (
            <div key={cp.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8 }}>
              {img
                ? <img src={img} alt="" width={40} height={40} style={{ borderRadius: 6, objectFit: "cover", border: "1px solid #E5E7EB", flexShrink: 0 }} />
                : <div style={{ width: 40, height: 40, borderRadius: 6, background: "#fff", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎁</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {prod?.name}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                  {variant && (
                    <span style={{ fontSize: 10, background: "#EFF6FF", color: "#1A3A6B", borderRadius: 4, padding: "1px 6px", border: "1px solid #c7d4f0", fontWeight: 600 }}>
                      {variant.variantName}
                    </span>
                  )}
                  {cp.quantity > 1 && <span style={{ fontSize: 10, color: "#6B7280" }}>×{cp.quantity}</span>}
                  {oos  && <span style={{ fontSize: 10, background: "#fef2f2", color: "#dc2626", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>Out of stock</span>}
                  {low  && !oos && <span style={{ fontSize: 10, background: "#fef9c3", color: "#b45309", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>Only {isLowStock(cp) ? (cp.variant?.stock ?? cp.product?.stock) : ""} left</span>}
                </div>
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
  const { sales, mrp, variantId } = getVariantPrice(prod);
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
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#F15A24" }}>₹{sales.toLocaleString("en-IN")}</span>
          {mrp > sales && <span style={{ fontSize: 10, color: "#6B7280", textDecoration: "line-through" }}>₹{mrp.toLocaleString("en-IN")}</span>}
        </div>
        {oos && <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 600, marginTop: 2 }}>Out of stock</div>}
      </div>
    </div>
  );
}

// ── Mix & Match selected tray ─────────────────────────────────────────────────
function SelectedTray({ selections, comboProducts, onRemove }) {
  if (selections.length === 0) return null;
  return (
    <div style={{ marginTop: 12, padding: "10px 12px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Selected Items</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {selections.map((sel, i) => {
          const cp   = comboProducts.find(c => String(c.productId) === String(sel.productId));
          const prod = cp?.product;
          const img  = getProductImg(prod);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FEF0EB", border: "1px solid #F15A24", borderRadius: 6, padding: "3px 8px" }}>
              {img && <img src={img} alt="" width={18} height={18} style={{ borderRadius: 3, objectFit: "cover" }} />}
              <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1A2E" }}>{prod?.name || sel.productId}</span>
              <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 0, fontSize: 12, lineHeight: 1 }}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const ComboDetailPage = () => {
  const { rootComboId } = useParams();
  const { pathname }    = useLocation();
  const dispatch        = useDispatch();
  const navigate        = useNavigate();

  const { currentCombo, loading, error, mixMatchSelections } = useSelector(s => s.combo || {});
  const { isAuthenticated } = useSelector(s => s.auth || {});

  const [qty,        setQty]        = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [activeChild, setActiveChild] = useState(null); // selected child combo tab

  useEffect(() => {
    dispatch(fetchComboById(rootComboId));
  }, [rootComboId]);

  // Auto-select first active child
  useEffect(() => {
    if (currentCombo?.children?.length && !activeChild) {
      const first = currentCombo.children.find(c => c.isActive) || currentCombo.children[0];
      setActiveChild(first);
    }
  }, [currentCombo]);

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

  const child = activeChild || currentCombo.children?.[0];
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

  const fixedOos = child.type === "fixed" && child.comboProducts?.some(cp => isOutOfStock(cp));

  // ── Add to cart ─────────────────────────────────────────────────────────────
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
      await addComboToCart({
        childComboId: child.id,
        quantity: qty,
        selections: child.type === "mix_match" ? selections : undefined,
      });
      cogoToast.success("Combo added to cart!", { position: "top-center" });
      if (child.type === "mix_match") dispatch(clearMixMatch(child.id));

      // Re-fetch cart from server to sync combo cart items into Redux
      try {
        const res = await api.get("/cart");
        const items = (res.data || []).map(cartItem => {
          const variants = cartItem.product?.Variants || cartItem.product?.variants || [];
          const matched = variants.find(v => String(v.id) === String(cartItem.selectedVariantId));
          const resolvedPrice = matched?.salesPrice ?? cartItem.productSnapshot?.price ?? cartItem.product?.price ?? 0;
          const resolvedDiscount = cartItem.productSnapshot?.discount ?? cartItem.product?.discount ?? 0;
          return {
            id: cartItem.productId,
            cartItemId: cartItem.id,
            quantity: cartItem.quantity,
            selectedVariantId: cartItem.selectedVariantId != null ? Number(cartItem.selectedVariantId) : null,
            selectedVariantName: cartItem.productSnapshot?.selectedVariantName || null,
            selectedProductColor: cartItem.selectedProductColor || null,
            selectedProductSize: cartItem.selectedProductSize || null,
            name: cartItem.productSnapshot?.name || cartItem.product?.name,
            price: typeof resolvedPrice === "string" ? parseFloat(resolvedPrice) : resolvedPrice,
            discount: typeof resolvedDiscount === "string" ? parseFloat(resolvedDiscount) : resolvedDiscount,
            image: cartItem.productSnapshot?.image || cartItem.product?.image || [],
            variation: cartItem.product?.variation || [],
            // Combo specific fields
            isCombo: cartItem.productSnapshot?.isCombo || false,
            rootComboId: cartItem.productSnapshot?.rootComboId || null,
          };
        });
        dispatch(replaceCart(items));
      } catch (cartErr) {
        // Cart sync failed silently — combo was still added
        console.warn("Cart re-sync failed after combo add:", cartErr);
      }
    } catch {
      // error already toasted in service
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
                <div className="product-details-content ml-70">

                  {/* Combo name + root group */}
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {currentCombo.name}
                    </span>
                  </div>
                  <h2 style={{ marginBottom: 12 }}>{child.name}</h2>

                  {/* Child combo tabs (if multiple active children) */}
                  {currentCombo.children?.filter(c => c.isActive).length > 1 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                      {currentCombo.children.filter(c => c.isActive).map(c => (
                        <button key={c.id}
                          onClick={() => { setActiveChild(c); setQty(1); }}
                          style={{
                            padding: "5px 14px", borderRadius: 20, border: "1.5px solid",
                            borderColor: activeChild?.id === c.id ? "#F15A24" : "#E5E7EB",
                            background: activeChild?.id === c.id ? "#FEF0EB" : "#fff",
                            color: activeChild?.id === c.id ? "#F15A24" : "#6B7280",
                            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                          }}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}

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
                      {fixedOos && (
                        <div style={{ marginTop: 10, padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                          ⚠️ One or more products in this combo are out of stock.
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
                            const isSel = selections.some(s => String(s.productId) === String(cp.productId));
                            return (
                              <MixMatchCard key={cp.id} cp={cp} selected={isSel}
                                onToggle={(cp, vId) => handleToggle(cp, vId)} />
                            );
                          })}
                        </div>
                      )}

                      {/* Selected tray */}
                      <SelectedTray
                        selections={selections}
                        comboProducts={child.comboProducts || []}
                        onRemove={(i) => dispatch(removeMixMatchItem({ childComboId: child.id, index: i }))}
                      />
                    </>
                  )}

                  {/* Qty selector — same PDP style */}
                  {child.type === "fixed" && (
                    <div className="pro-details-quality" style={{ marginTop: 20 }}>
                      <div className="cart-plus-minus">
                        <button className="dec qtybutton" onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
                        <input type="text" readOnly value={qty} className="cart-plus-minus-box" />
                        <button className="inc qtybutton" onClick={() => setQty(q => q + 1)}>+</button>
                      </div>
                    </div>
                  )}

                  {/* Add to Cart — same PDP primary button style */}
                  <div className="pro-details-quality" style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <div className="pro-details-cart btn-hover">
                      <button
                        onClick={handleAddToCart}
                        disabled={addingCart || fixedOos || (child.type === "mix_match" && !canAdd)}
                        style={{ opacity: addingCart || fixedOos ? 0.65 : 1, cursor: fixedOos ? "not-allowed" : "pointer" }}
                      >
                        {addingCart ? "Adding…" : fixedOos ? "Out of Stock" : child.type === "mix_match" && !canAdd ? `Add ${minQty - totalSel} more to unlock` : "Add to Cart"}
                      </button>
                    </div>
                  </div>

                  {/* Stock warning */}
                  {child.type === "fixed" && child.comboProducts?.some(isLowStock) && !fixedOos && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#b45309", fontWeight: 600 }}>
                      ⚠️ Low stock on some items — order soon!
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default ComboDetailPage;
