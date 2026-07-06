import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../../components/seo";
import LayoutOne from "../../../layouts/LayoutOne";
import Breadcrumb from "../../../wrappers/breadcrumb/Breadcrumb";

const PrivacyPolicy = () => {
  const { pathname } = useLocation();

  const sections = [
    "Information We Collect",
    "How We Use Your Information",
    "Payment Security",
    "Sharing of Information",
    "Cookies",
    "Data Protection",
    "Your Rights"
  ];

  return (
    <Fragment>
      <SEO
        titleTemplate="Privacy Policy – JB Tex & Tailors"
        description="Learn how JB Tex & Tailors collects, uses, and protects your personal information when you visit our website or place an order."
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Privacy Policy", path: process.env.PUBLIC_URL + pathname },
          ]}
        />

        <div className="policy-page">
          {/* Hero */}
          <div className="policy-hero">
            <div className="policy-hero-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="policy-hero-badge">Legal</div>
            <h1>Privacy Policy</h1>
            <p>Last Updated: June 2026</p>
          </div>

          <div className="policy-body">
            {/* Intro */}
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#444" }}>
                At <strong>JB Tex & Tailors</strong>, your privacy is important to us. This Privacy Policy explains how we collect, use, protect, and disclose your personal information when you visit our website or place an order.
              </p>
            </div>

            {/* TOC */}
            <div className="policy-toc">
              <h3>Table of Contents</h3>
              <ol>
                {sections.map((s, i) => (
                  <li key={i}>
                    <a href={`#pp-${i + 1}`}>{s}</a>
                  </li>
                ))}
              </ol>
            </div>

            {/* 1 */}
            <div className="policy-section" id="pp-1">
              <div className="policy-section-header">
                <div className="policy-section-num">1</div>
                <h2>Information We Collect</h2>
              </div>
              <p>When you use our website, we may collect:</p>
              <ul className="policy-ul">
                <li>Full Name</li>
                <li>Mobile Number</li>
                <li>Email Address</li>
                <li>Billing and Shipping Address</li>
                <li>Payment Information (processed securely through our payment partners)</li>
                <li>IP Address, Browser Type, and Device Information</li>
              </ul>
            </div>

            {/* 2 */}
            <div className="policy-section" id="pp-2">
              <div className="policy-section-header">
                <div className="policy-section-num">2</div>
                <h2>How We Use Your Information</h2>
              </div>
              <p>Your information is used to:</p>
              <ul className="policy-ul">
                <li>Process and deliver your orders</li>
                <li>Provide customer support</li>
                <li>Send order confirmations and shipping updates</li>
                <li>Improve our products and services</li>
                <li>Prevent fraudulent transactions</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            {/* 3 */}
            <div className="policy-section" id="pp-3">
              <div className="policy-section-header">
                <div className="policy-section-num">3</div>
                <h2>Payment Security</h2>
              </div>
              <p>
                All online payments are processed through secure payment gateways. JB Tex & Tailors does not store your debit card, credit card, banking credentials, or UPI PIN.
              </p>
            </div>

            {/* 4 */}
            <div className="policy-section" id="pp-4">
              <div className="policy-section-header">
                <div className="policy-section-num">4</div>
                <h2>Sharing of Information</h2>
              </div>
              <p>We do not sell, rent, or trade your personal information.</p>
              <p>Your information may be shared only with trusted third parties such as:</p>
              <ul className="policy-ul">
                <li>Payment Gateway Providers</li>
                <li>Courier and Logistics Partners</li>
                <li>Government Authorities when required by law</li>
              </ul>
            </div>

            {/* 5 */}
            <div className="policy-section" id="pp-5">
              <div className="policy-section-header">
                <div className="policy-section-num">5</div>
                <h2>Cookies</h2>
              </div>
              <p>
                Our website may use cookies and similar technologies to improve website performance and enhance your shopping experience.
              </p>
            </div>

            {/* 6 */}
            <div className="policy-section" id="pp-6">
              <div className="policy-section-header">
                <div className="policy-section-num">6</div>
                <h2>Data Protection</h2>
              </div>
              <p>
                We take appropriate technical and organizational measures to protect your personal information from unauthorized access, misuse, or disclosure.
              </p>
            </div>

            {/* 7 */}
            <div className="policy-section" id="pp-7">
              <div className="policy-section-header">
                <div className="policy-section-num">7</div>
                <h2>Your Rights</h2>
              </div>
              <p>You may contact us at any time to:</p>
              <ul className="policy-ul">
                <li>Update your personal information</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information where legally permitted</li>
              </ul>
            </div>

          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default PrivacyPolicy;
