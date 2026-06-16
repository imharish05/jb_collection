import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../../components/seo";
import LayoutOne from "../../../layouts/LayoutOne";
import Breadcrumb from "../../../wrappers/breadcrumb/Breadcrumb";

const PrivacyPolicy = () => {
  const { pathname } = useLocation();

  const sections = [
    "Who We Are",
    "Information We Collect",
    "How We Use Your Information",
    "Sharing of Information",
    "Personalized & Custom Order Data",
    "Cookies & Tracking",
    "Data Retention",
    "Your Rights",
    "Data Security",
    "Children's Privacy",
    "Changes to This Policy",
    "Contact Us",
  ];

  return (
    <Fragment>
    
      <SEO
        titleTemplate="Privacy Policy – Kamali Gifts"
        description="Learn how Kamali Gifts collects, uses, and protects your personal information when you shop for customized gifts, toys, and stationery."
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
            <p>Last Updated: June 2026 &nbsp;•&nbsp; Effective Date: June 2026</p>
          </div>

          <div className="policy-body">
            {/* Intro */}
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#444" }}>
                Welcome to <strong style={{ color: "#0d1b40" }}>Kamali Gifts</strong>. We are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you visit our website, purchase from us, or interact with us in any manner. By using our services, you agree to the terms described herein.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#444" }}>
                We process payments securely through <strong>Razorpay</strong> (PCI-DSS compliant) and handle deliveries via <strong>Shiprocket</strong>. Both partners are governed by their own privacy policies in addition to this document.
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
                <h2>Who We Are</h2>
              </div>
              <p>
                Kamali Gifts is an online retail platform specializing in customized gifts, personalized toys, creative stationery, and bespoke gift hampers. We operate from India and serve customers nationwide. Our primary contact email is <strong>support@kamaligifts.com</strong>.
              </p>
            </div>

            {/* 2 */}
            <div className="policy-section" id="pp-2">
              <div className="policy-section-header">
                <div className="policy-section-num">2</div>
                <h2>Information We Collect</h2>
              </div>
              <h3>2.1 Personal Information You Provide</h3>
              <p>When you place an order, register an account, or contact us, we may collect:</p>
              <ul className="policy-ul">
                <li>Full name, billing and shipping address</li>
                <li>Email address and phone number</li>
                <li>Payment information — processed securely via <strong>Razorpay</strong>; we never store card or UPI details on our servers</li>
                <li>Personalization details: custom names, messages, photos, and design preferences submitted for customized products</li>
                <li>Gift recipient information when shipping to a third party</li>
                <li>Communication records including emails, chat transcripts, and support tickets</li>
                <li>Account credentials (hashed passwords — never stored in plain text)</li>
              </ul>
              <h3>2.2 Automatically Collected Information</h3>
              <p>When you browse our website, we automatically collect:</p>
              <ul className="policy-ul">
                <li>IP address, browser type, and operating system</li>
                <li>Pages visited, time spent, and clickstream data</li>
                <li>Referring URLs and search terms</li>
                <li>Device identifiers and cookie data</li>
                <li>Location data (city/region level) used for delivery estimation via Shiprocket</li>
              </ul>
              <h3>2.3 Third-Party Sources</h3>
              <p>We may receive supplemental data from payment processors (Razorpay), logistics partners (Shiprocket), and social media platforms if you interact with our pages or use social login features.</p>
            </div>

            {/* 3 */}
            <div className="policy-section" id="pp-3">
              <div className="policy-section-header">
                <div className="policy-section-num">3</div>
                <h2>How We Use Your Information</h2>
              </div>
              <ul className="policy-ul">
                <li>Processing and fulfilling your orders, including production of customized items</li>
                <li>Sharing name, address, and phone number with <strong>Shiprocket</strong> courier partners for delivery</li>
                <li>Communicating order confirmation, dispatch notification, and AWB tracking details via email and SMS</li>
                <li>Providing personalization services — printing names, photos, and messages on products</li>
                <li>Responding to customer service inquiries and resolving disputes</li>
                <li>Sending promotional emails and offers (only with your consent — opt-out available at any time)</li>
                <li>Improving our website, products, and services through analytics</li>
                <li>Fraud detection, chargeback prevention via Razorpay's risk tools</li>
                <li>Complying with legal obligations including GST filing under Indian law</li>
              </ul>
            </div>

            {/* 4 */}
            <div className="policy-section" id="pp-4">
              <div className="policy-section-header">
                <div className="policy-section-num">4</div>
                <h2>Sharing of Information</h2>
              </div>
              <p>Kamali Gifts does not sell your personal data to third parties. We share information only in the following circumstances:</p>
              <div className="policy-info-grid">
                <div className="policy-info-card">
                  <div className="label">Delivery</div>
                  <div className="value">Shiprocket & courier partners (name, address, phone)</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Payments</div>
                  <div className="value">Razorpay — PCI-DSS compliant payment gateway</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Production</div>
                  <div className="value">Printing/manufacturing partners (personalization details only)</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Legal</div>
                  <div className="value">Government/court orders as required by Indian law</div>
                </div>
              </div>
            </div>

            {/* 5 */}
            <div className="policy-section" id="pp-5">
              <div className="policy-section-header">
                <div className="policy-section-num">5</div>
                <h2>Personalized & Custom Order Data</h2>
              </div>
              <p>
                When you submit photos, names, or personal messages for customized products, this data is used exclusively to produce your order. We do not use this content for marketing, profiling, or sharing without your explicit consent.
              </p>
              <div className="policy-highlight">
                <p>Uploaded photos and personalization data are permanently deleted from our production systems within <strong>60 days</strong> of order fulfillment. If you require earlier deletion, contact us at <strong>Kamalireturngifts@gmail.com</strong>.</p>
              </div>
            </div>

            {/* 6 */}
            <div className="policy-section" id="pp-6">
              <div className="policy-section-header">
                <div className="policy-section-num">6</div>
                <h2>Cookies & Tracking</h2>
              </div>
              <p>We use cookies and similar tracking technologies to enhance your experience, remember your cart, wishlist, and analyze traffic. You may control cookies through your browser settings; disabling certain cookies may limit features like wishlist persistence and saved cart.</p>
              <ul className="policy-ul">
                <li><strong>Essential Cookies:</strong> Required for site functionality — cart, login session, checkout flow</li>
                <li><strong>Analytics Cookies:</strong> Google Analytics — used to understand traffic and user behavior</li>
                <li><strong>Payment Cookies:</strong> Razorpay may set cookies for fraud prevention and payment session management</li>
                <li><strong>Marketing Cookies:</strong> Retargeting via Facebook Pixel or Google Ads — opt-out available in your account settings</li>
              </ul>
            </div>

            {/* 7 */}
            <div className="policy-section" id="pp-7">
              <div className="policy-section-header">
                <div className="policy-section-num">7</div>
                <h2>Data Retention</h2>
              </div>
              <p>
                We retain your order and account data for a minimum of <strong>3 years</strong> to comply with Indian GST and tax regulations. Personalization media (photos, custom content) is deleted within 60 days of order fulfillment. After the retention period, data is anonymized or securely destroyed.
              </p>
              <p>You may request early deletion of non-essential data by contacting us at <strong>Kamalireturngifts@gmail.com</strong>. Deletion requests are processed within 30 days subject to legal retention requirements.</p>
            </div>

            {/* 8 */}
            <div className="policy-section" id="pp-8">
              <div className="policy-section-header">
                <div className="policy-section-num">8</div>
                <h2>Your Rights</h2>
              </div>
              <p>Under applicable Indian data protection principles, you have the right to:</p>
              <ul className="policy-ul">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate or incomplete data</li>
                <li>Request deletion of your data (subject to legal retention requirements)</li>
                <li>Opt out of marketing communications at any time via the unsubscribe link in emails</li>
                <li>Withdraw consent for data processing where consent is the legal basis</li>
                <li>Lodge a complaint with the relevant data protection authority in India</li>
                <li>Request a portable copy of your personal data in a machine-readable format</li>
              </ul>
            </div>

            {/* 9 */}
            <div className="policy-section" id="pp-9">
              <div className="policy-section-header">
                <div className="policy-section-num">9</div>
                <h2>Data Security</h2>
              </div>
              <p>
                We implement industry-standard security measures including SSL/TLS encryption for all data in transit, bcrypt password hashing, and role-based access controls. All payment processing is delegated entirely to <strong>Razorpay's PCI-DSS Level 1 certified</strong> infrastructure — we never receive or store card numbers, CVVs, or UPI PINs.
              </p>
              <p>Delivery data shared with Shiprocket is transmitted over encrypted channels and used solely for logistics purposes. Despite best efforts, no digital system is entirely immune to threats; we encourage use of strong passwords and enabling two-factor authentication where available.</p>
            </div>

            {/* 10 */}
            <div className="policy-section" id="pp-10">
              <div className="policy-section-header">
                <div className="policy-section-num">10</div>
                <h2>Children's Privacy</h2>
              </div>
              <p>
                Our services are not directed to children under 13 years of age. We do not knowingly collect personal data from minors. Many of our products (toys, kids' stationery) are purchased by parents or guardians on behalf of children; the account holder must be 18 or older. If you believe a child has inadvertently provided us with personal information, contact us immediately and we will delete it promptly.
              </p>
            </div>

            {/* 11 */}
            <div className="policy-section" id="pp-11">
              <div className="policy-section-header">
                <div className="policy-section-num">11</div>
                <h2>Changes to This Policy</h2>
              </div>
              <p>
                We may update this Privacy Policy periodically to reflect changes in our data practices, legal requirements, or service offerings. Material changes will be communicated via email to registered users or via a prominent notice on our website at least 7 days before they take effect. Continued use of our services after such changes constitutes acceptance of the updated policy.
              </p>
            </div>

            {/* 12 */}
            <div className="policy-section" id="pp-12">
              <div className="policy-section-header">
                <div className="policy-section-num">12</div>
                <h2>Contact Us</h2>
              </div>
              <p>For any privacy-related queries, data deletion requests, or concerns:</p>
              <div className="policy-contact-box">
                <div>
                  <h3>Data Protection Contact</h3>
                  <p>We aim to respond to all privacy queries within 48 business hours.</p>
                </div>
                <div className="policy-contact-items">
                  <div className="policy-contact-item"><span>Email</span> Kamalireturngifts@gmail.com</div>
                  <div className="policy-contact-item"><span>Phone</span> +91 73388 14319</div>
                  
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