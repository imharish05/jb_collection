import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../../components/seo";
import LayoutOne from "../../../layouts/LayoutOne";
import Breadcrumb from "../../../wrappers/breadcrumb/Breadcrumb";

const TermsConditions = () => {
  const { pathname } = useLocation();

  const sections = [
    "Products",
    "Pricing",
    "Orders",
    "Payments",
    "Shipping",
    "Returns & Refunds",
    "Intellectual Property",
    "Limitation of Liability",
    "Governing Law"
  ];

  return (
    <Fragment>
      <SEO
        titleTemplate="Terms & Conditions – JB Tex & Tailors"
        description="Read the Terms and Conditions for shopping at JB Tex & Tailors — girls' clothing for sale across India."
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Terms & Conditions", path: process.env.PUBLIC_URL + pathname },
          ]}
        />

        <div className="policy-page">
          <div className="policy-hero">
            <div className="policy-hero-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="policy-hero-badge">Legal</div>
            <h1>Terms &amp; Conditions</h1>
            <p>Last Updated: June 2026</p>
          </div>

          <div className="policy-body">
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#444" }}>
                By accessing or using this website, you agree to comply with these Terms &amp; Conditions.
              </p>
            </div>

            <div className="policy-toc">
              <h3>Table of Contents</h3>
              <ol>
                {sections.map((s, i) => (
                  <li key={i}><a href={`#tc-${i + 1}`}>{s}</a></li>
                ))}
              </ol>
            </div>

            {/* 1 */}
            <div className="policy-section" id="tc-1">
              <div className="policy-section-header">
                <div className="policy-section-num">1</div>
                <h2>Products</h2>
              </div>
              <p>
                JB Tex &amp; Tailors offers girls' clothing for sale across India.
              </p>
              <p>
                Product images and descriptions are provided as accurately as possible. Actual colors may vary slightly due to screen settings and lighting.
              </p>
            </div>

            {/* 2 */}
            <div className="policy-section" id="tc-2">
              <div className="policy-section-header">
                <div className="policy-section-num">2</div>
                <h2>Pricing</h2>
              </div>
              <p>
                All prices are displayed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.
              </p>
              <p>
                Prices may change without prior notice.
              </p>
            </div>

            {/* 3 */}
            <div className="policy-section" id="tc-3">
              <div className="policy-section-header">
                <div className="policy-section-num">3</div>
                <h2>Orders</h2>
              </div>
              <p>
                JB Tex &amp; Tailors reserves the right to accept, reject, or cancel any order due to:
              </p>
              <ul className="policy-ul">
                <li>Product unavailability</li>
                <li>Pricing or technical errors</li>
                <li>Payment failure</li>
                <li>Suspected fraudulent activity</li>
              </ul>
            </div>

            {/* 4 */}
            <div className="policy-section" id="tc-4">
              <div className="policy-section-header">
                <div className="policy-section-num">4</div>
                <h2>Payments</h2>
              </div>
              <p>
                Payments must be completed through the available secure payment methods before an order is processed.
              </p>
            </div>

            {/* 5 */}
            <div className="policy-section" id="tc-5">
              <div className="policy-section-header">
                <div className="policy-section-num">5</div>
                <h2>Shipping</h2>
              </div>
              <p>
                Delivery timelines are estimates and may vary depending on location, courier operations, weather conditions, or unforeseen circumstances.
              </p>
            </div>

            {/* 6 */}
            <div className="policy-section" id="tc-6">
              <div className="policy-section-header">
                <div className="policy-section-num">6</div>
                <h2>Returns &amp; Refunds</h2>
              </div>
              <p>
                Returns and refunds are subject to our Refund &amp; Return Policy.
              </p>
            </div>

            {/* 7 */}
            <div className="policy-section" id="tc-7">
              <div className="policy-section-header">
                <div className="policy-section-num">7</div>
                <h2>Intellectual Property</h2>
              </div>
              <p>
                All website content, including logos, product images, graphics, text, and designs, is the property of JB Tex &amp; Tailors and may not be copied, reproduced, or distributed without prior written permission.
              </p>
            </div>

            {/* 8 */}
            <div className="policy-section" id="tc-8">
              <div className="policy-section-header">
                <div className="policy-section-num">8</div>
                <h2>Limitation of Liability</h2>
              </div>
              <p>
                JB Tex &amp; Tailors shall not be liable for any indirect, incidental, or consequential damages arising from the use of this website or the purchase of products.
              </p>
            </div>

            {/* 9 */}
            <div className="policy-section" id="tc-9">
              <div className="policy-section-header">
                <div className="policy-section-num">9</div>
                <h2>Governing Law</h2>
              </div>
              <p>
                These Terms &amp; Conditions shall be governed by the laws of India. Any disputes shall be subject to the jurisdiction of the courts of Tiruchirappalli, Tamil Nadu.
              </p>
            </div>

          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default TermsConditions;
