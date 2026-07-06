import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../../components/seo";
import LayoutOne from "../../../layouts/LayoutOne";
import Breadcrumb from "../../../wrappers/breadcrumb/Breadcrumb";

const CancellationPolicy = () => {
  const { pathname } = useLocation();

  const sections = [
    "Order Cancellation",
    "Post-Shipment Policy",
    "Refund Process",
    "Right to Cancel"
  ];

  return (
    <Fragment>
      <SEO
        titleTemplate="Cancellation Policy – JB Tex & Tailors"
        description="Read the Cancellation Policy of JB Tex & Tailors. Learn about order cancellations, refund processing timelines, and terms."
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Cancellation Policy", path: process.env.PUBLIC_URL + pathname },
          ]}
        />

        <div className="policy-page">
          <div className="policy-hero">
            <div className="policy-hero-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
            </div>
            <div className="policy-hero-badge">Cancellations</div>
            <h1>Cancellation Policy</h1>
            <p>Last Updated: June 2026</p>
          </div>

          <div className="policy-body">
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#444" }}>
                At <strong>JB Tex & Tailors</strong>, we want to make your shopping experience as smooth as possible. Below are the details of our Cancellation Policy.
              </p>
            </div>

            <div className="policy-toc">
              <h3>Table of Contents</h3>
              <ol>
                {sections.map((s, i) => (
                  <li key={i}><a href={`#cp-${i + 1}`}>{s}</a></li>
                ))}
              </ol>
            </div>

            {/* 1 */}
            <div className="policy-section" id="cp-1">
              <div className="policy-section-header">
                <div className="policy-section-num">1</div>
                <h2>Order Cancellation</h2>
              </div>
              <p>
                Orders may be cancelled before they are dispatched for shipment.
              </p>
            </div>

            {/* 2 */}
            <div className="policy-section" id="cp-2">
              <div className="policy-section-header">
                <div className="policy-section-num">2</div>
                <h2>Post-Shipment Policy</h2>
              </div>
              <p>
                Once an order has been shipped, cancellation requests cannot be accepted.
              </p>
            </div>

            {/* 3 */}
            <div className="policy-section" id="cp-3">
              <div className="policy-section-header">
                <div className="policy-section-num">3</div>
                <h2>Refund Process</h2>
              </div>
              <p>
                For prepaid orders cancelled before dispatch, refunds will be processed to the original payment method within <strong>5–7 business days</strong>.
              </p>
            </div>

            {/* 4 */}
            <div className="policy-section" id="cp-4">
              <div className="policy-section-header">
                <div className="policy-section-num">4</div>
                <h2>Right to Cancel</h2>
              </div>
              <p>
                JB Tex & Tailors reserves the right to cancel any order due to:
              </p>
              <ul className="policy-ul">
                <li>Product unavailability</li>
                <li>Pricing or technical errors</li>
                <li>Payment verification issues</li>
                <li>Suspected fraudulent transactions</li>
              </ul>
            </div>

          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default CancellationPolicy;
