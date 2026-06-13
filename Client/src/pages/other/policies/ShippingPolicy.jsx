import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../../components/seo";
import LayoutOne from "../../../layouts/LayoutOne";
import Breadcrumb from "../../../wrappers/breadcrumb/Breadcrumb";


const ShippingPolicy = () => {
  const { pathname } = useLocation();

  const sections = [
    "Order Processing Time",
    "How We Ship — Shiprocket",
    "Delivery Timelines",
    "Shipping Charges",
    "Order Tracking",
    "Packaging",
    "Delivery Attempts & Failed Deliveries",
    "Shipping Restrictions",
    "Address Change Requests",
    "Lost, Stolen, or Missing Packages",
    "Shiprocket's Role & Liability",
    "Contact for Shipping Issues",
  ];

  return (
    <Fragment>
      
      <SEO
        titleTemplate="Shipping Policy – Kamali Gifts"
        description="Kamali Gifts ships via Shiprocket across India. Learn about delivery timelines, shipping charges, tracking, and packaging for your customized gifts, toys, and stationery."
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Shipping Policy", path: process.env.PUBLIC_URL + pathname },
          ]}
        />

        <div className="policy-page">
          <div className="policy-hero">
            <div className="policy-hero-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="1" />
                <path d="M16 8h4l3 5v3h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div className="policy-hero-badge">Shipping</div>
            <h1>Shipping Policy</h1>
            <p>Last Updated: June 2026 &nbsp;•&nbsp; Powered by Shiprocket</p>
          </div>

          <div className="policy-body">
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#444" }}>
                At <strong style={{ color: "#0d1b40" }}>Kamali Gifts</strong>, we take pride in safely delivering your personalized gifts, toys, and stationery across India. We use <strong>Shiprocket</strong> — India's leading logistics aggregator — to manage our shipping operations, giving us access to the best-suited courier for your pin code.
              </p>

              {/* Shiprocket callout */}
              <div className="policy-highlight" style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ background: "#0d1b40", borderRadius: 8, padding: "6px 10px", flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: "#0d1b40" }}>Powered by Shiprocket</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>
                    Shiprocket aggregates India's top courier partners — Delhivery, Blue Dart, Ekart, DTDC, XpressBees, and others — automatically selecting the optimal courier based on your delivery pin code, order weight, and real-time courier performance data.
                  </p>
                </div>
              </div>
            </div>

            <div className="policy-toc">
              <h3>Table of Contents</h3>
              <ol>
                {sections.map((s, i) => (
                  <li key={i}><a href={`#sp-${i + 1}`}>{s}</a></li>
                ))}
              </ol>
            </div>

            {/* 1 */}
            <div className="policy-section" id="sp-1">
              <div className="policy-section-header">
                <div className="policy-section-num">1</div>
                <h2>Order Processing Time</h2>
              </div>
              <p>Processing time is the time taken to prepare, produce, quality-check, and pack your order before handover to Shiprocket. This is <strong>separate from</strong> the delivery transit time.</p>
              <div className="policy-info-grid">
                <div className="policy-info-card">
                  <div className="label">Standard Products</div>
                  <div className="value">1–2 Business Days</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Customized Items</div>
                  <div className="value">3–7 Business Days</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Bulk / Corporate</div>
                  <div className="value">7–14 Business Days</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Festive Season</div>
                  <div className="value">Add 3–5 Extra Days</div>
                </div>
              </div>
              <p style={{ marginTop: 14 }}>
                Orders placed on Sundays or public holidays are processed on the next business day. During festive seasons (Diwali, Christmas, Valentine's Day, Raksha Bandhan), we recommend placing orders at least <strong>10–14 days in advance</strong> to avoid delays.
              </p>
            </div>

            {/* 2 */}
            <div className="policy-section" id="sp-2">
              <div className="policy-section-header">
                <div className="policy-section-num">2</div>
                <h2>How We Ship — Shiprocket</h2>
              </div>
              <p>
                We ship all orders through <strong>Shiprocket's multi-carrier platform</strong>. Shiprocket's intelligent routing system (Courier Recommendation Engine) automatically assigns the most reliable and cost-effective courier for your specific pin code and order weight.
              </p>
              <p>Courier partners available through Shiprocket include:</p>
              <div className="policy-badge-row">
                {["Delhivery", "Blue Dart", "Ekart Logistics", "DTDC", "XpressBees", "Shadowfax", "Ecom Express", "Smartr Logistics"].map((c) => (
                  <span className="policy-badge" key={c}><span className="dot" />{ c}</span>
                ))}
              </div>
              <p style={{ marginTop: 12 }}>
                The specific courier assigned to your order is shown in your shipment confirmation email along with the AWB tracking number. Kamali Gifts does not allow customers to select a specific courier; assignments are purely based on serviceability and performance metrics.
              </p>
            </div>

            {/* 3 */}
            <div className="policy-section" id="sp-3">
              <div className="policy-section-header">
                <div className="policy-section-num">3</div>
                <h2>Delivery Timelines</h2>
              </div>
              <p>
                Estimated delivery times are calculated <strong>from the date of dispatch</strong> (after processing), not from the date of order placement. Transit times are provided by Shiprocket's courier partners and are subject to operational conditions.
              </p>
              <div className="policy-info-grid">
                <div className="policy-info-card">
                  <div className="label">Metro Cities</div>
                  <div className="value">2–4 Business Days</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Mumbai, Delhi, Bengaluru, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Tier-2 Cities</div>
                  <div className="value">3–5 Business Days</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Coimbatore, Jaipur, Surat, Nagpur, Lucknow, Indore, etc.</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Tier-3 & Towns</div>
                  <div className="value">5–8 Business Days</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Remote / J&K / NE</div>
                  <div className="value">8–14 Business Days</div>
                </div>
              </div>
              <div className="policy-warning" style={{ marginTop: 16 }}>
                <strong>Note:</strong> These are estimated timelines and are not guaranteed delivery dates. Actual delivery may vary due to courier capacity, weather disruptions, strikes, or other events beyond our control. Shiprocket's courier partners operate independently and Kamali Gifts is not liable for transit delays.
              </div>
            </div>

            {/* 4 */}
            <div className="policy-section" id="sp-4">
              <div className="policy-section-header">
                <div className="policy-section-num">4</div>
                <h2>Shipping Charges</h2>
              </div>
              <ul className="policy-ul">
                <li><strong>Free Shipping</strong> on all orders above ₹999 (standard delivery)</li>
                <li>Orders below ₹999: flat shipping fee of <strong>₹49–₹79</strong> depending on dimensional weight and destination zone</li>
                <li><strong>Express Delivery</strong>: available at an additional charge calculated at checkout, subject to courier partner availability for your pin code via Shiprocket</li>
                <li>Bulk / corporate gift orders (50+ items): shipping charges are communicated separately via a customized quotation</li>
                <li>COD (Cash on Delivery) orders may attract an additional COD handling fee of <strong>₹25–₹50</strong></li>
              </ul>
              <p>All applicable shipping charges are clearly displayed at the checkout summary before payment confirmation.</p>
            </div>

            {/* 5 */}
            <div className="policy-section" id="sp-5">
              <div className="policy-section-header">
                <div className="policy-section-num">5</div>
                <h2>Order Tracking</h2>
              </div>
              <p>
                Once your order is dispatched via Shiprocket, you will receive an <strong>email and SMS notification</strong> containing your AWB (Air Waybill) number and a direct tracking link to the assigned courier's tracking page.
              </p>
              <ul className="policy-ul">
                <li>Tracking updates may take <strong>12–24 hours</strong> to appear after the first scan at the courier facility</li>
                <li>Track directly on the courier's website using the AWB number provided</li>
                <li>You can also track from your Kamali Gifts account under "My Orders"</li>
                <li>If tracking shows "Delivered" but you haven't received the package, contact us within <strong>48 hours</strong></li>
              </ul>
            </div>

            {/* 6 */}
            <div className="policy-section" id="sp-6">
              <div className="policy-section-header">
                <div className="policy-section-num">6</div>
                <h2>Packaging</h2>
              </div>
              <p>
                All Kamali Gifts products are carefully packaged to prevent damage during transit. Our packaging standards vary by product type:
              </p>
              <ul className="policy-ul">
                <li><strong>Customized Gifts & Framed Items:</strong> Rigid box + bubble wrap + foam inserts + outer corrugated layer</li>
                <li><strong>Toys:</strong> Original manufacturer packaging + outer protective layer where applicable</li>
                <li><strong>Stationery & Notebooks:</strong> Kraft box or padded mailer with cardboard stiffeners</li>
                <li><strong>Gift Hampers:</strong> Branded Kamali Gifts gift box + internal compartment padding</li>
                <li><strong>Gift-Ready Packaging:</strong> Available as a checkout add-on — includes ribbon wrap and a personalized gift message card</li>
              </ul>
              <div className="policy-warning">
                <strong>Received a damaged package?</strong> Photograph the outer packaging before opening and the damaged product immediately after. Report to us within <strong>24 hours of delivery</strong> with photos for priority resolution.
              </div>
            </div>

            {/* 7 */}
            <div className="policy-section" id="sp-7">
              <div className="policy-section-header">
                <div className="policy-section-num">7</div>
                <h2>Delivery Attempts & Failed Deliveries</h2>
              </div>
              <p>Shiprocket's courier partners typically make up to <strong>3 delivery attempts</strong>:</p>
              <ul className="policy-ul">
                <li>If the recipient is unavailable at the first attempt, the courier will attempt delivery on the next working day</li>
                <li>A delivery notification (physical slip or SMS) is typically left after each failed attempt</li>
                <li>After 3 failed attempts, the shipment is returned to our facility (RTO — Return to Origin)</li>
                <li>Re-dispatch of returned orders will incur an additional shipping fee to be paid before re-shipment</li>
                <li>Kamali Gifts is not responsible for failed deliveries due to an incorrect address, recipient unavailability, or inaccessible location</li>
              </ul>
              <p>Please ensure your <strong>delivery address and contact number</strong> are accurate. Some couriers will call before delivery; having an active mobile number is essential.</p>
            </div>

            {/* 8 */}
            <div className="policy-section" id="sp-8">
              <div className="policy-section-header">
                <div className="policy-section-num">8</div>
                <h2>Shipping Restrictions</h2>
              </div>
              <ul className="policy-ul">
                <li>We currently ship <strong>only within India</strong>; international shipping is not available at this time</li>
                <li>Certain remote pin codes may not be serviceable; you will be notified at checkout if your pin code is unserviceable via Shiprocket</li>
                <li>Items containing batteries (e.g., electronic toys) may be subject to carrier-specific hazardous materials restrictions</li>
                <li>Liquid-based gift items (e.g., perfumes, candles) have carrier restrictions for air shipments; these will be routed via surface shipping automatically by Shiprocket</li>
                <li>Orders to PO Box addresses are not accepted</li>
              </ul>
            </div>

            {/* 9 */}
            <div className="policy-section" id="sp-9">
              <div className="policy-section-header">
                <div className="policy-section-num">9</div>
                <h2>Address Change Requests</h2>
              </div>
              <p>
                Address changes can be requested <strong>before dispatch</strong> by contacting our support team. Once an order has been dispatched and is in Shiprocket's logistics network, address changes are subject to the assigned courier partner's policies and may not always be possible.
              </p>
              <p>
                Additional charges may apply for address changes that require re-routing within the Shiprocket system. Customized / personalized orders cannot be redirected to a different recipient once dispatched.
              </p>
            </div>

            {/* 10 */}
            <div className="policy-section" id="sp-10">
              <div className="policy-section-header">
                <div className="policy-section-num">10</div>
                <h2>Lost, Stolen, or Missing Packages</h2>
              </div>
              <p>
                In the rare event that your package is marked as "Delivered" in the Shiprocket tracking system but has not been received:
              </p>
              <ul className="policy-ul">
                <li>Contact us at <strong>shipping@kamaligifts.com</strong> within <strong>48 hours</strong> of the reported delivery timestamp</li>
                <li>We will initiate a formal investigation with Shiprocket and the assigned courier partner, which typically takes 5–7 business days</li>
                <li>Claims reported after <strong>7 days</strong> of the delivery date may not be eligible for resolution due to courier investigation deadlines</li>
                <li>We strongly recommend recording a short unboxing video for high-value or fragile orders, as it significantly aids dispute resolution</li>
                <li>If a package is confirmed lost in transit by Shiprocket, Kamali Gifts will either re-ship the order or issue a full refund at the customer's preference</li>
              </ul>
            </div>

            {/* 11 */}
            <div className="policy-section" id="sp-11">
              <div className="policy-section-header">
                <div className="policy-section-num">11</div>
                <h2>Shiprocket's Role & Liability</h2>
              </div>
              <p>
                Shiprocket (Bigfoot Retail Solutions Pvt Ltd) acts as an intermediary logistics aggregator between Kamali Gifts and third-party courier companies. By placing an order, you acknowledge that:
              </p>
              <ul className="policy-ul">
                <li>Shiprocket and its courier partners operate independently; their operational decisions (delivery schedules, route planning, facility management) are not within Kamali Gifts' direct control</li>
                <li>Shiprocket's own Terms of Service and Privacy Policy govern the logistics portion of your order</li>
                <li>Transit time guarantees (where offered by a courier) are governed by that specific courier's terms, not Kamali Gifts</li>
                <li>Kamali Gifts' liability is limited to ensuring timely and accurate handover of your order to Shiprocket; transit events thereafter fall under Shiprocket's responsibility</li>
              </ul>
              <p>Despite this, Kamali Gifts will always be your single point of contact for any shipping issues. We will coordinate with Shiprocket and the courier on your behalf to resolve disputes as efficiently as possible.</p>
            </div>

            {/* 12 */}
            <div className="policy-section" id="sp-12">
              <div className="policy-section-header">
                <div className="policy-section-num">12</div>
                <h2>Contact for Shipping Issues</h2>
              </div>
              <p>Always quote your <strong>Order ID</strong> and <strong>AWB number</strong> when contacting us about a shipment.</p>
              <div className="policy-contact-box">
                <div>
                  <h3>Shipping Support</h3>
                  <p>Mon–Sat, 9 AM – 6 PM IST. We'll coordinate with Shiprocket on your behalf.</p>
                </div>
                <div className="policy-contact-items">
                  <div className="policy-contact-item"><span>Email</span> shipping@kamaligifts.com</div>
                  <div className="policy-contact-item"><span>WhatsApp</span> +91-XXXXX-XXXXX</div>
                  <div className="policy-contact-item"><span>Response</span> Within 24 business hours</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default ShippingPolicy;