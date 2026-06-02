import { Fragment, useState, useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SEO from "../../components/seo";
import { getDiscountPrice } from "../../helpers/product";
import { getImgUrl } from "../../helpers/imageUrl";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import {
  addToCartService,
  increaseQuantityService,
  deleteFromCartService,
  decreaseQuantityService,
  deleteAllFromCartService,
} from "../../store/services";
import { fetchAddresses } from "../../store/services/addressService";
import { setActiveAddress } from "../../store/slices/addressSlice";
import { replaceCart } from "../../store/slices/cart-slice";
import { createCheckoutFromCart } from "../../store/slices/checkout-slice";
import api from "../../api/axios";
import cogoToast from "cogo-toast";
import "./Cart.css";

const SHIPPING_THRESHOLD = 999;
const SHIPPING_COST = 60;
const COD_FEE = 30;

/* ── Helpers ──────────────────────────────────────────────────────────────── */


// ── Variant helpers (same logic as Wishlist) ─────────────────────────────────
const safeAttrs = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};
const getVariantAttrs = (variant) => {
  if (!variant) return [];
  return safeAttrs(variant.attributes).filter(a => a.key && a.value && a.key !== "Custom Note");
};
// Fallback: parse selectedVariantName string for items added before selectedVariant was attached
const parseFallbackAttrs = (variantName) => {
  if (!variantName) return [];
  const seen = new Set();
  return variantName.split(" · ").map(s => {
    const [key, ...rest] = s.split(": ");
    return { key: key?.trim(), value: rest.join(": ").trim() };
  }).filter(a => {
    if (!a.key || !a.value) return false;
    const k = a.key.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/* ════════════════════════════════════════════════════════════════════════════
   Cart Component
════════════════════════════════════════════════════════════════════════════ */
const Cart = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth?.user);
  const currency = useSelector(
    (state) => state.currency || { currencyName: "INR", currencyRate: 1, currencySymbol: "₹" }
  );
  const { cartItems } = useSelector((state) => state.cart);
  const { addresses, activeAddressId, loading: addrLoading } = useSelector((state) => state.address);

  /* ── Expanded combos state ── */
  const [expandedCombos, setExpandedCombos] = useState({});
  const toggleComboExpanded = (cartItemId) => {
    setExpandedCombos(prev => ({
      ...prev,
      [cartItemId]: !prev[cartItemId]
    }));
  };

  /* ── Cart Revalidation ───────────────────────────────────────────────────── */
  const [revalidating, setRevalidating] = useState(false);
  const [revalAlerts, setRevalAlerts] = useState([]);  // [{cartItemId, message, status}]
  const revalDoneRef = useRef(false);

  const revalidateCartItems = useCallback(async () => {
    if (!cartItems || cartItems.length === 0 || revalDoneRef.current) return;
    setRevalidating(true);
    try {
      const payload = {
        items: cartItems.map(item => ({
          cartItemId: item.cartItemId,
          productId: item.id,
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
      const { hasChanges, items: results } = res.data;
      if (!hasChanges) return;

      // Build alert list for items that changed
      const alerts = [];
      const updatedCart = cartItems.map(item => {
        const result = results.find(r => r.cartItemId === item.cartItemId);
        if (!result || result.status === "OK") return item;
        alerts.push({ cartItemId: item.cartItemId, message: result.message, status: result.status });
        if (result.adjustedQty === 0) return null;  // mark for removal
        return { ...item, quantity: result.adjustedQty };
      }).filter(Boolean);

      if (alerts.length > 0) {
        setRevalAlerts(alerts);
        dispatch(replaceCart(updatedCart));
      }
    } catch (err) {
      console.warn("Cart revalidation failed:", err);
    } finally {
      setRevalidating(false);
      revalDoneRef.current = true;
    }
  }, [cartItems, dispatch]);

  useEffect(() => {
    revalidateCartItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authUser?.id) dispatch(fetchAddresses());
  }, [authUser?.id, dispatch]);

  const handleSelectAddress = (id) => dispatch(setActiveAddress(id));

  /* ── Price Calculations ────────────────────────────────────────────────── */
  let subtotal = 0;
  cartItems.forEach((item) => {
    // item.price = salesPrice stored at cart-add time (already final, no discount to apply)
    subtotal += parseFloat(item.price || 0) * (currency.currencyRate || 1) * item.quantity;
  });

  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const grandTotal = subtotal + shipping;

  /* ── Empty Cart ────────────────────────────────────────────────────────── */
  if (!cartItems || cartItems.length === 0) {
    return (
      <Fragment>
        <SEO titleTemplate="Cart — Kamali Gifts" description="Your shopping cart." />
        <LayoutOne headerTop="visible">
          <Breadcrumb
            pages={[
              { label: "Home", path: process.env.PUBLIC_URL + "/" },
              { label: "Cart", path: process.env.PUBLIC_URL + pathname },
            ]}
          />
          <div className="kg-cart-page">
            <div className="kg-cart-container">
              <div className="kg-empty-wrap">
                <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
                  <circle cx="45" cy="45" r="45" fill="#FFF0F5" />
                  <path
                    d="M24 30h5l6 26h22l6-19H36"
                    stroke="#db1a5d"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <circle cx="40" cy="61" r="3" fill="#db1a5d" />
                  <circle cx="54" cy="61" r="3" fill="#db1a5d" />
                </svg>
                <h3 className="kg-empty-title">Your cart is empty</h3>
                <p className="kg-empty-text">
                  Looks like you haven't added anything yet.
                </p>
                <Link to={process.env.PUBLIC_URL + "/shop"} className="kg-shop-btn">
                  Start Shopping →
                </Link>
              </div>
            </div>
          </div>
        </LayoutOne>
      </Fragment>
    );
  }

  /* ── Main Render ───────────────────────────────────────────────────────── */
  return (
    <Fragment>
      <SEO titleTemplate="Cart — Kamali Gifts" description="Your shopping cart." />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Cart", path: process.env.PUBLIC_URL + pathname },
          ]}
        />

        <div className="kg-cart-page">
          <div className="kg-cart-container">

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="kg-cart-header">
              <h2 className="kg-cart-title">
                Shopping Cart
                <span className="kg-cart-badge">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                </span>
              </h2>
              <button className="kg-clear-btn" onClick={() => deleteAllFromCartService()}>
                🗑 Clear All
              </button>
            </div>

            {/* ── Layout ─────────────────────────────────────────── */}
            <div className="kg-cart-layout">

              {/* ══ LEFT COLUMN ═════════════════════════════════════ */}
              <div className="kg-cart-left">

                {/* Free Shipping Progress */}
                {/* {subtotal < SHIPPING_THRESHOLD && (
                  <div className="kg-shipping-bar">
                    <div className="kg-shipping-bar-inner">
                      <span style={{ fontSize: 20 }}>🚚</span>
                      <span>
                        Add{" "}
                        <strong style={{ color: "#db1a5d" }}>
                          ₹{(SHIPPING_THRESHOLD - subtotal).toFixed(0)}
                        </strong>{" "}
                        more for <strong>FREE delivery</strong>
                      </span>
                    </div>
                    <div className="kg-progress-track">
                      <div
                        className="kg-progress-fill"
                        style={{
                          width: `${Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {subtotal >= SHIPPING_THRESHOLD && (
                  <div className="kg-shipping-bar success">
                    <div className="kg-shipping-bar-inner">
                      <span style={{ fontSize: 20 }}>🎉</span>
                      <span style={{ color: "#16a34a" }}>
                        <strong>You qualify for FREE delivery!</strong>
                      </span>
                    </div>
                  </div>
                )} */}


                {/* Revalidation alerts */}
                {revalidating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, marginBottom: 12, fontSize: 13, color: "#92400e" }}>
                    <span style={{ fontSize: 18 }}>🔄</span>
                    <span>Checking stock availability…</span>
                  </div>
                )}
                {revalAlerts.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    {revalAlerts.map((alert, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: alert.status === "OOS" || alert.status === "Discontinued" || alert.status === "Unavailable" ? "#fef2f2" : "#fffbeb", border: `1px solid ${alert.status === "OOS" || alert.status === "Discontinued" || alert.status === "Unavailable" ? "#fecaca" : "#fde68a"}`, borderRadius: 10, fontSize: 13, color: alert.status === "OOS" || alert.status === "Discontinued" || alert.status === "Unavailable" ? "#991b1b" : "#92400e" }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{alert.status === "OOS" || alert.status === "Discontinued" || alert.status === "Unavailable" ? "⚠️" : "📦"}</span>
                        <span style={{ flex: 1 }}>{alert.message}</span>
                        <button onClick={() => setRevalAlerts(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "inherit", opacity: 0.6, padding: 0, lineHeight: 1 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cart Items */}
                <div className="kg-items-card">
                  {cartItems.map((item) => {
                    // item.price = salesPrice already final from backend
                    // ── Image resolution (handles JSON string, array, localhost URLs) ──
                    const resolveItemImage = (raw) => {
                      let arr = raw;
                      if (!Array.isArray(arr)) {
                        try { arr = JSON.parse(arr); } catch { arr = arr ? [arr] : []; }
                      }
                      const first = (Array.isArray(arr) ? arr[0] : null) || "";
                      if (!first) return "/assets/img/products/products-1.jpeg";
                      // Strip localhost base so getImgUrl re-resolves via REACT_APP_IMG_URL
                      const stripped = first.replace(/^https?:\/\/[^/]*(:\d+)?/, "");
                      return getImgUrl(stripped) || "/assets/img/products/products-1.jpeg";
                    };
                    const resolvedImgSrc = resolveItemImage(item.image);
                    const rate = currency.currencyRate || 1;
                    const unitPrice = parseFloat(item.price || 0) * rate;
                    const finalPrice = unitPrice.toFixed(2);
                    const finalDisc = null;  // no client-side discount — price is already final
                    const lineTotal = (unitPrice * item.quantity).toFixed(2);

                    // Use stock stored on item directly (set by cartService from variant or product)
                    const maxStock = item.stock || 999;

                    // ── Variant attrs (priority order, same resolution as Wishlist):
                    // 1. selectedVariant.attributes  (set by new cartService/authService)
                    // 2. find from item.Variants[] by selectedVariantId (existing Redux items)
                    // 3. parse selectedVariantName string (legacy string format)
                    const resolvedVariant =
                      item.selectedVariant ||
                      (item.selectedVariantId && Array.isArray(item.Variants)
                        ? item.Variants.find(v => Number(v.id) === Number(item.selectedVariantId)) || null
                        : null);
                    const attrs = getVariantAttrs(resolvedVariant).length > 0
                      ? getVariantAttrs(resolvedVariant)
                      : parseFallbackAttrs(item.selectedVariantName);

                    return (
                      <div key={item.cartItemId} className="kg-cart-item">
                        {/* Image */}
                        <Link
                          to={item.isCombo ? process.env.PUBLIC_URL + "/combo/root/" + item.rootComboId : process.env.PUBLIC_URL + "/product/" + item.id}
                          className="kg-item-img-wrap"
                        >
                          <img
                            src={resolvedImgSrc}
                            alt={item.name}
                            className="kg-item-img"
                            onError={(e) => {
                              e.target.src = "/assets/img/products/products-1.jpeg";
                            }}
                          />
                          {item.discount > 0 && (
                            <span className="kg-disc-badge">−{item.discount}%</span>
                          )}
                        </Link>

                        {/* Details */}
                        <div className="kg-item-details">
                          {item.isCombo && (
                            <span className="kg-combo-badge" style={{
                              display: "inline-block",
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "#db1a5d",
                              background: "#fff0f6",
                              border: "1px solid #ffd6e7",
                              borderRadius: "4px",
                              padding: "2px 8px",
                              marginBottom: "6px",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              width: "fit-content"
                            }}>
                              🎁 Combo Offer ({item.comboType === "fixed" ? "Fixed Combo" : item.comboType === "mix_match" ? "Mix & Match" : "Combo"})
                            </span>
                          )}
                          <Link
                            to={item.isCombo ? process.env.PUBLIC_URL + "/combo/root/" + item.rootComboId : process.env.PUBLIC_URL + "/product/" + item.id}
                            className="kg-item-name"
                          >
                            {item.name}
                          </Link>

                          {/* Variant attributes — show all parsed key-value pairs */}
                          {attrs.length > 0 ? (
                            <div className="kg-variant-row">
                              {attrs.map((attr, i) => (
                                <span key={i} className="kg-variant-chip">
                                  <span style={{ color: "#888", fontSize: 10, marginRight: 2 }}>
                                    {attr.key}:
                                  </span>
                                  {attr.value}
                                </span>
                              ))}
                            </div>
                          ) : (item.selectedProductColor || item.selectedProductSize) ? (
                            <div className="kg-variant-row">
                              {item.selectedProductColor && (
                                <span className="kg-variant-chip">
                                  <span style={{ color: "#888", fontSize: 10, marginRight: 2 }}>Colour:</span>
                                  {item.selectedProductColor}
                                </span>
                              )}
                              {item.selectedProductSize && (
                                <span className="kg-variant-chip">
                                  <span style={{ color: "#888", fontSize: 10, marginRight: 2 }}>Size:</span>
                                  {item.selectedProductSize}
                                </span>
                              )}
                            </div>
                          ) : null}

                          {item.isCombo && (
                            <div className="kg-combo-toggle" style={{ marginTop: "6px", display: "flex", alignItems: "center" }}>
                              <button
                                onClick={() => toggleComboExpanded(item.cartItemId)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#db1a5d",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "0"
                                }}
                              >
                                <span>{expandedCombos[item.cartItemId] ? "Hide Included Products" : "Show Included Products"}</span>
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  style={{
                                    transform: expandedCombos[item.cartItemId] ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s"
                                  }}
                                >
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </button>
                            </div>
                          )}

                          {item.isCombo && expandedCombos[item.cartItemId] && (
                            <div className="kg-combo-included-products" style={{
                              marginTop: "10px",
                              padding: "10px 12px",
                              background: "#f8fafc",
                              border: "1px dashed #e2e8f0",
                              borderRadius: "8px"
                            }}>
                              <div style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "#6b7280",
                                marginBottom: "8px",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em"
                              }}>
                                Included Products
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {Array.isArray(item.selectedProducts) && item.selectedProducts.length > 0 ? (
                                  item.selectedProducts.map((p, idx) => {
                                    const productImgSrc = p.image ? getImgUrl(p.image) : "/assets/img/products/products-1.jpeg";
                                    return (
                                      <div key={idx} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "7px 9px",
                                        background: "#fff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "7px"
                                      }}>
                                        {/* Thumbnail */}
                                        <img
                                          src={productImgSrc}
                                          alt={p.name || "product"}
                                          style={{
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "6px",
                                            objectFit: "cover",
                                            border: "1px solid #e5e7eb",
                                            flexShrink: 0
                                          }}
                                          onError={(e) => e.target.src = "/assets/img/products/products-1.jpeg"}
                                        />
                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: "#1f2937",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                          }}>
                                          {p.name || "Included Product"}
                                          </div>
                                          <div style={{ display: "flex", gap: "5px", marginTop: "4px", flexWrap: "wrap", alignItems: "center" }}>
                                            {p.variantName && (
                                              <span style={{
                                                fontSize: "10px",
                                                background: "#fff0f6",
                                                color: "#db1a5d",
                                                border: "1px solid #ffd6e7",
                                                borderRadius: "4px",
                                                padding: "1px 6px",
                                                fontWeight: 600
                                              }}>{p.variantName}</span>
                                            )}
                                            {p.quantity >= 1 && (
                                              <span style={{
                                                fontSize: "10px",
                                                background: "#f3f4f6",
                                                color: "#6b7280",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "4px",
                                                padding: "1px 6px",
                                                fontWeight: 600
                                              }}>×{p.quantity}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <span style={{ fontSize: "11px", color: "#9ca3af", fontStyle: "italic" }}>
                                    No product details available
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Stock warning when near limit */}
                          {maxStock < 10 && (
                            <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 3 }}>
                              Only {maxStock} left in stock
                            </div>
                          )}

                          {/* Price */}
                          <div className="kg-price-row">
                            {finalDisc ? (
                              <>
                                <span className="kg-price-old">₹{finalPrice}</span>
                                <span className="kg-price-final">₹{finalDisc}</span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "#16a34a",
                                    fontWeight: 700,
                                    background: "#f0fdf4",
                                    borderRadius: 4,
                                    padding: "2px 6px",
                                  }}
                                >
                                  {item.discount}% off
                                </span>
                              </>
                            ) : (
                              <span className="kg-price-final">₹{finalPrice}</span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="kg-item-actions">
                            {/* Qty control */}
                            <div className="kg-qty-control">
                              <button
                                className="kg-qty-btn"
                                onClick={() => decreaseQuantityService(item)}
                                title="Decrease"
                              >
                                −
                              </button>
                              <span className="kg-qty-num">{item.quantity}</span>
                              <button
                                className="kg-qty-btn"
                                onClick={() =>
                                  increaseQuantityService(item)
                                }
                                disabled={item.quantity >= maxStock}
                                title={item.quantity >= maxStock ? `Max stock: ${maxStock}` : "Increase"}
                              >
                                +
                              </button>
                            </div>

                            {/* Line total */}
                            <span className="kg-line-total">₹{lineTotal}</span>

                            {/* Remove */}
                            <button
                              className="kg-remove-btn"
                              onClick={() => deleteFromCartService(item.cartItemId)}
                              title="Remove item"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4h6v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>


                {/* Continue Shopping */}
                <Link
                  to={process.env.PUBLIC_URL + "/shop"}
                  className="kg-continue-link"
                >
                  ← Continue Shopping
                </Link>
              </div>

              {/* ══ RIGHT COLUMN ════════════════════════════════════ */}
              <div className="kg-cart-right">

                {/* Saved Shipping Address */}
                {/* <div
                  className="kg-address-card"
                  style={{
                    marginBottom: 24,
                    padding: 20,
                    borderRadius: 14,
                    border: "1px solid #e8e8e8",
                    background: "#fff",
                  }}
                >
                  <h3 className="kg-summary-title" style={{ marginBottom: 14 }}>
                    Shipping Address
                  </h3>
                  {addrLoading ? (
                    <p style={{ color: "#666", fontSize: 13 }}>Loading saved addresses...</p>
                  ) : addresses.length === 0 ? (
                    <div style={{ color: "#555", fontSize: 13, lineHeight: 1.6 }}>
                      <p>No saved shipping address was found.</p>
                      <Link
                        to={process.env.PUBLIC_URL + "/my-account?tab=address"}
                        className="kg-continue-link"
                        style={{ marginTop: 10, display: "inline-block" }}
                      >
                        Manage Addresses
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {addresses.map((addr) => {
                        const isActive = addr.id === activeAddressId;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => handleSelectAddress(addr.id)}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              borderRadius: 12,
                              border: `1px solid ${isActive ? "#db1a5d" : "#e0e0e0"}`,
                              background: isActive ? "#fff0f8" : "#fff",
                              padding: 18,
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                              <span style={{ fontWeight: 700, color: "#222" }}>{addr.fullName}</span>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "#555",
                                  background: "#f5f5f5",
                                  padding: "4px 10px",
                                  borderRadius: 20,
                                }}
                              >
                                {addr.addressType || "Home"}
                              </span>
                              {addr.isDefault && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "#2e7d32",
                                    background: "#ecfdf5",
                                    padding: "4px 10px",
                                    borderRadius: 20,
                                  }}
                                >
                                  Default
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>
                              {addr.street}{addr.apartment ? `, ${addr.apartment}` : ""}
                              <br />
                              {addr.city}, {addr.state} - {addr.pincode}
                              <br />
                              {addr.country}
                            </div>
                            <div style={{ fontSize: 13, color: "#555" }}>
                              <i className="fa fa-phone" style={{ marginRight: 6 }}></i>
                              {addr.phone}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div> */}

                {/* Order Summary */}
                <div className="kg-summary-card">
                  <h3 className="kg-summary-title">Order Summary</h3>

                  {/* Breakdown */}
                  <div className="kg-breakdown">
                    <div className="kg-breakdown-row">
                      <span>
                        Subtotal ({cartItems.length}{" "}
                        {cartItems.length === 1 ? "item" : "items"})
                      </span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                  {/* Checkout Button */}
                  <button
                    className="kg-checkout-btn"
                    onClick={() => {
                      dispatch(createCheckoutFromCart(cartItems));
                      navigate(process.env.PUBLIC_URL + "/checkout", {
                        state: {
                          subtotal,
                          shipping,
                          couponDiscount: 0,
                          couponCode: null,
                          grandTotal,
                        },
                      });
                    }}
                  >
                    Proceed to Checkout →
                  </button>

                  {/* Trust Badges */}
                  <div className="kg-trust-row">
                    <div className="kg-trust-item">
                      <span>🔒</span>
                      <span>Secure</span>
                    </div>
                    <div className="kg-trust-item">
                      <span>↩️</span>
                      <span>Returns</span>
                    </div>
                    <div className="kg-trust-item">
                      <span>📦</span>
                      <span>Safe Pack</span>
                    </div>
                    <div className="kg-trust-item">
                      <span>✅</span>
                      <span>Authentic</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="kg-info-card">
                  <div className="kg-info-row">
                    <span className="kg-info-icon">🚚</span>
                    <div>
                      <div className="kg-info-label">Estimated delivery</div>
                      <div className="kg-info-value">3–7 business days</div>
                    </div>
                  </div>
                  <div className="kg-info-divider" />
                  <div className="kg-info-row">
                    <span className="kg-info-icon">💵</span>
                    <div>
                      <div className="kg-info-label">Cash on Delivery</div>
                      <div className="kg-info-value">Available (+₹{COD_FEE} handling)</div>
                    </div>
                  </div>
                  <div className="kg-info-divider" />
                  <div className="kg-info-row">
                    <span className="kg-info-icon">↩️</span>
                    <div>
                      <div className="kg-info-label">Return policy</div>
                      <div className="kg-info-value">7-day hassle-free returns</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default Cart;