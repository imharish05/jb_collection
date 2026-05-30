import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { getImgUrl } from "../../helpers/imageUrl";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";

const parseJson = (val) => {
  if (!val || typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return val; }
};

const getOrderItemImage = (img) => {
  const arr = Array.isArray(img) ? img : parseJson(img);
  const raw = Array.isArray(arr) ? arr[0] : (typeof img === "string" ? img : null);
  return raw ? getImgUrl(raw) : "/assets/img/products/products-1.jpeg";
};

const OrderConfirmation = () => {
  const { state } = useLocation();
  const orderId = state?.orderId || "KG000000";
  const selectedAddr = state?.selectedShippingAddr || state?.selectedAddr || {};
  const paymentMethod = state?.paymentMethod || "cod";
  const cartItems = state?.cartItems || [];
  const estimatedDays = state?.estimatedDays || null;

  const cartTotalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const PAYMENT_LABELS = {
    card: "Credit / Debit Card",
    upi: "UPI",
    netbanking: "Net Banking",
    wallet: "Wallet",
    cod: "Cash on Delivery (COD)",
    razorpay: "Online Payment (Razorpay)",
  };

  return (
    <Fragment>
      <SEO titleTemplate="Order Confirmed — Kamali Gifts" description="Your order has been placed successfully." />
      <LayoutOne headerTop="visible">
        <div className="container" style={{ padding: "80px 15px 100px" }}>

          {/* Thank you banner */}
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
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#2c2c2c", marginBottom: 8 }}>
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
                fontSize: 18,
                letterSpacing: 1,
              }}
            >
              Order ID: {orderId}
            </div>
          </div>

          {/* Order details grid */}
          <div className="row" style={{ marginBottom: 32 }}>

            {/* Items */}
            <div className="col-lg-7">
              <div style={cardStyle}>
                <h4 style={cardTitle}>📦 Items Ordered</h4>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f9f9f9" }}>
                      <th style={thStyle}>Product</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Qty</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <img
                              src={getOrderItemImage(item.image)}
                              alt=""
                              style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }}
                            />
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>{item.quantity}</td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ borderTop: "2px solid #f0f0f0", marginTop: 12, paddingTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16 }}>
                    <span>Grand Total</span>
                    <span style={{ color: "rgba(223, 77, 129)" }}>₹{parseFloat(cartTotalPrice).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery & Payment */}
            <div className="col-lg-5">
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

              <div style={cardStyle}>
                <h4 style={cardTitle}>💳 Payment</h4>
                <div style={infoRow}>
                  <span style={infoLabel}>Method</span>
                  <span style={infoValue}>{PAYMENT_LABELS[paymentMethod]}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Status</span>
                  <span
                    style={{
                      ...infoValue,
                      background: paymentMethod === "cod" ? "#fff3e0" : "#e8f5e9",
                      color: paymentMethod === "cod" ? "rgba(223, 77, 129)" : "#2e7d32",
                      padding: "2px 10px",
                      borderRadius: 20,
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {paymentMethod === "cod" ? "Pay on Delivery" : "Payment Received"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notification note */}
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

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to={process.env.PUBLIC_URL + "/my-account?tab=orders"}
              style={{
                background: "#db1a5d",
                color: "#fff",
                padding: "12px 32px",
                borderRadius: 30,
                fontWeight: 600,
                textDecoration: "none",
                fontSize: 15,
              }}
            >
              View My Orders
            </Link>
            <Link
              to={process.env.PUBLIC_URL + "/shop"}
              style={{
                background: "#fff",
                color: "#db1a5d",
                padding: "12px 32px",
                borderRadius: 30,
                fontWeight: 600,
                textDecoration: "none",
                fontSize: 15,
                border: "2px solid #db1a5d",
              }}
            >
              Continue Shopping
            </Link>
          </div>

        </div>
      </LayoutOne>
    </Fragment>
  );
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 14,
  padding: "20px 24px",
  marginBottom: 0,
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
};
const cardTitle = {
  fontWeight: 700,
  fontSize: 15,
  marginBottom: 16,
  color: "#333",
  paddingBottom: 10,
  borderBottom: "1px solid #f0f0f0",
};
const thStyle = {
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 600,
  color: "#888",
  textAlign: "left",
};
const tdStyle = { padding: "10px 12px", fontSize: 14 };
const infoRow = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 16 };
const infoLabel = { fontSize: 13, color: "#888", flexShrink: 0 };
const infoValue = { fontSize: 13, color: "#333", fontWeight: 500, textAlign: "right" };

export default OrderConfirmation;