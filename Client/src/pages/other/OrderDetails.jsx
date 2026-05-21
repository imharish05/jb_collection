import { Fragment, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import api from "../../api/axios";
import cogoToast from "cogo-toast";

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.get(`/orders/${id}`)
        .then((res) => {
          setOrder(res.data);
        })
        .catch((err) => {
          console.error("Failed to fetch order:", err);
          cogoToast.error("Could not load order details", { position: "top-center" });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

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

  const stages = [
    { label: "Placed", icon: "fa-shopping-basket" },
    { label: "Processing", icon: "fa-cogs" },
    { label: "Shipped", icon: "fa-truck" },
    { label: "Out for Delivery", icon: "fa-map-marker" },
    { label: "Delivered", icon: "fa-check-circle" }
  ];

  const statusMap = {
    "pending": "Placed",
    "confirmed": "Processing",
    "processing": "Processing",
    "shipped": "Shipped",
    "delivery": "Out for Delivery",
    "delivered": "Delivered",
    "cancelled": "Cancelled"
  };

  const orderStatus = statusMap[order.status?.toLowerCase()] || order.status || "Pending";
  const currentIdx = stages.findIndex(s => s.label === orderStatus);

  const shippingAddr = order.shippingAddress || {};

  return (
    <Fragment>
      <SEO titleTemplate="Order Receipt" />
      <LayoutOne headerTop="visible">
        <div className="premium-order-bg pt-100 pb-100">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-xl-10">
                
                {/* Top Action Bar */}
                <div className="order-nav-bar">
                  <Link to="/my-account?tab=orders"><i className="fa fa-long-arrow-left"></i> My Account</Link>
                  <button className="minimal-btn" onClick={() => window.print()}><i className="fa fa-print"></i> Print Receipt</button>
                </div>

                <div className="premium-main-grid">
                  
                  {/* Left Sidebar: Minimal Status & Info */}
                  <div className="premium-side-panel">
                    <div className="side-card status-box">
                      <p className="mini-label">Current Status</p>
                      <h4>{orderStatus}</h4>
                      <div className="pulse-indicator"></div>
                    </div>

                    <div className="side-card info-summary">
                      <div className="info-group">
                        <label>Delivery Address</label>
                        <p>{shippingAddr.fullName}, {shippingAddr.street}, {shippingAddr.city}, {shippingAddr.state} - {shippingAddr.pincode}</p>
                      </div>
                      <div className="info-group">
                        <label>Payment Method</label>
                        <p>{order.paymentMethod || "Pending"}</p>
                      </div>
                      <div className="info-group">
                        <label>Order ID</label>
                        <p className="text-dark font-weight-bold">#{order.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Content: Tracking & Items */}
                  <div className="premium-content-panel">
                    
                    {/* Compact Visual Tracker */}
                    <div className="tracker-header-card">
                      <div className="tracker-steps-row">
                        {stages.map((stage, i) => (
                          <div key={i} className={`step-item ${i <= currentIdx ? 'active' : ''}`}>
                            <div className="icon-wrap"><i className={`fa ${stage.icon}`}></i></div>
                            <span>{stage.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Product List Section */}
                    <div className="items-container-card">
                      <h5>Items in this shipment</h5>
                      {Array.isArray(order.items) && order.items.length > 0 ? (
                        <>
                          {order.items.map((item, index) => (
                            <div className="premium-product-row" key={index}>
                              <div className="prod-img">
                                <img src={item.image?.[0] || "https://via.placeholder.com/80"} alt={item.productName || "Product"} onError={(e) => { e.target.src = "https://via.placeholder.com/80"; }} />
                                <span className="qty-badge">{item.quantity}</span>
                              </div>
                              <div className="prod-info">
                                <h6>{item.productName || "Product"}</h6>
                                <p>Price: ₹{item.price}</p>
                              </div>
                              <div className="prod-price">₹{item.price * item.quantity}</div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <p style={{ color: "#999" }}>No items found</p>
                      )}

                      {/* Floating Total Area */}
                      <div className="premium-total-footer">
                        <div className="total-line">
                          <span>Subtotal</span>
                          <span>₹{order.totalAmount || "0"}</span>
                        </div>
                        <div className="total-line">
                          <span>Payment Status</span>
                          <span className={order.paymentStatus === 'paid' ? "text-success" : "text-warning"}>{order.paymentStatus || "Pending"}</span>
                        </div>
                        <div className="total-line grand-total">
                          <span>Amount Paid</span>
                          <span>₹{order.totalAmount || "0"}</span>
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