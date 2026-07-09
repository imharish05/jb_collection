import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../../components/seo";
import LayoutOne from "../../../layouts/LayoutOne";
import Breadcrumb from "../../../wrappers/breadcrumb/Breadcrumb";

const ExchangePolicy = () => {
  const { pathname } = useLocation();

  const sections = [
    "Return Eligibility",
    "Items Not Eligible for Return",
    "Refund Process",
    "Exchange",
    "Return Shipping"
  ];

  return (
    <Fragment>
      <SEO
        titleTemplate="Refund & Return Policy – JB Tex & Tailors"
        description="Read the Refund & Return Policy of JB Tex & Tailors. Learn about return eligibility, non-eligible items, refund processing, and exchanges."
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Refund & Return Policy", path: process.env.PUBLIC_URL + pathname },
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
                Customer satisfaction is important to us. If you receive a damaged, defective, or incorrect product, we are happy to assist.
              </p>
            </div>

            <div className="policy-toc">
              <h3>Table of Contents</h3>
              <ol>
                {sections.map((s, i) => (
                  <li key={i}><a href={`#rp-${i + 1}`}>{s}</a></li>
                ))}
              </ol>
            </div>

            {/* 1 */}
            <div className="policy-section" id="rp-1">
              <div className="policy-section-header">
                <div className="policy-section-num">1</div>
                <h2>Return Eligibility</h2>
              </div>
              <p>
                Returns are accepted within <strong>7 days</strong> from the date of delivery if:
              </p>
              <ul className="policy-ul">
                <li>A wrong product was delivered</li>
                <li>The product is damaged during transit</li>
                <li>The product has a manufacturing defect</li>
              </ul>
              <p>
                Returned products must be:
              </p>
              <ul className="policy-ul">
                <li>Unused</li>
                <li>Unwashed</li>
                <li>In their original packaging</li>
                <li>With all original tags attached</li>
              </ul>
              <div style={{ background: "#fef2f2", borderLeft: "4px solid #ef4444", padding: "14px 16px", margin: "18px 0", borderRadius: "4px", color: "#991b1b" }}>
                <strong>Mandatory Proof Requirement:</strong> A complete, unedited box unboxing video is strictly required as proof to verify all return or replacement claims. Requests submitted without a valid unboxing video will not be accepted under any circumstances.
              </div>
            </div>

            {/* 2 */}
            <div className="policy-section" id="rp-2">
              <div className="policy-section-header">
                <div className="policy-section-num">2</div>
                <h2>Items Not Eligible for Return</h2>
              </div>
              <p>
                Returns will not be accepted for:
              </p>
              <ul className="policy-ul">
                <li>Used or washed garments</li>
                <li>Products without original tags</li>
                <li>Products damaged after delivery</li>
                <li>Clearance or sale items unless they are defective</li>
              </ul>
            </div>

            {/* 3 */}
            <div className="policy-section" id="rp-3">
              <div className="policy-section-header">
                <div className="policy-section-num">3</div>
                <h2>Refund Process</h2>
              </div>
              <p>
                After receiving and inspecting the returned product, eligible refunds will be processed within <strong>5–7 business days</strong> to the original payment method.
              </p>
            </div>

            {/* 4 */}
            <div className="policy-section" id="rp-4">
              <div className="policy-section-header">
                <div className="policy-section-num">4</div>
                <h2>Exchange</h2>
              </div>
              <p>
                Product exchanges are subject to stock availability.
              </p>
            </div>

            {/* 5 */}
            <div className="policy-section" id="rp-5">
              <div className="policy-section-header">
                <div className="policy-section-num">5</div>
                <h2>Return Shipping</h2>
              </div>
              <p>
                If the return is due to our error, return shipping costs will be borne by <strong>JB Tex &amp; Tailors</strong>.
              </p>
              <p>
                For approved exchanges requested by customers, return shipping charges may apply.
              </p>
            </div>

          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default ExchangePolicy;
