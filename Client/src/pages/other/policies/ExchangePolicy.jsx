import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../../components/seo";
import LayoutOne from "../../../layouts/LayoutOne";
import Breadcrumb from "../../../wrappers/breadcrumb/Breadcrumb";


const ExchangePolicy = () => {
  const { pathname } = useLocation();

  const sections = [
    "What Is & Isn't Eligible",
    "Return Window",
    "Customized Product Policy",
    "How to Initiate a Return or Exchange",
    "Exchange Process",
    "Refund Policy & Timelines (Razorpay)",
    "Cancellations",
    "Damaged in Transit",
    "Quality Assurance",
    "Contact",
  ];

  return (
    <Fragment>
     
      <SEO
        titleTemplate="Exchange & Return Policy – Kamali Gifts"
        description="Kamali Gifts exchange and return policy for customized gifts, toys, and stationery. Learn about eligibility, return windows, refund timelines via Razorpay, and how to initiate a return."
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Exchange & Return Policy", path: process.env.PUBLIC_URL + pathname },
          ]}
        />

        <div className="policy-page">
          <div className="policy-hero">
            <div className="policy-hero-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <polyline points="23 20 23 14 17 14" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
            </div>
            <div className="policy-hero-badge">Returns</div>
            <h1>Exchange &amp; Return Policy</h1>
            <p>Last Updated: June 2026 &nbsp;•&nbsp; Refunds via Razorpay</p>
          </div>

          <div className="policy-body">
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#444" }}>
                Customer satisfaction is at the heart of everything we do at <strong style={{ color: "#0d1b40" }}>Kamali Gifts</strong>. We understand that sometimes things don't go as planned, and we've designed this policy to be fair, transparent, and easy to navigate. Please read this carefully before making a purchase — especially for customized and personalized items.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#444" }}>
                All approved refunds are processed through <strong>Razorpay</strong> back to your original payment method. Timelines are governed by Razorpay's settlement processes and your bank's processing time.
              </p>
            </div>

            <div className="policy-toc">
              <h3>Table of Contents</h3>
              <ol>
                {sections.map((s, i) => (
                  <li key={i}><a href={`#ep-${i + 1}`}>{s}</a></li>
                ))}
              </ol>
            </div>

            {/* 1 */}
            <div className="policy-section" id="ep-1">
              <div className="policy-section-header">
                <div className="policy-section-num">1</div>
                <h2>What Is &amp; Isn't Eligible</h2>
              </div>
              <h3>✓ Eligible for Exchange or Return</h3>
              <ul className="policy-ul">
                <li>Products received in a <strong>damaged or defective condition</strong></li>
                <li><strong>Wrong item delivered</strong> — different product or variant from what was ordered</li>
                <li>Missing items in multi-piece orders or gift hampers</li>
                <li>Non-customized standard products in <strong>unused, original condition</strong> with tags and packaging intact</li>
                <li>Quality issues such as poor printing, significant color mismatch, or manufacturing defects on customized items caused by our production error</li>
              </ul>
              <h3>✗ Not Eligible for Exchange or Return</h3>
              <ul className="policy-ul">
                <li><strong>Customized / personalized products</strong> (name-printed, photo-printed, engraved, or embroidered) — unless defective or incorrectly produced on our end</li>
                <li>Products damaged due to customer misuse, improper storage, or accidental damage after delivery</li>
                <li>Items returned without original packaging or in used / washed condition</li>
                <li>Products with tampered, removed, or missing labels or tags</li>
                <li>Digital products and gift cards / vouchers</li>
                <li>Items reported after the eligible return window has closed</li>
                <li><strong>Change of mind</strong> returns on customized or personalized items</li>
                <li>Minor color variations between on-screen previews and physical products (due to screen calibration differences)</li>
              </ul>
            </div>

            {/* 2 */}
            <div className="policy-section" id="ep-2">
              <div className="policy-section-header">
                <div className="policy-section-num">2</div>
                <h2>Return Window</h2>
              </div>
              <div className="policy-info-grid">
                <div className="policy-info-card">
                  <div className="label">Damaged / Defective / Wrong</div>
                  <div className="value">48 hours from delivery</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Photo/video evidence required</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Standard Non-Customized</div>
                  <div className="value">7 days from delivery</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Unused, original packaging</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Bulk / Corporate Orders</div>
                  <div className="value">3 days from delivery</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Written report required</div>
                </div>
              </div>
              <p style={{ marginTop: 14 }}>
                All return requests must be <strong>initiated by contacting our support team</strong>. We do not accept walk-in returns. Self-return shipments dispatched without prior authorization from Kamali Gifts will not be accepted and cannot be credited.
              </p>
            </div>

            {/* 3 */}
            <div className="policy-section" id="ep-3">
              <div className="policy-section-header">
                <div className="policy-section-num">3</div>
                <h2>Customized Product Policy</h2>
              </div>
              <p>
                Due to the bespoke nature of personalized items, we invest significant materials, time, and craftsmanship in each custom order. Customized products are <strong>non-refundable and non-exchangeable</strong> unless:
              </p>
              <ul className="policy-ul">
                <li>The product has a clear <strong>manufacturing defect</strong> (e.g., torn material, broken component, peeling print)</li>
                <li>The print quality is unacceptably poor or inaccurate — blurred photo, incorrect name, wrong text</li>
                <li>The <strong>wrong customization was applied</strong> due to an error on our end (not customer-submitted data)</li>
              </ul>
              <div className="policy-warning">
                <strong>Customer-submitted errors</strong> (spelling mistakes, wrong photo, incorrect date submitted by you) are <strong>not eligible for free replacement</strong>. We strongly encourage all customers to double-check every personalization detail before confirming the order. A paid re-production option may be offered at a discounted rate as a goodwill gesture.
              </div>
            </div>

            {/* 4 */}
            <div className="policy-section" id="ep-4">
              <div className="policy-section-header">
                <div className="policy-section-num">4</div>
                <h2>How to Initiate a Return or Exchange</h2>
              </div>
              <p>Follow these steps within the eligible return window:</p>
              <ul className="policy-ul">
                <li><strong>Step 1:</strong> Contact us at <strong>returns@kamaligifts.com</strong> or WhatsApp <strong>+91-XXXXX-XXXXX</strong></li>
                <li><strong>Step 2:</strong> Provide your Order ID, a clear description of the issue, and photographs or an unboxing video showing the defect or damage</li>
                <li><strong>Step 3:</strong> Our team reviews your request within <strong>24–48 business hours</strong> and approves or declines with a reason</li>
                <li><strong>Step 4:</strong> If approved, we arrange a <strong>reverse pickup</strong> via Shiprocket at no cost to you for eligible defective/wrong-item returns</li>
                <li><strong>Step 5:</strong> After receiving and inspecting the returned item at our facility, we process the exchange or initiate the refund via Razorpay</li>
              </ul>
              <p>Do not send products back without receiving an approval email from Kamali Gifts. Unauthorized returns will not be processed.</p>
            </div>

            {/* 5 */}
            <div className="policy-section" id="ep-5">
              <div className="policy-section-header">
                <div className="policy-section-num">5</div>
                <h2>Exchange Process</h2>
              </div>
              <ul className="policy-ul">
                <li>Approved exchanges: replacement of the same product (or closest available variant) dispatched within <strong>3–5 business days</strong> after the returned item is received and inspected</li>
                <li>If the original product is out of stock, we offer a <strong>store credit or full refund</strong> at your preference</li>
                <li>Size or color exchanges for non-customized items are subject to stock availability at the time of request</li>
                <li>Only <strong>one exchange is permitted</strong> per original order line item</li>
                <li>Replacement shipments are dispatched via Shiprocket under the same delivery terms as the original order</li>
              </ul>
            </div>

            {/* 6 */}
            <div className="policy-section" id="ep-6">
              <div className="policy-section-header">
                <div className="policy-section-num">6</div>
                <h2>Refund Policy & Timelines (Razorpay)</h2>
              </div>
              <p>Kamali Gifts offers refunds in the following scenarios:</p>
              <ul className="policy-ul">
                <li>Product is defective/damaged and a suitable replacement is unavailable</li>
                <li>Order was cancelled before production began (customized) or before dispatch (standard)</li>
                <li>Duplicate payment or overcharge due to a Razorpay / bank technical error</li>
                <li>Kamali Gifts cancels your order due to stock unavailability or operational constraints</li>
              </ul>
              <h3>Refund Methods & Timelines</h3>
              <div className="policy-info-grid">
                <div className="policy-info-card">
                  <div className="label">Credit / Debit Card</div>
                  <div className="value">5–7 Business Days</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Via Razorpay back to card</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">UPI / Net Banking</div>
                  <div className="value">3–5 Business Days</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Via Razorpay back to source</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Razorpay Wallet</div>
                  <div className="value">24–48 Hours</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Or Store Credit option</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">COD Orders</div>
                  <div className="value">5–7 Business Days</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>NEFT/UPI to your bank account</div>
                </div>
              </div>
              <div className="policy-highlight" style={{ marginTop: 14 }}>
                <p>Refund timelines are governed by <strong>Razorpay's processing schedule</strong> and your bank's internal processing time after Razorpay initiates the transfer. Kamali Gifts has no control over bank-side delays beyond Razorpay's settlement. Shipping charges are refunded only if the return is due to our error (defective or wrong item).</p>
              </div>
            </div>

            {/* 7 */}
            <div className="policy-section" id="ep-7">
              <div className="policy-section-header">
                <div className="policy-section-num">7</div>
                <h2>Cancellations</h2>
              </div>
              <h3>Standard Products</h3>
              <p>Cancellations accepted within <strong>12 hours</strong> of order placement. After 12 hours, the order may already be in dispatch preparation.</p>
              <h3>Customized Products</h3>
              <p>Cancellations for personalized products must be requested within <strong>2 hours</strong> of order placement. After production has begun, cancellations are <strong>not accepted</strong> and no refund will be issued. In exceptional circumstances (documented medical emergency, natural disaster), partial goodwill refunds may be considered at Kamali Gifts' sole discretion.</p>
              <h3>Kamali Gifts–Initiated Cancellations</h3>
              <p>If we cancel your order due to stock unavailability, production constraints, or inability to verify your address, a <strong>full refund is processed automatically</strong> via Razorpay within 5–7 business days without requiring any action from you.</p>
            </div>

            {/* 8 */}
            <div className="policy-section" id="ep-8">
              <div className="policy-section-header">
                <div className="policy-section-num">8</div>
                <h2>Damaged in Transit</h2>
              </div>
              <p>If your product arrives visibly damaged in transit (via Shiprocket's courier partners), follow these steps:</p>
              <ul className="policy-ul">
                <li>Photograph the <strong>outer packaging before opening</strong> — this is critical evidence for courier claims</li>
                <li>Photograph the <strong>damaged product clearly</strong> showing the defect from multiple angles</li>
                <li>Report to <strong>returns@kamaligifts.com</strong> within <strong>24 hours of delivery</strong> with the above photos and your Order ID</li>
                <li>We will lodge a formal damage claim with Shiprocket and the responsible courier</li>
                <li>Post investigation: we will arrange a replacement shipment or issue a full refund at your preference</li>
              </ul>
              <div className="policy-warning">
                <strong>Damage claims reported after 48 hours</strong> of delivery may be declined as courier investigation windows expire. We strongly recommend recording a short unboxing video for all orders containing fragile or high-value items.
              </div>
            </div>

            {/* 9 */}
            <div className="policy-section" id="ep-9">
              <div className="policy-section-header">
                <div className="policy-section-num">9</div>
                <h2>Quality Assurance</h2>
              </div>
              <p>
                Every order from Kamali Gifts goes through a quality check before handover to Shiprocket. For customized items, our QC team reviews the print / engraving / embroidery against your submitted details including name spelling, photo placement, and color accuracy.
              </p>
              <p>
                Despite these rigorous checks, if you are not satisfied with the quality of your received product, please reach out to us. We will review the case with an open mind and work towards a resolution that is fair to both parties.
              </p>
            </div>

            {/* 10 */}
            <div className="policy-section" id="ep-10">
              <div className="policy-section-header">
                <div className="policy-section-num">10</div>
                <h2>Contact</h2>
              </div>
              <p>Always include your <strong>Order ID</strong> and clear photographs when submitting a return or exchange request.</p>
              <div className="policy-contact-box">
                <div>
                  <h3>Returns & Exchange Support</h3>
                  <p>Our team responds within 24–48 business hours.</p>
                </div>
                <div className="policy-contact-items">
                  <div className="policy-contact-item"><span>Email</span> returns@kamaligifts.com</div>
                  <div className="policy-contact-item"><span>WhatsApp</span> +91-XXXXX-XXXXX</div>
                  <div className="policy-contact-item"><span>Hours</span> Mon–Sat, 9 AM – 6 PM IST</div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default ExchangePolicy;