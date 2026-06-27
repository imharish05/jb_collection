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
import { clearCheckout, replaceCheckoutItems } from "../../store/slices/checkout-slice";
import { getDiscountPrice, renderVariantLabel, isColourKey, isHexColor } from "../../helpers/product";
import { getImgUrl } from "../../helpers/imageUrl";
import api from "../../api/axios";
import cogoToast from "cogo-toast";
import "./Checkout.css";
import { useRef } from "react";

// ── Helper: calculate total cart weight (in kg) ─────────────────────────────
const calculateTotalWeight = (items) => {
  let total = 0;
  (items || []).forEach((item) => {
    // Default to 0.2 kg (200g) if shippingWeight is not set or is 0
    const w = parseFloat(item.shippingWeight) || 0.2;
    total += w * item.quantity;
  });
  return parseFloat(total.toFixed(3));
};

// ── Helper: check shipping rates ─────────────────────────────────
const checkShippingServiceability = async (pincode, orderValue, weight = 0.5) => {
  try {
    const cod = true;
    const res = await api.get("/shipping/rates", {
      params: { pincode, weight, cod },
    });
    return {
      serviceable: res.data.serviceable,
      shippingCharge: res.data.charge || 0,
      courier: res.data.courier || null,
      estimatedDays: res.data.estimatedDays || null,
      codAvailable: cod,
      allCouriers: res.data.allCouriers || [],
    };
  } catch (err) {
    console.error("[Checkout] Shipping rates check failed:", err.message);
    return null;
  }
};

// Resolve cart item image (array or JSON string) → full URL
const parseJson = (v) => { try { return JSON.parse(v); } catch { return v; } };
const resolveCartImg = (img) => {
  const arr = Array.isArray(img) ? img : parseJson(img);
  const raw = Array.isArray(arr) ? arr[0] : (typeof img === "string" ? img : null);
  return raw ? getImgUrl(raw) : "/assets/img/products/products-1.jpeg";
};

const toAmount = (value) => Number.parseFloat(value || 0) || 0;

const GST_RATE = 0.18;

const withGrandTotal = (pricing) => {
  const subtotal = toAmount(pricing.subtotal);
  const shipping = toAmount(pricing.shipping);
  const couponDiscount = toAmount(pricing.couponDiscount);

  // Since subtotal is inclusive of GST, back-calculate exclusive subtotal and gstAmount
  const subtotalBeforeGst = subtotal / (1 + GST_RATE);
  const gstAmount = subtotal - subtotalBeforeGst;

  return {
    ...pricing,
    subtotal,
    subtotalBeforeGst,
    gstAmount,
    shipping,
    couponDiscount,
    grandTotal: Math.max(0, subtotal + shipping - couponDiscount),
  };
};

const getCouponLabel = (coupon) => {
  if (!coupon) return "";
  const value = toAmount(coupon.value);
  return coupon.type === "percent" ? `${value}% off` : `Rs. ${value} off`;
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
  {
    id: "partial_cod",
    label: "Partial COD",
    icon: "🔀",
    desc: "Pay delivery charge now · Product cost on delivery",
  },
  {
    id: "razorpay",
    label: "Pay Online",
    icon: "💳",
    desc: "UPI, Credit / Debit Card, Net Banking, Wallet — all accepted",
  },
];

/* ── Variant attr helpers (same as Cart) ────────────────────────────────── */
const safeAttrs = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
};

const buildVariantAttrs = (item) => {
  // 1. selectedVariant.attributes (preferred)
  const resolvedVariant =
    item.selectedVariant ||
    (item.selectedVariantId && Array.isArray(item.Variants)
      ? item.Variants.find(v => Number(v.id) === Number(item.selectedVariantId)) || null
      : null);

  if (resolvedVariant) {
    const attrs = safeAttrs(resolvedVariant.attributes).filter(
      a => a.key && a.value && a.key !== "Custom Note"
    );
    if (attrs.length) return attrs.map(a => ({ key: a.key, val: a.value }));
  }

  // 2. variation[0].attributes
  const v = Array.isArray(item.variation) ? item.variation[0] : null;
  const rawAttrs = v?.attributes;
  const attrsArray = Array.isArray(rawAttrs)
    ? rawAttrs
    : typeof rawAttrs === "string"
    ? (() => { try { return JSON.parse(rawAttrs); } catch { return []; } })()
    : [];
  if (attrsArray.length) return attrsArray.map(a => ({ key: a.key, val: a.value }));

  // 3. Parse selectedVariantName string
  if (item.selectedVariantName?.includes(":")) {
    const seen = new Set();
    return item.selectedVariantName.split("·").map(part => {
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
  if (item.selectedVariantName) return [{ key: "Variant", val: item.selectedVariantName }];

  // 4. selectedProductColor / selectedProductSize fallback
  const fallback = [];
  if (item.selectedProductColor) fallback.push({ key: "Colour", val: item.selectedProductColor });
  if (item.selectedProductSize) fallback.push({ key: "Size", val: item.selectedProductSize });
  return fallback;
};

/* ── Colour swatch chip renderer (shared by both columns) ───────────────── */
const VariantChips = ({ attrs, fontSize = 10, swatchSize = 12 }) => {
  if (!attrs || attrs.length === 0) return null;
  return (
    <div 
      className="kco-variant-chips-container"
      style={{ 
        display: "flex", 
        flexWrap: "nowrap", 
        gap: 6,
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        width: "100%"
      }}
    >
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
              padding: "3px 9px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontWeight: 500,
              whiteSpace: "nowrap",
              flexShrink: 0
            }}
          >
            <span>{a.key}:</span>
            {hasPreview ? (
              // Color: show swatch only, no hex text
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
              // Non-color: show value text
              <span>{displayVal}</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Checkout Component
════════════════════════════════════════════════════════════════════════════ */
const Checkout = () => {
  const newAddrFormRef = useRef(null);
  const navigatingRef = useRef(false);
  const { pathname, state: navState } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currency = useSelector((s) => s.currency || { currencyRate: 1 });
  const { cartItems } = useSelector((s) => s.cart);
  const { items: checkoutItems, source: checkoutSource, expiresAt: checkoutExpiresAt } = useSelector((s) => s.checkout);
  const { addresses, activeAddressId, loading: addrLoading } = useSelector(
    (s) => s.address
  );
  const user = useSelector((s) => s.auth?.user);

  /* ── Route & Session Protection ── */
  useEffect(() => {
    if (navigatingRef.current) return;
    if (!checkoutItems || checkoutItems.length === 0) {
      cogoToast.warn("Your checkout session is empty.", { position: "top-center" });
      navigate(`${process.env.PUBLIC_URL}/cart`);
    } else if (checkoutExpiresAt && Date.now() > checkoutExpiresAt) {
      cogoToast.error("Your checkout session has expired.", { position: "top-center" });
      dispatch(clearCheckout());
      navigate(`${process.env.PUBLIC_URL}/cart`);
    }
  }, [checkoutItems, checkoutExpiresAt, navigate, dispatch]);

  /* ── Pricing ── */
  useEffect(() => {
    let sub = 0;
    (checkoutItems || []).forEach((item) => {
      sub += parseFloat(item.price || 0) * (currency.currencyRate || 1) * item.quantity;
    });

    if (navState) {
      const base = sub || navState.subtotal || 0;
      setShippingPricing((prev) => withGrandTotal({
        ...prev,
        ...navState,
        subtotal: base,
        couponDiscount: navState.couponCode ? navState.couponDiscount : prev.couponDiscount,
        couponCode: navState.couponCode || prev.couponCode || null,
        couponType: navState.couponType || prev.couponType || null,
        couponValue: navState.couponValue ?? prev.couponValue ?? null,
        coupon: navState.coupon || prev.coupon || null,
      }));
    } else {
      setShippingPricing((prev) => withGrandTotal({
        ...prev,
        subtotal: sub,
      }));
    }
  }, [checkoutItems, currency.currencyRate, navState]);

  /* ── State ── */
  const [selectedShippingAddrId, setSelectedShippingAddrId] = useState(activeAddressId);
  const [selectedBillingAddrId, setSelectedBillingAddrId] = useState(null);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("partial_cod");
  const [showNewAddrForm, setShowNewAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDR);
  const [addrErrors, setAddrErrors] = useState({});
  const step = 1;
  const [placing, setPlacing] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [shippingCollapsed, setShippingCollapsed] = useState(false);
  const [billingCollapsed, setBillingCollapsed] = useState(false);

  const [shippingInfo, setShippingInfo] = useState(null);
  const [courierModalOpen, setCourierModalOpen] = useState(false);
  const [checkingServiceability, setCheckingServiceability] = useState(false);
  const [shippingPricing, setShippingPricing] = useState({
    subtotal: 0,
    subtotalBeforeGst: 0,
    gstAmount: 0,
    gstRate: GST_RATE,
    shipping: 0,
    couponDiscount: 0,
    couponCode: null,
    couponType: null,
    couponValue: null,
    coupon: null,
    grandTotal: 0,
  });
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

  /* ── Fetch addresses ── */
  useEffect(() => {
    if (user?.id) dispatch(fetchAddresses());
  }, [user?.id, dispatch]);

  useEffect(() => {
    let mounted = true;
    const loadActiveCoupons = async () => {
      setLoadingCoupons(true);
      try {
        const res = await api.get("/coupons/active");
        if (mounted) setActiveCoupons(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.warn("[Checkout] Active coupons fetch failed:", err.message);
        if (mounted) setActiveCoupons([]);
      } finally {
        if (mounted) setLoadingCoupons(false);
      }
    };
    loadActiveCoupons();
    return () => { mounted = false; };
  }, []);

  /* ── Check shipping rates when address changes ── */
  useEffect(() => {
    const checkShipping = async () => {
      if (!selectedShippingAddr?.pincode) {
        setShippingInfo(null);
        return;
      }
      setCheckingServiceability(true);
      const totalWeight = calculateTotalWeight(checkoutItems || []);
      const result = await checkShippingServiceability(
        selectedShippingAddr.pincode,
        shippingPricing.subtotal,
        totalWeight
      );
      setCheckingServiceability(false);
      if (result) {
        setShippingInfo(result);
        const newShipping = result.serviceable ? (result.shippingCharge || 0) : 0;
        setShippingPricing((prev) => withGrandTotal({ ...prev, shipping: newShipping }));
      } else {
        setShippingInfo(null);
      }
    };
    checkShipping();
  }, [selectedShippingAddrId, shippingPricing.subtotal, checkoutItems]);

  const handleSelectCourier = (selected) => {
    setShippingInfo((prev) => ({
      ...prev,
      shippingCharge: selected.charge,
      courier: selected.name,
      estimatedDays: selected.days,
    }));
    setShippingPricing((prev) => withGrandTotal({ ...prev, shipping: selected.charge }));
    setCourierModalOpen(false);
  };

  /* ── Mount-time inventory & price revalidation ── */
  useEffect(() => {
    if (!checkoutItems || checkoutItems.length === 0) return;
    const revalidateCheckoutOnMount = async () => {
      try {
        const revalPayload = {
          items: checkoutItems.map(item => ({
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
          const updatedCheckout = checkoutItems.map(item => {
            const result = revalResults.find(r => r.cartItemId === item.cartItemId);
            if (!result || result.status === "OK") return item;
            if (result.adjustedQty === 0) return null;
            return { ...item, quantity: result.adjustedQty };
          }).filter(Boolean);
          dispatch(replaceCheckoutItems(updatedCheckout));
          if (checkoutSource === "cart") {
            const updatedCart = cartItems.map(item => {
              const result = revalResults.find(r => r.cartItemId === item.cartItemId);
              if (!result || result.status === "OK") return item;
              if (result.adjustedQty === 0) return null;
              return { ...item, quantity: result.adjustedQty };
            }).filter(Boolean);
            dispatch(replaceCart(updatedCart));
          }
          if (blockers.length > 0) {
            cogoToast.error(
              "Some items in your order are no longer available. Redirecting to cart...",
              { position: "top-center" }
            );
            setTimeout(() => { navigate(`${process.env.PUBLIC_URL}/cart`); }, 2000);
          } else {
            cogoToast.warn(
              "Some quantities in your order were adjusted due to stock changes.",
              { position: "top-center" }
            );
          }
        }
      } catch (err) {
        console.warn("Mount-time checkout revalidation failed:", err);
      }
    };
    revalidateCheckoutOnMount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Auto-select default/first address ── */
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

  /* ── Address validation ── */
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

  const handleSelectBillingAddr = (id) => { setSelectedBillingAddrId(id); };

  const handleToggleBillingSame = (checked) => {
    setBillingSameAsShipping(checked);
    if (checked) setSelectedBillingAddrId(selectedShippingAddrId);
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError("Enter a coupon code."); return; }
    if (shippingPricing.subtotal <= 0) { setCouponError("Add items before applying a coupon."); return; }
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await api.post("/coupons/validate", { code, order_total: shippingPricing.subtotal });
      const data = res.data || {};
      if (!data.valid) throw new Error(data.message || "Coupon could not be applied.");
      const couponCode = data.coupon_code || code;
      const discount = toAmount(data.discount);
      const coupon = { code: couponCode, discount, type: data.type || null, value: data.value ?? null };
      setShippingPricing((prev) => withGrandTotal({
        ...prev,
        couponDiscount: discount,
        couponCode,
        couponType: data.type || null,
        couponValue: data.value ?? null,
        coupon,
      }));
      setCouponInput(couponCode);
      setCouponOpen(true);
    } catch (err) {
      setCouponError(
        err.response?.data?.message || err.message || "This coupon is not valid for your order."
      );
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setShippingPricing((prev) => withGrandTotal({
      ...prev,
      couponDiscount: 0,
      couponCode: null,
      couponType: null,
      couponValue: null,
      coupon: null,
    }));
    setCouponInput("");
    setCouponError("");
  };

  /* ── Derived values ── */
  const selectedShippingAddr = addresses.find((a) => a.id === selectedShippingAddrId);
  const selectedBillingAddr = billingSameAsShipping
    ? selectedShippingAddr
    : addresses.find((a) => a.id === selectedBillingAddrId);

  // Partial COD is available only if:
  // 1. COD is available for this pincode
  // 2. Every item in the cart has isPartialCodAvailable === true (on the product)
  const allItemsPartialCodEligible = (checkoutItems || []).every(
    (item) => item.isPartialCodAvailable !== false
  );
  const partialCodGloballyAvailable = shippingInfo?.codAvailable === true && allItemsPartialCodEligible;

  const availablePaymentMethods = PAYMENT_METHODS.filter(
    (pm) => pm.id !== "partial_cod" || partialCodGloballyAvailable
  );

  // When Partial COD becomes unavailable, fall back to razorpay
  useEffect(() => {
    if (paymentMethod === "partial_cod" && !partialCodGloballyAvailable) {
      const fallback = availablePaymentMethods.find(p => p.id !== "partial_cod")?.id || "razorpay";
      setPaymentMethod(fallback);
    }
  }, [partialCodGloballyAvailable, paymentMethod]);

  // When Partial COD becomes available again, switch to it
  useEffect(() => {
    if (partialCodGloballyAvailable && paymentMethod === "razorpay") {
      setPaymentMethod("partial_cod");
    }
  }, [partialCodGloballyAvailable]);

  const grandTotalWithCOD = shippingPricing.grandTotal;

  const [razorpayOrderId, setRazorpayOrderId] = useState(null);
  const [processingRazorpay, setProcessingRazorpay] = useState(false);

  /* ── Place order ── */
  const handlePlaceOrder = async () => {
    if (!selectedShippingAddr) {
      cogoToast.warn("Please select a shipping address", { position: "top-center" });
      return;
    }
    if (!billingSameAsShipping && !selectedBillingAddr) {
      cogoToast.warn("Please select a billing address", { position: "top-center" });
      return;
    }

    try {
      const revalPayload = {
        items: checkoutItems.map(item => ({
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
        const updatedCheckout = checkoutItems.map(item => {
          const result = revalResults.find(r => r.cartItemId === item.cartItemId);
          if (!result || result.status === "OK") return item;
          if (result.adjustedQty === 0) return null;
          return { ...item, quantity: result.adjustedQty };
        }).filter(Boolean);
        dispatch(replaceCheckoutItems(updatedCheckout));
        if (checkoutSource === "cart") {
          const updatedCart = cartItems.map(item => {
            const result = revalResults.find(r => r.cartItemId === item.cartItemId);
            if (!result || result.status === "OK") return item;
            if (result.adjustedQty === 0) return null;
            return { ...item, quantity: result.adjustedQty };
          }).filter(Boolean);
          dispatch(replaceCart(updatedCart));
        }
        if (blockers.length > 0) {
          cogoToast.error("Some items are no longer available. Please review your order.", { position: "top-center" });
        } else {
          cogoToast.warn("Some quantities were adjusted due to stock changes. Please review your order.", { position: "top-center" });
        }
        navigate(`${process.env.PUBLIC_URL}/cart`);
        return;
      }
    } catch (revalErr) {
      console.warn("Pre-order revalidation failed (proceeding):", revalErr);
    }

    // Build order payload (used for both COD/partial_cod and prepaid)
    const orderPayload = {
      items: checkoutItems.map((item) => ({
        productId: item.id,
        selectedVariantId: item.selectedVariantId || null,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        image: item.image || null,
        selectedProductColor: item.selectedProductColor || null,
        selectedProductSize: item.selectedProductSize || null,
        isCombo: item.isCombo || false,
        rootComboId: item.rootComboId || null,
        childComboId: item.childComboId || null,
        comboName: item.isCombo ? item.name : null,
        comboType: item.comboType || null,
        selectedProducts: item.selectedProducts || null,
        customisationDetails: item.customisationDetails || null,
      })),
      totalAmount: shippingPricing.grandTotal,
      shippingAddressId: selectedShippingAddrId,
      billingAddressId: selectedBillingAddrId,
      paymentMethod,
      couponCode: shippingPricing.couponCode || null,
      couponDiscount: shippingPricing.couponDiscount || 0,
      couponType: shippingPricing.couponType || null,
      couponValue: shippingPricing.couponValue || null,
      notes: giftNote.trim() || null,
      shippingCharge: shippingInfo?.shippingCharge || 0,
      taxAmount: shippingPricing.gstAmount || 0,
      gstAmount: shippingPricing.gstAmount || 0,
      courier: shippingInfo?.courier || null,
      estimatedDeliveryDays: shippingInfo?.estimatedDays || null,
    };

    if (paymentMethod === "partial_cod") {
      // Partial COD: create DB order first, then open Razorpay for advance payment
      setPlacing(true);
      try {
        const res = await api.post("/orders", orderPayload);
        const createdOrder = res.data || {};
        const id = createdOrder.id || createdOrder.orderId || "KG" + Date.now();
        const referenceSlug = createdOrder.referenceSlug || id;
        initPartialCodPayment(id, shippingInfo?.shippingCharge || 0, referenceSlug);
      } catch (err) {
        const errorData = err.response?.data;
        const message = errorData?.message || "Could not place order. Please try again.";
        cogoToast.error(message, { position: "top-center" });
        if (errorData?.outOfStock) {
          import("../../store/services/productService").then(({ refreshProductsSilently }) => {
            refreshProductsSilently();
          });
          dispatch(clearCheckout());
          setTimeout(() => { navigate(`${process.env.PUBLIC_URL}/cart`); }, 1500);
        }
      } finally {
        setPlacing(false);
      }
    } else {
      // Prepaid (Razorpay): open payment modal FIRST.
      // DB order is created ONLY after payment succeeds — cancel leaves nothing in DB.
      initRazorpayPayment(orderPayload);
    }
  };

  /* ── Initialize Partial COD Payment ── */
  const initPartialCodPayment = async (dbOrderId, deliveryCharge, referenceSlug) => {
    if (!deliveryCharge || deliveryCharge <= 0) {
      if (checkoutSource === "cart") dispatch(deleteAllFromCart());
      navigatingRef.current = true;
      dispatch(clearCheckout());
      setTimeout(() => {
        navigate(`/order-confirmation`, {
          replace: true,
          state: {
            orderId: dbOrderId,
            referenceSlug,
            selectedShippingAddr,
            billingAddress: selectedBillingAddr,
            paymentMethod,
            cartItems: checkoutItems,
            estimatedDays: shippingInfo?.estimatedDays || null,
            shippingCharge: 0,
            couponCode: shippingPricing.couponCode || null,
            couponDiscount: shippingPricing.couponDiscount || 0,
            tax: shippingPricing.gstAmount || 0,
            orderStatus: "confirmed",
          },
        });
      }, 1000);
      return;
    }

    try {
      setProcessingRazorpay(true);
      const paymentRes = await api.post("/payment/create-delivery-charge-order", {
        deliveryCharge,
        currency: "INR",
        dbOrderId,
      });
      const rzpOrderId = paymentRes.data.orderId;
      if (!window.Razorpay) {
        cogoToast.error("Razorpay SDK not loaded", { position: "top-center" });
        setProcessingRazorpay(false);
        return;
      }
      const productCost = shippingPricing.grandTotal - deliveryCharge;
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        order_id: rzpOrderId,
        amount: Math.round(deliveryCharge * 100),
        currency: "INR",
        name: "Kamali Gifts",
        description: `Delivery charge for Order ${dbOrderId}`,
        customer_notify: 1,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: selectedShippingAddr?.phone || "",
        },
        theme: { color: "#b60410" },
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              dbOrderId,
              isDeliveryCharge: true,
            });
            if (verifyRes.data.success) {
              cogoToast.success(
                `Delivery charge ₹${deliveryCharge} paid! Pay ₹${productCost.toFixed(2)} on delivery.`,
                { position: "top-center" }
              );
              if (checkoutSource === "cart") dispatch(deleteAllFromCart());
              navigatingRef.current = true;
              dispatch(clearCheckout());
              setTimeout(() => {
                navigate(`/order-confirmation`, {
                  replace: true,
                  state: {
                    orderId: dbOrderId,
                    referenceSlug,
                    selectedShippingAddr,
                    billingAddress: selectedBillingAddr,
                    paymentMethod: "partial_cod",
                    cartItems: checkoutItems,
                    estimatedDays: shippingInfo?.estimatedDays || null,
                    partialCod: {
                      deliveryChargePaid: deliveryCharge,
                      amountDueOnDelivery: productCost,
                      shippingCharge: deliveryCharge,
                    },
                    shippingCharge: deliveryCharge,
                    couponCode: shippingPricing.couponCode || null,
                    couponDiscount: shippingPricing.couponDiscount || 0,
                    tax: shippingPricing.gstAmount || 0,
                    orderStatus: "confirmed",
                  },
                });
              }, 1500);
            } else {
              setProcessingRazorpay(false);
            }
          } catch (verifyErr) {
            cogoToast.error("Delivery charge verification failed", { position: "top-center" });
            console.error("Partial COD verify error:", verifyErr);
            setProcessingRazorpay(false);
          }
        },
        modal: {
          ondismiss: async () => {
            // User cancelled — delete the pending DB order so no ghost order is left
            try {
              await api.delete(`/payment/abort-pending-order/${dbOrderId}`);
            } catch (abortErr) {
              console.warn("Could not abort pending order:", abortErr);
            }
            cogoToast.warn("Payment cancelled. Your order has been removed.", { position: "top-center" });
            setProcessingRazorpay(false);
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      cogoToast.error("Could not initialize delivery charge payment", { position: "top-center" });
      console.error("Partial COD init error:", err);
      setProcessingRazorpay(false);
    }
  };

  /* ── Initialize Razorpay Payment ── */
  // orderPayload: the full order data to be saved in DB only after payment succeeds.
  // DB order is NOT created before opening the modal — cancel = nothing saved.
  const initRazorpayPayment = async (orderPayload) => {
    try {
      setProcessingRazorpay(true);

      // Create Razorpay order (no dbOrderId — DB order doesn't exist yet)
      const paymentRes = await api.post("/payment/create-order", {
        amount: orderPayload.totalAmount,
        currency: "INR",
      });
      const rzpOrderId = paymentRes.data.orderId;
      setRazorpayOrderId(rzpOrderId);

      if (!window.Razorpay) {
        cogoToast.error("Razorpay SDK not loaded", { position: "top-center" });
        setProcessingRazorpay(false);
        return;
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        order_id: rzpOrderId,
        amount: Math.round(orderPayload.totalAmount * 100),
        currency: "INR",
        name: "Kamali Gifts",
        description: "Order Payment",
        customer_notify: 1,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: selectedShippingAddr?.phone || "",
        },
        theme: { color: "#b60410" },
        handler: async (response) => {
          // Payment succeeded — NOW create the DB order + verify atomically
          try {
            const verifyRes = await api.post("/payment/verify-and-create-order", {
              // Payment proof
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              // Full order payload
              ...orderPayload,
            });
            if (verifyRes.data.success) {
              const resolvedMethod = verifyRes.data.actualPaymentMethod || paymentMethod;
              const orderId = verifyRes.data.orderId;
              const referenceSlug = verifyRes.data.referenceSlug || orderId;
              cogoToast.success("Payment successful!", { position: "top-center" });
              if (checkoutSource === "cart") dispatch(deleteAllFromCart());
              navigatingRef.current = true;
              dispatch(clearCheckout());
              setTimeout(() => {
                navigate(`/order-confirmation`, {
                  replace: true,
                  state: {
                    orderId,
                    referenceSlug,
                    selectedShippingAddr,
                    billingAddress: selectedBillingAddr,
                    paymentMethod: resolvedMethod,
                    cartItems: checkoutItems,
                    estimatedDays: shippingInfo?.estimatedDays || null,
                    shippingCharge: shippingInfo?.shippingCharge || 0,
                    couponCode: shippingPricing.couponCode || null,
                    couponDiscount: shippingPricing.couponDiscount || 0,
                    tax: shippingPricing.gstAmount || 0,
                    orderStatus: "confirmed",
                  },
                });
              }, 1500);
            } else {
              cogoToast.error("Order creation failed after payment. Please contact support.", { position: "top-center" });
              setProcessingRazorpay(false);
            }
          } catch (verifyErr) {
            cogoToast.error("Payment verification failed. Please contact support.", { position: "top-center" });
            console.error("Verification error:", verifyErr);
            setProcessingRazorpay(false);
          }
        },
        modal: {
          ondismiss: () => {
            // User cancelled — no DB order was created, nothing to clean up
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
      setProcessingRazorpay(false);
    }
  };

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════════ */
  return (
    <Fragment>
      {(placing || processingRazorpay) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #b60410',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px',
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <h3 style={{
            margin: 0,
            fontFamily: '"Outfit", "Inter", sans-serif',
            fontSize: '22px',
            fontWeight: '600',
            color: '#333',
            letterSpacing: '0.5px',
          }}>
            {placing ? 'Creating Your Order...' : 'Processing Payment...'}
          </h3>
          <p style={{
            margin: '8px 0 0 0',
            fontFamily: '"Inter", sans-serif',
            fontSize: '14px',
            color: '#666',
          }}>
            Please do not close this window or refresh the page.
          </p>
        </div>
      )}
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

            {/* ── Secure Checkout Header ── */}
            <div className="kco-header">
              <h2 className="kg-cart-title">
                Secure Checkout
              </h2>
            </div>

            {/* ── Two-column layout ── */}
            <div className="kco-layout">

              {/* ══ LEFT COLUMN ══ */}
              <div className="kco-left">

                {/* Shipping & Billing Address Card */}
                <div className="kco-card">
                  <div className="kco-card-header">
                    <h3 className="kco-card-title">Shipping & Billing Address</h3>
                    <button
                      className="kco-add-new-btn"
                      onClick={() => {
                        setShowNewAddrForm((p) => {
                          if (!p) {
                            setTimeout(() => {
                              newAddrFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }, 50);
                          }
                          return !p;
                        });
                      }}
                    >
                      {showNewAddrForm ? "✕ Cancel" : "+ Add New"}
                    </button>
                  </div>

                  {addrLoading && (
                    <div style={{ color: "#aaa", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
                      Loading your saved addresses...
                    </div>
                  )}

                  {!addrLoading && addresses.length === 0 && !showNewAddrForm && (
                    <div className="kco-no-addr">
                      <div style={{ fontSize: 40 }}>📭</div>
                      <div>No saved addresses yet.</div>
                      <button className="kco-add-first-btn" onClick={() => setShowNewAddrForm(true)}>
                        + Add Your First Address
                      </button>
                    </div>
                  )}

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

                      {/* Billing Divider */}
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

                        {billingSameAsShipping && (
                          <div className="kco-billing-disabled-overlay">
                            <span className="kco-billing-disabled-msg">✓ Same as shipping address</span>
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
                            placeholder="Enter your full name"
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
                      <label className="kco-default-check-row" style={{ display: "flex" }}>
                        <input
                          type="checkbox"
                          checked={addrForm.isDefault}
                          onChange={(e) => setAddrForm((f) => ({ ...f, isDefault: e.target.checked }))}
                          style={{ accentColor: "#b60410" }}
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
                </div>

                {/* Payment Method Card */}
                <div className="kco-card" style={{ marginTop: 24 }}>
                  <h3 className="kco-card-title">Select Payment Method</h3>
                  <div style={{ marginTop: 20 }}>
                    {availablePaymentMethods.map((pm) => (
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
                  {!partialCodGloballyAvailable && (
                    <div style={{
                      marginTop: 16,
                      padding: '12px 14px',
                      background: '#fef2f2',
                      border: '1.5px dashed #fca5a5',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}>
                      <span style={{ fontSize: 16 }}>⚠️</span>
                      <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.4 }}>
                        <strong>Partial COD Unavailable:</strong>{' '}
                        {!allItemsPartialCodEligible 
                          ? 'One or more items in your cart do not support Partial COD (online payment required).'
                          : (selectedShippingAddr && shippingInfo && shippingInfo.codAvailable !== true)
                            ? `Cash on Delivery is not supported for your pincode (${selectedShippingAddr.pincode}).`
                            : 'Cash on Delivery is not available for this order.'
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ══ RIGHT COLUMN — Order Summary ══ */}
              <div className="kco-right">
                <div className="kco-price-card">
                  <h3 className="kco-price-title">
                    Order Summary
                    <span className="kco-price-title-count">
                      {checkoutItems.length} {checkoutItems.length === 1 ? "item" : "items"}
                    </span>
                  </h3>

                  {/* Item Cards */}
                  <div className="kco-item-list">
                    {checkoutItems.map((item) => {
                      const price = parseFloat(item.price || 0);
                      const mrp = parseFloat(item.selectedVariant?.mrp || item.variation?.[0]?.mrp || 0);
                      const hasMrp = mrp > 0 && mrp > price;
                      const discount = hasMrp ? Math.round((1 - price / mrp) * 100) : 0;

                      // ── Build attrs with same priority chain as Cart ──
                      const attrs = buildVariantAttrs(item);

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

                            {/* ── Colour swatch chips — matches Cart page exactly ── */}
                            {attrs.length > 0 && (
                              <div className="kco-item-variant" style={{ marginTop: 3 }}>
                                <VariantChips attrs={attrs} fontSize={10} swatchSize={12} />
                              </div>
                            )}

                            {(() => {
                              let custom = item.customisationDetails;
                              if (typeof custom === 'string') {
                                try {
                                  custom = JSON.parse(custom);
                                  if (typeof custom === 'string') {
                                    custom = JSON.parse(custom);
                                  }
                                } catch {
                                  custom = null;
                                }
                              }
                                if (custom && typeof custom === 'object' && Object.values(custom).some(Boolean)) {
                                  const validEntries = Object.entries(custom).filter(([_, val]) => val);
                                  return (
                                    <div 
                                      className="kco-custom-row-container"
                                      style={{
                                        marginTop: 5,
                                        padding: "4px 8px",
                                        background: "#fffbeb",
                                        border: "1px solid #fde68a",
                                        borderRadius: "6px",
                                        fontSize: "10px",
                                        color: "#78350f",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        whiteSpace: "nowrap",
                                        overflowX: "auto",
                                        scrollbarWidth: "none",
                                        width: "100%"
                                      }}
                                    >
                                      <span style={{ fontWeight: 700, flexShrink: 0 }}>🎨 Custom:</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        {validEntries.map(([key, val], idx) => {
                                          const label = key
                                            .split('_')
                                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                            .join(' ');
                                          const isFont = key.toLowerCase().includes('font');
                                          const isCol = key.toLowerCase().includes('color') || key.toLowerCase().includes('colour') || (typeof val === 'string' && val.startsWith('#'));
                                          return (
                                            <span 
                                              key={key} 
                                              style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: 3, 
                                                background: "rgba(253, 230, 138, 0.4)", 
                                                padding: "2px 6px", 
                                                borderRadius: "4px",
                                                fontSize: "9px",
                                                flexShrink: 0,
                                                ...(isFont ? { fontFamily: val } : {}) 
                                              }}
                                            >
                                              <span style={{ fontWeight: 600 }}>{label}:</span>
                                              {isCol ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                  <span style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    background: val,
                                                    border: '1px solid rgba(0,0,0,0.15)',
                                                    display: 'inline-block'
                                                  }} />
                                                  <code style={{ fontSize: 9, background: '#f3f4f6', padding: '1px 3px', borderRadius: 3 }}>{val}</code>
                                                </span>
                                              ) : (
                                                <span>{val}</span>
                                              )}
                                              {idx < validEntries.length - 1 && (
                                                <span style={{ marginLeft: 6, color: '#d97706', fontWeight: "bold" }}>•</span>
                                              )}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

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

                  {/* Coupon Panel */}
                  <div className="kco-coupon-panel">
                    <button
                      type="button"
                      className="kco-coupon-toggle"
                      onClick={() => setCouponOpen((open) => !open)}
                      aria-expanded={couponOpen}
                    >
                      <span>
                        <span className="kco-coupon-title">Have a coupon?</span>
                        <span className="kco-coupon-subtitle">Apply an available code before payment</span>
                      </span>
                      {shippingPricing.couponCode ? (
                        <span className="kco-coupon-applied-badge">
                          {shippingPricing.couponCode}
                          <span
                            role="button"
                            tabIndex={0}
                            className="kco-coupon-remove-inline"
                            onClick={(e) => { e.stopPropagation(); handleRemoveCoupon(); }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveCoupon();
                              }
                            }}
                          >
                            clear
                          </span>
                        </span>
                      ) : (
                        <span className={`kco-coupon-chevron ${couponOpen ? "open" : ""}`}>⌄</span>
                      )}
                    </button>

                    {couponOpen && (
                      <div className="kco-coupon-body">
                        {loadingCoupons ? (
                          <div className="kco-coupon-muted">Loading coupons...</div>
                        ) : activeCoupons.length > 0 ? (
                          <div className="kco-coupon-chip-row">
                            {activeCoupons.map((coupon) => (
                              <button
                                type="button"
                                key={coupon.id || coupon.code}
                                className={`kco-coupon-chip ${shippingPricing.couponCode === coupon.code ? "active" : ""}`}
                                onClick={() => { setCouponInput(coupon.code); setCouponError(""); }}
                                title={getCouponLabel(coupon)}
                              >
                                <span>{coupon.code}</span>
                                <small>{getCouponLabel(coupon)}</small>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="kco-coupon-muted">No active coupons right now.</div>
                        )}

                        <div className="kco-coupon-input-row">
                          <input
                            type="text"
                            className="kco-coupon-input"
                            value={couponInput}
                            onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                            onKeyDown={(e) => { if (e.key === "Enter") handleApplyCoupon(); }}
                            placeholder="Enter coupon code"
                            disabled={applyingCoupon}
                          />
                          <button
                            type="button"
                            className="kco-coupon-apply-btn"
                            onClick={handleApplyCoupon}
                            disabled={applyingCoupon || !couponInput.trim()}
                          >
                            {applyingCoupon ? "Applying..." : "Apply"}
                          </button>
                        </div>

                        {couponError && (
                          <div className="kco-coupon-error">{couponError}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="kco-sum-rows">
                    <div className="kco-sum-row">
                      <span>Subtotal (before GST)</span>
                      <span>₹{shippingPricing.subtotalBeforeGst.toFixed(2)}</span>
                    </div>
                    <div className="kco-sum-row">
                      <span style={{ color: "#555" }}>GST (18%)</span>
                      <span style={{ color: "#555" }}>+ ₹{shippingPricing.gstAmount.toFixed(2)}</span>
                    </div>

                    {checkingServiceability && (
                      <div className="kco-sum-row" style={{ color: "#666" }}>
                        <span>Delivery</span>
                        <span>⏳ Checking...</span>
                      </div>
                    )}

                    {!checkingServiceability && shippingInfo && (
                      <>
                        <div className="kco-sum-row" style={{ marginBottom: shippingInfo.allCouriers?.length > 0 ? "4px" : "12px" }}>
                          <span>
                            Delivery
                            {shippingInfo.estimatedDays && (
                              <span style={{ fontSize: "0.85em", color: "#666" }}>
                                {" "}(Est. {shippingInfo.estimatedDays} {Number(shippingInfo.estimatedDays) === 1 ? "day" : "days"})
                              </span>
                            )}
                          </span>
                          <span style={shippingInfo.shippingCharge === 0 ? { color: "#16a34a", fontWeight: 700 } : {}}>
                            {shippingInfo.shippingCharge === 0 ? "FREE" : `₹${shippingInfo.shippingCharge}`}
                          </span>
                        </div>
                        {shippingInfo.allCouriers && shippingInfo.allCouriers.length > 0 && (
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -6, marginBottom: 8 }}>
                            <button
                              type="button"
                              onClick={() => setCourierModalOpen(true)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#b60410",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer",
                                padding: 0,
                                textDecoration: "underline",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px"
                              }}
                            >
                              <span>Change Partner ({shippingInfo.courier})</span>
                              <span style={{ fontSize: "9px" }}>✏️</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {!checkingServiceability && !shippingInfo && selectedShippingAddr && (
                      <div className="kco-sum-row" style={{ color: "#dc2626" }}>
                        <span>Delivery</span>
                        <span>❌ Not available</span>
                      </div>
                    )}

                    {shippingPricing.couponDiscount > 0 && (
                      <div className="kco-sum-row kco-sum-row--green">
                        <span>Coupon ({shippingPricing.couponCode})</span>
                        <span>− ₹{shippingPricing.couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="kco-total-line">
                    <span>Total (incl. GST)</span>
                    <span style={{ color: "#b60410" }}>₹{grandTotalWithCOD.toFixed(2)}</span>
                  </div>

                  {shippingPricing.couponDiscount > 0 && (
                    <div className="kco-savings-banner">
                      🎉 You save ₹{shippingPricing.couponDiscount.toFixed(2)} with coupon!
                    </div>
                  )}

                  {paymentMethod === "partial_cod" && (
                    <div style={{
                      background: "#fff3cd",
                      border: "1px solid #ffc107",
                      borderRadius: 8,
                      padding: "10px 12px",
                      marginBottom: 14,
                      fontSize: "12px",
                      color: "#856404",
                      textAlign: "center",
                      fontWeight: "500",
                      lineHeight: "1.4"
                    }}>
                      ℹ️ ₹{(shippingPricing.grandTotal - (shippingInfo?.shippingCharge || 0)).toFixed(2)} will be collected on delivery
                    </div>
                  )}

                  <button
                    className="kco-place-order-btn"
                    onClick={handlePlaceOrder}
                    disabled={placing || !selectedShippingAddr || !paymentMethod || checkingServiceability || (selectedShippingAddr && !shippingInfo)}
                    style={{
                      width: "100%",
                      display: "block",
                      opacity: placing || !selectedShippingAddr || !paymentMethod || checkingServiceability || (selectedShippingAddr && !shippingInfo) ? 0.5 : 1,
                      cursor: placing || !selectedShippingAddr || !paymentMethod || checkingServiceability || (selectedShippingAddr && !shippingInfo) ? "not-allowed" : "pointer",
                      marginBottom: 16,
                      padding: "14px 20px",
                      borderRadius: "12px",
                      fontSize: "15px",
                      fontWeight: "800",
                      background: "linear-gradient(135deg, #b60410, #c01550)",
                      color: "#fff",
                      border: "none",
                      boxShadow: "0 4px 14px rgba(219,26,93,0.28)",
                      transition: "opacity 0.2s"
                    }}
                    title={
                      !selectedShippingAddr
                        ? "Please select a shipping address first"
                        : !paymentMethod
                        ? "Please select a payment method"
                        : ""
                    }
                  >
                    {placing ? "Placing Order..." :
                      `Pay ₹${(paymentMethod === "partial_cod" ? (shippingInfo?.shippingCharge || 0) : grandTotalWithCOD).toFixed(2)} now`
                    }
                  </button>

                  <div className="kco-secure-note">
                    🔒 Safe &amp; secure payments · 100% authentic
                    <br />Easy returns · Packed with love 💝
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Courier Selection Modal */}
        {courierModalOpen && shippingInfo?.allCouriers && shippingInfo.allCouriers.length > 0 && (
          <div className="kco-modal-overlay">
            <div className="kco-modal-content">
              <div className="kco-modal-header">
                <h3>Select Courier Partner</h3>
                <button className="kco-modal-close" onClick={() => setCourierModalOpen(false)}>×</button>
              </div>
              <div className="kco-modal-body">
                <p>Select your preferred courier partner for this delivery:</p>
                <div className="kco-courier-list">
                  {shippingInfo.allCouriers.map((c) => {
                    const isSelected = shippingInfo.courier === c.name && shippingInfo.shippingCharge === c.charge;
                    return (
                      <div 
                        key={c.name + "_" + c.charge} 
                        className={`kco-courier-item ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectCourier(c)}
                      >
                        <div className="kco-courier-info">
                          <span className="kco-courier-icon">🚚</span>
                          <div>
                            <div className="kco-courier-name">{c.name}</div>
                            <div className="kco-courier-days">Estimated Delivery: {c.days} days</div>
                          </div>
                        </div>
                        <div className="kco-courier-price">
                          ₹{c.charge.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="kco-modal-footer">
                <button className="kco-modal-btn" onClick={() => setCourierModalOpen(false)}>
                  Confirm Delivery Partner
                </button>
              </div>
            </div>
          </div>
        )}
      </LayoutOne>
    </Fragment>
  );
};

/* ── Field Wrapper Component ── */
const FormField = ({ label, error, children }) => (
  <div className="kco-field">
    <label className="kco-field-label">{label}</label>
    {children}
    {error && <div className="kco-field-err">⚠ {error}</div>}
  </div>
);

export default Checkout;