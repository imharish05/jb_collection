// utils/mailer.js
const nodemailer = require("nodemailer");

const SUPPORT_EMAIL = "kamalireturngifts@gmail.com";
const SUPPORT_WHATSAPP = "+91 73388 14319";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const BADGE_STYLES = {
  green: { bg: "#e8f5e9", color: "#16a34a", border: "#a5d6a7" },
  blue: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  orange: { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  red: { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
  purple: { bg: "#f3e8ff", color: "#7e22ce", border: "#e9d5ff" },
};

const STATUS_EMAIL_CONFIG = {
  confirmed: {
    subject: (orderId) => `Order Confirmed 🎉 — Order #${orderId} | Kamali Gifts`,
    heroIcon: "🎉",
    heroTitle: "Your Order Has Been Confirmed",
    heroMessage:
      "Thank you for your purchase! We have successfully received your order and our team is preparing it for shipment.",
    badgeText: "Confirmed",
    badgeStyle: BADGE_STYLES.green,
  },
  shipped: {
    subject: (orderId) => `Order Shipped 📦 — Order #${orderId} | Kamali Gifts`,
    heroIcon: "📦",
    heroTitle: "Your Order Has Been Shipped",
    heroMessage:
      "Good news! Your order has been packed and handed over to our delivery partner.",
    badgeText: "Shipped",
    badgeStyle: BADGE_STYLES.blue,
    showTrackingButton: true,
  },
  processing: {
    subject: (orderId) => `Out For Delivery 🚚 — Order #${orderId} | Kamali Gifts`,
    heroIcon: "🚚",
    heroTitle: "Your Order Is Out For Delivery",
    heroMessage: "Your package is on its final journey and should arrive shortly.",
    badgeText: "Out For Delivery",
    badgeStyle: BADGE_STYLES.orange,
    notice:
      "Please keep your phone available to receive delivery updates.",
  },
  delivered: {
    subject: (orderId) => `Delivered Successfully ✅ — Order #${orderId} | Kamali Gifts`,
    heroIcon: "✅",
    heroTitle: "Your Order Has Been Delivered",
    heroMessage:
      "Your order has been successfully delivered. We hope you enjoy your purchase.",
    badgeText: "Delivered",
    badgeStyle: BADGE_STYLES.green,
    additionalSection: "delivered",
  },
  cancelled: {
    subject: (orderId) => `Order Cancelled ❌ — Order #${orderId} | Kamali Gifts`,
    heroIcon: "❌",
    heroTitle: "Your Order Has Been Cancelled",
    heroMessage: "Your order has been cancelled successfully.",
    badgeText: "Cancelled",
    badgeStyle: BADGE_STYLES.red,
    additionalSection: "refund",
  },
  returned: {
    subject: (orderId) => `Return Request Updated ↩️ — Order #${orderId} | Kamali Gifts`,
    heroIcon: "↩️",
    heroTitle: "Return Process Started",
    heroMessage: "Your return request is currently being processed.",
    badgeText: "Returned",
    badgeStyle: BADGE_STYLES.purple,
    additionalSection: "return",
  },
};

const PAYMENT_LABELS = {
  card: "Credit / Debit Card",
  upi: "UPI",
  netbanking: "Net Banking",
  wallet: "Wallet",
  cod: "Cash on Delivery (COD)",
  partial_cod: "Partial Cash on Delivery",
  razorpay: "Online Payment (Razorpay)",
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));

const safeNumber = (value, fallback = 0) => {
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
};

const asPlain = (value) => {
  if (value && typeof value.get === "function") {
    return value.get({ plain: true });
  }
  return value || {};
};

const normalizeStatusKey = (status) => {
  const key = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return key === "out_for_delivery" ? "processing" : key;
};

const getTrackingUrl = (order, trackingDetails = {}) => {
  const details = asPlain(trackingDetails);
  const orderData = asPlain(order);
  return (
    details.trackingUrl ||
    details.tracking_url ||
    details.shiprocketTrackingUrl ||
    details.shiprocket_tracking_url ||
    details.url ||
    orderData.trackingUrl ||
    orderData.tracking_url ||
    orderData.shiprocketTrackingUrl ||
    orderData.shiprocket_tracking_url ||
    ""
  );
};

const buildItemRows = (items) => {
  if (!items.length) {
    return `
      <tr>
        <td colspan="3" style="padding:12px;border-bottom:1px solid #f5f5f5;font-size:14px;color:#777;text-align:center;">
          No items found
        </td>
      </tr>`;
  }

  return items.map((item) => {
    const row = asPlain(item);
    const name = escapeHtml(row.productName || row.name || row.comboName || "Product");
    const variant = row.selectedVariantName
      ? `<div style="font-size:11px;color:#999;margin-top:3px;">${escapeHtml(row.selectedVariantName)}</div>`
      : "";
    const qty = safeNumber(row.quantity, 1) || 1;
    const price = safeNumber(row.salesPrice || row.price);
    const mrp = safeNumber(row.mrp);
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
};

const buildStatusExtras = ({ config, trackingUrl }) => {
  const blocks = [];

  if (config.showTrackingButton && trackingUrl) {
    blocks.push(`
  <tr>
    <td style="padding:0 40px 28px;text-align:center;">
      <a href="${escapeHtml(trackingUrl)}" target="_blank" rel="noopener noreferrer"
        style="display:inline-block;background:#db1a5d;color:#fff;text-decoration:none;border-radius:30px;padding:12px 30px;font-weight:700;font-size:14px;letter-spacing:0.4px;">
        Track Shipment
      </a>
    </td>
  </tr>`);
  }

  if (config.notice) {
    blocks.push(`
  <tr>
    <td style="padding:0 40px 28px;">
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;color:#9a3412;font-size:13px;font-weight:600;">
        ${escapeHtml(config.notice)}
      </div>
    </td>
  </tr>`);
  }

  if (config.additionalSection === "delivered") {
    blocks.push(`
  <tr>
    <td style="padding:0 40px 28px;">
      <div style="background:#f9fff9;border:1px solid #c8e6c9;border-radius:10px;padding:16px;overflow:hidden;">
        <h3 style="margin:0 0 14px;font-size:15px;color:#27ae60;font-weight:700;padding-bottom:10px;border-bottom:2px solid #c8e6c9;">
          Need Help?
        </h3>
        <p style="margin:0 0 12px;font-size:13px;color:#666;line-height:1.6;">
          If there are any issues with your order, please contact our support team within 3 days of delivery.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#666;">WhatsApp</td>
            <td style="padding:6px 0;font-size:13px;text-align:right;color:#333;font-weight:600;">${SUPPORT_WHATSAPP}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#666;">Email</td>
            <td style="padding:6px 0;font-size:13px;text-align:right;">
              <a href="mailto:${SUPPORT_EMAIL}" style="color:#db1a5d;font-weight:600;">${SUPPORT_EMAIL}</a>
            </td>
          </tr>
        </table>
      </div>
    </td>
  </tr>`);
  }

  if (config.additionalSection === "refund") {
    blocks.push(`
  <tr>
    <td style="padding:0 40px 28px;">
      <div style="background:#fffafa;border:1px solid #fecaca;border-radius:10px;padding:16px;overflow:hidden;">
        <h3 style="margin:0 0 14px;font-size:15px;color:#dc2626;font-weight:700;padding-bottom:10px;border-bottom:2px solid #fecaca;">
          Refund Information
        </h3>
        <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
          If payment was completed online, any eligible refund will be processed according to our refund policy.
        </p>
      </div>
    </td>
  </tr>`);
  }

  if (config.additionalSection === "return") {
    blocks.push(`
  <tr>
    <td style="padding:0 40px 28px;">
      <div style="background:#fbf7ff;border:1px solid #e9d5ff;border-radius:10px;padding:16px;overflow:hidden;">
        <h3 style="margin:0 0 14px;font-size:15px;color:#7e22ce;font-weight:700;padding-bottom:10px;border-bottom:2px solid #e9d5ff;">
          Return Status
        </h3>
        <ul style="margin:0;padding-left:20px;color:#666;font-size:13px;line-height:1.8;">
          <li>Return Request Submitted</li>
          <li>Under Review</li>
          <li>Pickup Scheduled</li>
          <li>Pickup Completed</li>
          <li>Refund Processing</li>
        </ul>
      </div>
    </td>
  </tr>`);
  }

  return blocks.join("");
};

const buildOrderEmailHtml = ({ order, user, status, trackingDetails }) => {
  const orderData = asPlain(order);
  const statusKey = normalizeStatusKey(status || orderData.status || "confirmed");
  const config = STATUS_EMAIL_CONFIG[statusKey];

  if (!config) {
    return null;
  }

  const items = (orderData.items || []).map(asPlain);
  const itemRows = buildItemRows(items);

  let addr = asPlain(orderData.shippingAddress || {});
  if (typeof addr === "string") {
    try {
      addr = JSON.parse(addr);
    } catch {
      addr = {};
    }
  }

  const addrLine = [
    addr.street,
    addr.apartment,
    addr.city,
    addr.state,
    addr.pincode,
  ].filter(Boolean).map(escapeHtml).join(", ");

  const itemsSubtotal = items.reduce((sum, item) => {
    const row = asPlain(item);
    return sum + safeNumber(row.salesPrice || row.price) * (safeNumber(row.quantity, 1) || 1);
  }, 0);
  const shippingCharge = safeNumber(orderData.shippingCharge);
  const couponDiscount = safeNumber(orderData.couponDiscount);
  const taxAmount = safeNumber(orderData.taxAmount);
  const grandTotal = safeNumber(orderData.totalAmount);
  const couponCode = orderData.couponCode ? escapeHtml(orderData.couponCode) : "";
  const trackingUrl = getTrackingUrl(orderData, trackingDetails);
  const statusExtras = buildStatusExtras({ config, trackingUrl });
  const statusStyle = config.badgeStyle;

  const shippingRow = shippingCharge > 0
    ? `<tr>
        <td style="padding:8px 0;font-size:13px;color:#666;">Shipping Charges</td>
        <td style="padding:8px 0;font-size:13px;text-align:right;color:#333;">₹${shippingCharge.toFixed(2)}</td>
       </tr>`
    : `<tr>
        <td style="padding:8px 0;font-size:13px;color:#666;">Shipping Charges</td>
        <td style="padding:8px 0;font-size:13px;text-align:right;color:#16a34a;font-weight:600;">FREE</td>
       </tr>`;

  const couponRow = couponDiscount > 0
    ? `<tr>
        <td style="padding:8px 0;font-size:13px;color:#666;">Coupon Discount ${couponCode ? `<span style="color:#16a34a;font-size:11px;font-weight:600;">(${couponCode})</span>` : ""}</td>
        <td style="padding:8px 0;font-size:13px;text-align:right;color:#16a34a;font-weight:600;">−₹${couponDiscount.toFixed(2)}</td>
       </tr>`
    : "";

  const taxRow = taxAmount > 0
    ? `<tr>
        <td style="padding:8px 0;font-size:13px;color:#666;">Tax / GST</td>
        <td style="padding:8px 0;font-size:13px;text-align:right;color:#333;">₹${taxAmount.toFixed(2)}</td>
       </tr>`
    : "";

  const estDays = orderData.estimatedDeliveryDays;
  const estDeliveryText = estDays
    ? `${estDays} ${estDays === 1 ? "business day" : "business days"}`
    : "3–7 business days";

  const paymentLabel = PAYMENT_LABELS[orderData.paymentMethod] || orderData.paymentMethod || "COD";
  const isCOD = orderData.paymentMethod === "cod" || orderData.paymentMethod === "partial_cod";
  const contactEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || SUPPORT_EMAIL;
  const orderId = escapeHtml(orderData.id);
  const customerName = escapeHtml(addr.fullName || user?.name || "—");
  const customerPhone = escapeHtml(addr.phone || "—");

  return `
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

  <!-- Status hero -->
  <tr>
    <td style="padding:36px 40px 28px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">${config.heroIcon}</div>
      <h2 style="margin:0 0 8px;font-size:22px;color:#2c2c2c;font-weight:700;">
        ${config.heroTitle}
      </h2>
      <p style="margin:0;color:#666;font-size:15px;line-height:1.6;">${config.heroMessage}</p>
      <div style="display:inline-block;background:${statusStyle.bg};color:${statusStyle.color};border:1px solid ${statusStyle.border};border-radius:30px;padding:8px 22px;font-weight:700;font-size:13px;letter-spacing:0.5px;margin-top:16px;">
        ${config.badgeText}
      </div>
      <div style="display:inline-block;background:#db1a5d;color:#fff;border-radius:30px;padding:10px 28px;font-weight:700;font-size:15px;letter-spacing:1px;margin-top:16px;margin-left:8px;">
        Order ID: ${orderId}
      </div>
    </td>
  </tr>

  ${statusExtras}

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
        ${taxRow}
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

  <!-- Coupon Information (if applied) -->
  ${couponDiscount > 0 && couponCode ? `
  <tr>
    <td style="padding:0 40px 28px;">
      <div style="background:#f9fff9;border:1px solid #c8e6c9;border-radius:10px;padding:16px;overflow:hidden;">
        <h3 style="margin:0 0 14px;font-size:15px;color:#27ae60;font-weight:700;padding-bottom:10px;border-bottom:2px solid #c8e6c9;">
          🏷️ Coupon Applied
        </h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#666;">Code</td>
            <td style="padding:8px 0;font-size:13px;text-align:right;">
              <span style="display:inline-block;background:#e8f5e9;color:#1b5e20;padding:4px 14px;border-radius:20px;font-weight:700;font-size:13px;letter-spacing:0.5px;border:1px solid #a5d6a7;">
                ${couponCode}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#666;">Discount</td>
            <td style="padding:8px 0;font-size:13px;text-align:right;color:#27ae60;font-weight:700;font-size:15px;">
              −₹${couponDiscount.toFixed(2)}
            </td>
          </tr>
        </table>
      </div>
    </td>
  </tr>
  ` : ""}

  <!-- Delivery details (column) -->
  <tr>
    <td style="padding:0 40px 20px;">
      <h3 style="margin:0 0 14px;font-size:15px;color:#333;font-weight:700;padding-bottom:10px;border-bottom:2px solid #f5f5f5;">
        🏠 Delivery Details
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;">
        <tr>
          <td width="36%" style="padding:10px 16px;background:#fafafa;font-size:12px;color:#999;font-weight:600;border-bottom:1px solid #f0f0f0;">Name</td>
          <td style="padding:10px 16px;font-size:13px;color:#333;font-weight:600;border-bottom:1px solid #f0f0f0;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;background:#fafafa;font-size:12px;color:#999;font-weight:600;border-bottom:1px solid #f0f0f0;">Phone</td>
          <td style="padding:10px 16px;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0;">${customerPhone}</td>
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
          <td style="padding:10px 16px;font-size:13px;color:#333;font-weight:600;border-bottom:1px solid #f0f0f0;">${escapeHtml(paymentLabel)}</td>
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
        Need help? Contact us at <a href="mailto:${escapeHtml(contactEmail)}" style="color:#db1a5d;">${escapeHtml(contactEmail)}</a>
      </p>
      <p style="margin:0;font-size:12px;color:#bbb;">© ${new Date().getFullYear()} Kamali Gifts. All rights reserved.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
};

const sendOrderStatusEmail = async ({ order, user, status, trackingDetails } = {}) => {
  const orderData = asPlain(order);
  const statusKey = normalizeStatusKey(status || orderData.status || "confirmed");
  const config = STATUS_EMAIL_CONFIG[statusKey];

  if (!config) {
    const reason = `No email template configured for order status "${status || orderData.status}"`;
    console.warn(`[Mailer] ${reason}`);
    return { sent: false, skipped: true, reason };
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const reason = "EMAIL_USER or EMAIL_PASS not set";
    console.warn(`[Mailer] ${reason} — skipping email`);
    return { sent: false, skipped: true, reason };
  }

  if (!user?.email) {
    const reason = "Customer email not available";
    console.warn(`[Mailer] ${reason} — skipping order status email`);
    return { sent: false, skipped: true, reason };
  }

  const html = buildOrderEmailHtml({ order: orderData, user, status: statusKey, trackingDetails });
  if (!html) {
    const reason = `Unable to render email for order status "${status || orderData.status}"`;
    console.warn(`[Mailer] ${reason}`);
    return { sent: false, skipped: true, reason };
  }

  const sentAt = new Date();
  await transporter.sendMail({
    from: `"Kamali Gifts" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: config.subject(orderData.id),
    html,
  });

  console.log(`[Mailer] Order ${statusKey} email sent to ${user.email}`);
  return { sent: true, sentAt };
};

const sendOrderConfirmationEmail = async (order, user) =>
  sendOrderStatusEmail({ order, user, status: "confirmed" });

module.exports = { sendOrderConfirmationEmail, sendOrderStatusEmail };
