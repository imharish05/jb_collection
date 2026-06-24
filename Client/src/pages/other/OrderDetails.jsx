import { Fragment, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import api from "../../api/axios";
import cogoToast from "cogo-toast";
import Swal from "sweetalert2";
import { getImgUrl } from "../../helpers/imageUrl";
import { renderVariantLabel, isColourKey, isHexColor } from "../../helpers/product";

const FALLBACK_IMG = "/assets/img/logo.png";

// Strip old variant suffix from productName (e.g. "Gifts (Colour: #000000)" → "Gifts")
const cleanProductName = (name) => {
  if (!name) return "Product";
  const idx = name.indexOf(" (");
  return idx !== -1 ? name.slice(0, idx).trim() : name;
};

const parseJson = (val) => {
  if (!val || typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return val; }
};

const deepParse = (val) => {
  let result = val;
  for (let i = 0; i < 5; i++) {
    if (typeof result !== "string") break;
    const next = parseJson(result);
    if (next === result) break;
    result = next;
  }
  return result;
};

const getOrderItemImage = (img) => {
  if (!img) return FALLBACK_IMG;
  const unwrapped = deepParse(img);
  const raw = Array.isArray(unwrapped) ? unwrapped[0] : (typeof unwrapped === "string" ? unwrapped : null);
  if (!raw) return FALLBACK_IMG;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return getImgUrl(raw);
};

const toAmount = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const amount = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(amount) ? amount : null;
};

const formatCurrency = (value) => `₹${(toAmount(value) ?? 0).toFixed(2)}`;

const firstAmount = (...values) => {
  for (const value of values) {
    const amount = toAmount(value);
    if (amount !== null) return amount;
  }
  return null;
};

const hoursSince = (date) => (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
const daysSince  = (date) => hoursSince(date) / 24;

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openIncluded, setOpenIncluded] = useState({});
  const toggleIncluded = (idx) => setOpenIncluded(prev => ({ ...prev, [idx]: !prev[idx] }));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => {
        console.error("Failed to fetch order:", err);
        cogoToast.error("Could not load order details", { position: "top-center" });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const formatPaymentMethod = (method) => {
    if (!method) return "Pending";
    const normalized = method.toLowerCase();
    if (normalized === "cod" || normalized === "full_cod") return "Cash on Delivery (COD)";
    if (normalized === "upi") return "UPI";
    if (normalized === "card") return "Credit / Debit Card";
    if (normalized === "netbanking") return "Net Banking";
    if (normalized === "wallet") return "Wallet";
    if (normalized === "razorpay") return "Online Payment (Razorpay)";
    if (normalized === "partial_cod") return "Partial Cash on Delivery";
    if (normalized === "prepaid") return "Prepaid Online";
    return method;
  };

  const handleCancelOrder = async () => {
    const result = await Swal.fire({
      title: "Cancel this order?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#db1a5d",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, cancel order",
      cancelButtonText: "No, keep it",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    // Show loading state
    Swal.fire({
      title: "Cancelling order...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: async () => {
        Swal.showLoading();
        try {
          await api.patch(`/returns/cancel-order/${order.referenceSlug || order.id}`);
          // Reload order details
          const res = await api.get(`/orders/${order.referenceSlug || order.id}`);
          setOrder(res.data);
          
          Swal.fire({
            title: "Success!",
            text: "Order cancelled successfully!",
            icon: "success",
            confirmButtonColor: "#db1a5d",
          });
        } catch (err) {
          console.error(err);
          const errorMsg = err.response?.data?.message || "Failed to cancel order";
          Swal.fire({
            title: "Error",
            text: errorMsg,
            icon: "error",
            confirmButtonColor: "#db1a5d",
          });
        }
      },
    });
  };

  const renderCancelButton = () => {
    if (!order) return null;
    const hours = hoursSince(order.createdAt);
    const orderStatusLower = order.status?.toLowerCase();
    const nonCancellable = ["confirmed", "shipped", "processing", "delivered", "cancelled"];
    
    // Check if customised items in production
    const hasCustom = order.items?.some(i => i.product?.isCustomisable || (i.customisationDetails && Object.keys(i.customisationDetails).length > 0));
    const isProductionCustom = hasCustom && orderStatusLower !== "pending";

    const cancellable = hours < 24 && !nonCancellable.includes(orderStatusLower) && !isProductionCustom;

    if (!cancellable) return null;

    return (
      <button
        onClick={handleCancelOrder}
        className="btn-cancel-action"
        style={{ width: "100%", marginTop: "12px", border: "none", padding: "10px", fontWeight: "bold", borderRadius: "4px" }}
      >
        Cancel Order
      </button>
    );
  };

  const renderItemActions = (item) => {
    if (!order || order.status?.toLowerCase() !== "delivered") return null;

    const deliveredAt = order.updatedAt;
    const hours = hoursSince(deliveredAt);
    const isReturnable = item.product ? (!item.product.isNonReturnable && !item.product.isCustomisable) : true;
    
    const returns = item.returns || [];
    const activeReturn = returns[0];
    const hasExistingReturn = !!activeReturn;

    if (hasExistingReturn) {
      const statusLabels = {
        pending_review: "Under Review",
        approved: "Approved",
        rejected: "Rejected",
        pickup_scheduled: "Pickup Scheduled",
        picked_up: "Picked Up",
        inspection_completed: "Inspection Done",
        refund_initiated: "Refund Initiated",
        refund_completed: "Refund Completed",
        replacement_shipped: "Replacement Shipped",
        replacement_delivered: "Replacement Delivered",
        cancelled: "Cancelled",
      };
      return (
        <div className="item-return-status-section" style={{ marginTop: "10px" }}>
          <span className={`return-status-badge ${activeReturn.status}`}>
            Return Status: {statusLabels[activeReturn.status] || activeReturn.status}
          </span>
          <div style={{ marginTop: "6px" }}>
            <Link to={`/return-tracking/${activeReturn.referenceSlug || activeReturn.id}`} style={{ color: "#db1a5d", fontWeight: 600, fontSize: "13px" }}>
              <i className="fa fa-map-marker"></i> Track Return
            </Link>
          </div>
        </div>
      );
    }

    if (!isReturnable) {
      return (
        <div style={{ marginTop: "10px" }}>
          <span className="non-returnable-badge">Non-Returnable Product</span>
        </div>
      );
    }

    const withinReturnWindow = hours <= 72; // 3 days
    if (!withinReturnWindow) {
      return (
        <div style={{ marginTop: "10px" }}>
          <span className="return-window-expired">Return window expired</span>
        </div>
      );
    }

    const remainingHoursTotal = Math.max(0, 72 - hours);
    const remDays = Math.floor(remainingHoursTotal / 24);
    const remHours = Math.floor(remainingHoursTotal % 24);

    return (
      <div style={{ marginTop: "10px" }}>
        <span className="return-window-timer">
          Return Window: {remDays > 0 ? `${remDays}d ` : ""}{remHours}h remaining
        </span>
        <div className="return-action-buttons">
          <Link
            to={`/return-request?orderId=${order.referenceSlug || order.id}&itemId=${item.id}`}
            className="btn-return-action"
          >
            Return Product
          </Link>
          <Link
            to={`/return-request?orderId=${order.referenceSlug || order.id}&itemId=${item.id}&type=replacement`}
            className="btn-replace-action"
          >
            Replace Product
          </Link>
        </div>
      </div>
    );
  };

  const statusMap = {
    pending: "Placed",
    confirmed: "Processing",
    processing: "Out for Delivery",
    shipped: "Shipped",
    delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  const stages = [
    { label: "Placed", icon: "fa-shopping-basket" },
    { label: "Processing", icon: "fa-cogs" },
    { label: "Shipped", icon: "fa-truck" },
    { label: "Out for Delivery", icon: "fa-map-marker" },
    { label: "Delivered", icon: "fa-check-circle" },
  ];
const getVariantLabel = (item) => {
  if (item.selectedVariantName) {
    // Keep "Colour: #FF0000" as-is so renderVariantLabel can render the dot
    // but strip the hex TEXT by passing original — renderVariantLabel handles the dot
    return renderVariantLabel(item.selectedVariantName);
  }
  if (item.variantAttributes && Array.isArray(item.variantAttributes) && item.variantAttributes.length) {
    const label = item.variantAttributes.map((attr) => `${attr.key}: ${attr.value}`).join(" · ");
    return renderVariantLabel(label);
  }
  return renderVariantLabel("Handcrafted Series");
};

  const itemPrice = (item) => {
    const price = item.salesPrice ?? item.price ?? item.unitPrice ?? item.sellingPrice ?? item.mrp ?? 0;
    return typeof price === "string" ? parseFloat(price) : price;
  };

  if (loading) {
    return (
      <Fragment>
        <SEO titleTemplate="Order Receipt" />
        <LayoutOne headerTop="visible">
          <div className="premium-order-bg pt-100 pb-100">
            <div className="container" style={{ textAlign: "center", color: "#999" }}>
              <p>Loading order details...</p>
            </div>
          </div>
        </LayoutOne>
      </Fragment>
    );
  }

  if (!order) {
    return (
      <Fragment>
        <SEO titleTemplate="Order Not Found" />
        <LayoutOne headerTop="visible">
          <div className="premium-order-bg pt-100 pb-100">
            <div className="container" style={{ textAlign: "center", color: "#999" }}>
              <p>Order not found</p>
              <Link to="/my-account?tab=orders">Back to Orders</Link>
            </div>
          </div>
        </LayoutOne>
      </Fragment>
    );
  }

  const orderStatus = statusMap[order.status?.toLowerCase()] || order.status || "Pending";
  const currentIdx = Math.max(stages.findIndex((s) => s.label === orderStatus), -1);
  // shippingAddress is now loaded as a related Address instance; fallback for legacy stored JSON.
  let shippingAddr = order.shippingAddress || {};
  if (typeof shippingAddr === "string") {
    try { shippingAddr = JSON.parse(shippingAddr); } catch { shippingAddr = {}; }
  }
  const orderItems = Array.isArray(order.items) ? order.items : [];
  const itemsSubtotal = orderItems.reduce((sum, item) => {
    const qty = toAmount(item.quantity) ?? 1;
    return sum + itemPrice(item) * qty;
  }, 0);
  const itemsListTotal = orderItems.reduce((sum, item) => {
    const qty = toAmount(item.quantity) ?? 1;
    const unitPrice = itemPrice(item);
    const mrp = toAmount(item.mrp);
    return sum + (mrp && mrp > unitPrice ? mrp : unitPrice) * qty;
  }, 0);
  const totalAmount = toAmount(order.totalAmount) ?? 0;
  const rawShippingCharge = toAmount(order.shippingCharge);
  const shippingMethod = String(order.shippingMethod || "").toLowerCase();
  const isFreeShipping = rawShippingCharge === null || rawShippingCharge === 0 || shippingMethod === "free";
  const shippingCharge = isFreeShipping ? 0 : rawShippingCharge;
  const explicitSubtotal = toAmount(order.subtotal ?? order.subTotal ?? order.itemsSubtotal);
  const explicitDiscount = firstAmount(
    order.discountAmount,
    order.discountTotal,
    order.productDiscount,
    order.itemsDiscount,
    order.discount_total
  );
  const discount = explicitDiscount ?? Math.max(0, itemsListTotal - itemsSubtotal);
  const subtotalBeforeDiscount = itemsListTotal > 0 ? itemsListTotal : itemsSubtotal;
  const subtotal = explicitSubtotal ?? Math.max(0, subtotalBeforeDiscount - discount);
  const splitGst = firstAmount(order.cgstAmount, order.cgst) !== null ||
    firstAmount(order.sgstAmount, order.sgst) !== null ||
    firstAmount(order.igstAmount, order.igst) !== null
      ? (firstAmount(order.cgstAmount, order.cgst) ?? 0) +
        (firstAmount(order.sgstAmount, order.sgst) ?? 0) +
        (firstAmount(order.igstAmount, order.igst) ?? 0)
      : null;
  const gstAmount = firstAmount(
    order.gstAmount,
    order.gstTotal,
    order.taxAmount,
    order.tax,
    order.totalTax,
    splitGst
  ) ?? 0;
  const gstRate = firstAmount(order.gstRate, order.taxRate);
  const subtotalBeforeGst = itemsSubtotal - gstAmount;

const couponCode =
  order.couponCode ||
  order.coupon_code ||
  null;

const couponDiscount =
  firstAmount(
    order.couponDiscount,
    order.coupon_discount
  ) ?? 0;

  // ── Paid / Due breakdown ──────────────────────────────────────────────────
  // advancePaid = paid online (Razorpay). For PREPAID this equals totalAmount.
  // codAmount   = remaining amount to collect at delivery (0 for PREPAID).
  const paymentTypeNorm = String(order.paymentType || "").toUpperCase();
  const paymentMethodNorm = String(order.paymentMethod || "").toLowerCase();
  const isCodOrder = ["COD", "FULL_COD", "PARTIAL_COD"].includes(paymentTypeNorm) || ["cod", "partial_cod", "full_cod"].includes(paymentMethodNorm);
  const isPrepaid = paymentTypeNorm === "PREPAID" || (paymentMethodNorm !== "cod" && paymentMethodNorm !== "partial_cod" && paymentMethodNorm !== "full_cod" && order.paymentStatus === "paid");
  const paidAmount = firstAmount(order.advancePaid) ?? (isPrepaid ? totalAmount : 0);
  const rawDueAmount = firstAmount(order.codAmount) ?? Math.max(0, totalAmount - paidAmount);
  const isCancelled = order.status?.toLowerCase() === "cancelled";
  const dueAmount = (order.codCollected || isCancelled) ? 0 : rawDueAmount;
  const isPartialCod = paymentTypeNorm === "PARTIAL_COD";
  const paidLabel = isPartialCod ? "Paid Online (Advance)" : "Amount Paid";
  const showDueRow = (dueAmount > 0 || (isCancelled && isCodOrder)) && (!isPrepaid || isCodOrder);
  const dueLabel = dueAmount > 0 ? (isCodOrder ? "Due at Delivery" : "Amount Due") : (isCodOrder ? "Due at Delivery" : "Balance Due");

  const refund = order.refunds?.[0];
  const getRefundLabel = (ref) => {
    if (!ref) return null;
    const status = (ref.refundStatus || "").toLowerCase();
    const dateStr = ref.refundedAt
      ? " on " + new Date(ref.refundedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : "";
    if (status === "completed" || status === "manual_completed") return `Refunded ✓${dateStr}`;
    if (status === "initiated") return "Refund Initiated";
    if (status === "failed") return "Refund Failed";
    if (status === "manual_pending") return "Manual Transfer Pending";
    return ref.refundStatus;
  };

  const paymentRows = [
    paidAmount > 0 && {
      key: "paid",
      label: paidLabel,
      value: formatCurrency(paidAmount),
      className: "breakdown-row--paid",
      footerClassName: "paid-line",
    },
    order.codCollected && rawDueAmount > 0 && {
      key: "cod-collected",
      label: "Paid on Delivery (COD)",
      value: formatCurrency(rawDueAmount),
      className: "breakdown-row--paid",
      footerClassName: "paid-line",
    },
    showDueRow && {
      key: "due",
      label: dueLabel,
      value: formatCurrency(dueAmount),
      className: dueAmount > 0 ? "breakdown-row--due" : "breakdown-row--due-clear",
      footerClassName: dueAmount > 0 ? "due-line" : "due-line due-line--clear",
    },
    order.codCollected && paidAmount > 0 && {
      key: "total-paid",
      label: "Total Paid",
      value: formatCurrency(paidAmount + rawDueAmount),
      className: "breakdown-row--paid",
      footerClassName: "paid-line",
      valueClassName: "font-weight-bold",
    },
    refund && {
      key: "refund-status",
      label: "Refund",
      value: getRefundLabel(refund),
      className: "breakdown-row--refund",
      footerClassName: "refund-line",
      valueClassName: ["completed", "manual_completed"].includes(refund.refundStatus?.toLowerCase()) ? "text-success" : "text-warning",
    }
  ].filter(Boolean);
  const priceRows = [
    discount > 0 && {
      key: "items-total",
      label: "Items Total",
      value: formatCurrency(subtotalBeforeDiscount),
    },
    discount > 0 && {
      key: "discount",
      label: "Discount",
      value: `- ${formatCurrency(discount)}`,
      className: "breakdown-row--discount",
      footerClassName: "discount-line",
    },
    {
      key: "subtotal",
      label: "Subtotal (before GST)",
      value: formatCurrency(subtotalBeforeGst),
    },
    gstAmount > 0 && {
      key: "gst",
      label: gstRate ? `GST (${gstRate}%)` : "GST",
      value: formatCurrency(gstAmount),
      className: "breakdown-row--gst",
    },
    {
      key: "shipping",
      label: "Shipping",
      value: isFreeShipping ? "FREE" : formatCurrency(shippingCharge),
      valueClassName: isFreeShipping ? "shipping-free" : "",
    },
    couponCode && couponDiscount > 0 && {
      key: "coupon",
      label: `Coupon (${couponCode})`,
      value: `- ${formatCurrency(couponDiscount)}`,
      className: "breakdown-row--coupon",
      footerClassName: "coupon-line",
    },
  ].filter(Boolean);

  return (
    <Fragment>
      <SEO titleTemplate="Order Receipt" />
      <LayoutOne headerTop="visible">
        <div className="premium-order-bg pt-100 pb-100">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-xl-10">
                <div className="order-nav-bar">
                  <Link to="/my-account?tab=orders"><i className="fa fa-long-arrow-left"></i> My Account</Link>
                  {/* <button className="minimal-btn" onClick={() => window.print()}><i className="fa fa-print"></i> Print Receipt</button> */}
                </div>

                <div className="premium-main-grid">
                  <div className="premium-side-panel">
                    <div className="side-card status-box">
                      <p className="mini-label">Current Status</p>
                      <h4>{orderStatus}</h4>
                      <div className="pulse-indicator"></div>
                      {renderCancelButton()}
                    </div>

                    {order.shiprocketShipmentId && ["shipped", "processing", "delivery", "delivered"].includes(order.status?.toLowerCase()) && (
                      <div className="side-card info-summary" style={{ marginTop: "12px", border: "1px solid #bfdbfe", background: "#f0f7ff" }}>
                        <div className="info-group" style={{ margin: 0 }}>
                          <label style={{ color: "#1e3a8a", fontWeight: 700, fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                            🚚 Shipping & Tracking
                          </label>
                          <p style={{ fontSize: "13px", color: "#374151", marginTop: "6px", marginBottom: "8px" }}>
                            Courier Partner: <strong>{order.courier || "Shiprocket"}</strong>
                          </p>
                          <a
                            href={order.awbCode ? `https://shiprocket.co/tracking/${order.awbCode}` : `https://shiprocket.co/tracking/${order.shiprocketShipmentId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              backgroundColor: "#0d1b40",
                              color: "#fff",
                              padding: "8px 16px",
                              fontSize: "12px",
                              fontWeight: 600,
                              borderRadius: "6px",
                              display: "inline-block",
                              textDecoration: "none",
                              textAlign: "center",
                              width: "100%"
                            }}
                          >
                            Track Order Package
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="side-card info-summary">
                      <div className="info-group">
                        <label>Delivery Address</label>
                        <p>{shippingAddr.fullName || shippingAddr.name}, {shippingAddr.street || shippingAddr.addressLine1}, {shippingAddr.city}, {shippingAddr.state} - {shippingAddr.pincode}</p>
                      </div>
                      <div className="info-group">
                        <label>Payment Method</label>
                        <p>{formatPaymentMethod(order.paymentMethod)}</p>
                      </div>
                      <div className="info-group">
                        <label>Order ID</label>
                        <p className="text-dark font-weight-bold">{order.referenceSlug || order.orderNumber || order.id}</p>
                      </div>
                    </div>

                    <div className="side-card price-breakdown-card">
                      <div className="breakdown-header">
                        <span className="mini-label">Price Breakdown</span>
                        <i className="fa fa-credit-card"></i>
                      </div>
                      {priceRows.map((row) => (
                        <div key={row.key} className={`breakdown-row ${row.className || ""}`}>
                          <span>{row.label}</span>
                          <strong className={row.valueClassName || ""}>{row.value}</strong>
                        </div>
                      ))}
                      <div className="breakdown-row breakdown-row--grand">
                        <span>Grand Total</span>
                        <strong>{formatCurrency(totalAmount)}</strong>
                      </div>
                      {paymentRows.length > 0 && (
                        <div className="payment-status-block">
                          {paymentRows.map((row) => (
                            <div key={row.key} className={`breakdown-row ${row.className || ""}`}>
                              <span>{row.label}</span>
                              <strong className={row.valueClassName || ""}>{row.value}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="premium-content-panel">
                    <div className="tracker-header-card">
                      <div className="tracker-steps-row">
                        {stages.map((stage, i) => (
                          <div key={i} className={`step-item ${i <= currentIdx ? "active" : ""}`}>
                            <div className="icon-wrap"><i className={`fa ${stage.icon}`}></i></div>
                            <span>{stage.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="items-container-card">
                      <h5>Items in this shipment</h5>
                      {orderItems.length > 0 ? (
                        orderItems.map((item, index) => {
                          const selectedProducts = item.selectedProducts ? (typeof item.selectedProducts === 'string' ? deepParse(item.selectedProducts) : item.selectedProducts) : null;
                          return (
                            <div key={index} style={{ marginBottom: "18px" }}>
                              {/* ── Main row: img + name + qty + price (single div) ── */}
                              <div className="premium-product-row">
                                <div className="prod-img">
                                  <img
                                    src={getOrderItemImage(item.image)}
                                    alt={cleanProductName(item.productName)}
                                    onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
                                  />
                                  <span className="qty-badge">{item.quantity}</span>
                                </div>
                                <div className="prod-info">
                                  <h6>{cleanProductName(item.productName)}</h6>
                                  <p>{getVariantLabel(item)}</p>
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
                                      return (
                                        <div style={{
                                          marginTop: 6,
                                          padding: "6px 10px",
                                          background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                                          border: "1px solid #fde68a",
                                          borderRadius: "6px",
                                          fontSize: "11px",
                                          color: "#78350f",
                                          width: "fit-content",
                                          minWidth: "220px",
                                          marginBottom: 8
                                        }}>
                                          <div style={{ fontSize: "10px", fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                                            🎨 Customisation:
                                          </div>
                                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", alignItems: "center" }}>
                                            {Object.entries(custom).map(([key, val]) => {
                                               if (!val) return null;
                                               const label = key
                                                 .split('_')
                                                 .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                 .join(' ');
                                               const isFont = key.toLowerCase().includes('font');
                                               const isCol = key.toLowerCase().includes('color') || key.toLowerCase().includes('colour') || (typeof val === 'string' && val.startsWith('#'));
                                               return (
                                                 <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, ...(isFont ? { fontFamily: val } : {}) }}>
                                                   <span style={{ fontWeight: 600 }}>{label}:</span>
                                                   {isCol ? (
                                                     <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                       <span style={{
                                                         width: 12,
                                                         height: 12,
                                                         borderRadius: '50%',
                                                         background: val,
                                                         border: '1px solid rgba(0,0,0,0.15)',
                                                         display: 'inline-block'
                                                       }} />
                                                       <code style={{ fontSize: 10, background: '#f3f4f6', padding: '1px 4px', borderRadius: 4 }}>{val}</code>
                                                     </span>
                                                   ) : (
                                                     <span>
                                                       {val} {isFont && (() => {
                                                         const priorityKeys = ['name', 'text', 'custom_text', 'customisation_text', 'engraving_text'];
                                                         let textVal = 'Preview';
                                                         for (const pk of priorityKeys) {
                                                           if (custom[pk]) { textVal = custom[pk]; break; }
                                                         }
                                                         if (textVal === 'Preview') {
                                                           for (const [k, v] of Object.entries(custom)) {
                                                             const kLower = k.toLowerCase();
                                                             if (kLower.includes('font') || kLower.includes('size') || kLower.includes('color') || kLower.includes('colour')) continue;
                                                             if (typeof v !== 'string') continue;
                                                             const isColor = v.startsWith('#') || ['red', 'blue', 'green', 'yellow', 'gold', 'silver', 'black', 'white', 'rose gold', 'bronze', 'orange', 'pink', 'purple', 'grey', 'brown'].includes(v.toLowerCase());
                                                             if (isColor) continue;
                                                             textVal = v;
                                                             break;
                                                           }
                                                         }
                                                         return `(${textVal})`;
                                                       })()}
                                                     </span>
                                                   )}
                                                 </div>
                                               );
                                             })}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                  {renderItemActions(item)}
                                </div>
                                <div className="prod-price">₹{itemPrice(item).toFixed(2)}</div>
                              </div>

                              {/* ── Included Products: separate div, below the main row ── */}
                              {Array.isArray(selectedProducts) && selectedProducts.length > 0 && (
                                <div style={{ marginTop: "10px" }}>
                                    <button
                                      type="button"
                                      onClick={() => toggleIncluded(index)}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        background: "none",
                                        border: "none",
                                        padding: 0,
                                        cursor: "pointer",
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em"
                                      }}
                                    >
                                      <span>Included Products ({selectedProducts.length})</span>
                                      <span style={{
                                        display: "inline-block",
                                        transition: "transform 0.15s ease",
                                        transform: openIncluded[index] ? "rotate(180deg)" : "rotate(0deg)",
                                        fontSize: "9px"
                                      }}>▼</span>
                                    </button>

                                    {openIncluded[index] && (
                                      <div style={{
                                        marginTop: "8px",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "8px",
                                        overflow: "hidden"
                                      }}>
                                        {selectedProducts.map((p, idx) => {
                                          const pTags = (p.variantName || "")
                                            .split(/·|,/)
                                            .map(s => s.trim())
                                            .filter(Boolean)
                                            .map(part => {
                                              if (part.includes(":")) {
                                                const [k, ...rest] = part.split(":");
                                                return { key: k.trim(), val: rest.join(":").trim() };
                                              }
                                              return { key: "Variant", val: part };
                                            });
                                          return (
                                            <div key={idx} style={{
                                              padding: "8px 10px",
                                              borderBottom: idx < selectedProducts.length - 1 ? "1px solid #f0f0f0" : "none",
                                              background: "#fff"
                                            }}>
                                              <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: "8px"
                                              }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                                                  {(() => {
                                                    const getSingleImg = (img) => {
                                                      if (Array.isArray(img)) return img[0];
                                                      if (typeof img === "string") {
                                                        try {
                                                          const parsed = JSON.parse(img);
                                                          return Array.isArray(parsed) ? parsed[0] : img;
                                                        } catch {
                                                          return img;
                                                        }
                                                      }
                                                      return null;
                                                    };
                                                    const resolvedImg = getSingleImg(p.image);
                                                    return (
                                                      <img
                                                        src={resolvedImg ? getImgUrl(resolvedImg) : FALLBACK_IMG}
                                                        alt={p.name}
                                                        style={{ width: 30, height: 30, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                                                        onError={(e) => e.target.src = FALLBACK_IMG}
                                                      />
                                                    );
                                                  })()}
                                                  <span style={{
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    color: "#111",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis"
                                                  }}>
                                                    {p.name}
                                                  </span>
                                                </div>
                                                {p.quantity >= 1 && (
                                                  <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600, flexShrink: 0 }}>
                                                    × {p.quantity}
                                                  </span>
                                                )}
                                              </div>
                                              {pTags.length > 0 && (
                                                <div style={{
                                                  display: "flex",
                                                  flexWrap: "wrap",
                                                  alignItems: "center",
                                                  gap: "5px",
                                                  marginTop: "4px",
                                                  fontSize: "11px",
                                                  color: "#6b7280"
                                                }}>
                                                  {pTags.map((tag, ti) => {
                                                    const isCol = isColourKey(tag.key);
                                                    const hasPreview = isCol && isHexColor(tag.val);
                                                    return (
                                                      <span key={ti} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                                        <span>{tag.key}:</span>
                                                        {hasPreview ? (
                                                          <span
                                                            title={tag.val.toUpperCase()}
                                                            style={{
                                                              width: 10,
                                                              height: 10,
                                                              borderRadius: "50%",
                                                              border: "1px solid #dcdcdc",
                                                              backgroundColor: tag.val,
                                                              display: "inline-block"
                                                            }}
                                                          />
                                                        ) : (
                                                          <span>{tag.val}</span>
                                                        )}
                                                        {ti < pTags.length - 1 && <span style={{ color: "#d1d5db" }}>,</span>}
                                                      </span>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p style={{ color: "#999" }}>No order items found</p>
                      )}

                      <div className="premium-total-footer">
                        {priceRows.map((row) => (
                          <div key={row.key} className={`total-line ${row.footerClassName || ""}`}>
                            <span>{row.label}</span>
                            <span className={row.valueClassName || ""}>{row.value}</span>
                          </div>
                        ))}
                        <div className="total-line grand-total">
                          <span>Grand Total</span>
                          <span>{formatCurrency(totalAmount)}</span>
                        </div>
                        {paymentRows.map((row) => (
                          <div key={row.key} className={`total-line ${row.footerClassName || ""}`}>
                            <span>{row.label}</span>
                            <span className={row.valueClassName || ""}>{row.value}</span>
                          </div>
                        ))}
                      </div>
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

export default OrderDetails;