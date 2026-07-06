import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../../components/seo";
import LayoutOne from "../../../layouts/LayoutOne";
import Breadcrumb from "../../../wrappers/breadcrumb/Breadcrumb";

const ShippingPolicy = () => {
  const { pathname } = useLocation();

  const sections = [
    "Order Processing",
    "Delivery Timeline",
    "Shipping Charges",
    "Order Tracking",
    "Delivery Issues"
  ];

  return (
    <Fragment>
      <SEO
        titleTemplate="Shipping Policy – JB Tex & Tailors"
        description="Read the Shipping Policy of JB Tex & Tailors. Learn about delivery timelines, order processing, shipping charges, tracking, and support."
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
            <p>Last Updated: June 2026</p>
          </div>

          <div className="policy-body">
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#444" }}>
                JB Tex &amp; Tailors delivers girls' clothing across India.
              </p>
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
                <h2>Order Processing</h2>
              </div>
              <p>
                Orders are usually processed within <strong>1–2 business days</strong> after successful payment confirmation.
              </p>
            </div>

            {/* 2 */}
            <div className="policy-section" id="sp-2">
              <div className="policy-section-header">
                <div className="policy-section-num">2</div>
                <h2>Delivery Timeline</h2>
              </div>
              <p>Estimated delivery times are:</p>
              <ul className="policy-ul">
                <li>Metro Cities: <strong>3–5 Business Days</strong></li>
                <li>Other Cities and Towns: <strong>5–8 Business Days</strong></li>
                <li>Remote Areas: <strong>7–10 Business Days</strong></li>
              </ul>
              <p>
                Delivery timelines are estimates and may vary due to courier delays, weather conditions, public holidays, or other unforeseen circumstances.
              </p>
            </div>

            {/* 3 */}
            <div className="policy-section" id="sp-3">
              <div className="policy-section-header">
                <div className="policy-section-num">3</div>
                <h2>Shipping Charges</h2>
              </div>
              <p>
                Shipping charges, if applicable, will be displayed during checkout before payment.
              </p>
            </div>

            {/* 4 */}
            <div className="policy-section" id="sp-4">
              <div className="policy-section-header">
                <div className="policy-section-num">4</div>
                <h2>Order Tracking</h2>
              </div>
              <p>
                Tracking information will be shared once your order has been dispatched.
              </p>
            </div>

            {/* 5 */}
            <div className="policy-section" id="sp-5">
              <div className="policy-section-header">
                <div className="policy-section-num">5</div>
                <h2>Delivery Issues</h2>
              </div>
              <p>
                If your order is delayed, lost, or arrives damaged, please contact our customer support team for assistance.
              </p>
            </div>

          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default ShippingPolicy;
