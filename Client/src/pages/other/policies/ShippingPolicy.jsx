import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../../components/seo";
import LayoutOne from "../../../layouts/LayoutOne";
import Breadcrumb from "../../../wrappers/breadcrumb/Breadcrumb";


const ShippingPolicy = () => {
  const { pathname } = useLocation();

  const sections = [
    "Order Processing & Dispatch",
    "Pre-Booking Orders",
    "Delivery Timelines",
    "Shipping Charges",
    "Order Tracking",
    "Contact for Shipping Issues",
  ];

  return (
    <Fragment>
      <SEO
        titleTemplate="Shipping Policy – JB House of Fashion"
        description="JB House of Fashion ships across India. Learn about delivery timelines, shipping charges, tracking, and pre-booking orders for your customized gifts, toys, and stationery."
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
                <h2>Order Processing &amp; Dispatch</h2>
              </div>
              <p>
                We strive to process and dispatch all orders as quickly as possible. Standard orders are typically processed within <strong>1–3 business days</strong>, while customized or bulk orders may require additional preparation time depending on the quantity and specifications.
              </p>
              <p>
                Customers are requested to provide accurate shipping information, as we cannot be held liable for delays or non-delivery resulting from incorrect or incomplete addresses.
              </p>
            </div>

            {/* 2 */}
            <div className="policy-section" id="sp-2">
              <div className="policy-section-header">
                <div className="policy-section-num">2</div>
                <h2>Pre-Booking Orders</h2>
              </div>
              <p>
                Certain products offered on our website are available on a <strong>pre-booking basis</strong>, meaning they are imported, manufactured, or specially sourced only after a confirmed order is placed. Such pre-booking items may take <strong>up to 20 days or more</strong> before shipping begins, and the estimated dispatch timeline will be communicated to customers at the time of ordering.
              </p>
              <div className="policy-warning">
                As these products are procured specifically for each customer, <strong>pre-booking orders cannot be canceled, modified, or refunded</strong> once the order has been confirmed.
              </div>
              <p style={{ marginTop: 14 }}>
                However, in rare circumstances where we are unable to manufacture, source, or import the product due to supplier issues, production constraints, regulatory requirements, or other unforeseen factors, we reserve the right to cancel the order. In such cases, customers will be promptly notified and a <strong>full refund</strong> of the amount paid will be processed using the original payment method.
              </p>
            </div>

            {/* 3 */}
            <div className="policy-section" id="sp-3">
              <div className="policy-section-header">
                <div className="policy-section-num">3</div>
                <h2>Delivery Timelines</h2>
              </div>
              <p>
                Delivery timelines may vary based on the destination, courier service, weather conditions, public holidays, customs clearance, or other unforeseen circumstances. While we make every effort to ensure timely delivery, we are not responsible for delays caused by third-party courier services.
              </p>
            </div>

            {/* 4 */}
            <div className="policy-section" id="sp-4">
              <div className="policy-section-header">
                <div className="policy-section-num">4</div>
                <h2>Shipping Charges</h2>
              </div>
              <p>
                Shipping charges, if applicable, will be displayed during checkout and are <strong>non-refundable</strong> except in cases where an incorrect or damaged product has been delivered by us.
              </p>
            </div>

            {/* 5 */}
            <div className="policy-section" id="sp-5">
              <div className="policy-section-header">
                <div className="policy-section-num">5</div>
                <h2>Order Tracking</h2>
              </div>
              <p>
                Once an order has been shipped, tracking details will be provided where available.
              </p>
            </div>

            {/* 6 */}
            <div className="policy-section" id="sp-6">
              <div className="policy-section-header">
                <div className="policy-section-num">6</div>
                <h2>Contact for Shipping Issues</h2>
              </div>
              <p>Always quote your <strong>Order ID</strong> when contacting us about a shipment.</p>
              <div className="policy-contact-box">
                <div>
                  <h3>Shipping Support</h3>
                  <p>Mon–Sat, 9 AM – 6 PM IST.</p>
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

export default ShippingPolicy;
