import { Fragment, useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SEO from "../../components/seo";
import { getDiscountPrice } from "../../helpers/product";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import {
  addToCartService,
  deleteFromCartService,
  decreaseQuantityService,
  deleteAllFromCartService,
} from "../../store/services";
import api from "../../api/axios";
import "./Cart.css";

const SHIPPING_THRESHOLD = 999;
const SHIPPING_COST = 60;
const COD_FEE = 30;

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const formatCouponDesc = (c) => {
  if (c.type === "percent") {
    let s = `${parseFloat(c.value)}% OFF`;
    if (c.max_discount) s += ` up to ₹${parseFloat(c.max_discount)}`;
    return s;
  }
  return `₹${parseFloat(c.value)} OFF`;
};

const formatCouponCond = (c) => {
  const parts = [];
  if (parseFloat(c.min_order) > 0) parts.push(`Min order ₹${parseFloat(c.min_order)}`);
  if (c.expires_at) {
    const d = new Date(c.expires_at);
    parts.push(`Valid till ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`);
  }
  return parts.join(" · ") || "No minimum order";
};

/* ════════════════════════════════════════════════════════════════════════════
   Cart Component
════════════════════════════════════════════════════════════════════════════ */
const Cart = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currency = useSelector(
    (state) => state.currency || { currencyName: "INR", currencyRate: 1, currencySymbol: "₹" }
  );
  const { cartItems } = useSelector((state) => state.cart);

  /* ── Coupon state ──────────────────────────────────────────────────────── */
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponErr, setCouponErr] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);

  /* ── Available coupons from backend ───────────────────────────────────── */
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsLoaded, setCouponsLoaded] = useState(false);

  useEffect(() => {
    if (couponOpen && !couponsLoaded) {
      setCouponsLoading(true);
      api
        .get("/coupons/active")
        .then((res) => setAvailableCoupons(res.data || []))
        .catch(() => {})
        .finally(() => {
          setCouponsLoading(false);
          setCouponsLoaded(true);
        });
    }
  }, [couponOpen, couponsLoaded]);

  /* ── Price Calculations ────────────────────────────────────────────────── */
  let subtotal = 0;
  cartItems.forEach((item) => {
    const disc = getDiscountPrice(item.price, item.discount);
    const price = disc !== null ? disc : item.price;
    subtotal += price * currency.currencyRate * item.quantity;
  });

  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const couponDiscount = coupon ? parseFloat(coupon.discount) : 0;
  const grandTotal = subtotal + shipping - couponDiscount;

  /* ── Apply Coupon ──────────────────────────────────────────────────────── */
  const applyCode = useCallback(
    async (code) => {
      const normalized = (code || couponInput).trim().toUpperCase();
      if (!normalized) return;
      setCouponLoading(true);
      setCouponErr("");
      setCoupon(null);
      try {
        const res = await api.post("/coupons/validate", {
          code: normalized,
          order_total: subtotal,
        });
        setCoupon(res.data);
        setCouponInput(normalized);
      } catch (err) {
        setCouponErr(err.response?.data?.message || "Invalid coupon code");
      } finally {
        setCouponLoading(false);
      }
    },
    [couponInput, subtotal]
  );

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponErr("");
  };

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

                {/* Cart Items */}
                <div className="kg-items-card">
                  {cartItems.map((item) => {
                    const disc = getDiscountPrice(item.price, item.discount);
                    const finalPrice = (item.price * currency.currencyRate).toFixed(2);
                    const finalDisc = disc
                      ? (disc * currency.currencyRate).toFixed(2)
                      : null;
                    const lineTotal = finalDisc
                      ? (parseFloat(finalDisc) * item.quantity).toFixed(2)
                      : (parseFloat(finalPrice) * item.quantity).toFixed(2);

                    // Use stock stored on item directly (set by cartService from variant or product)
                    const maxStock = item.stock || 999;

                    // Parse variant attributes from selectedVariantName
                    // Format: "Colour: bronze · Size: Small · Material: Gold-plated"
                    const variantAttrs = item.selectedVariantName
                      ? item.selectedVariantName.split(" · ").map(s => {
                          const [key, ...rest] = s.split(": ");
                          return { key: key?.trim(), value: rest.join(": ").trim() };
                        }).filter(a => a.key && a.value)
                      : [];

                    // Deduplicate attrs — keep only FIRST occurrence of each key
                    // e.g. "Size: Small · Size: Medium · Size: Large" → just "Size: Small"
                    const seenKeys = new Set();
                    const uniqueAttrs = variantAttrs.filter(a => {
                      const k = a.key?.toLowerCase();
                      if (seenKeys.has(k)) return false;
                      seenKeys.add(k);
                      return true;
                    });

                    const variantLabel = uniqueAttrs.length === 0 && item.selectedVariantName
                      ? item.selectedVariantName
                      : "";

                    return (
                      <div key={item.cartItemId} className="kg-cart-item">
                        {/* Image */}
                        <Link
                          to={process.env.PUBLIC_URL + "/product/" + item.id}
                          className="kg-item-img-wrap"
                        >
                          <img
                            src={
                              item.image?.[0]?.startsWith("http")
                                ? item.image[0]
                                : `${process.env.REACT_APP_IMG_URL || ""}/uploads/${(item.image?.[0] || "").replace(/^\/?uploads\//, "")}`
                            }
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
                          <Link
                            to={process.env.PUBLIC_URL + "/product/" + item.id}
                            className="kg-item-name"
                          >
                            {item.name}
                          </Link>

                          {/* Variant attributes — show all parsed key-value pairs */}
                          {uniqueAttrs.length > 0 && (
                            <div className="kg-variant-row">
                              {uniqueAttrs.map((attr, i) => (
                                <span key={i} className="kg-variant-chip">
                                  <span style={{ color: "#888", fontSize: 10, marginRight: 2 }}>
                                    {attr.key}:
                                  </span>
                                  {attr.value}
                                </span>
                              ))}
                            </div>
                          )}

                          {variantLabel && (
                            <div className="kg-variant-row">
                              <span className="kg-variant-chip">{variantLabel}</span>
                            </div>
                          )}

                          {/* Fallback: legacy color/size chips if no variantName */}
                          {uniqueAttrs.length === 0 && !variantLabel && (item.selectedProductColor || item.selectedProductSize) && (
                            <div className="kg-variant-row">
                              {item.selectedProductColor && (
                                <span className="kg-variant-chip">
                                  {item.selectedProductColor}
                                </span>
                              )}
                              {item.selectedProductSize && (
                                <span className="kg-variant-chip">
                                  {item.selectedProductSize}
                                </span>
                              )}
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
                                  addToCartService({ ...item, quantity: 1 })
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

                {/* ── Coupons & Offers (Secondary Card) ───────────── */}
                <div className="kg-coupons-card">
                  {/* Header */}
                  <div
                    className="kg-coupons-header"
                    onClick={() => setCouponOpen((o) => !o)}
                    role="button"
                    aria-expanded={couponOpen}
                  >
                    <div className="kg-coupons-header-left">
                      <div className="kg-coupon-icon-wrap">🏷️</div>
                      <div>
                        <div className="kg-coupons-title">
                          {coupon ? (
                            <span style={{ color: "#16a34a" }}>Coupon Applied ✓</span>
                          ) : (
                            "Promo Codes & Offers"
                          )}
                        </div>
                        <div className="kg-coupons-subtitle">
                          {coupon
                            ? `Saving ₹${couponDiscount.toFixed(2)} on this order`
                            : "Tap to view available offers"}
                        </div>
                      </div>
                    </div>
                    <span className={`kg-coupons-toggle-icon ${couponOpen ? "open" : ""}`}>
                      ▼
                    </span>
                  </div>

                  {/* Applied chip (always visible) */}
                  {coupon && (
                    <div style={{ marginTop: 14 }}>
                      <span className="kg-coupon-applied-chip">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {coupon.coupon_code}
                        <button className="kg-coupon-remove-btn" onClick={handleRemoveCoupon}>
                          Remove
                        </button>
                      </span>
                    </div>
                  )}

                  {/* Expanded body */}
                  {couponOpen && (
                    <div className="kg-coupon-body">

                      {/* Available coupon cards */}
                      {couponsLoading && (
                        <div className="kg-coupons-loading">
                          <span>Loading offers...</span>
                        </div>
                      )}

                      {!couponsLoading && availableCoupons.length > 0 && (
                        <>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#888",
                              marginBottom: 10,
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            Available Offers
                          </p>
                          <div className="kg-coupon-cards-grid">
                            {availableCoupons.map((c) => {
                              const isApplied = coupon?.coupon_code === c.code;
                              const isEligible = subtotal >= parseFloat(c.min_order || 0);
                              return (
                                <div
                                  key={c.id}
                                  className={`kg-coupon-card ${isApplied ? "applied" : ""}`}
                                  onClick={() => !isApplied && isEligible && applyCode(c.code)}
                                  style={{ opacity: isEligible ? 1 : 0.55 }}
                                  title={!isEligible ? `Min order ₹${c.min_order} required` : ""}
                                >
                                  <div className="kg-coupon-card-code">{c.code}</div>
                                  <div className="kg-coupon-card-desc">
                                    {formatCouponDesc(c)}
                                  </div>
                                  <div className="kg-coupon-card-cond">
                                    {formatCouponCond(c)}
                                  </div>
                                  {!isApplied && isEligible && (
                                    <div className="kg-coupon-card-tap">
                                      ↗ Tap to apply
                                    </div>
                                  )}
                                  {isApplied && (
                                    <div
                                      className="kg-coupon-card-tap"
                                      style={{ color: "#16a34a" }}
                                    >
                                      ✓ Applied
                                    </div>
                                  )}
                                  {!isEligible && (
                                    <div
                                      className="kg-coupon-card-tap"
                                      style={{ color: "#f59e0b" }}
                                    >
                                      ⚠ Add ₹{(parseFloat(c.min_order) - subtotal).toFixed(0)} more
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {/* Manual input */}
                      <p className="kg-coupon-manual-label">
                        {availableCoupons.length > 0
                          ? "Or enter a different code:"
                          : "Enter promo code:"}
                      </p>
                      <div className="kg-coupon-input-row">
                        <input
                          type="text"
                          className="kg-coupon-input"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            setCouponErr("");
                          }}
                          placeholder="E.g. KAMALI15"
                          onKeyDown={(e) => e.key === "Enter" && applyCode()}
                        />
                        <button
                          className="kg-coupon-apply-btn"
                          onClick={() => applyCode()}
                          disabled={couponLoading || !couponInput.trim()}
                        >
                          {couponLoading ? "..." : "Apply"}
                        </button>
                      </div>
                      {couponErr && (
                        <p className="kg-coupon-err">⚠ {couponErr}</p>
                      )}
                    </div>
                  )}
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
                    <div className="kg-breakdown-row">
                      <span>Delivery</span>
                      <span style={shipping === 0 ? { color: "#16a34a", fontWeight: 700 } : {}}>
                        {shipping === 0 ? "FREE" : `₹${shipping}`}
                      </span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="kg-breakdown-row" style={{ color: "#16a34a" }}>
                        <span>Coupon ({coupon.coupon_code})</span>
                        <span>− ₹{couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="kg-total-row">
                    <span>Total</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>

                  <p className="kg-tax-note">
                    Inclusive of all taxes · COD +₹{COD_FEE}
                  </p>

                  {couponDiscount > 0 && (
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #86efac",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                        color: "#16a34a",
                        fontWeight: 700,
                        textAlign: "center",
                        marginBottom: 14,
                      }}
                    >
                      🎉 You're saving ₹{couponDiscount.toFixed(2)} on this order!
                    </div>
                  )}

                  {/* Checkout Button */}
                  <button
                    className="kg-checkout-btn"
                    onClick={() =>
                      navigate(process.env.PUBLIC_URL + "/checkout", {
                        state: {
                          subtotal,
                          shipping,
                          couponDiscount,
                          couponCode: coupon?.coupon_code || null,
                          grandTotal,
                        },
                      })
                    }
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