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
    "Sharing of Information",
    "Data Security",
    "Cookies and Tracking Technologies",
    "Third-Party Links",
    "Children's Privacy",
    "Your Rights",
    "Changes to This Privacy Policy",
    "Contact Us",
  ];

  return (
    <Fragment>
      <SEO
        titleTemplate="Privacy Policy – JB House of Fashion"
        description="Learn how JB House of Fashion collects, uses, and protects your personal information when you shop for customized gifts, toys, and stationery."
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
                We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website{" "}
                <a href="https://www.kamaligiftsfactory.com" target="_blank" rel="noopener noreferrer">www.kamaligiftsfactory.com</a>{" "}
                and purchase products from us.
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
              <p>We may collect the following information:</p>
              <h3>Personal Information</h3>
              <ul className="policy-ul">
                <li>Full Name</li>
                <li>Email Address</li>
                <li>Phone Number</li>
                <li>Shipping and Billing Address</li>
                <li>Payment Information (processed securely through payment gateways)</li>
              </ul>
              <h3>Non-Personal Information</h3>
              <ul className="policy-ul">
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>IP address</li>
                <li>Website usage data and analytics</li>
              </ul>
            </div>

            {/* 2 */}
            <div className="policy-section" id="pp-2">
              <div className="policy-section-header">
                <div className="policy-section-num">2</div>
                <h2>How We Use Your Information</h2>
              </div>
              <p>We use your information to:</p>
              <ul className="policy-ul">
                <li>Process and fulfill orders</li>
                <li>Deliver products and services</li>
                <li>Communicate regarding orders and customer support</li>
                <li>Send order updates and promotional offers (with your consent)</li>
                <li>Improve our website, products, and customer experience</li>
                <li>Prevent fraud and maintain website security</li>
              </ul>
              <div className="policy-highlight" style={{ marginTop: 20 }}>
                <p>
                  For promotional and marketing purposes, we may feature customer orders, product photographs, videos, reviews, testimonials, and limited customer information such as the customer's first name and city, state, or country on our website, social media platforms, advertisements, reels, and other marketing materials. We will never disclose sensitive personal information, including full addresses, phone numbers, email addresses, payment details, or any confidential customer data. By placing an order with us, you acknowledge and agree that we may use such non-sensitive information and related product content for promotional purposes unless you specifically request otherwise at the time of ordering or by contacting us directly.
                </p>
              </div>
            </div>

            {/* 3 */}
            <div className="policy-section" id="pp-3">
              <div className="policy-section-header">
                <div className="policy-section-num">3</div>
                <h2>Sharing of Information</h2>
              </div>
              <p>We do not sell, rent, or trade your personal information.</p>
              <p>We may share your information with:</p>
              <ul className="policy-ul">
                <li>Delivery and logistics partners</li>
                <li>Payment processing providers</li>
                <li>Website hosting and technology service providers</li>
                <li>Legal authorities when required by law</li>
              </ul>
            </div>

            {/* 4 */}
            <div className="policy-section" id="pp-4">
              <div className="policy-section-header">
                <div className="policy-section-num">4</div>
                <h2>Data Security</h2>
              </div>
              <p>
                We implement reasonable security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no online transmission or storage system can be guaranteed to be 100% secure.
              </p>
            </div>

            {/* 5 */}
            <div className="policy-section" id="pp-5">
              <div className="policy-section-header">
                <div className="policy-section-num">5</div>
                <h2>Cookies and Tracking Technologies</h2>
              </div>
              <p>Our website may use cookies and similar technologies to:</p>
              <ul className="policy-ul">
                <li>Improve website functionality</li>
                <li>Remember user preferences</li>
                <li>Analyze website traffic and performance</li>
              </ul>
              <p>You may disable cookies through your browser settings; however, some website features may not function properly.</p>
            </div>

            {/* 6 */}
            <div className="policy-section" id="pp-6">
              <div className="policy-section-header">
                <div className="policy-section-num">6</div>
                <h2>Third-Party Links</h2>
              </div>
              <p>
                Our website may contain links to third-party websites, including social media platforms. We are not responsible for the privacy practices or content of those external websites.
              </p>
            </div>

            {/* 7 */}
            <div className="policy-section" id="pp-7">
              <div className="policy-section-header">
                <div className="policy-section-num">7</div>
                <h2>Children's Privacy</h2>
              </div>
              <p>
                Our website is not intended for children under the age of 13. We do not knowingly collect personal information from children.
              </p>
            </div>

            {/* 8 */}
            <div className="policy-section" id="pp-8">
              <div className="policy-section-header">
                <div className="policy-section-num">8</div>
                <h2>Your Rights</h2>
              </div>
              <p>You may:</p>
              <ul className="policy-ul">
                <li>Request access to your personal information</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your personal data where applicable</li>
                <li>Opt out of promotional communications at any time</li>
              </ul>
            </div>

            {/* 9 */}
            <div className="policy-section" id="pp-9">
              <div className="policy-section-header">
                <div className="policy-section-num">9</div>
                <h2>Changes to This Privacy Policy</h2>
              </div>
              <p>
                We reserve the right to update this Privacy Policy at any time. Any changes will be posted on this page with an updated effective date.
              </p>
            </div>

            {/* 10 */}
            <div className="policy-section" id="pp-10">
              <div className="policy-section-header">
                <div className="policy-section-num">10</div>
                <h2>Contact Us</h2>
              </div>
              <p>For any privacy-related queries, data deletion requests, or concerns:</p>
              <div className="policy-contact-box">
                <div>
                  <h3>JB House of Fashion Factory</h3>
                  <p>We aim to respond to all privacy queries within 48 business hours.</p>
                </div>
                <div className="policy-contact-items">
                  <div className="policy-contact-item"><span>Email</span> jbbeautyandfashion@gmail.com</div>
                  <div className="policy-contact-item"><span>WhatsApp</span> +91 95008 48860</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default PrivacyPolicy;
