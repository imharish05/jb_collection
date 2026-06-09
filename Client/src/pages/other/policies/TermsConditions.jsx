import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../../components/seo";
import LayoutOne from "../../../layouts/LayoutOne";
import Breadcrumb from "../../../wrappers/breadcrumb/Breadcrumb";

const TermsConditions = () => {
  const { pathname } = useLocation();

  const sections = [
    "Definitions",
    "Account Registration",
    "Ordering & Acceptance",
    "Pricing & Payments (Razorpay)",
    "Customization Policy",
    "Intellectual Property",
    "Prohibited Activities",
    "Disclaimer of Warranties",
    "Limitation of Liability",
    "Governing Law & Dispute Resolution",
    "Amendments",
    "Contact",
  ];

  return (
    <Fragment>
      
      <SEO
        titleTemplate="Terms & Conditions – Kamali Gifts"
        description="Read the Terms and Conditions for shopping at Kamali Gifts — customized gifts, toys, and stationery. Covers orders, payments via Razorpay, delivery via Shiprocket, and more."
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
            <p>Last Updated: June 2026 &nbsp;•&nbsp; Effective Date: June 2026</p>
          </div>

          <div className="policy-body">
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#444" }}>
                These Terms and Conditions (<strong>"Terms"</strong>) govern your use of the Kamali Gifts website, mobile application, and all associated services. By accessing our platform or placing an order, you agree to be legally bound by these Terms. If you do not agree, please do not use our services.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#444" }}>
                Payments on our platform are processed exclusively through <strong>Razorpay</strong> and shipping is managed through <strong>Shiprocket</strong>, each with their own terms that govern those specific services.
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
                <h2>Definitions</h2>
              </div>
              <ul className="policy-ul">
                <li><strong>"Company" / "We" / "Us"</strong> refers to Kamali Gifts</li>
                <li><strong>"Customer" / "You"</strong> refers to any person accessing or using our services</li>
                <li><strong>"Products"</strong> refers to customized gifts, toys, stationery, and related merchandise</li>
                <li><strong>"Order"</strong> refers to a confirmed purchase of one or more Products</li>
                <li><strong>"Customization"</strong> refers to personalization of Products including printing, engraving, embroidery, or photo/text overlay</li>
                <li><strong>"Razorpay"</strong> refers to Razorpay Software Private Limited, our payment processing partner</li>
                <li><strong>"Shiprocket"</strong> refers to Bigfoot Retail Solutions Pvt Ltd, our logistics aggregation partner</li>
              </ul>
            </div>

            {/* 2 */}
            <div className="policy-section" id="tc-2">
              <div className="policy-section-header">
                <div className="policy-section-num">2</div>
                <h2>Account Registration</h2>
              </div>
              <p>
                To place orders, you are required to create an account. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account. You must provide accurate, current, and complete information during registration and keep it updated.
              </p>
              <p>
                Kamali Gifts reserves the right to suspend or permanently terminate accounts that are found to be in violation of these Terms, engaged in fraudulent activity, or have provided false information. You may not create multiple accounts to circumvent restrictions.
              </p>
            </div>

            {/* 3 */}
            <div className="policy-section" id="tc-3">
              <div className="policy-section-header">
                <div className="policy-section-num">3</div>
                <h2>Ordering & Acceptance</h2>
              </div>
              <p>
                All orders placed through our platform are subject to acceptance by Kamali Gifts. An order is confirmed only upon receipt of a confirmation email and successful payment authorization via Razorpay. We reserve the right to refuse or cancel any order due to:
              </p>
              <ul className="policy-ul">
                <li>Product unavailability or stock depletion after order placement</li>
                <li>Pricing errors or technical glitches displaying incorrect prices</li>
                <li>Suspected fraudulent activity or policy violations</li>
                <li>Inability to verify payment or delivery address</li>
                <li>Operational constraints during peak seasons</li>
              </ul>
              <div className="policy-warning">
                <strong>Important for customized orders:</strong> You are fully responsible for providing accurate personalization details — names, dates, photos, and messages. Errors in submitted details resulting in incorrect production are not eligible for free replacement. Please review all customization inputs carefully before confirming.
              </div>
            </div>

            {/* 4 */}
            <div className="policy-section" id="tc-4">
              <div className="policy-section-header">
                <div className="policy-section-num">4</div>
                <h2>Pricing & Payments (Razorpay)</h2>
              </div>
              <ul className="policy-ul">
                <li>All prices are listed in Indian Rupees (INR) and include GST unless explicitly stated otherwise</li>
                <li>Prices are subject to change without notice; orders are billed at the price confirmed at checkout</li>
                <li>Payments are processed via <strong>Razorpay</strong>, supporting Credit/Debit Cards, UPI, Net Banking, EMI, and Wallets</li>
                <li>Partial Cash on Delivery (COD) may be available on eligible orders; remaining balance is collected at delivery</li>
                <li>Failed payments must be retried; orders will not enter production until payment is fully confirmed</li>
                <li>In the event of a double-charge due to technical error, a full refund will be initiated through Razorpay within 5–7 business days</li>
                <li>Kamali Gifts does not store any payment card details; all sensitive payment data is handled exclusively by Razorpay's PCI-DSS Level 1 certified infrastructure</li>
                <li>Razorpay's own Terms of Service apply to the payment processing portion of your transaction</li>
              </ul>
            </div>

            {/* 5 */}
            <div className="policy-section" id="tc-5">
              <div className="policy-section-header">
                <div className="policy-section-num">5</div>
                <h2>Customization Policy</h2>
              </div>
              <p>Kamali Gifts specializes in personalized products. By submitting personalization details, you confirm that:</p>
              <ul className="policy-ul">
                <li>You own or have lawful permission to use any images, logos, or copyrighted material submitted</li>
                <li>Content submitted does not violate any applicable law or third-party intellectual property rights</li>
                <li>Personalization details submitted are treated as final once production begins; changes are not guaranteed after this point</li>
                <li>We reserve the right to refuse production of content deemed offensive, illegal, defamatory, or otherwise inappropriate</li>
                <li>Submitting another person's photo without their consent may violate their privacy rights; you bear full legal responsibility</li>
              </ul>
              <p>
                A preview confirmation may be sent for complex or high-value customized orders. It is your responsibility to approve or request corrections within the specified time window before production proceeds.
              </p>
            </div>

            {/* 6 */}
            <div className="policy-section" id="tc-6">
              <div className="policy-section-header">
                <div className="policy-section-num">6</div>
                <h2>Intellectual Property</h2>
              </div>
              <p>
                All content on the Kamali Gifts website — including logos, product images, designs, descriptions, UI elements, and software — is the exclusive property of Kamali Gifts or its licensors and is protected under applicable intellectual property laws. You may not reproduce, distribute, modify, or commercially exploit our content without prior written permission.
              </p>
              <p>
                Customer-submitted content (photos, custom text) remains the intellectual property of the customer. However, by submitting content for order production, you grant Kamali Gifts a limited, non-exclusive, royalty-free license to use such content solely for fulfilling your specific order.
              </p>
            </div>

            {/* 7 */}
            <div className="policy-section" id="tc-7">
              <div className="policy-section-header">
                <div className="policy-section-num">7</div>
                <h2>Prohibited Activities</h2>
              </div>
              <p>You agree not to:</p>
              <ul className="policy-ul">
                <li>Use our platform for any unlawful purpose or in violation of applicable laws or regulations</li>
                <li>Submit false, misleading, or fraudulent information including fake delivery addresses</li>
                <li>Engage in unauthorized scraping, crawling, or systematic data extraction from our website</li>
                <li>Attempt to gain unauthorized access to our systems, servers, or other user accounts</li>
                <li>Submit offensive, hateful, defamatory, or sexually explicit content for customization</li>
                <li>Resell our products for commercial purposes without prior written consent from Kamali Gifts</li>
                <li>Misuse our return, exchange, or refund policies through fraudulent claims</li>
                <li>Initiate chargebacks through Razorpay for valid, fulfilled orders without first contacting our support team</li>
              </ul>
            </div>

            {/* 8 */}
            <div className="policy-section" id="tc-8">
              <div className="policy-section-header">
                <div className="policy-section-num">8</div>
                <h2>Disclaimer of Warranties</h2>
              </div>
              <p>
                Our products and services are provided "as is" and "as available." While we strive for the highest quality in every customized and standard product, Kamali Gifts does not warrant that products will always match digital previews exactly due to natural variations in screen color calibration, printing substrates, and material batches. Slight color or texture variations are not considered defects.
              </p>
              <p>
                Delivery timelines provided are estimates facilitated through <strong>Shiprocket</strong> and its associated courier partners. Kamali Gifts does not guarantee delivery by a specific date and is not liable for delays caused by courier operations, weather events, public holidays, or force majeure circumstances.
              </p>
            </div>

            {/* 9 */}
            <div className="policy-section" id="tc-9">
              <div className="policy-section-header">
                <div className="policy-section-num">9</div>
                <h2>Limitation of Liability</h2>
              </div>
              <p>
                To the maximum extent permitted by applicable law, Kamali Gifts shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use or inability to use our services, products, or information on this website.
              </p>
              <p>
                Our total liability for any claim arising from an order shall not exceed the total value of that specific order as paid by the customer. We are not responsible for delays, losses, or damages caused by third-party services including Razorpay or Shiprocket, whose own liability terms apply.
              </p>
            </div>

            {/* 10 */}
            <div className="policy-section" id="tc-10">
              <div className="policy-section-header">
                <div className="policy-section-num">10</div>
                <h2>Governing Law & Dispute Resolution</h2>
              </div>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India, including the Consumer Protection Act 2019 and the Information Technology Act 2000.
              </p>
              <p>
                Any disputes arising from or relating to these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days of notice, disputes shall be subject to the exclusive jurisdiction of competent courts in Tamil Nadu, India. Consumer disputes may also be referred to the appropriate Consumer Disputes Redressal Forum under Indian law.
              </p>
            </div>

            {/* 11 */}
            <div className="policy-section" id="tc-11">
              <div className="policy-section-header">
                <div className="policy-section-num">11</div>
                <h2>Amendments</h2>
              </div>
              <p>
                We reserve the right to modify these Terms at any time to reflect changes in our business practices, legal requirements, or service offerings. Updated Terms will be published on our website with a revised effective date. For material changes, we will provide at least 7 days' notice via email or a website banner. Continued use of our services after the effective date of such changes constitutes your acceptance of the amended Terms.
              </p>
            </div>

            {/* 12 */}
            <div className="policy-section" id="tc-12">
              <div className="policy-section-header">
                <div className="policy-section-num">12</div>
                <h2>Contact</h2>
              </div>
              <p>For legal or compliance-related queries:</p>
              <div className="policy-contact-box">
                <div>
                  <h3>Legal Queries</h3>
                  <p>Kamali Gifts legal & compliance team.</p>
                </div>
                <div className="policy-contact-items">
                  <div className="policy-contact-item"><span>Email</span> legal@kamaligifts.com</div>
                  <div className="policy-contact-item"><span>Phone</span> +91-XXXXX-XXXXX</div>
                  <div className="policy-contact-item"><span>Hours</span> Mon–Sat, 9 AM – 6 PM IST</div>
                </div>
              </div>
            </div>

            <div className="policy-last-updated">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              These Terms were last reviewed and updated in June 2026.
            </div>
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default TermsConditions;