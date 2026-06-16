import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../../components/seo";
import LayoutOne from "../../../layouts/LayoutOne";
import Breadcrumb from "../../../wrappers/breadcrumb/Breadcrumb";


const ExchangePolicy = () => {
  const { pathname } = useLocation();

  const sections = [
    "Eligibility for Returns",
    "Non-Returnable Items",
    "Refund Process",
    "Replacement Policy",
    "Order Cancellation",
    "Shipping Damage",
    "Contact Us",
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
            <h1>Refund &amp; Return Policy</h1>
           <p>Last Updated: June 2026</p>
          </div>

          <div className="policy-body">
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#444" }}>
                Thank you for shopping with <strong style={{ color: "#0d1b40" }}>Kamali Gifts Factory</strong>. We strive to provide high-quality return gifts and excellent customer service. Please read our Refund &amp; Return Policy carefully before making a purchase.
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
                <h2>Eligibility for Returns</h2>
              </div>
              <p>Returns are accepted only under the following circumstances:</p>
              <ul className="policy-ul">
                <li>The product received is damaged, defective, or incorrect.</li>
                <li>The product is significantly different from the item ordered.</li>
                <li>The return request is submitted within <strong>3 days</strong> of receiving the order.</li>
              </ul>
              <p>To initiate a return, customers must provide:</p>
              <ul className="policy-ul">
                <li>Order number</li>
                <li>Photos or videos showing the issue (box opening video)</li>
                <li>Contact details</li>
              </ul>
            </div>

            {/* 2 */}
            <div className="policy-section" id="ep-2">
              <div className="policy-section-header">
                <div className="policy-section-num">2</div>
                <h2>Non-Returnable Items</h2>
              </div>
              <p>The following items are not eligible for return or refund:</p>
              <ul className="policy-ul">
                <li>Customized or personalized gifts</li>
                <li>Bulk orders made to customer specifications</li>
                <li>Products damaged due to misuse or mishandling after delivery</li>
                <li>Items returned without original packaging</li>
              </ul>
            </div>

            {/* 3 */}
            <div className="policy-section" id="ep-3">
              <div className="policy-section-header">
                <div className="policy-section-num">3</div>
                <h2>Refund Process</h2>
              </div>
              <p>Once the returned item is received and inspected:</p>
              <ul className="policy-ul">
                <li>Approved refunds will be processed within <strong>5–7 business days</strong>.</li>
                <li>Refunds will be credited to the original payment method used during purchase.</li>
                <li>Shipping charges are non-refundable.</li>
              </ul>
            </div>

            {/* 4 */}
            <div className="policy-section" id="ep-4">
              <div className="policy-section-header">
                <div className="policy-section-num">4</div>
                <h2>Replacement Policy</h2>
              </div>
              <p>For damaged, defective, or incorrect items, customers may choose:</p>
              <ul className="policy-ul">
                <li>A replacement product (subject to availability), or</li>
                <li>A full refund</li>
              </ul>
            </div>

            {/* 5 */}
            <div className="policy-section" id="ep-5">
              <div className="policy-section-header">
                <div className="policy-section-num">5</div>
                <h2>Order Cancellation</h2>
              </div>
              <ul className="policy-ul">
                <li>Orders can be canceled within <strong>24 hours</strong> of placement.</li>
                <li>Customized orders cannot be canceled once production has started.</li>
              </ul>
            </div>

            {/* 6 */}
            <div className="policy-section" id="ep-6">
              <div className="policy-section-header">
                <div className="policy-section-num">6</div>
                <h2>Shipping Damage</h2>
              </div>
              <p>If your package arrives damaged:</p>
              <ul className="policy-ul">
                <li>Take clear photos immediately upon delivery.</li>
                <li>Contact us within <strong>48 hours</strong> of receiving the package.</li>
                <li>We will review the claim and arrange a replacement or refund if eligible.</li>
              </ul>
            </div>

            {/* 7 */}
            <div className="policy-section" id="ep-7">
              <div className="policy-section-header">
                <div className="policy-section-num">7</div>
                <h2>Contact Us</h2>
              </div>
              <p>For return, refund, or replacement requests, please contact:</p>
              <div className="policy-contact-box">
                <div>
                  <h3>Kamali Gifts Factory</h3>
                  <p>We appreciate your trust and look forward to serving you.</p>
                </div>
                <div className="policy-contact-items">
                  <div className="policy-contact-item"><span>WhatsApp</span> +91 73388 14319</div>
                  <div className="policy-contact-item"><span>Email</span> kamalireturngifts@gmail.com</div>
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