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
import { getDiscountPrice } from "../../helpers/product";
import { getImgUrl } from "../../helpers/imageUrl";
import api from "../../api/axios";
import cogoToast from "cogo-toast";
import "./Checkout.css";
import { useRef } from "react";

// ── Helper: check Shiprocket shipping rates ─────────────────────────────────
const checkShippingServiceability = async (pincode, orderValue, weight = 0.5) => {
  try {
    const cod = true;
    const res = await api.get("/shipping/rates", {
      params: { pincode, weight, cod },
    });
    // Map new response shape to what checkout expects
    return {
      serviceable: res.data.serviceable,
      shippingCharge: res.data.charge || 0,
      courier: res.data.courier || null,
      estimatedDays: res.data.estimatedDays || null,
      codAvailable: cod,
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

const withGrandTotal = (pricing) => {
  const subtotal = toAmount(pricing.subtotal);
  const shipping = toAmount(pricing.shipping);
  const couponDiscount = toAmount(pricing.couponDiscount);

  return {
    ...pricing,
    subtotal,
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
  const navigatingRef = useRef(false); // prevents route guard from firing during nav
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
    if (navigatingRef.current) return; // already navigating to confirmation
    if (!checkoutItems || checkoutItems.length === 0) {
      cogoToast.warn("Your checkout session is empty.", { position: "top-center" });
      navigate(`${process.env.PUBLIC_URL}/cart`);
    } else if (checkoutExpiresAt && Date.now() > checkoutExpiresAt) {
      cogoToast.error("Your checkout session has expired.", { position: "top-center" });
      dispatch(clearCheckout());
      navigate(`${process.env.PUBLIC_URL}/cart`);
    }
  }, [checkoutItems, checkoutExpiresAt, navigate, dispatch]);

  /* ── Pricing (passed from Cart or recomputed) ──────────────────────────── */
  useEffect(() => {
    let sub = 0;
    (checkoutItems || []).forEach((item) => {
      sub += parseFloat(item.price || 0) * (currency.currencyRate || 1) * item.quantity;
    });

    if (navState) {
      setShippingPricing((prev) => withGrandTotal({
        ...prev,
        ...navState,
        subtotal: sub || navState.subtotal,
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

  /* ── State ─────────────────────────────────────────────────────────────── */
  const [selectedShippingAddrId, setSelectedShippingAddrId] = useState(activeAddressId);
  const [selectedBillingAddrId, setSelectedBillingAddrId] = useState(null);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("partial_cod");
  const [showNewAddrForm, setShowNewAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDR);
  const [addrErrors, setAddrErrors] = useState({});
  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [giftNoteOpen, setGiftNoteOpen] = useState(false);
  const [shippingCollapsed, setShippingCollapsed] = useState(false);
  const [billingCollapsed, setBillingCollapsed] = useState(false);

  // ── Serviceability & Shipping State ────────────────────────────────────
  const [shippingInfo, setShippingInfo] = useState(null);
  const [checkingServiceability, setCheckingServiceability] = useState(false);
  const [shippingPricing, setShippingPricing] = useState({
    subtotal: 0,
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

  /* ── Fetch addresses from backend ──────────────────────────────────────── */
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

    return () => {
      mounted = false;
    };
  }, []);

  /* ── Check shipping rates when address changes ───────────────────────── */
  useEffect(() => {
    const checkShipping = async () => {
      if (!selectedShippingAddr?.pincode) {
        setShippingInfo(null);
        return;
      }

      setCheckingServiceability(true);
      const result = await checkShippingServiceability(
        selectedShippingAddr.pincode,
        shippingPricing.subtotal
      );
      setCheckingServiceability(false);

      if (result) {
        setShippingInfo(result);
        const newShipping = result.serviceable ? (result.shippingCharge || 0) : 0;
        setShippingPricing((prev) => withGrandTotal({
          ...prev,
          shipping: newShipping,
        }));
      } else {
        setShippingInfo(null);
      }
    };

    checkShipping();
  }, [selectedShippingAddrId, shippingPricing.subtotal]);

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
            setTimeout(() => {
              navigate(`${process.env.PUBLIC_URL}/cart`);
            }, 2000);
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

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();

    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }

    if (shippingPricing.subtotal <= 0) {
      setCouponError("Add items before applying a coupon.");
      return;
    }

    setApplyingCoupon(true);
    setCouponError("");

    try {
      const res = await api.post("/coupons/validate", {
        code,
        order_total: shippingPricing.subtotal,
      });
      const data = res.data || {};

      if (!data.valid) {
        throw new Error(data.message || "Coupon could not be applied.");
      }

      const couponCode = data.coupon_code || code;
      const discount = toAmount(data.discount);
      const coupon = {
        code: couponCode,
        discount,
        type: data.type || null,
        value: data.value ?? null,
      };

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
        err.response?.data?.message ||
        err.message ||
        "This coupon is not valid for your order."
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

  /* ── Derived values ────────────────────────────────────────────────────── */
  const selectedShippingAddr = addresses.find((a) => a.id === selectedShippingAddrId);
  const selectedBillingAddr = billingSameAsShipping
    ? selectedShippingAddr
    : addresses.find((a) => a.id === selectedBillingAddrId);

  // Filter payment methods based on COD availability (hide partial COD when COD not available)
  const availablePaymentMethods = PAYMENT_METHODS.filter(
    (pm) => pm.id !== "partial_cod" || (shippingInfo?.codAvailable === true)
  );

  // Reset payment method if Partial COD was selected but not available
  useEffect(() => {
    if (paymentMethod === "partial_cod" && !shippingInfo?.codAvailable) {
      const fallback = availablePaymentMethods.length ? availablePaymentMethods[0].id : "upi";
      setPaymentMethod(fallback);
    }
  }, [shippingInfo?.codAvailable, paymentMethod, availablePaymentMethods]);

  // If COD becomes available after load, prefer Partial COD by default
  useEffect(() => {
    if (shippingInfo?.codAvailable && paymentMethod !== "partial_cod") {
      setPaymentMethod("partial_cod");
    }
  }, [shippingInfo?.codAvailable]);

  const grandTotalWithCOD = shippingPricing.grandTotal;

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
            "Some items are no longer available. Please review your order.",
            { position: "top-center" }
          );
        } else {
          cogoToast.warn(
            "Some quantities were adjusted due to stock changes. Please review your order.",
            { position: "top-center" }
          );
        }
        navigate(`${process.env.PUBLIC_URL}/cart`);
        return;
      }
    } catch (revalErr) {
      console.warn("Pre-order revalidation failed (proceeding):", revalErr);
    }

    setPlacing(true);
    try {
      const payload = {
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
        courier: shippingInfo?.courier || null,
        estimatedDeliveryDays: shippingInfo?.estimatedDays || null,
      };

      const res = await api.post("/orders", payload);
      const id = res.data?.id || res.data?.orderId || "KG" + Date.now();

      if (paymentMethod === "partial_cod") {
        // Collect delivery charge via Razorpay, rest on delivery
        initPartialCodPayment(id, shippingInfo?.shippingCharge || 0);
      } else if (paymentMethod !== "cod") {
        initRazorpayPayment(id);
      } else {
        if (checkoutSource === "cart") {
          dispatch(deleteAllFromCart());
        }
        navigatingRef.current = true;
        dispatch(clearCheckout());
        setTimeout(() => {
          navigate(`/order-confirmation`, {
            replace: true,
            state: {
  orderId: id,
  selectedShippingAddr,
  billingAddress: selectedBillingAddr,
  paymentMethod,
  cartItems: checkoutItems,
  estimatedDays: shippingInfo?.estimatedDays || null,  // ← add this
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

  /* ── Initialize Partial COD Payment (delivery charge only) ────────────── */
  const initPartialCodPayment = async (dbOrderId, deliveryCharge) => {
    if (!deliveryCharge || deliveryCharge <= 0) {
      // No delivery charge to collect — treat as plain COD
      if (checkoutSource === "cart") dispatch(deleteAllFromCart());
      navigatingRef.current = true;
      dispatch(clearCheckout());
      setTimeout(() => {
        navigate(`/order-confirmation`, {
          replace: true,
          state: { orderId: dbOrderId, selectedShippingAddr, billingAddress: selectedBillingAddr, paymentMethod, cartItems: checkoutItems, estimatedDays: shippingInfo?.estimatedDays || null },
        });
      }, 1000);
      return;
    }

    try {
      setProcessingRazorpay(true);

      const paymentRes = await api.post("/payment/create-delivery-charge-order", {
        deliveryCharge,
        currency: "INR",
      });

      const rzpOrderId = paymentRes.data.orderId;

      if (!window.Razorpay) {
        cogoToast.error("Razorpay SDK not loaded", { position: "top-center" });
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
        theme: { color: "#f15a24" },
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
                    selectedShippingAddr,
                    billingAddress: selectedBillingAddr,
                    paymentMethod: "partial_cod",
                    cartItems: checkoutItems,
                    estimatedDays: shippingInfo?.estimatedDays || null,
                    partialCod: { deliveryChargePaid: deliveryCharge, amountDueOnDelivery: productCost },
                  },
                });
              }, 1500);
            }
          } catch (verifyErr) {
            cogoToast.error("Delivery charge verification failed", { position: "top-center" });
            console.error("Partial COD verify error:", verifyErr);
          }
        },
        modal: {
          ondismiss: () => {
            cogoToast.warn("Payment cancelled — your order is placed but delivery charge unpaid. Contact support.", { position: "top-center" });
            setProcessingRazorpay(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      cogoToast.error("Could not initialize delivery charge payment", { position: "top-center" });
      console.error("Partial COD init error:", err);
    } finally {
      setProcessingRazorpay(false);
    }
  };

  /* ── Initialize Razorpay Payment ───────────────────────────────────────── */
  const initRazorpayPayment = async (dbOrderId) => {
    try {
      setProcessingRazorpay(true);

      const paymentRes = await api.post("/payment/create-order", {
        amount: shippingPricing.grandTotal,
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
        amount: Math.round(shippingPricing.grandTotal * 100),
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
              if (checkoutSource === "cart") {
                dispatch(deleteAllFromCart());
              }
              navigatingRef.current = true;
              dispatch(clearCheckout());
              setTimeout(() => {
                navigate(`/order-confirmation`, {
                  replace: true,
                  state: {
                    orderId: dbOrderId,
                    selectedShippingAddr,
                    billingAddress: selectedBillingAddr,
                    paymentMethod,
                    cartItems: checkoutItems,
                    estimatedDays: shippingInfo?.estimatedDays || null,
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

                        {/* ── Billing Divider ── */}
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

                        <label className="kco-default-check-row" style={{ display: "flex" }}>
                          <input
                            type="checkbox"
                            checked={addrForm.isDefault}
                            onChange={(e) => setAddrForm((f) => ({ ...f, isDefault: e.target.checked }))}
                            style={{ accentColor: "#db1a5d" }}
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
                        (!billingSameAsShipping && !selectedBillingAddr) ||
                        checkingServiceability ||
                        (selectedShippingAddr && !shippingInfo)
                      }
                      style={{
                        opacity:
                          !selectedShippingAddr ||
                          (!billingSameAsShipping && !selectedBillingAddr) ||
                          checkingServiceability ||
                          (selectedShippingAddr && !shippingInfo)
                            ? 0.5
                            : 1,
                        cursor:
                          !selectedShippingAddr ||
                          (!billingSameAsShipping && !selectedBillingAddr) ||
                          checkingServiceability ||
                          (selectedShippingAddr && !shippingInfo)
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
                        if (selectedShippingAddr && !shippingInfo) {
                          cogoToast.error("Delivery not available to selected pincode", { position: "top-center" });
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
                        </span>
                      </div>
                    </div>

                    {/* Items */}
<div className="kco-review-section">
  <div className="kco-review-section-title" style={{ marginBottom: 12 }}>
    🛍 Items ({checkoutItems.length})
  </div>
  {checkoutItems.map((item) => {
    const price = parseFloat(item.price || 0);

    // Build dynamic variant attrs
    const attrs = [];
    const v = Array.isArray(item.variation) ? item.variation[0] : null;
const rawAttrs = v?.attributes;
const attrsArray = Array.isArray(rawAttrs)
  ? rawAttrs
  : typeof rawAttrs === "string"
  ? (() => { try { return JSON.parse(rawAttrs); } catch { return []; } })()
  : [];

if (attrsArray.length) {
  attrsArray.forEach(a => attrs.push({ key: a.key, val: a.value }));
} else if (item.selectedVariantName?.includes(":")) {
      item.selectedVariantName.split("·").forEach(part => {
        const [k, val] = part.split(":").map(s => s.trim());
        if (k && val) attrs.push({ key: k, val });
      });
    } else if (item.selectedVariantName) {
      attrs.push({ key: "Variant", val: item.selectedVariantName });
    }

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
          {attrs.length > 0 && (
            <div style={{ marginTop: 3, display: "flex", flexWrap: "wrap", gap: 4 }}>
              {attrs.map((a, i) => (
                <span key={i} style={{
                  fontSize: 10,
                  color: "#666",
                  background: "#f5f5f5",
                  borderRadius: 4,
                  padding: "2px 6px",
                }}>
                  {a.key}: {a.val}
                </span>
              ))}
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
                      {checkoutItems.length} {checkoutItems.length === 1 ? "item" : "items"}
                    </span>
                  </h3>

                  {/* ── Item Cards ── */}
                  <div className="kco-item-list">
                    {checkoutItems.map((item) => {
                      const price = parseFloat(item.price || 0);
                      const mrp = parseFloat(item.selectedVariant?.mrp || item.variation?.[0]?.mrp || 0);
                      const hasMrp = mrp > 0 && mrp > price;
                      const discount = hasMrp ? Math.round((1 - price / mrp) * 100) : 0;

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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCoupon();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveCoupon();
                              }
                            }}
                          >
                            Remove &times;
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
                          // <div className="kco-coupon-chip-row">
                          //   {activeCoupons.map((coupon) => (
                          //     <button
                          //       type="button"
                          //       key={coupon.id || coupon.code}
                          //       className={`kco-coupon-chip ${shippingPricing.couponCode === coupon.code ? "active" : ""}`}
                          //       onClick={() => {
                          //         setCouponInput(coupon.code);
                          //         setCouponError("");
                          //       }}
                          //       title={getCouponLabel(coupon)}
                          //     >
                          //       <span>{coupon.code}</span>
                          //       <small>{getCouponLabel(coupon)}</small>
                          //     </button>
                          //   ))}
                          // </div>
                          <></>
                        ) : (
                          <div className="kco-coupon-muted">No active coupons right now.</div>
                        )}

                        <div className="kco-coupon-input-row">
                          <input
                            type="text"
                            className="kco-coupon-input"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value.toUpperCase());
                              setCouponError("");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleApplyCoupon();
                            }}
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

                  {/* ── Price Breakdown ── */}
                  <div className="kco-sum-rows">
                    <div className="kco-sum-row">
                      <span>Subtotal</span>
                      <span>₹{shippingPricing.subtotal.toFixed(2)}</span>
                    </div>

                    {checkingServiceability && (
                      <div className="kco-sum-row" style={{ color: "#666" }}>
                        <span>Delivery</span>
                        <span>⏳ Checking...</span>
                      </div>
                    )}

                    {!checkingServiceability && shippingInfo && (
                      <div className="kco-sum-row">
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
                    <span>Total</span>
                    <span style={{ color: "#db1a5d" }}>₹{grandTotalWithCOD.toFixed(2)}</span>
                  </div>

                  {shippingPricing.couponDiscount > 0 && (
                    <div className="kco-savings-banner">
                      🎉 You save ₹{shippingPricing.couponDiscount.toFixed(2)} with coupon!
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
