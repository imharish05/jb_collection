import { Fragment, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getImgUrl } from "../../helpers/imageUrl";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import { isColourKey, isHexColor } from "../../helpers/product";

import { useEffect } from "react";        // add if not already there
import { useDispatch } from "react-redux"; // add if not already there
import { refreshProductsSilently } from "../../store/services/productService";
import { clearCheckout } from "../../store/slices/checkout-slice";
import { replaceCart } from "../../store/slices/cart-slice";
import api from "../../api/axios";

const parseJson = (val) => {
  if (!val || typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return val; }
};

const getOrderItemImage = (img, selectedVariant) => {
  const variantImg = selectedVariant?.image;
  if (variantImg) return getImgUrl(variantImg);
  const arr = Array.isArray(img) ? img : parseJson(img);
  const raw = Array.isArray(arr) ? arr[0] : (typeof img === "string" ? img : null);
  return raw ? getImgUrl(raw) : "/assets/img/products/products-1.jpeg";
};

const resolveVariantTags = (item) => {
  const tags = [];
  if (item.selectedVariantName) {
    const parts = item.selectedVariantName.split(/·|,/).map(s => s.trim()).filter(Boolean);
    parts.forEach(part => {
      if (part.includes(":")) {
        const [k, ...rest] = part.split(":");
        tags.push({ key: k.trim(), val: rest.join(":").trim() });
      } else {
        tags.push({ key: "Variant", val: part });
      }
    });
    return tags;
  }
  const v = Array.isArray(item.variation) ? item.variation[0] : null;
  if (v) {
    const raw = v.attributes;
    const attrs = Array.isArray(raw)
      ? raw
      : typeof raw === "string"
      ? (() => { try { return JSON.parse(raw); } catch { return []; } })()
      : [];
    if (attrs.length) {
      attrs.forEach(a => tags.push({ key: a.key, val: a.value }));
      return tags;
    }
    if (v.variantName) { tags.push({ key: "Variant", val: v.variantName }); return tags; }
  }
  if (item.selectedProductColor) tags.push({ key: "Color", val: item.selectedProductColor });
  if (item.selectedProductSize)  tags.push({ key: "Size",  val: item.selectedProductSize  });
  return tags;
};

// ── Status Tracker ────────────────────────────────────────────────────────────
const STATUSES = ["confirmed", "processing", "shipped", "processing", "delivered"];
const STATUS_LABELS = {
  pending:    "Order Pending",
  confirmed:  "Order Confirmed",
  processing: "Out for Delivery",
  shipped:    "Shipped",
  delivered:  "Delivered",
};
const STATUS_STEPS = [
  { key: "confirmed",  label: "Order Confirmed" },
  { key: "processing-pre", label: "Processing" },
  { key: "shipped",    label: "Shipped" },
  { key: "processing", label: "Out for Delivery" },
  { key: "delivered",  label: "Delivered" },
];


// ── Invoice helpers ───────────────────────────────────────────────────────────
const generateReceiptText = (state) => {
  const { referenceSlug, orderId, cartItems = [], selectedAddr = {}, paymentMethod, partialCod, couponCode, couponDiscount, shippingCharge, tax } = state;
  const subtotal  = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount  = parseFloat(couponDiscount || 0);
  const shipping  = parseFloat(shippingCharge || partialCod?.shippingCharge || 0);
  const taxAmt    = parseFloat(tax || 0);
  const subtotalBeforeGst = subtotal - taxAmt;
  const grandTotal = subtotal - discount + shipping;

  const lines = [
    "=== JB House of Fashion — ORDER RECEIPT ===",
    `Order ID   : ${referenceSlug || orderId}`,
    `Date       : ${new Date().toLocaleDateString("en-IN")}`,
    "",
    ...cartItems.flatMap(i => {
      const itemLines = [`${i.name} x${i.quantity}  ₹${(i.price * i.quantity).toFixed(2)}`        ];
      const selectedProducts = i.selectedProducts ? (typeof i.selectedProducts === 'string' ? parseJson(i.selectedProducts) : i.selectedProducts) : null;
      if (Array.isArray(selectedProducts) && selectedProducts.length > 0) {
        selectedProducts.forEach(p => {
          const pName = p.name || "Product";
          const pVar = p.variantName ? ` (${p.variantName})` : "";
          const pQty = p.quantity ? ` x${p.quantity}` : "";
          itemLines.push(`  - Included: ${pName}${pVar}${pQty}`);
        });
      }
      return itemLines;
    }),
    "",
    "--- PAYMENT BREAKDOWN ---",
    `Subtotal   : ₹${subtotalBeforeGst.toFixed(2)}`,
    discount > 0 ? `Coupon (${couponCode})  : -₹${discount.toFixed(2)}` : null,
    `Shipping   : ₹${shipping.toFixed(2)}`,
    taxAmt > 0 ? `Tax/GST    : ₹${taxAmt.toFixed(2)}` : null,
    `Grand Total: ₹${grandTotal.toFixed(2)}`,
    "",
    "--- DELIVERY ADDRESS ---",
    selectedAddr.fullName,
    selectedAddr.street,
    `${selectedAddr.city}, ${selectedAddr.state} — ${selectedAddr.pincode}`,
    selectedAddr.phone,
    "",
    "Thank you for shopping with JB House of Fashion! 💝",
  ].filter(l => l !== null).join("\n");

  return lines;
};

const downloadReceipt = (state) => {
  const text = generateReceiptText(state);
  const blob = new Blob([text], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  const refSlug = state.referenceSlug || state.orderNumber || state.orderId;
  a.download = `KamaliGifts_Receipt_${refSlug}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Main Component ────────────────────────────────────────────────────────────
const OrderConfirmation = () => {
  const [openIncluded, setOpenIncluded] = useState({});
  const toggleIncluded = (idx) => setOpenIncluded(prev => ({ ...prev, [idx]: !prev[idx] }));
  const { state } = useLocation();
  const orderId       = state?.orderId       || "KG000000";
  const referenceSlug = state?.referenceSlug || state?.orderNumber || orderId; // Use slug for display
  const selectedAddr  = state?.selectedShippingAddr || state?.selectedAddr || {};
  const paymentMethod = state?.paymentMethod || "partial_cod";
  const cartItems     = state?.cartItems     || [];
  const estimatedDays = state?.estimatedDays || null;
  const partialCod    = state?.partialCod    || null;

  // NEW: additional state fields (backward-compatible — all optional)
  const orderStatus    = state?.orderStatus    || state?.status || "confirmed";
  const couponCode     = state?.couponCode     || null;
  const couponDiscount = parseFloat(state?.couponDiscount || 0);
  const shippingCharge = parseFloat(state?.shippingCharge || partialCod?.shippingCharge || 0);
  const tax            = parseFloat(state?.tax || 0);

  const subtotal   = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotalBeforeGst = subtotal - tax;
  const grandTotal = subtotal - couponDiscount + shippingCharge;

  const cartTotalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const PAYMENT_LABELS = {
    card:        "Credit / Debit Card",
    upi:         "UPI",
    netbanking:  "Net Banking",
    wallet:      "Wallet",
    cod:         "Cash on Delivery (COD)",
    razorpay:    "Online Payment (Razorpay)",
    partial_cod: "Partial COD (Delivery paid online)",
  };


  const dispatch = useDispatch();

useEffect(() => {
  // ── After successful order: refresh products + cart silently ──────────────
  // This ensures:
  //   1. Product stock in Redux reflects the newly depleted inventory
  //   2. Cart is cleared on server (in case it wasn't by checkout flow)
  //   3. Buy Now / Add to Cart buttons become disabled for OOS products
  //   4. Next Buy Now attempt uses fresh stock data → no empty checkout toast

  const syncAfterOrder = async () => {
    // 1. Refresh all product stock data silently in background
    refreshProductsSilently();

    // 2. Ensure checkout slice is cleared (guard for browser back-button case)
    dispatch(clearCheckout());

    // 3. Refresh cart from server (handles any edge-case where cart wasn't cleared)
    try {
      const res = await api.get("/cart");
      if (res.data && Array.isArray(res.data) && res.data.length === 0) {
        dispatch(replaceCart([]));
      }
    } catch (err) {
      // Non-fatal — cart sync failure should not break the confirmation page
      console.warn("[OrderConfirmation] Cart sync failed:", err.message);
    }
  };

  syncAfterOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // run once on mount

  const stateForDownload = {
    orderId, referenceSlug, cartItems, selectedAddr, paymentMethod,
    partialCod, couponCode, couponDiscount, shippingCharge, tax,
  };

  return (
    <Fragment>
      <SEO titleTemplate="Order Confirmed — JB House of Fashion" description="Your order has been placed successfully." />
      <LayoutOne headerTop="visible">
        <div className="container" style={{ padding: "30px 15px" }}>

          {/* ── Thank you banner (UNCHANGED) ─────────────────────────────── */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(223, 77, 129, 0.4) 0%, rgb(255, 232, 214) 100%)",
              borderRadius: 20,
              padding: "48px 32px",
              textAlign: "center",
              border: "1.5px solid #f0c9a0",
              marginBottom: 40,
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#000", marginBottom: 8 }}>
              Thank you, {selectedAddr?.fullName?.split(" ")[0] || "Customer"}!
            </h2>
            <p style={{ color: "#666", fontSize: 16, marginBottom: 20 }}>
              Your order has been placed successfully. We'll get it packed with love! 💝
            </p>
            <div
              style={{
                display: "inline-block",
                background: "rgba(223, 77, 129)",
                color: "#fff",
                borderRadius: 30,
                padding: "10px 32px",
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              Order ID: {referenceSlug}
            </div>
          </div>

          {/* ── NEW: Order Tracker ────────────────────────────────────────── */}
          {/* <OrderTracker currentStatus={orderStatus} /> */}

          {/* ── Order details grid ───────────────────────────────────────── */}
          <div className="row" style={{ marginBottom: 32 }}>

            {/* ── Items (UNCHANGED) ──────────────────────────────────────── */}
            <div className="col-lg-7 mb-3">
              <div style={cardStyle}>
                <h4 style={cardTitle}>📦 Items Ordered</h4>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "#f9f9f9",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em"
                }}>
                  <span>Product</span>
                  <span style={{ display: "flex", gap: 40 }}>
                    <span>Qty</span>
                    <span>Price</span>
                  </span>
                </div>
                <div>
                  {cartItems.map((item, i) => {
                      const variantTags = resolveVariantTags(item);
                      return (
                        <div key={i} style={{ borderBottom: "1px solid #f0f0f0", padding: "14px 0" }}>
                          {/* ── Item main row: img + name + qty + price (single div) ── */}
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
                              <img
                                src={getOrderItemImage(item.image, item.selectedVariant)}
                                alt=""
                                style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: variantTags.length ? 6 : 0 }}>
                                  {item.name}
                                </div>
{variantTags.length > 0 && (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
    {variantTags.filter(tag => tag.key !== "ColourHex").map((tag, ti) => {
      const isCol = isColourKey(tag.key);
      const hexAttr = variantTags.find(x => x.key === "ColourHex");
      const hasSwatch = isCol && hexAttr && isHexColor(hexAttr.val);
      const swatchColor = hasSwatch ? hexAttr.val : "";
      return (
        <span key={ti} style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          fontSize: 11, fontWeight: 500, color: "#555",
          background: "#f4f4f6", border: "1px solid #e4e4e8",
          borderRadius: 20, padding: "2px 9px", lineHeight: 1.6,
        }}>
          <span style={{ color: "#999", fontWeight: 400 }}>{tag.key}:</span>
          {hasSwatch && (
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '1px solid #dcdcdc',
                backgroundColor: swatchColor,
                display: 'inline-block',
                flexShrink: 0,
              }}
              title={tag.val}
            />
          )}
          <span>{tag.val}</span>
        </span>
      );
    })}
  </div>
)}

                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 40, flexShrink: 0, paddingTop: 2 }}>
                              <span style={{ fontSize: 14, color: "#374151", minWidth: 18, textAlign: "center" }}>{item.quantity}</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#111", minWidth: 64, textAlign: "right" }}>
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                </div>

                {/* ── NEW: Payment Breakdown (replaces simple Grand Total) ── */}
                <div style={{ marginTop: 12, paddingTop: 12 }}>
                  {/* Subtotal */}
                  <div style={breakdownRow}>
                    <span style={breakdownLabel}>Subtotal (before GST)</span>
                    <span style={breakdownValue}>₹{subtotalBeforeGst.toFixed(2)}</span>
                  </div>
                  {/* Coupon Discount */}
                  {couponDiscount > 0 && (
                    <div style={breakdownRow}>
                      <span style={breakdownLabel}>
                        Coupon Discount
                        {couponCode && <span style={{ fontSize: 11, color: "#27ae60", marginLeft: 6, fontWeight: 500 }}>({couponCode})</span>}
                      </span>
                      <span style={{ ...breakdownValue, color: "#27ae60", fontWeight: 700 }}>
                        −₹{couponDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {/* Shipping */}
                  <div style={breakdownRow}>
                    <span style={breakdownLabel}>Shipping Charges</span>
                    <span style={breakdownValue}>
                      {shippingCharge > 0 ? `₹${shippingCharge.toFixed(2)}` : <span style={{ color: "#27ae60" }}>Free</span>}
                    </span>
                  </div>
                  {/* Tax */}
                  {tax > 0 && (
                    <div style={breakdownRow}>
                      <span style={breakdownLabel}>Tax / GST</span>
                      <span style={breakdownValue}>₹{tax.toFixed(2)}</span>
                    </div>
                  )}
                  {/* Grand Total */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, marginTop: 8, paddingTop: 8, borderTop: "1px dashed #eee" }}>
                    <span>Grand Total</span>
                    <span style={{ color: "rgba(223, 77, 129)" }}>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* ── NEW: Coupon savings callout ───────────────────────── */}
                {/* {couponDiscount > 0 && couponCode && (
                  <div style={{
                    marginTop: 12, background: "linear-gradient(90deg,#f0fff4,#e6ffed)",
                    border: "1px solid #b2dfdb", borderRadius: 10,
                    padding: "10px 14px", fontSize: 13, color: "#27ae60", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ fontSize: 16 }}>🎉</span>
                    You saved <strong>₹{couponDiscount.toFixed(2)}</strong> using coupon <strong>{couponCode}</strong>!
                  </div>
                )} */}
              </div>

              {/* ── NEW: Coupon Information card ──────────────────────────── */}
              {couponDiscount > 0 && couponCode && (
                <div style={{ ...cardStyle, marginTop: 16,marginBottom: 16, background: "#f9fff9", border: "1px solid #c8e6c9" }}>
                  <h4 style={{ ...cardTitle, color: "#27ae60", borderBottomColor: "#c8e6c9" }}>🏷️ Coupon Applied</h4>
                  <div style={infoRow}>
                    <span style={infoLabel}>Code</span>
                    <span style={{
                      ...infoValue, background: "#e8f5e9", color: "#1b5e20",
                      padding: "3px 12px", borderRadius: 20, fontWeight: 700, fontSize: 13,
                      letterSpacing: 1, border: "1px solid #a5d6a7",
                    }}>
                      {couponCode}
                    </span>
                  </div>
                  <div style={infoRow}>
                    <span style={infoLabel}>Discount</span>
                    <span style={{ ...infoValue, color: "#27ae60", fontWeight: 700, fontSize: 15 }}>
                      −₹{couponDiscount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right column ─────────────────────────────────────────────── */}
            <div className="col-lg-5">

              {/* ── Delivery Details (UNCHANGED) ─────────────────────────── */}
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <h4 style={cardTitle}>🏠 Delivery Details</h4>
                <div style={infoRow}>
                  <span style={infoLabel}>Name</span>
                  <span style={infoValue}>{selectedAddr.fullName}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Phone</span>
                  <span style={infoValue}>{selectedAddr.phone}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Address</span>
                  <span style={infoValue}>
                    {selectedAddr.street}
                    {selectedAddr.apartment ? ", " + selectedAddr.apartment : ""},{" "}
                    {selectedAddr.city}, {selectedAddr.state} — {selectedAddr.pincode}
                  </span>
                </div>
                <div style={{ ...infoRow, marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
                  <span style={infoLabel}>🚚 Estimated delivery</span>
                  <span style={{ ...infoValue, fontWeight: 600, color: "#2e7d32" }}>
                    {estimatedDays
                      ? `${estimatedDays} ${estimatedDays == 1 ? "day" : "days"}`
                      : "3–7 business days"}
                  </span>
                </div>
              </div>

              {/* ── Payment (UNCHANGED base, new Partial COD callout added) ─ */}
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <h4 style={cardTitle}>💳 Payment</h4>
                <div style={infoRow}>
                  <span style={infoLabel}>Method</span>
                  <span style={infoValue}>{PAYMENT_LABELS[paymentMethod] || paymentMethod}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Status</span>
                  <span style={{
                    ...infoValue,
                    background: paymentMethod === "cod" ? "#fff3e0" : paymentMethod === "partial_cod" ? "#fff8e1" : "#e8f5e9",
                    color: paymentMethod === "cod" ? "rgba(223, 77, 129)" : paymentMethod === "partial_cod" ? "#e65100" : "#2e7d32",
                    padding: "2px 10px", borderRadius: 20, fontWeight: 600, fontSize: 12,
                  }}>
                    {paymentMethod === "cod" ? "Pay on Delivery" : paymentMethod === "partial_cod" ? "Delivery Charge Paid" : "Payment Received"}
                  </span>
                </div>
                {paymentMethod === "partial_cod" && partialCod && (
                  <>
                    <div style={infoRow}>
                      <span style={infoLabel}>Delivery paid</span>
                      <span style={{ ...infoValue, color: "#2e7d32", fontWeight: 700 }}>₹{partialCod.deliveryChargePaid?.toFixed(2)}</span>
                    </div>
                    <div style={{ ...infoRow, background: "#fff8e1", borderRadius: 8, padding: "8px 12px", marginTop: 8 }}>
                      <span style={{ ...infoLabel, color: "#e65100" }}>Due on delivery</span>
                      <span style={{ ...infoValue, color: "#e65100", fontWeight: 800, fontSize: 15 }}>₹{partialCod.amountDueOnDelivery?.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Notification note (UNCHANGED) ─────────────────────────────── */}
          <div
            style={{
              background: "#f0f8ff",
              border: "1px solid #bbdefb",
              borderRadius: 12,
              padding: "16px 20px",
              fontSize: 14,
              color: "#1565c0",
              marginBottom: 32,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 20 }}>📩</span>
            <span>
              A confirmation has been sent to{" "}
              <strong>{selectedAddr.email || "your registered email"}</strong>
            </span>
          </div>

          {/* ── NEW: Action Buttons (extended from existing CTA section) ──── */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to={process.env.PUBLIC_URL + "/my-account?tab=orders"}
              style={ctaBtnPrimary}
            >
              📋 View My Orders
            </Link>
            <Link
              to={process.env.PUBLIC_URL + "/shop"}
              style={{ ...ctaBtnOutline }}
            >
              🛍️ Continue Shopping
            </Link>
          </div>

        </div>
      </LayoutOne>
    </Fragment>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const cardStyle = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 14,
  padding: "20px 24px",
  marginBottom: 0,
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
};
const cardTitle = {
  fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#333",
  paddingBottom: 10, borderBottom: "1px solid #f0f0f0",
};
const thStyle = { padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "#888", textAlign: "left" };
const tdStyle  = { padding: "10px 12px", fontSize: 14 };
const infoRow  = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 16 };
const infoLabel = { fontSize: 13, color: "#888", flexShrink: 0 };
const infoValue = { fontSize: 13, color: "#333", fontWeight: 500, textAlign: "right" };

// NEW shared styles
const breakdownRow = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  marginBottom: 8, fontSize: 13,
};
const breakdownLabel = { color: "#666" };
const breakdownValue = { fontWeight: 600, color: "#333" };

const docBtnStyle = {
  background: "#f5f5f5", color: "#333", border: "1px solid #ddd",
  borderRadius: 20, padding: "8px 18px", fontSize: 13, fontWeight: 600,
  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
};

const ctaBtnPrimary = {
  background: "var(--theme-color)", color: "#fff",
  padding: "12px 28px", borderRadius: 30,
  fontWeight: 600, textDecoration: "none", fontSize: 14,
  display: "inline-flex", alignItems: "center", gap: 6,
};
const ctaBtnOutline = {
  background: "#fff", color: "var(--theme-color)",
  padding: "12px 28px", borderRadius: 30,
  fontWeight: 600, textDecoration: "none", fontSize: 14,
  border: "2px solid var(--theme-color)",
  display: "inline-flex", alignItems: "center", gap: 6,
};

export default OrderConfirmation;
