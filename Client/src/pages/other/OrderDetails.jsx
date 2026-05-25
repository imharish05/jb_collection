import { Fragment, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import api from "../../api/axios";
import cogoToast from "cogo-toast";
import { getImgUrl } from "../../helpers/imageUrl";

const parseJson = (val) => {
  if (!val || typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return val; }
};
const getOrderItemImage = (img) => {
  const arr = Array.isArray(img) ? img : parseJson(img);
  const raw = Array.isArray(arr) ? arr[0] : (typeof img === "string" ? img : null);
  return raw ? getImgUrl(raw) : "https://via.placeholder.com/80";
};

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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
    if (normalized === "cod") return "Cash on Delivery";
    if (normalized === "upi") return "UPI";
    if (normalized === "razorpay") return "Razorpay";
    return method;
  };

  const statusMap = {
    pending: "Placed",
    confirmed: "Processing",
    processing: "Processing",
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
    if (item.selectedVariantName) return item.selectedVariantName;
    if (item.variantAttributes && Array.isArray(item.variantAttributes) && item.variantAttributes.length) {
      return item.variantAttributes.map((attr) => `${attr.key}: ${attr.value}`).join(" · ");
    }
    return "Handcrafted Series";
  };

  const itemPrice = (item) => {
    const price = item.price ?? item.salesPrice ?? item.mrp ?? 0;
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
  // shippingAddress may be stored as a JSON string in DB
  let shippingAddr = order.shippingAddress || {};
  if (typeof shippingAddr === "string") {
    try { shippingAddr = JSON.parse(shippingAddr); } catch { shippingAddr = {}; }
  }
  const orderItems = Array.isArray(order.items) ? order.items : [];
  const orderTotal = typeof order.totalAmount === "string" ? parseFloat(order.totalAmount) : order.totalAmount;

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
                  <button className="minimal-btn" onClick={() => window.print()}><i className="fa fa-print"></i> Print Receipt</button>
                </div>

                <div className="premium-main-grid">
                  <div className="premium-side-panel">
                    <div className="side-card status-box">
                      <p className="mini-label">Current Status</p>
                      <h4>{orderStatus}</h4>
                      <div className="pulse-indicator"></div>
                    </div>

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
                        <p className="text-dark font-weight-bold">#{order.id}</p>
                      </div>
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
                        orderItems.map((item, index) => (
                          <div className="premium-product-row" key={index}>
                            <div className="prod-img">
                              <img
                                src={getOrderItemImage(item.image)}
                                alt={item.productName || "Product"}
                                onError={(e) => { e.target.src = "https://via.placeholder.com/80"; }}
                              />
                              <span className="qty-badge">{item.quantity}</span>
                            </div>
                            <div className="prod-info">
                              <h6>{item.productName || "Product"}</h6>
                              <p>{getVariantLabel(item)}</p>
                            </div>
                            <div className="prod-price">₹{itemPrice(item).toFixed(2)}</div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: "#999" }}>No order items found</p>
                      )}

                      <div className="premium-total-footer">
                        <div className="total-line">
                          <span>Subtotal</span>
                          <span>₹{orderTotal?.toFixed(2) ?? "0.00"}</span>
                        </div>
                        <div className="total-line">
                          <span>Shipping</span>
                          <span className="text-success">Free</span>
                        </div>
                        <div className="total-line grand-total">
                          <span>Amount Paid</span>
                          <span>₹{orderTotal?.toFixed(2) ?? "0.00"}</span>
                        </div>
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