// utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOrderConfirmationEmail = async (order, user) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[Mailer] EMAIL_USER or EMAIL_PASS not set — skipping email");
    return;
  }

  const items = order.items || [];

  // ── Item rows ──────────────────────────────────────────────────────────────
  const itemRows = items.map((item) => {
    const name = item.productName || item.name || "Product";
    const variant = item.selectedVariantName
      ? `<div style="font-size:11px;color:#999;margin-top:3px;">${item.selectedVariantName}</div>`
      : "";
    const qty  = item.quantity || 1;
    const price = parseFloat(item.salesPrice || item.price || 0);
    const mrp   = parseFloat(item.mrp || 0);
    const mrpHtml = mrp > price
      ? `<span style="text-decoration:line-through;color:#bbb;font-size:12px;margin-right:4px;">₹${(mrp * qty).toFixed(2)}</span>`
      : "";
    return `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #f5f5f5;font-size:14px;color:#333;">
          ${name}${variant}
        </td>
        <td style="padding:12px;border-bottom:1px solid #f5f5f5;font-size:14px;text-align:center;color:#555;">${qty}</td>
        <td style="padding:12px;border-bottom:1px solid #f5f5f5;font-size:14px;text-align:right;">
          ${mrpHtml}<span style="font-weight:600;color:#222;">₹${(price * qty).toFixed(2)}</span>
        </td>
      </tr>`;
  }).join("");

  // ── Address ────────────────────────────────────────────────────────────────
  let addr = order.shippingAddress || {};
  if (typeof addr === "string") { try { addr = JSON.parse(addr); } catch { addr = {}; } }
  const addrLine = [addr.street, addr.apartment, addr.city, addr.state, addr.pincode]
    .filter(Boolean).join(", ");

  // ── Price breakdown ────────────────────────────────────────────────────────
  const itemsSubtotal = items.reduce((s, it) => {
    return s + parseFloat(it.salesPrice || it.price || 0) * (it.quantity || 1);
  }, 0);
  const shippingCharge = parseFloat(order.shippingCharge || 0);
  const couponDiscount = Math.max(0, itemsSubtotal + shippingCharge - parseFloat(order.totalAmount || 0));
  const grandTotal     = parseFloat(order.totalAmount || 0);

  const shippingRow = shippingCharge > 0
    ? `<tr>
        <td style="padding:8px 0;font-size:13px;color:#666;">Shipping</td>
        <td style="padding:8px 0;font-size:13px;text-align:right;color:#333;">₹${shippingCharge.toFixed(2)}</td>
       </tr>`
    : `<tr>
        <td style="padding:8px 0;font-size:13px;color:#666;">Shipping</td>
        <td style="padding:8px 0;font-size:13px;text-align:right;color:#16a34a;font-weight:600;">FREE</td>
       </tr>`;

  const couponRow = couponDiscount > 0
    ? `<tr>
        <td style="padding:8px 0;font-size:13px;color:#666;">Coupon ${order.couponCode ? `(${order.couponCode})` : ""}</td>
        <td style="padding:8px 0;font-size:13px;text-align:right;color:#16a34a;font-weight:600;">−₹${couponDiscount.toFixed(2)}</td>
       </tr>`
    : "";

  // ── Estimated delivery ─────────────────────────────────────────────────────
  const estDays = order.estimatedDeliveryDays;
  const estDeliveryText = estDays
    ? `${estDays} ${estDays === 1 ? "business day" : "business days"}`
    : "3–7 business days";

  // ── Payment labels ─────────────────────────────────────────────────────────
  const PAYMENT_LABELS = {
    card: "Credit / Debit Card", upi: "UPI", netbanking: "Net Banking",
    wallet: "Wallet", cod: "Cash on Delivery (COD)", razorpay: "Online Payment (Razorpay)",
  };
  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || "COD";
  const isCOD = order.paymentMethod === "cod";

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
    <td style="background:linear-gradient(135deg,rgba(223,77,129,0.4) 0%,rgb(255,232,214) 100%);padding:36px 40px;text-align:center;">
      <h1 style="margin:0;color:#000;font-size:26px;font-weight:700;letter-spacing:0.5px;">🎁 Kamali Gifts</h1>
      <p style="margin:8px 0 0;color:rgba(0,0,0,0.75);font-size:14px;">Order Confirmation</p>
    </td>
  </tr>

  <!-- Thank you -->
  <tr>
    <td style="padding:36px 40px 28px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">🎉</div>
      <h2 style="margin:0 0 8px;font-size:22px;color:#2c2c2c;font-weight:700;">
        Thank you, ${user.name?.split(" ")[0] || "Customer"}!
      </h2>
      <p style="margin:0;color:#666;font-size:15px;">Your order has been placed successfully. We'll get it packed with love! 💝</p>
      <div style="display:inline-block;background:#db1a5d;color:#fff;border-radius:30px;padding:10px 28px;font-weight:700;font-size:15px;letter-spacing:1px;margin-top:16px;">
        Order ID: ${order.id}
      </div>
    </td>
  </tr>

  <!-- Items ordered -->
  <tr>
    <td style="padding:0 40px 28px;">
      <h3 style="margin:0 0 14px;font-size:15px;color:#333;font-weight:700;padding-bottom:10px;border-bottom:2px solid #f5f5f5;">
        📦 Items Ordered
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <thead>
          <tr style="background:#fafafa;">
            <th style="padding:8px 12px;font-size:12px;color:#999;font-weight:600;text-align:left;">Product</th>
            <th style="padding:8px 12px;font-size:12px;color:#999;font-weight:600;text-align:center;">Qty</th>
            <th style="padding:8px 12px;font-size:12px;color:#999;font-weight:600;text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </td>
  </tr>

  <!-- Price breakdown -->
  <tr>
    <td style="padding:0 40px 28px;">
      <h3 style="margin:0 0 14px;font-size:15px;color:#333;font-weight:700;padding-bottom:10px;border-bottom:2px solid #f5f5f5;">
        🧾 Price Breakdown
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#666;">Items Subtotal</td>
          <td style="padding:8px 0;font-size:13px;text-align:right;color:#333;">₹${itemsSubtotal.toFixed(2)}</td>
        </tr>
        ${shippingRow}
        ${couponRow}
        <tr>
          <td colspan="2" style="padding:4px 0;border-top:1px dashed #e5e5e5;"></td>
        </tr>
        <tr>
          <td style="padding:12px 0 4px;font-size:16px;font-weight:700;color:#222;">Grand Total</td>
          <td style="padding:12px 0 4px;font-size:16px;font-weight:700;text-align:right;color:#db1a5d;">₹${grandTotal.toFixed(2)}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Delivery details (column) -->
  <tr>
    <td style="padding:0 40px 20px;">
      <h3 style="margin:0 0 14px;font-size:15px;color:#333;font-weight:700;padding-bottom:10px;border-bottom:2px solid #f5f5f5;">
        🏠 Delivery Details
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;">
        <tr>
          <td width="36%" style="padding:10px 16px;background:#fafafa;font-size:12px;color:#999;font-weight:600;border-bottom:1px solid #f0f0f0;">Name</td>
          <td style="padding:10px 16px;font-size:13px;color:#333;font-weight:600;border-bottom:1px solid #f0f0f0;">${addr.fullName || user.name || "—"}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;background:#fafafa;font-size:12px;color:#999;font-weight:600;border-bottom:1px solid #f0f0f0;">Phone</td>
          <td style="padding:10px 16px;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0;">${addr.phone || "—"}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;background:#fafafa;font-size:12px;color:#999;font-weight:600;border-bottom:1px solid #f0f0f0;">Address</td>
          <td style="padding:10px 16px;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0;">${addrLine || "—"}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;background:#fafafa;font-size:12px;color:#999;font-weight:600;">Est. Delivery</td>
          <td style="padding:10px 16px;font-size:13px;color:#16a34a;font-weight:600;">🚚 ${estDeliveryText}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Payment details (column) -->
  <tr>
    <td style="padding:0 40px 32px;">
      <h3 style="margin:0 0 14px;font-size:15px;color:#333;font-weight:700;padding-bottom:10px;border-bottom:2px solid #f5f5f5;">
        💳 Payment
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;">
        <tr>
          <td width="36%" style="padding:10px 16px;background:#fafafa;font-size:12px;color:#999;font-weight:600;border-bottom:1px solid #f0f0f0;">Method</td>
          <td style="padding:10px 16px;font-size:13px;color:#333;font-weight:600;border-bottom:1px solid #f0f0f0;">${paymentLabel}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;background:#fafafa;font-size:12px;color:#999;font-weight:600;">Status</td>
          <td style="padding:10px 16px;">
            <span style="display:inline-block;background:${isCOD ? "#fff3e0" : "#e8f5e9"};color:${isCOD ? "#b45309" : "#16a34a"};padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600;">
              ${isCOD ? "Pay on Delivery" : "Payment Received"}
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:24px 40px;background:#fafafa;text-align:center;border-top:1px solid #f0f0f0;">
      <p style="margin:0 0 8px;font-size:13px;color:#888;">
        Need help? Contact us at <a href="mailto:${process.env.ADMIN_EMAIL || process.env.EMAIL_USER}" style="color:#db1a5d;">${process.env.ADMIN_EMAIL || process.env.EMAIL_USER}</a>
      </p>
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
