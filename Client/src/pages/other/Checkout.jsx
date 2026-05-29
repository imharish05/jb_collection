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
import { deleteAllFromCart, replaceCart } from "../../store/slices/cart-slice";
import { getDiscountPrice } from "../../helpers/product";
import { getImgUrl } from "../../helpers/imageUrl";
import api from "../../api/axios";
import cogoToast from "cogo-toast";
import "./Checkout.css";
import { useRef } from "react";

// Resolve cart item image (array or JSON string) → full URL
const parseJson = (v) => { try { return JSON.parse(v); } catch { return v; } };
const resolveCartImg = (img) => {
  const arr = Array.isArray(img) ? img : parseJson(img);
  const raw = Array.isArray(arr) ? arr[0] : (typeof img === "string" ? img : null);
  return raw ? getImgUrl(raw) : "/assets/img/products/products-1.jpeg";
};

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
  // {
  //   id: "cod",
  //   label: "Cash on Delivery",
  //   icon: "💵",
  //   desc: "Pay when your order arrives (+₹77 handling)",
  // },
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
  const newAddrFormRef = useRef(null);
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
      // item.price = final salesPrice from backend — no discount calculation
      sub += parseFloat(item.price || 0) * (currency.currencyRate || 1) * item.quantity;
    });
    const ship = 0;
    return {
      subtotal: sub,
      shipping: ship,
      couponDiscount: 0,
      couponCode: null,
      grandTotal: sub + ship,
    };
  });

  /* ── State ─────────────────────────────────────────────────────────────── */
  const [selectedShippingAddrId, setSelectedShippingAddrId] = useState(activeAddressId);
  const [selectedBillingAddrId, setSelectedBillingAddrId] = useState(null);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [showNewAddrForm, setShowNewAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDR);
  const [addrErrors, setAddrErrors] = useState({});
  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [giftNoteOpen, setGiftNoteOpen] = useState(false);
  const [shippingCollapsed, setShippingCollapsed] = useState(false);
  const [billingCollapsed, setBillingCollapsed] = useState(false);

  /* ── Fetch addresses from backend ──────────────────────────────────────── */
  useEffect(() => {
    if (user?.id) dispatch(fetchAddresses());
  }, [user?.id, dispatch]);

  /* ── Auto-select default/first address ────────────────────────────────── */
  useEffect(() => {
    if (addresses.length === 0) return;
    const def = addresses.find((a) => a.isDefault) || addresses[0];
    setSelectedShippingAddrId((prev) => prev || def.id);
    if (billingSameAsShipping) {
      setSelectedBillingAddrId((prev) => prev || selectedShippingAddrId || def.id);
    } else {
      setSelectedBillingAddrId((prev) => prev || def.id);
    }
  }, [addresses, billingSameAsShipping, selectedShippingAddrId]);

  /* ── Address validation ────────────────────────────────────────────────── */
  const validateAddr = () => {
    const errs = {};
    if (!addrForm.fullName.trim()) errs.fullName = "Full name is required";
    if (!addrForm.phone.trim() || addrForm.phone.replace(/\D/g, "").length < 10)
      errs.phone = "Valid 10-digit mobile required";
    if (!addrForm.pincode.trim() || addrForm.pincode.replace(/\D/g, "").length < 6)
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

  const handleSelectShippingAddr = (id) => {
    setSelectedShippingAddrId(id);
    dispatch(setActiveAddress(id));
    if (billingSameAsShipping) setSelectedBillingAddrId(id);
  };

  const handleSelectBillingAddr = (id) => {
    setSelectedBillingAddrId(id);
  };

  const handleToggleBillingSame = (checked) => {
    setBillingSameAsShipping(checked);
    if (checked) setSelectedBillingAddrId(selectedShippingAddrId);
  };

  /* ── Derived values ────────────────────────────────────────────────────── */
  const selectedShippingAddr = addresses.find((a) => a.id === selectedShippingAddrId);
  const selectedBillingAddr = billingSameAsShipping
    ? selectedShippingAddr
    : addresses.find((a) => a.id === selectedBillingAddrId);
  const grandTotalWithCOD = pricing.grandTotal;

  const [razorpayOrderId, setRazorpayOrderId] = useState(null);
  const [processingRazorpay, setProcessingRazorpay] = useState(false);

  /* ── Place order ───────────────────────────────────────────────────────── */
  const handlePlaceOrder = async () => {
    if (!selectedShippingAddr) {
      cogoToast.warn("Please select a shipping address", { position: "top-center" });
      return;
    }
    if (!billingSameAsShipping && !selectedBillingAddr) {
      cogoToast.warn("Please select a billing address", { position: "top-center" });
      return;
    }

    // ── Pre-order stock revalidation ──────────────────────────────────────
    try {
      const revalPayload = {
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
      const revalRes = await api.post("/cart/revalidate", revalPayload);
      const { hasChanges, items: revalResults } = revalRes.data;

      if (hasChanges) {
        const blockers = revalResults.filter(r =>
          r.adjustedQty === 0 && ["OOS", "Discontinued", "Unavailable"].includes(r.status)
        );
        const updatedCart = cartItems.map(item => {
          const result = revalResults.find(r => r.cartItemId === item.cartItemId);
          if (!result || result.status === "OK") return item;
          if (result.adjustedQty === 0) return null;
          return { ...item, quantity: result.adjustedQty };
        }).filter(Boolean);
        dispatch(replaceCart(updatedCart));

        if (blockers.length > 0) {
          cogoToast.error(
            "Some items are no longer available. Please review your cart.",
            { position: "top-center" }
          );
        } else {
          cogoToast.warn(
            "Some quantities were adjusted due to stock changes. Please review your cart.",
            { position: "top-center" }
          );
        }
        navigate(`${process.env.PUBLIC_URL}/cart`);
        return;
      }
    } catch (revalErr) {
      // Non-blocking: log and proceed if revalidation API fails
      console.warn("Pre-order revalidation failed (proceeding):", revalErr);
    }

    setPlacing(true);
    try {
      const payload = {
        items: cartItems.map((item) => ({
          productId: item.id,
          selectedVariantId: item.selectedVariantId || null,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          selectedProductColor: item.selectedProductColor || null,
          selectedProductSize: item.selectedProductSize || null,
        })),
        totalAmount: pricing.grandTotal,
        shippingAddressId: selectedShippingAddrId,
        billingAddressId: selectedBillingAddrId,
        paymentMethod,
        couponCode: pricing.couponCode || null,
        notes: giftNote.trim() || null,
      };

      const res = await api.post("/orders", payload);
      const id = res.data?.id || res.data?.orderId || "KG" + Date.now();

      if (paymentMethod !== "cod") {
        initRazorpayPayment(id);
      } else {
        dispatch(deleteAllFromCart());
        setTimeout(() => {
          navigate(`/order-confirmation`, {
            replace: true,
            state: {
              orderId: id,
              selectedShippingAddr,
              billingAddress: selectedBillingAddr,
              paymentMethod,
              cartItems,
            },
          });
        }, 1000);
      }
    } catch (err) {
      cogoToast.error(err.response?.data?.message || "Could not place order. Please try again.", {
        position: "top-center",
      });
    } finally {
      setPlacing(false);
    }
  };

  /* ── Initialize Razorpay Payment ───────────────────────────────────────── */
  const initRazorpayPayment = async (dbOrderId) => {
    try {
      setProcessingRazorpay(true);

      const paymentRes = await api.post("/payment/create-order", {
        amount: pricing.grandTotal,
        currency: "INR",
      });

      const rzpOrderId = paymentRes.data.orderId;
      setRazorpayOrderId(rzpOrderId);

      if (!window.Razorpay) {
        cogoToast.error("Razorpay SDK not loaded", { position: "top-center" });
        return;
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        order_id: rzpOrderId,
        amount: Math.round(pricing.grandTotal * 100),
        currency: "INR",
        name: "Kamali Gifts",
        description: `Order ${dbOrderId}`,
        customer_notify: 1,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: selectedShippingAddr?.phone || "",
        },
        theme: { color: "#f15a24" },
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              dbOrderId,
            });

            if (verifyRes.data.success) {
              cogoToast.success("Payment successful!", { position: "top-center" });
              dispatch(deleteAllFromCart());
              setTimeout(() => {
                navigate(`/order-confirmation`, {
                  replace: true,
                  state: {
                    orderId: dbOrderId,
                    selectedShippingAddr,
                    billingAddress: selectedBillingAddr,
                    paymentMethod,
                    cartItems,
                  },
                });
              }, 1500);
            }
          } catch (verifyErr) {
            cogoToast.error("Payment verification failed", { position: "top-center" });
            console.error("Verification error:", verifyErr);
          }
        },
        modal: {
          ondismiss: () => {
            cogoToast.warn("Payment cancelled", { position: "top-center" });
            setProcessingRazorpay(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      cogoToast.error("Could not initialize payment", { position: "top-center" });
      console.error("Razorpay init error:", err);
    } finally {
      setProcessingRazorpay(false);
    }
  };

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
              {["Shipping & Billing", "Payment", "Review & Place"].map((label, i) => {
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
                          background: done ? "#22c55e" : active ? "#db1a5d" : "#e5e7eb",
                          color: done || active ? "#fff" : "#aaa",
                        }}
                      >
                        {done ? "✓" : n}
                      </div>
                      <span
                        className="kco-step-label"
                        style={{ color: active ? "#db1a5d" : done ? "#16a34a" : "#aaa" }}
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
              })}
            </div>

            {/* ── Two-column layout ──────────────────────────────── */}
            <div className="kco-layout">

              {/* ══ LEFT COLUMN ══════════════════════════════════════ */}
              <div className="kco-left">

                {/* ── STEP 1: Shipping & Billing Address ──────────────────── */}
                {step === 1 && (
                  <div className="kco-card">
                    <div className="kco-card-header">
                      <h3 className="kco-card-title">Shipping & Billing Address</h3>
                      <button
                        className="kco-add-new-btn"
                        onClick={() => {
  setShowNewAddrForm((p) => {
    if (!p) {
      setTimeout(() => {
        newAddrFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    }
    return !p;
  });
}}
                      >
                        {showNewAddrForm ? "✕ Cancel" : "+ Add New"}
                      </button>
                    </div>

                    {/* Loading */}
                    {addrLoading && (
                      <div style={{ color: "#aaa", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
                        Loading your saved addresses...
                      </div>
                    )}

                    {/* No addresses */}
                    {!addrLoading && addresses.length === 0 && !showNewAddrForm && (
                      <div className="kco-no-addr">
                        <div style={{ fontSize: 40 }}>📭</div>
                        <div>No saved addresses yet.</div>
                        <button className="kco-add-first-btn" onClick={() => setShowNewAddrForm(true)}>
                          + Add Your First Address
                        </button>
                      </div>
                    )}

                    {/* ── Shipping Panel ── */}
                    {addresses.length > 0 && (
                      <div className="kco-address-sections">

                        {/* Shipping */}
                        <div className="kco-address-panel">
                          <div className="kco-panel-header-row">
                            <p className="kco-section-label">Shipping Address</p>
                            <button
                              className="kco-collapse-btn"
                              onClick={() => setShippingCollapsed((s) => !s)}
                              aria-label={shippingCollapsed ? "Expand shipping" : "Collapse shipping"}
                            >
                              <span className={`kco-chevron ${shippingCollapsed ? "collapsed" : ""}`}>‹</span>
                            </button>
                          </div>
                          {!shippingCollapsed && addresses.map((addr) => (
                            <div
                              key={addr.id}
                              className={`kco-addr-card ${selectedShippingAddrId === addr.id ? "selected" : ""}`}
                              onClick={() => handleSelectShippingAddr(addr.id)}
                            >
                              <div className="kco-radio-outer">
                                {selectedShippingAddrId === addr.id && <div className="kco-radio-dot" />}
                              </div>
                              <div className="kco-addr-body">
                                <div className="kco-addr-top">
                                  <span className="kco-addr-name">{addr.fullName}</span>
                                  <span className="kco-addr-type-badge">{addr.addressType}</span>
                                  {addr.isDefault && <span className="kco-default-badge">★ Default</span>}
                                </div>
                                <div className="kco-addr-line">
                                  {addr.street}{addr.apartment ? ", " + addr.apartment : ""}
                                </div>
                                <div className="kco-addr-line">
                                  {addr.city}, {addr.state} – {addr.pincode}
                                </div>
                                <div className="kco-addr-line">{addr.country}</div>
                                <div className="kco-addr-phone">📞 {addr.phone}</div>
                              </div>
                            </div>
                          ))}
                          {shippingCollapsed && selectedShippingAddr && (
                            <div className="kco-collapsed-summary">
                              <strong>{selectedShippingAddr.fullName}</strong>
                              {" · "}{selectedShippingAddr.city}, {selectedShippingAddr.state} – {selectedShippingAddr.pincode}
                            </div>
                          )}
                        </div>

                        {/* ── Billing Divider (checkbox centered between panels) ── */}
                        <div className="kco-billing-divider">
                          <div className="kco-billing-divider-line" />
                          <label className="kco-same-billing-pill">
                            <input
                              type="checkbox"
                              checked={billingSameAsShipping}
                              onChange={(e) => handleToggleBillingSame(e.target.checked)}
                            />
                            Billing same as shipping
                          </label>
                          <div className="kco-billing-divider-line" />
                        </div>

                        {/* Billing */}
                        <div className={`kco-address-panel kco-billing-panel ${billingSameAsShipping ? "disabled" : ""}`}>
                          <div className="kco-panel-header-row">
                            <p className="kco-section-label">Billing Address</p>
                            {!billingSameAsShipping && (
                              <button
                                className="kco-collapse-btn"
                                onClick={() => setBillingCollapsed((b) => !b)}
                                aria-label={billingCollapsed ? "Expand billing" : "Collapse billing"}
                              >
                                <span className={`kco-chevron ${billingCollapsed ? "collapsed" : ""}`}>‹</span>
                              </button>
                            )}
                          </div>

                          {/* Disabled overlay when same as shipping */}
                          {billingSameAsShipping && (
                            <div className="kco-billing-disabled-overlay">
                              <span className="kco-billing-disabled-msg">
                                ✓ Same as shipping address
                              </span>
                            </div>
                          )}

                          {!billingSameAsShipping && !billingCollapsed && addresses.map((addr) => (
                            <div
                              key={addr.id}
                              className={`kco-addr-card ${selectedBillingAddrId === addr.id ? "selected" : ""}`}
                              onClick={() => handleSelectBillingAddr(addr.id)}
                            >
                              <div className="kco-radio-outer">
                                {selectedBillingAddrId === addr.id && <div className="kco-radio-dot" />}
                              </div>
                              <div className="kco-addr-body">
                                <div className="kco-addr-top">
                                  <span className="kco-addr-name">{addr.fullName}</span>
                                  <span className="kco-addr-type-badge">{addr.addressType}</span>
                                  {addr.isDefault && <span className="kco-default-badge">★ Default</span>}
                                </div>
                                <div className="kco-addr-line">
                                  {addr.street}{addr.apartment ? ", " + addr.apartment : ""}
                                </div>
                                <div className="kco-addr-line">
                                  {addr.city}, {addr.state} – {addr.pincode}
                                </div>
                                <div className="kco-addr-line">{addr.country}</div>
                                <div className="kco-addr-phone">📞 {addr.phone}</div>
                              </div>
                            </div>
                          ))}
                          {!billingSameAsShipping && billingCollapsed && selectedBillingAddr && (
                            <div className="kco-collapsed-summary">
                              <strong>{selectedBillingAddr.fullName}</strong>
                              {" · "}{selectedBillingAddr.city}, {selectedBillingAddr.state} – {selectedBillingAddr.pincode}
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                    {/* New Address Form */}
                    {showNewAddrForm && (
                     <div className="kco-new-addr-form" ref={newAddrFormRef}>

                        <h4 className="kco-new-addr-title">➕ New Address</h4>

                        <div className="kco-type-row">
                          {["Home", "Work", "Other"].map((t) => (
                            <button
                              key={t}
                              className={`kco-type-btn ${addrForm.addressType === t ? "active" : ""}`}
                              onClick={() => setAddrForm((f) => ({ ...f, addressType: t }))}
                            >
                              {t === "Home" ? "🏠" : t === "Work" ? "🏢" : "📍"} {t}
                            </button>
                          ))}
                        </div>

                        <div className="kco-field-grid">
                          <FormField label="Full Name *" error={addrErrors.fullName}>
                            <input
                              className={`kco-input ${addrErrors.fullName ? "error" : ""}`}
                              value={addrForm.fullName}
                              onChange={(e) => setAddrForm((f) => ({ ...f, fullName: e.target.value }))}
                              placeholder="As on ID / package"
                            />
                          </FormField>
                          <FormField label="Mobile Number *" error={addrErrors.phone}>
                            <input
                              className={`kco-input ${addrErrors.phone ? "error" : ""}`}
                              value={addrForm.phone}
                              onChange={(e) => setAddrForm((f) => ({ ...f, phone: e.target.value }))}
                              placeholder="10-digit mobile"
                              type="tel"
                              maxLength={10}
                            />
                          </FormField>
                        </div>

                        <FormField label="Street / House No. *" error={addrErrors.street}>
                          <input
                            className={`kco-input ${addrErrors.street ? "error" : ""}`}
                            value={addrForm.street}
                            onChange={(e) => setAddrForm((f) => ({ ...f, street: e.target.value }))}
                            placeholder="House / flat no., road name"
                          />
                        </FormField>

                        <FormField label="Apartment / Landmark (optional)">
                          <input
                            className="kco-input"
                            value={addrForm.apartment}
                            onChange={(e) => setAddrForm((f) => ({ ...f, apartment: e.target.value }))}
                            placeholder="Building name, floor, landmark"
                          />
                        </FormField>

                        <div className="kco-field-grid">
                          <FormField label="City *" error={addrErrors.city}>
                            <input
                              className={`kco-input ${addrErrors.city ? "error" : ""}`}
                              value={addrForm.city}
                              onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))}
                              placeholder="City"
                            />
                          </FormField>
                          <FormField label="State *" error={addrErrors.state}>
                            <input
                              className={`kco-input ${addrErrors.state ? "error" : ""}`}
                              value={addrForm.state}
                              onChange={(e) => setAddrForm((f) => ({ ...f, state: e.target.value }))}
                              placeholder="State"
                            />
                          </FormField>
                        </div>

                        <div className="kco-field-grid">
                          <FormField label="Pincode *" error={addrErrors.pincode}>
                            <input
                              className={`kco-input ${addrErrors.pincode ? "error" : ""}`}
                              value={addrForm.pincode}
                              onChange={(e) => setAddrForm((f) => ({ ...f, pincode: e.target.value }))}
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

                        <label className="kco-default-check-row" style={{display : "flex"}}>
                          <input
                            type="checkbox"
                            checked={addrForm.isDefault}
                            onChange={(e) => setAddrForm((f) => ({ ...f, isDefault: e.target.checked }))}
                            style={{ accentColor: "#db1a5d"}}
                          />
                          Set as my default address
                        </label>

                        <div className="kco-form-actions">
                          <button className="kco-save-addr-btn btn-small" onClick={handleSaveNewAddr}>
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
                        <span style={{ fontSize: 11, color: "#bbb" }}>{giftNoteOpen ? "▲" : "▼"}</span>
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
                      disabled={
                        !selectedShippingAddr ||
                        (!billingSameAsShipping && !selectedBillingAddr)
                      }
                      style={{
                        opacity:
                          !selectedShippingAddr || (!billingSameAsShipping && !selectedBillingAddr)
                            ? 0.5
                            : 1,
                        cursor:
                          !selectedShippingAddr || (!billingSameAsShipping && !selectedBillingAddr)
                            ? "not-allowed"
                            : "pointer",
                      }}
                      onClick={() => {
                        if (!selectedShippingAddr) {
                          cogoToast.warn("Please select a shipping address", { position: "top-center" });
                          return;
                        }
                        if (!billingSameAsShipping && !selectedBillingAddr) {
                          cogoToast.warn("Please select a billing address", { position: "top-center" });
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
                          className={`kco-pay-card ${paymentMethod === pm.id ? "selected" : ""}`}
                          onClick={() => setPaymentMethod(pm.id)}
                        >
                          <div className="kco-radio-outer">
                            {paymentMethod === pm.id && <div className="kco-radio-dot" />}
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
                        🔒 You'll be redirected to our secure payment gateway after reviewing your order.
                      </p>
                    )}

                    <div className="kco-btn-row">
                      <button className="kco-back-btn" onClick={() => setStep(1)}>← Back</button>
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
                        <span className="kco-review-section-title">📍 Delivering To</span>
                        <button className="kco-edit-link" onClick={() => setStep(1)}>Edit</button>
                      </div>
                      {selectedShippingAddr && (
                        <div className="kco-review-addr-box">
                          <strong>{selectedShippingAddr.fullName}</strong> · {selectedShippingAddr.phone}
                          <br />
                          {selectedShippingAddr.street}
                          {selectedShippingAddr.apartment ? ", " + selectedShippingAddr.apartment : ""},
                          {" "}{selectedShippingAddr.city}, {selectedShippingAddr.state} – {selectedShippingAddr.pincode}
                          <br />
                          <span style={{ color: "#888", fontSize: 12 }}>Shipping Address</span>
                        </div>
                      )}
                      {selectedBillingAddr && (
                        <div className="kco-review-addr-box" style={{ marginTop: 12 }}>
                          <strong>{selectedBillingAddr.fullName}</strong> · {selectedBillingAddr.phone}
                          <br />
                          {selectedBillingAddr.street}
                          {selectedBillingAddr.apartment ? ", " + selectedBillingAddr.apartment : ""},
                          {" "}{selectedBillingAddr.city}, {selectedBillingAddr.state} – {selectedBillingAddr.pincode}
                          <br />
                          <span style={{ color: "#888", fontSize: 12 }}>Billing Address</span>
                        </div>
                      )}
                      {giftNote && (
                        <div className="kco-gift-note-preview">🎁 "{giftNote}"</div>
                      )}
                    </div>

                    {/* Payment summary */}
                    <div className="kco-review-section">
                      <div className="kco-review-header">
                        <span className="kco-review-section-title">💳 Payment</span>
                        <button className="kco-edit-link" onClick={() => setStep(2)}>Edit</button>
                      </div>
                      <div style={{ fontSize: 13, color: "#444", marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20 }}>
                          {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.icon}
                        </span>
                        <span>
                          {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label}
                          {/* COD handling label — disabled
                          {paymentMethod === "cod" && (
                            <span style={{ color: "#888", fontSize: 12 }}> (+₹30 handling fee)</span>
                          )}
                          */}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="kco-review-section">
                      <div className="kco-review-section-title" style={{ marginBottom: 12 }}>
                        🛍 Items ({cartItems.length})
                      </div>
                      {cartItems.map((item) => {
                        const price = parseFloat(item.price || 0);
                        return (
                          <div key={item.cartItemId} className="kco-review-item">
                            <img
                              src={resolveCartImg(item.image)}
                              alt={item.name}
                              className="kco-review-item-img"
                              onError={(e) => { e.target.src = "/assets/img/products/products-1.jpeg"; }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.name}
                              </div>
                              {(item.selectedProductColor || item.selectedProductSize) && (
                                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                                  {item.selectedProductColor}
                                  {item.selectedProductSize ? " / " + item.selectedProductSize : ""}
                                </div>
                              )}
                              <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>
                                Qty: {item.quantity}
                              </div>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#db1a5d", flexShrink: 0 }}>
                              ₹{(price * currency.currencyRate * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Place Order */}
                    <div className="kco-btn-row">
                      <button className="kco-back-btn" onClick={() => setStep(2)}>← Back</button>
                      <button
                        className="kco-place-order-btn"
                        onClick={handlePlaceOrder}
                        disabled={placing || !selectedShippingAddr || !paymentMethod}
                        style={{
                          opacity: placing || !selectedShippingAddr || !paymentMethod ? 0.5 : 1,
                          cursor: !selectedShippingAddr || !paymentMethod ? "not-allowed" : "pointer",
                        }}
                        title={
                          !selectedShippingAddr
                            ? "Please select a shipping address first"
                            : !paymentMethod
                            ? "Please select a payment method"
                            : ""
                        }
                      >
                        {placing ? "Placing Order..." : `Place Order · ₹${grandTotalWithCOD.toFixed(2)}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ══ RIGHT COLUMN — Order Summary ═════════════════════ */}
              <div className="kco-right">
                <div className="kco-price-card">
                  <h3 className="kco-price-title">
                    Order Summary
                    <span className="kco-price-title-count">
                      {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                    </span>
                  </h3>

                  {/* ── Item Cards ── */}
                  <div className="kco-item-list">
                    {cartItems.map((item) => {
                      const price = parseFloat(item.price || 0);
                      const mrp   = parseFloat(item.selectedVariant?.mrp || item.variation?.[0]?.mrp || 0);
                      const hasMrp = mrp > 0 && mrp > price;
                      const discount = hasMrp ? Math.round((1 - price / mrp) * 100) : 0;

                      // Variant label: use selectedVariantName or build from variation attributes
                      const variantLabel = (() => {
                        if (item.selectedVariantName) return item.selectedVariantName;
                        const v = Array.isArray(item.variation) ? item.variation[0] : null;
                        if (v?.variantName) return v.variantName;
                        if (v?.attributes?.length) {
                          return v.attributes.map(a => `${a.key}: ${a.value}`).join(" · ");
                        }
                        if (item.selectedProductColor || item.selectedProductSize) {
                          return [item.selectedProductColor, item.selectedProductSize].filter(Boolean).join(" / ");
                        }
                        return null;
                      })();

                      return (
                        <div className="kco-item-card" key={item.cartItemId}>
                          <div className="kco-item-img-wrap">
                            <img
                              src={resolveCartImg(item.image)}
                              alt={item.name}
                              className="kco-item-img"
                              onError={(e) => { e.target.src = "/assets/img/products/products-1.jpeg"; }}
                            />
                            <span className="kco-item-qty-badge">{item.quantity}</span>
                          </div>
                          <div className="kco-item-info">
                            <div className="kco-item-name">{item.name}</div>
                            {variantLabel && (
                              <div className="kco-item-variant">{variantLabel}</div>
                            )}
                            <div className="kco-item-price-row">
                              <span className="kco-item-price">₹{(price * item.quantity).toFixed(2)}</span>
                              {hasMrp && (
                                <span className="kco-item-mrp">₹{(mrp * item.quantity).toFixed(2)}</span>
                              )}
                              {discount > 0 && (
                                <span className="kco-item-disc">{discount}% off</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Price Breakdown ── */}
                  <div className="kco-sum-rows">
                    <div className="kco-sum-row">
                      <span>Subtotal</span>
                      <span>₹{pricing.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="kco-sum-row">
                      <span>Delivery</span>
                      <span style={pricing.shipping === 0 ? { color: "#16a34a", fontWeight: 700 } : {}}>
                        {pricing.shipping === 0 ? "FREE" : `₹${pricing.shipping}`}
                      </span>
                    </div>
                    {pricing.couponDiscount > 0 && (
                      <div className="kco-sum-row kco-sum-row--green">
                        <span>Coupon ({pricing.couponCode})</span>
                        <span>− ₹{pricing.couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="kco-total-line">
                    <span>Total</span>
                    <span style={{ color: "#db1a5d" }}>₹{grandTotalWithCOD.toFixed(2)}</span>
                  </div>

                  {pricing.couponDiscount > 0 && (
                    <div className="kco-savings-banner">
                      🎉 You save ₹{pricing.couponDiscount.toFixed(2)} with coupon!
                    </div>
                  )}

                  <div className="kco-secure-note">
                    🔒 Safe &amp; secure payments · 100% authentic
                    <br />Easy returns · Packed with love 💝
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