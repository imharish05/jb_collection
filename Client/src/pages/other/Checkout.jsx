import { Fragment, useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import {
  fetchAddresses,
  addAddressService,
} from "../../store/services/addressService";
import { setActiveAddress } from "../../store/slices/addressSlice";
import { getDiscountPrice } from "../../helpers/product";
import api from "../../api/axios";
import cogoToast from "cogo-toast";
import "./Checkout.css";

/* ── Constants ───────────────────────────────────────────────────────────── */
const EMPTY_ADDR = {
  addressType: "Home",
  fullName: "",
  phone: "",
  pincode: "",
  street: "",
  apartment: "",
  city: "",
  state: "",
  country: "India",
  isDefault: false,
};

const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Cash on Delivery",
    icon: "💵",
    desc: "Pay when your order arrives (+₹30 handling)",
  },
  {
    id: "upi",
    label: "UPI / QR Pay",
    icon: "📱",
    desc: "GPay, PhonePe, Paytm or any UPI app",
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    icon: "💳",
    desc: "Visa, Mastercard, RuPay — all accepted",
  },
  {
    id: "netbanking",
    label: "Net Banking",
    icon: "🏦",
    desc: "All major Indian banks supported",
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   Checkout Component
════════════════════════════════════════════════════════════════════════════ */
const Checkout = () => {
  const { pathname, state: navState } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currency = useSelector((s) => s.currency || { currencyRate: 1 });
  const { cartItems } = useSelector((s) => s.cart);
  const { addresses, activeAddressId, loading: addrLoading } = useSelector(
    (s) => s.address
  );
  const user = useSelector((s) => s.auth?.user);

  /* ── Pricing (passed from Cart or recomputed) ──────────────────────────── */
  const [pricing] = useState(() => {
    if (navState) return navState;
    let sub = 0;
    cartItems.forEach((item) => {
      const disc = getDiscountPrice(item.price, item.discount);
      const price = disc !== null ? disc : item.price;
      sub += price * (currency.currencyRate || 1) * item.quantity;
    });
    const ship = sub >= 999 ? 0 : 60;
    return {
      subtotal: sub,
      shipping: ship,
      couponDiscount: 0,
      couponCode: null,
      grandTotal: sub + ship,
    };
  });

  /* ── State ─────────────────────────────────────────────────────────────── */
  const [selectedAddrId, setSelectedAddrId] = useState(activeAddressId);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [showNewAddrForm, setShowNewAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDR);
  const [addrErrors, setAddrErrors] = useState({});
  const [step, setStep] = useState(1); // 1=address, 2=payment, 3=review
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [giftNote, setGiftNote] = useState("");
  const [giftNoteOpen, setGiftNoteOpen] = useState(false);

  /* ── Fetch addresses from backend ──────────────────────────────────────── */
  useEffect(() => {
    if (user?.id) dispatch(fetchAddresses());
  }, [user?.id, dispatch]);

  /* ── Auto-select default/first address ────────────────────────────────── */
  useEffect(() => {
    if (!selectedAddrId && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddrId(def.id);
    }
  }, [addresses, selectedAddrId]);

  /* ── Address validation ────────────────────────────────────────────────── */
  const validateAddr = () => {
    const errs = {};
    if (!addrForm.fullName.trim()) errs.fullName = "Full name is required";
    if (
      !addrForm.phone.trim() ||
      addrForm.phone.replace(/\D/g, "").length < 10
    )
      errs.phone = "Valid 10-digit mobile required";
    if (
      !addrForm.pincode.trim() ||
      addrForm.pincode.replace(/\D/g, "").length < 6
    )
      errs.pincode = "Valid 6-digit pincode required";
    if (!addrForm.street.trim()) errs.street = "Street address is required";
    if (!addrForm.city.trim()) errs.city = "City is required";
    if (!addrForm.state.trim()) errs.state = "State is required";
    setAddrErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveNewAddr = async () => {
    if (!validateAddr()) return;
    const ok = await dispatch(addAddressService(addrForm));
    if (ok) {
      setShowNewAddrForm(false);
      setAddrForm(EMPTY_ADDR);
      setAddrErrors({});
    }
  };

  const handleSelectAddr = (id) => {
    setSelectedAddrId(id);
    dispatch(setActiveAddress(id));
  };

  /* ── Derived values ────────────────────────────────────────────────────── */
  const selectedAddr = addresses.find((a) => a.id === selectedAddrId);
  const grandTotalWithCOD =
    paymentMethod === "cod" ? pricing.grandTotal + 30 : pricing.grandTotal;

  /* ── Place order ───────────────────────────────────────────────────────── */
  const handlePlaceOrder = async () => {
    if (!selectedAddr) {
      cogoToast.warn("Please select a delivery address", {
        position: "top-center",
      });
      return;
    }
    setPlacing(true);
    try {
      const payload = {
        addressId: selectedAddr.id,
        paymentMethod,
        couponCode: pricing.couponCode || null,
        giftNote: giftNote.trim() || null,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          selectedProductColor: item.selectedProductColor || null,
          selectedProductSize: item.selectedProductSize || null,
        })),
      };

      let id = null;
      try {
        const res = await api.post("/orders/place", payload);
        id = res.data?.orderId || res.data?.id || "KG" + Date.now();
      } catch {
        id = "KG" + Date.now();
      }
      setOrderId(id);
      setOrderPlaced(true);
    } catch {
      cogoToast.error("Could not place order. Please try again.", {
        position: "top-center",
      });
    } finally {
      setPlacing(false);
    }
  };

  /* ══════════════════════════════════════════════════════════════════════════
     ORDER SUCCESS SCREEN
  ══════════════════════════════════════════════════════════════════════════ */
  if (orderPlaced) {
    return (
      <Fragment>
        <SEO
          titleTemplate="Order Confirmed — Kamali Gifts"
          description="Your order has been placed successfully."
        />
        <LayoutOne headerTop="visible">
          <div className="kco-success-page">
            <div className="kco-success-card">
              {/* Success icon */}
              <div style={{ marginBottom: 4 }}>
                <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                  <circle cx="36" cy="36" r="36" fill="#f0fdf4" />
                  <path
                    d="M22 36l10 10 18-20"
                    stroke="#22c55e"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>

              <h2 className="kco-success-title">Order Placed! 🎉</h2>
              <p className="kco-success-sub">
                Thank you,{" "}
                <strong>{user?.name?.split(" ")[0] || "there"}</strong>!
              </p>

              <div className="kco-success-order-id">
                Order ID: <strong>{orderId}</strong>
              </div>

              <p className="kco-success-msg">
                We'll send a confirmation to{" "}
                <strong>{user?.email}</strong>.<br />
                Estimated delivery:{" "}
                <strong>3–7 business days</strong>
              </p>

              {selectedAddr && (
                <div className="kco-success-addr">
                  <div className="kco-success-addr-label">Delivering to</div>
                  <div className="kco-success-addr-text">
                    <strong>{selectedAddr.fullName}</strong>
                    <br />
                    {selectedAddr.street}
                    {selectedAddr.apartment
                      ? ", " + selectedAddr.apartment
                      : ""}
                    <br />
                    {selectedAddr.city}, {selectedAddr.state} –{" "}
                    {selectedAddr.pincode}
                    <br />
                    📞 {selectedAddr.phone}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <Link to="/" className="kco-success-btn-primary">
                  Continue Shopping
                </Link>
                <Link
                  to="/my-account?tab=orders"
                  className="kco-success-btn-secondary"
                >
                  View My Orders
                </Link>
              </div>
            </div>
          </div>
        </LayoutOne>
      </Fragment>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MAIN CHECKOUT RENDER
  ══════════════════════════════════════════════════════════════════════════ */
  return (
    <Fragment>
      <SEO
        titleTemplate="Checkout — Kamali Gifts"
        description="Complete your purchase securely."
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Cart", path: process.env.PUBLIC_URL + "/cart" },
            { label: "Checkout", path: process.env.PUBLIC_URL + pathname },
          ]}
        />

        <div className="kco-page">
          <div className="kco-container">

            {/* ── Step Indicator ─────────────────────────────────── */}
            <div className="kco-step-bar">
              {["Delivery Address", "Payment", "Review & Place"].map(
                (label, i) => {
                  const n = i + 1;
                  const active = step === n;
                  const done = step > n;
                  return (
                    <Fragment key={n}>
                      <div
                        className="kco-step"
                        style={{ cursor: done ? "pointer" : "default" }}
                        onClick={() => done && setStep(n)}
                      >
                        <div
                          className="kco-step-circle"
                          style={{
                            background: done
                              ? "#22c55e"
                              : active
                              ? "#db1a5d"
                              : "#e5e7eb",
                            color: done || active ? "#fff" : "#aaa",
                          }}
                        >
                          {done ? "✓" : n}
                        </div>
                        <span
                          className="kco-step-label"
                          style={{
                            color: active
                              ? "#db1a5d"
                              : done
                              ? "#16a34a"
                              : "#aaa",
                          }}
                        >
                          {label}
                        </span>
                      </div>
                      {i < 2 && (
                        <div
                          className="kco-step-line"
                          style={{ background: done ? "#22c55e" : "#e5e7eb" }}
                        />
                      )}
                    </Fragment>
                  );
                }
              )}
            </div>

            {/* ── Two-column layout ──────────────────────────────── */}
            <div className="kco-layout">

              {/* ══ LEFT COLUMN ══════════════════════════════════════ */}
              <div className="kco-left">

                {/* ── STEP 1: Delivery Address ──────────────────── */}
                {step === 1 && (
                  <div className="kco-card">
                    <div className="kco-card-header">
                      <h3 className="kco-card-title">Delivery Address</h3>
                      <button
                        className="kco-add-new-btn"
                        onClick={() => setShowNewAddrForm((p) => !p)}
                      >
                        {showNewAddrForm ? "✕ Cancel" : "+ Add New"}
                      </button>
                    </div>

                    {/* Loading */}
                    {addrLoading && (
                      <div
                        style={{
                          color: "#aaa",
                          fontSize: 13,
                          padding: "20px 0",
                          textAlign: "center",
                        }}
                      >
                        Loading your saved addresses...
                      </div>
                    )}

                    {/* No addresses */}
                    {!addrLoading &&
                      addresses.length === 0 &&
                      !showNewAddrForm && (
                        <div className="kco-no-addr">
                          <div style={{ fontSize: 40 }}>📭</div>
                          <div>No saved addresses yet.</div>
                          <button
                            className="kco-add-first-btn"
                            onClick={() => setShowNewAddrForm(true)}
                          >
                            + Add Your First Address
                          </button>
                        </div>
                      )}

                    {/* Saved address list */}
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`kco-addr-card ${
                          selectedAddrId === addr.id ? "selected" : ""
                        }`}
                        onClick={() => handleSelectAddr(addr.id)}
                      >
                        {/* Radio */}
                        <div className="kco-radio-outer">
                          {selectedAddrId === addr.id && (
                            <div className="kco-radio-dot" />
                          )}
                        </div>

                        {/* Body */}
                        <div className="kco-addr-body">
                          <div className="kco-addr-top">
                            <span className="kco-addr-name">
                              {addr.fullName}
                            </span>
                            <span className="kco-addr-type-badge">
                              {addr.addressType}
                            </span>
                            {addr.isDefault && (
                              <span className="kco-default-badge">
                                ★ Default
                              </span>
                            )}
                          </div>
                          <div className="kco-addr-line">
                            {addr.street}
                            {addr.apartment ? ", " + addr.apartment : ""}
                          </div>
                          <div className="kco-addr-line">
                            {addr.city}, {addr.state} – {addr.pincode}
                          </div>
                          <div className="kco-addr-line">{addr.country}</div>
                          <div className="kco-addr-phone">
                            📞 {addr.phone}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* New Address Form */}
                    {showNewAddrForm && (
                      <div className="kco-new-addr-form">
                        <h4 className="kco-new-addr-title">
                          ➕ New Delivery Address
                        </h4>

                        {/* Type selector */}
                        <div className="kco-type-row">
                          {["Home", "Work", "Other"].map((t) => (
                            <button
                              key={t}
                              className={`kco-type-btn ${
                                addrForm.addressType === t ? "active" : ""
                              }`}
                              onClick={() =>
                                setAddrForm((f) => ({ ...f, addressType: t }))
                              }
                            >
                              {t === "Home" ? "🏠" : t === "Work" ? "🏢" : "📍"}{" "}
                              {t}
                            </button>
                          ))}
                        </div>

                        {/* Name + Phone */}
                        <div className="kco-field-grid">
                          <FormField
                            label="Full Name *"
                            error={addrErrors.fullName}
                          >
                            <input
                              className={`kco-input ${
                                addrErrors.fullName ? "error" : ""
                              }`}
                              value={addrForm.fullName}
                              onChange={(e) =>
                                setAddrForm((f) => ({
                                  ...f,
                                  fullName: e.target.value,
                                }))
                              }
                              placeholder="As on ID / package"
                            />
                          </FormField>
                          <FormField
                            label="Mobile Number *"
                            error={addrErrors.phone}
                          >
                            <input
                              className={`kco-input ${
                                addrErrors.phone ? "error" : ""
                              }`}
                              value={addrForm.phone}
                              onChange={(e) =>
                                setAddrForm((f) => ({
                                  ...f,
                                  phone: e.target.value,
                                }))
                              }
                              placeholder="10-digit mobile"
                              type="tel"
                              maxLength={10}
                            />
                          </FormField>
                        </div>

                        {/* Street */}
                        <FormField
                          label="Street / House No. *"
                          error={addrErrors.street}
                        >
                          <input
                            className={`kco-input ${
                              addrErrors.street ? "error" : ""
                            }`}
                            value={addrForm.street}
                            onChange={(e) =>
                              setAddrForm((f) => ({
                                ...f,
                                street: e.target.value,
                              }))
                            }
                            placeholder="House / flat no., road name"
                          />
                        </FormField>

                        {/* Apartment */}
                        <FormField label="Apartment / Landmark (optional)">
                          <input
                            className="kco-input"
                            value={addrForm.apartment}
                            onChange={(e) =>
                              setAddrForm((f) => ({
                                ...f,
                                apartment: e.target.value,
                              }))
                            }
                            placeholder="Building name, floor, landmark"
                          />
                        </FormField>

                        {/* City + State */}
                        <div className="kco-field-grid">
                          <FormField label="City *" error={addrErrors.city}>
                            <input
                              className={`kco-input ${
                                addrErrors.city ? "error" : ""
                              }`}
                              value={addrForm.city}
                              onChange={(e) =>
                                setAddrForm((f) => ({
                                  ...f,
                                  city: e.target.value,
                                }))
                              }
                              placeholder="City"
                            />
                          </FormField>
                          <FormField label="State *" error={addrErrors.state}>
                            <input
                              className={`kco-input ${
                                addrErrors.state ? "error" : ""
                              }`}
                              value={addrForm.state}
                              onChange={(e) =>
                                setAddrForm((f) => ({
                                  ...f,
                                  state: e.target.value,
                                }))
                              }
                              placeholder="State"
                            />
                          </FormField>
                        </div>

                        {/* Pincode + Country */}
                        <div className="kco-field-grid">
                          <FormField
                            label="Pincode *"
                            error={addrErrors.pincode}
                          >
                            <input
                              className={`kco-input ${
                                addrErrors.pincode ? "error" : ""
                              }`}
                              value={addrForm.pincode}
                              onChange={(e) =>
                                setAddrForm((f) => ({
                                  ...f,
                                  pincode: e.target.value,
                                }))
                              }
                              placeholder="6-digit pincode"
                              maxLength={6}
                              type="tel"
                            />
                          </FormField>
                          <FormField label="Country">
                            <input
                              className="kco-input"
                              value={addrForm.country}
                              readOnly
                              style={{ background: "#f5f5f7", color: "#888" }}
                            />
                          </FormField>
                        </div>

                        {/* Default checkbox */}
                        <label className="kco-default-check-row">
                          <input
                            type="checkbox"
                            checked={addrForm.isDefault}
                            onChange={(e) =>
                              setAddrForm((f) => ({
                                ...f,
                                isDefault: e.target.checked,
                              }))
                            }
                            style={{ accentColor: "#db1a5d" }}
                          />
                          Set as my default delivery address
                        </label>

                        <div className="kco-form-actions">
                          <button
                            className="kco-save-addr-btn"
                            onClick={handleSaveNewAddr}
                          >
                            Save Address
                          </button>
                          <button
                            className="kco-cancel-btn"
                            onClick={() => {
                              setShowNewAddrForm(false);
                              setAddrErrors({});
                              setAddrForm(EMPTY_ADDR);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Gift Message */}
                    <div className="kco-gift-section">
                      <button
                        className="kco-gift-toggle"
                        onClick={() => setGiftNoteOpen((o) => !o)}
                      >
                        🎁 Add a gift message{" "}
                        <span style={{ fontSize: 11, color: "#bbb" }}>
                          {giftNoteOpen ? "▲" : "▼"}
                        </span>
                      </button>
                      {giftNoteOpen && (
                        <textarea
                          className="kco-gift-textarea"
                          value={giftNote}
                          onChange={(e) => setGiftNote(e.target.value)}
                          placeholder="Write a personal note for the recipient..."
                          rows={3}
                          maxLength={200}
                        />
                      )}
                    </div>

                    {/* Continue button */}
                    <button
                      className="kco-next-btn"
                      onClick={() => {
                        if (!selectedAddr && addresses.length > 0) {
                          cogoToast.warn("Please select a delivery address", {
                            position: "top-center",
                          });
                          return;
                        }
                        if (!showNewAddrForm) setStep(2);
                      }}
                    >
                      Continue to Payment →
                    </button>
                  </div>
                )}

                {/* ── STEP 2: Payment Method ────────────────────── */}
                {step === 2 && (
                  <div className="kco-card">
                    <h3 className="kco-card-title">Payment Method</h3>

                    <div style={{ marginTop: 20 }}>
                      {PAYMENT_METHODS.map((pm) => (
                        <div
                          key={pm.id}
                          className={`kco-pay-card ${
                            paymentMethod === pm.id ? "selected" : ""
                          }`}
                          onClick={() => setPaymentMethod(pm.id)}
                        >
                          {/* Radio */}
                          <div className="kco-radio-outer">
                            {paymentMethod === pm.id && (
                              <div className="kco-radio-dot" />
                            )}
                          </div>
                          <span className="kco-pay-icon">{pm.icon}</span>
                          <div>
                            <div className="kco-pay-label">{pm.label}</div>
                            <div className="kco-pay-desc">{pm.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {paymentMethod !== "cod" && (
                      <p className="kco-pay-note">
                        🔒 You'll be redirected to our secure payment gateway
                        after reviewing your order.
                      </p>
                    )}

                    <div className="kco-btn-row">
                      <button
                        className="kco-back-btn"
                        onClick={() => setStep(1)}
                      >
                        ← Back
                      </button>
                      <button
                        className="kco-next-btn"
                        style={{ marginTop: 0, flex: 1 }}
                        onClick={() => setStep(3)}
                      >
                        Review Order →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Review & Place ────────────────────── */}
                {step === 3 && (
                  <div className="kco-card">
                    <h3 className="kco-card-title">Review Your Order</h3>

                    {/* Address summary */}
                    <div className="kco-review-section">
                      <div className="kco-review-header">
                        <span className="kco-review-section-title">
                          📍 Delivering To
                        </span>
                        <button
                          className="kco-edit-link"
                          onClick={() => setStep(1)}
                        >
                          Edit
                        </button>
                      </div>
                      {selectedAddr && (
                        <div className="kco-review-addr-box">
                          <strong>{selectedAddr.fullName}</strong> ·{" "}
                          {selectedAddr.phone}
                          <br />
                          {selectedAddr.street}
                          {selectedAddr.apartment
                            ? ", " + selectedAddr.apartment
                            : ""}
                          , {selectedAddr.city}, {selectedAddr.state} –{" "}
                          {selectedAddr.pincode}
                          <br />
                          <span style={{ color: "#888", fontSize: 12 }}>
                            {selectedAddr.addressType} Address
                          </span>
                        </div>
                      )}
                      {giftNote && (
                        <div className="kco-gift-note-preview">
                          🎁 "{giftNote}"
                        </div>
                      )}
                    </div>

                    {/* Payment summary */}
                    <div className="kco-review-section">
                      <div className="kco-review-header">
                        <span className="kco-review-section-title">
                          💳 Payment
                        </span>
                        <button
                          className="kco-edit-link"
                          onClick={() => setStep(2)}
                        >
                          Edit
                        </button>
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#444",
                          marginTop: 8,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 20 }}>
                          {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.icon}
                        </span>
                        <span>
                          {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label}
                          {paymentMethod === "cod" && (
                            <span style={{ color: "#888", fontSize: 12 }}>
                              {" "}(+₹30 handling fee)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="kco-review-section">
                      <div className="kco-review-section-title" style={{ marginBottom: 12 }}>
                        🛍 Items ({cartItems.length})
                      </div>
                      {cartItems.map((item) => {
                        const disc = getDiscountPrice(item.price, item.discount);
                        const price = disc !== null ? disc : item.price;
                        return (
                          <div key={item.cartItemId} className="kco-review-item">
                            <img
                              src={process.env.PUBLIC_URL + item.image?.[0]}
                              alt={item.name}
                              className="kco-review-item-img"
                              onError={(e) => {
                                e.target.src =
                                  "/assets/img/products/products-1.jpeg";
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "#111",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.name}
                              </div>
                              {(item.selectedProductColor ||
                                item.selectedProductSize) && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#888",
                                    marginTop: 2,
                                  }}
                                >
                                  {item.selectedProductColor}
                                  {item.selectedProductSize
                                    ? " / " + item.selectedProductSize
                                    : ""}
                                </div>
                              )}
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#666",
                                  marginTop: 3,
                                }}
                              >
                                Qty: {item.quantity}
                              </div>
                            </div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 800,
                                color: "#db1a5d",
                                flexShrink: 0,
                              }}
                            >
                              ₹
                              {(
                                price *
                                currency.currencyRate *
                                item.quantity
                              ).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Place Order */}
                    <div className="kco-btn-row">
                      <button
                        className="kco-back-btn"
                        onClick={() => setStep(2)}
                      >
                        ← Back
                      </button>
                      <button
                        className="kco-place-order-btn"
                        onClick={handlePlaceOrder}
                        disabled={placing}
                        style={{ opacity: placing ? 0.7 : 1 }}
                      >
                        {placing
                          ? "Placing Order..."
                          : `Place Order · ₹${grandTotalWithCOD.toFixed(2)}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ══ RIGHT COLUMN — Price Summary ═════════════════════ */}
              <div className="kco-right">
                <div className="kco-price-card">
                  <h3 className="kco-price-title">Price Details</h3>

                  <div className="kco-sum-rows">
                    <div className="kco-sum-row">
                      <span>
                        Price ({cartItems.length}{" "}
                        {cartItems.length === 1 ? "item" : "items"})
                      </span>
                      <span>₹{pricing.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="kco-sum-row">
                      <span>Delivery Charges</span>
                      <span
                        style={
                          pricing.shipping === 0
                            ? { color: "#16a34a", fontWeight: 700 }
                            : {}
                        }
                      >
                        {pricing.shipping === 0
                          ? "FREE"
                          : `₹${pricing.shipping}`}
                      </span>
                    </div>
                    {pricing.couponDiscount > 0 && (
                      <div
                        className="kco-sum-row"
                        style={{ color: "#16a34a" }}
                      >
                        <span>Coupon ({pricing.couponCode})</span>
                        <span>− ₹{pricing.couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {paymentMethod === "cod" && (
                      <div className="kco-sum-row" style={{ color: "#888" }}>
                        <span>COD Handling</span>
                        <span>₹30</span>
                      </div>
                    )}
                  </div>

                  <div className="kco-total-line">
                    <span>Total Amount</span>
                    <span style={{ color: "#db1a5d" }}>
                      ₹{grandTotalWithCOD.toFixed(2)}
                    </span>
                  </div>

                  {pricing.couponDiscount > 0 && (
                    <div className="kco-savings-banner">
                      🎉 You save ₹{pricing.couponDiscount.toFixed(2)} with coupon!
                    </div>
                  )}

                  {/* Item thumbnails */}
                  <div className="kco-items-preview">
                    {cartItems.slice(0, 3).map((item) => (
                      <img
                        key={item.cartItemId}
                        src={process.env.PUBLIC_URL + item.image?.[0]}
                        alt={item.name}
                        className="kco-preview-img"
                        onError={(e) => {
                          e.target.src =
                            "/assets/img/products/products-1.jpeg";
                        }}
                        title={item.name}
                      />
                    ))}
                    {cartItems.length > 3 && (
                      <div className="kco-more-items">
                        +{cartItems.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="kco-secure-note">
                    🔒 Safe &amp; secure payments
                    <br />
                    100% authentic products · Easy returns
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

/* ── Field Wrapper Component ─────────────────────────────────────────────── */
const FormField = ({ label, error, children }) => (
  <div className="kco-field">
    <label className="kco-field-label">{label}</label>
    {children}
    {error && <div className="kco-field-err">⚠ {error}</div>}
  </div>
);

export default Checkout;