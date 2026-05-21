import { Fragment } from "react";
import { useParams, Link } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";

const OrderDetails = () => {
  const { id } = useParams();

  const orderData = {
    id: id || "KG102345",
    status: "Shipped", // Order Placed, Processing, Shipped, Out for Delivery, Delivered
    items: [
      { name: "Divine Statue", qty: 1, price: "₹850", img: "/assets/img/products/products-9.jpeg" },
      { name: "Premium Gift Box", qty: 1, price: "₹400", img: "/assets/img/products/products-1.jpeg" }
    ]
  };

  const stages = [
    { label: "Placed", icon: "fa-shopping-basket" },
    { label: "Processing", icon: "fa-cogs" },
    { label: "Shipped", icon: "fa-truck" },
    { label: "Out for Delivery", icon: "fa-map-marker" },
    { label: "Delivered", icon: "fa-check-circle" }
  ];

  const currentIdx = stages.findIndex(s => s.label === orderData.status);

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
                  <Link to="/my-account"><i className="fa fa-long-arrow-left"></i> My Account</Link>
                  <button className="minimal-btn"><i className="fa fa-print"></i> Print Receipt</button>
                </div>

                <div className="premium-main-grid">
                  
                  {/* Left Sidebar: Minimal Status & Info */}
                  <div className="premium-side-panel">
                    <div className="side-card status-box">
                      <p className="mini-label">Current Status</p>
                      <h4>{orderData.status}</h4>
                      <div className="pulse-indicator"></div>
                    </div>

                    <div className="side-card info-summary">
                      <div className="info-group">
                        <label>Delivery Address</label>
                        <p>John Doe, 123 Kamali Lane, Coimbatore, TN - 641001</p>
                      </div>
                      <div className="info-group">
                        <label>Payment Method</label>
                        <p>UPI • PayTM / PhonePe</p>
                      </div>
                      <div className="info-group">
                        <label>Order ID</label>
                        <p className="text-dark font-weight-bold">#{orderData.id}</p>
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
                      {orderData.items.map((item, index) => (
                        <div className="premium-product-row" key={index}>
                          <div className="prod-img">
                            <img src={item.img} alt="" />
                            <span className="qty-badge">{item.qty}</span>
                          </div>
                          <div className="prod-info">
                            <h6>{item.name}</h6>
                            <p>Handcrafted Series</p>
                          </div>
                          <div className="prod-price">{item.price}</div>
                        </div>
                      ))}

                      {/* Floating Total Area */}
                      <div className="premium-total-footer">
                        <div className="total-line">
                          <span>Subtotal</span>
                          <span>₹1,250</span>
                        </div>
                        <div className="total-line">
                          <span>Shipping</span>
                          <span className="text-success">Free</span>
                        </div>
                        <div className="total-line grand-total">
                          <span>Amount Paid</span>
                          <span>₹1,250</span>
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