// utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (not your Gmail login password)
  },
});

/**
 * Send order confirmation email to customer.
 * @param {object} order   - The Order model instance (with .items populated)
 * @param {object} user    - { name, email }
 */
const sendOrderConfirmationEmail = async (order, user) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[Mailer] EMAIL_USER or EMAIL_PASS not set — skipping email");
    return;
  }

  const items = order.items || [];

  // Build items table rows
  const itemRows = items
    .map((item) => {
      const name = item.productName || item.name || "Product";
      const qty = item.quantity || 1;
      const price = parseFloat(item.salesPrice || item.price || 0);
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;">${name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:center;">${qty}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right;font-weight:600;">₹${(price * qty).toFixed(2)}</td>
        </tr>`;
    })
    .join("");

  // shippingAddress may be stored as a JSON string in DB — parse it
  let addr = order.shippingAddress || {};
  if (typeof addr === "string") {
    try { addr = JSON.parse(addr); } catch { addr = {}; }
  }
  const addrLine = [addr.street, addr.apartment, addr.city, addr.state, addr.pincode]
    .filter(Boolean)
    .join(", ");

  const PAYMENT_LABELS = {
    card: "Credit / Debit Card",
    upi: "UPI",
    netbanking: "Net Banking",
    wallet: "Wallet",
    cod: "Cash on Delivery (COD)",
    razorpay: "Online Payment (Razorpay)",
  };

  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || "COD";
  const grandTotal = parseFloat(order.totalAmount || 0).toFixed(2);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg, rgba(223, 77, 129, 0.4) 0%, rgb(255, 232, 214) 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#000;font-size:26px;font-weight:700;letter-spacing:0.5px;">
              🎁 Kamali Gifts
            </h1>
            <p style="margin:8px 0 0;color:rgba(0,0,0,0.85);font-size:14px;">Order Confirmation</p>
          </td>
        </tr>

        <!-- Thank you -->
        <tr>
          <td style="padding:36px 40px 24px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">🎉</div>
            <h2 style="margin:0 0 8px;font-size:22px;color:#2c2c2c;font-weight:700;">
              Thank you, ${user.name?.split(" ")[0] || "Customer"}!
            </h2>
            <p style="margin:0;color:#666;font-size:15px;">Your order has been placed successfully. We'll get it packed with love! 💝</p>
            <div style="display:inline-block;background:rgba(223, 77, 129, 1);color:#fff;border-radius:30px;padding:10px 28px;font-weight:700;font-size:16px;letter-spacing:1px;margin-top:16px;">
              Order ID: ${order.id}
            </div>
          </td>
        </tr>

        <!-- Items table -->
        <tr>
          <td style="padding:0 40px 28px;">
            <h3 style="margin:0 0 14px;font-size:15px;color:#333;font-weight:700;padding-bottom:10px;border-bottom:1px solid #f0f0f0;">
              📦 Items Ordered
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0">
              <thead>
                <tr style="background:#fafafa;">
                  <th style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;text-align:left;">Product</th>
                  <th style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;text-align:center;">Qty</th>
                  <th style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;text-align:right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
                <tr>
                  <td colspan="2" style="padding:12px;font-weight:700;font-size:15px;border-top:2px solid #f0f0f0;">Grand Total</td>
                  <td style="padding:12px;font-weight:700;font-size:15px;color:rgba(223, 77, 129, 1);text-align:right;border-top:2px solid #f0f0f0;">₹${grandTotal}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        <!-- Delivery & Payment -->
        <tr>
          <td style="padding:0 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;vertical-align:top;border-right:1px solid #eee;" width="50%">
                  <h4 style="margin:0 0 12px;font-size:14px;color:#333;font-weight:700;">🏠 Delivery Details</h4>
                  <p style="margin:0 0 6px;font-size:13px;color:#555;"><strong>${addr.fullName || user.name || ""}</strong></p>
                  <p style="margin:0 0 6px;font-size:13px;color:#555;">${addr.phone || ""}</p>
                  <p style="margin:0 0 6px;font-size:13px;color:#555;">${addrLine}</p>
                  <p style="margin:12px 0 0;font-size:13px;color:#2e7d32;font-weight:600;">🚚 Est. delivery: 3–7 business days</p>
                </td>
                <td style="padding:20px 24px;vertical-align:top;" width="50%">
                  <h4 style="margin:0 0 12px;font-size:14px;color:#333;font-weight:700;">💳 Payment</h4>
                  <p style="margin:0 0 6px;font-size:13px;color:#555;">${paymentLabel}</p>
                  <span style="display:inline-block;background:${order.paymentMethod === "cod" ? "#fff3e0" : "#e8f5e9"};color:${order.paymentMethod === "cod" ? "#e65100" : "#2e7d32"};padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-top:4px;">
                    ${order.paymentMethod === "cod" ? "Pay on Delivery" : "Payment Received"}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:#fafafa;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="margin:0 0 8px;font-size:13px;color:#888;">Need help? Contact us at <a href="mailto:${process.env.ADMIN_EMAIL}" style="color:#c0622a;">${process.env.ADMIN_EMAIL}</a></p>
            <p style="margin:0;font-size:12px;color:#bbb;">© ${new Date().getFullYear()} Kamali Gifts. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Kamali Gifts" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Order Confirmed 🎉 — Order #${order.id} | Kamali Gifts`,
    html,
  });

  console.log(`[Mailer] Order confirmation sent to ${user.email}`);
};

module.exports = { sendOrderConfirmationEmail };