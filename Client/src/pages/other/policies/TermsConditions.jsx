import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../../components/seo";
import LayoutOne from "../../../layouts/LayoutOne";
import Breadcrumb from "../../../wrappers/breadcrumb/Breadcrumb";

const TermsConditions = () => {
  const { pathname } = useLocation();

  const sections = [
    "Pricing & Orders",
    "Product Variations",
    "Customized, Personalized & Bulk Orders",
    "Pre-Booking Orders",
    "Processing & Delivery",
    "Returns & Replacements",
    "Shipping Charges",
    "Order Refusal & Cancellation",
    "Promotional Use of Content",
    "Intellectual Property",
    "Amendments",
    "Contact",
  ];

  return (
    <Fragment>
      <SEO
        titleTemplate="Terms & Conditions – JB House of Fashion"
        description="Read the Terms and Conditions for shopping at JB House of Fashion — customized gifts, toys, and stationery."
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
                By accessing and placing an order through our website, you agree to the following Terms &amp; Conditions.
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
                <h2>Pricing &amp; Orders</h2>
              </div>
              <ul className="policy-ul">
                <li>All product prices are displayed in the applicable currency and are subject to change without prior notice.</li>
                <li>Orders are considered confirmed only after successful payment and order verification.</li>
              </ul>
            </div>

            {/* 2 */}
            <div className="policy-section" id="tc-2">
              <div className="policy-section-header">
                <div className="policy-section-num">2</div>
                <h2>Product Variations</h2>
              </div>
              <ul className="policy-ul">
                <li>Product images are for illustrative purposes only. Minor variations in color, size, packaging, or finish may occur due to photography, screen settings, manufacturing processes, or supplier variations.</li>
              </ul>
            </div>

            {/* 3 */}
            <div className="policy-section" id="tc-3">
              <div className="policy-section-header">
                <div className="policy-section-num">3</div>
                <h2>Customized, Personalized &amp; Bulk Orders</h2>
              </div>
              <div className="policy-warning">
                Customized, personalized, made-to-order, and bulk orders are produced according to customer requirements and are <strong>not eligible for cancellation, return, or refund</strong> once production has commenced.
              </div>
            </div>

            {/* 4 */}
            <div className="policy-section" id="tc-4">
              <div className="policy-section-header">
                <div className="policy-section-num">4</div>
                <h2>Pre-Booking Orders</h2>
              </div>
              <ul className="policy-ul">
                <li>Certain products are offered on a pre-booking basis and may be imported, manufactured, or specially sourced only after a confirmed order is placed.</li>
                <li>Pre-booking products may require <strong>up to 20 days or more</strong> before dispatch, depending on manufacturing, sourcing, or import timelines.</li>
                <li>Pre-booking orders <strong>cannot be canceled, modified, or refunded</strong> by the customer after confirmation.</li>
                <li>In exceptional circumstances where we are unable to manufacture, source, or import a pre-booked product, we reserve the right to cancel the order and provide a <strong>full refund</strong> of the amount paid.</li>
              </ul>
            </div>

            {/* 5 */}
            <div className="policy-section" id="tc-5">
              <div className="policy-section-header">
                <div className="policy-section-num">5</div>
                <h2>Processing &amp; Delivery</h2>
              </div>
              <ul className="policy-ul">
                <li>Standard orders are generally processed within <strong>1–3 business days</strong>, while customized, bulk, or pre-booking orders may require additional processing time.</li>
                <li>Delivery timelines are estimates only and may be affected by courier delays, weather conditions, customs clearance, public holidays, or other circumstances beyond our control.</li>
                <li>Customers are responsible for providing accurate shipping and contact information. We are not liable for delays or losses resulting from incorrect details provided by the customer.</li>
              </ul>
            </div>

            {/* 6 */}
            <div className="policy-section" id="tc-6">
              <div className="policy-section-header">
                <div className="policy-section-num">6</div>
                <h2>Returns &amp; Replacements</h2>
              </div>
              <ul className="policy-ul">
                <li>Returns and replacements are accepted only for products that are damaged, defective, or incorrectly supplied, subject to verification.</li>
                <li>Claims regarding damaged, defective, or incorrect products must be reported within the specified return window along with supporting photographs and parcel opening videos.</li>
              </ul>
            </div>

            {/* 7 */}
            <div className="policy-section" id="tc-7">
              <div className="policy-section-header">
                <div className="policy-section-num">7</div>
                <h2>Shipping Charges</h2>
              </div>
              <ul className="policy-ul">
                <li>Shipping charges, if applicable, are <strong>non-refundable</strong> except where an incorrect or damaged product has been delivered by us.</li>
              </ul>
            </div>

            {/* 8 */}
            <div className="policy-section" id="tc-8">
              <div className="policy-section-header">
                <div className="policy-section-num">8</div>
                <h2>Order Refusal &amp; Cancellation</h2>
              </div>
              <ul className="policy-ul">
                <li>We reserve the right to refuse, cancel, or limit any order if fraudulent activity, pricing errors, stock unavailability, or other operational issues are identified.</li>
              </ul>
            </div>

            {/* 9 */}
            <div className="policy-section" id="tc-9">
              <div className="policy-section-header">
                <div className="policy-section-num">9</div>
                <h2>Promotional Use of Content</h2>
              </div>
              <div className="policy-highlight">
                <p>
                  With customer consent, we may use product photographs, customer reviews, testimonials, first names, and city/state/country information for promotional and marketing purposes on our website, social media platforms, advertisements, and other marketing materials. Sensitive personal information will never be disclosed.
                </p>
              </div>
            </div>

            {/* 10 */}
            <div className="policy-section" id="tc-10">
              <div className="policy-section-header">
                <div className="policy-section-num">10</div>
                <h2>Intellectual Property</h2>
              </div>
              <ul className="policy-ul">
                <li>All website content, including images, logos, designs, text, and branding, remains the intellectual property of <strong>JB House of Fashion Factory</strong> and may not be copied, reproduced, or distributed without prior written permission.</li>
              </ul>
            </div>

            {/* 11 */}
            <div className="policy-section" id="tc-11">
              <div className="policy-section-header">
                <div className="policy-section-num">11</div>
                <h2>Amendments</h2>
              </div>
              <p>
                JB House of Fashion Factory reserves the right to modify these Terms &amp; Conditions at any time without prior notice. Updated terms will be posted on this page and will become effective immediately upon publication.
              </p>
            </div>

            {/* 12 */}
            <div className="policy-section" id="tc-12">
              <div className="policy-section-header">
                <div className="policy-section-num">12</div>
                <h2>Contact</h2>
              </div>
              <p>For any queries related to these Terms &amp; Conditions:</p>
              <div className="policy-contact-box">
                <div>
                  <h3>JB House of Fashion Factory</h3>
                  <p>Mon–Sat, 9 AM – 6 PM IST.</p>
                </div>
                <div className="policy-contact-items">
                  <div className="policy-contact-item"><span>Email</span> kamalireturngifts@gmail.com</div>
                  <div className="policy-contact-item"><span>WhatsApp</span> +91 73388 14319</div>
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