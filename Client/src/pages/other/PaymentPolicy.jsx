import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";

const PaymentPolicy = () => {
  const { pathname } = useLocation();

  const sections = [
    "Payment Methods Accepted",
    "How Razorpay Processes Your Payment",
    "Partial COD (Cash on Delivery)",
    "Payment Security",
    "Failed & Pending Payments",
    "EMI & Buy Now Pay Later",
    "Currency & Taxes",
    "Refunds via Razorpay",
    "Chargebacks & Disputes",
    "Fraud Prevention",
    "Contact for Payment Issues",
  ];

  return (
    <Fragment>
      <SEO
        titleTemplate="Payment Policy – Kamali Gifts"
        description="Kamali Gifts payment policy — learn about accepted payment methods, Razorpay security, COD, EMI options, refund timelines, and how we handle failed transactions."
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Payment Policy", path: process.env.PUBLIC_URL + pathname },
          ]}
        />

        <div className="policy-page">
          {/* Hero */}
          <div className="policy-hero">
            <div className="policy-hero-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div className="policy-hero-badge">Payments</div>
            <h1>Payment Policy</h1>
            <p>Last Updated: June 2026 &nbsp;•&nbsp; Powered by Razorpay</p>
          </div>

          <div className="policy-body">
            {/* Intro */}
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "#444" }}>
                At <strong style={{ color: "#0d1b40" }}>Kamali Gifts</strong>, all payments are processed securely through <strong>Razorpay</strong> — one of India's leading PCI-DSS Level 1 certified payment gateways. This policy explains how we collect payments, what methods we accept, how refunds work, and how we protect your financial data. We do not store any card, UPI, or banking credentials on our servers.
              </p>

              {/* Razorpay callout */}
              <div className="policy-highlight" style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ background: "#0d1b40", borderRadius: 8, padding: "6px 10px", flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: "#0d1b40" }}>Powered by Razorpay</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>
                    Razorpay is a PCI-DSS Level 1 certified payment gateway compliant with RBI guidelines. Your card details, UPI credentials, and net banking information are handled entirely within Razorpay's encrypted infrastructure — Kamali Gifts never receives or stores this data.
                  </p>
                </div>
              </div>
            </div>

            {/* TOC */}
            <div className="policy-toc">
              <h3>Table of Contents</h3>
              <ol>
                {sections.map((s, i) => (
                  <li key={i}><a href={`#pay-${i + 1}`}>{s}</a></li>
                ))}
              </ol>
            </div>

            {/* 1 */}
            <div className="policy-section" id="pay-1">
              <div className="policy-section-header">
                <div className="policy-section-num">1</div>
                <h2>Payment Methods Accepted</h2>
              </div>
              <p>We accept all major payment methods supported by Razorpay's payment gateway:</p>

              <div className="policy-info-grid">
                <div className="policy-info-card">
                  <div className="label">Credit Cards</div>
                  <div className="value">Visa, Mastercard, Amex, RuPay</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Debit Cards</div>
                  <div className="value">All major Indian bank debit cards</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">UPI</div>
                  <div className="value">GPay, PhonePe, Paytm, BHIM, any UPI ID</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Net Banking</div>
                  <div className="value">50+ Indian banks supported</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Wallets</div>
                  <div className="value">Paytm, Amazon Pay, Mobikwik, Freecharge</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">EMI</div>
                  <div className="value">No-cost & standard EMI via credit cards</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">BNPL</div>
                  <div className="value">Simpl, LazyPay, ZestMoney (where available)</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Partial COD</div>
                  <div className="value">Online advance + cash at delivery</div>
                </div>
              </div>

              <p style={{ marginTop: 14 }}>
                Payment method availability may vary by order value, product type, and delivery pin code. All available options are displayed dynamically at checkout.
              </p>
            </div>

            {/* 2 */}
            <div className="policy-section" id="pay-2">
              <div className="policy-section-header">
                <div className="policy-section-num">2</div>
                <h2>How Razorpay Processes Your Payment</h2>
              </div>
              <p>
                When you click "Proceed to Pay" at checkout, you are redirected to Razorpay's secure hosted payment page. The entire payment interaction — entering card details, UPI PIN, or net banking credentials — occurs within <strong>Razorpay's PCI-DSS compliant environment</strong>, not on Kamali Gifts' servers.
              </p>
              <ul className="policy-ul">
                <li>Razorpay uses <strong>256-bit SSL/TLS encryption</strong> for all data transmitted during payment</li>
                <li>Card data is tokenized by Razorpay; Kamali Gifts only receives a token and transaction reference ID</li>
                <li>3D Secure (OTP-based) authentication is enforced for all card transactions as per RBI mandates</li>
                <li>UPI transactions are authorized via your UPI app PIN — this PIN never leaves your device</li>
                <li>Payment confirmation is communicated to Kamali Gifts via Razorpay's secure webhook; your order enters production only after payment is fully authorized</li>
                <li>Razorpay's own <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" style={{ color: "#db1a5d" }}>Privacy Policy</a> and <a href="https://razorpay.com/terms/" target="_blank" rel="noopener noreferrer" style={{ color: "#db1a5d" }}>Terms of Service</a> govern the payment processing portion of your transaction</li>
              </ul>
            </div>

            {/* 3 */}
            <div className="policy-section" id="pay-3">
              <div className="policy-section-header">
                <div className="policy-section-num">3</div>
                <h2>Partial COD (Cash on Delivery)</h2>
              </div>
              <p>
                Kamali Gifts offers a <strong>Partial COD</strong> option on eligible orders — a hybrid model where you pay a portion online via Razorpay upfront, and the remaining balance in cash at the time of delivery.
              </p>
              <ul className="policy-ul">
                <li>The online advance covers a minimum of 30–50% of the order value; the exact split is shown at checkout</li>
                <li>Production of customized items begins only after the online advance payment is confirmed via Razorpay</li>
                <li>The COD balance must be paid in cash to the delivery agent at the time of handover; digital payments at the door are at the courier partner's discretion</li>
                <li>If the COD balance is refused at delivery, the shipment will be returned to our facility. Re-dispatch requires full prepayment and an additional shipping fee</li>
                <li>Partial COD is not available on all orders; eligibility is determined by order value, pin code, and product type</li>
                <li>Refunds for Partial COD orders: the Razorpay advance portion is refunded to the original payment method; the COD portion is refunded via NEFT/UPI to a bank account you provide</li>
              </ul>
              <div className="policy-warning">
                <strong>Note:</strong> An additional COD handling fee of <strong>₹25–₹50</strong> may apply to orders using the Partial COD option, shown transparently at checkout before payment.
              </div>
            </div>

            {/* 4 */}
            <div className="policy-section" id="pay-4">
              <div className="policy-section-header">
                <div className="policy-section-num">4</div>
                <h2>Payment Security</h2>
              </div>
              <p>Your financial security is our highest priority. Here's what protects you when you pay on Kamali Gifts:</p>
              <ul className="policy-ul">
                <li><strong>PCI-DSS Level 1:</strong> Razorpay is certified at the highest level of the Payment Card Industry Data Security Standard — the same level used by global banks</li>
                <li><strong>3D Secure / OTP:</strong> All card transactions require an additional OTP or bank app authentication step, ensuring only the authorized cardholder can complete payment</li>
                <li><strong>TLS 1.2+:</strong> All data exchanged between your browser and Razorpay is encrypted using Transport Layer Security 1.2 or higher</li>
                <li><strong>Tokenization:</strong> Razorpay tokenizes saved card data in compliance with RBI's card-on-file tokenization guidelines; actual card numbers are never stored by Kamali Gifts</li>
                <li><strong>Fraud Detection:</strong> Razorpay's ML-powered fraud detection engine monitors transactions in real time and flags suspicious activity before authorization</li>
                <li><strong>Zero Knowledge Architecture:</strong> Kamali Gifts has zero access to your CVV, UPI PIN, net banking password, or card number at any point</li>
              </ul>
              <div className="policy-highlight">
                <p>Kamali Gifts will <strong>never</strong> ask you for your card number, CVV, OTP, UPI PIN, or net banking credentials via email, phone, or WhatsApp. If you receive such a request claiming to be from Kamali Gifts, it is a phishing attempt — report it to <strong>Kamalireturngifts@gmail.com</strong> immediately.</p>
              </div>
            </div>

            {/* 5 */}
            <div className="policy-section" id="pay-5">
              <div className="policy-section-header">
                <div className="policy-section-num">5</div>
                <h2>Failed & Pending Payments</h2>
              </div>
              <p>Payment failures can occur due to network issues, bank declines, incorrect OTP, or session timeouts. Here's how we handle each scenario:</p>

              <h3>Payment Failed (Confirmed by Razorpay)</h3>
              <ul className="policy-ul">
                <li>No amount is deducted; your order remains in a pending/unpaid state</li>
                <li>You may retry payment from your order page or initiate a new checkout</li>
                <li>If an amount was debited from your bank but Razorpay shows "failed," this is typically a bank-side delay; funds are auto-reversed within <strong>5–7 business days</strong> by your bank per RBI guidelines</li>
              </ul>

              <h3>Payment Pending (Processing / Awaiting Bank Confirmation)</h3>
              <ul className="policy-ul">
                <li>This occurs with net banking, UPI collect requests, or wallet transactions where authorization is delayed</li>
                <li>Your order is held in a pending state; do not attempt to repay until the first transaction is confirmed failed or refunded</li>
                <li>If pending for more than <strong>24 hours</strong>, contact us at <strong>Kamalireturngifts@gmail.com</strong> with your Order ID and we will investigate via Razorpay's dashboard</li>
              </ul>

              <h3>Double Charge</h3>
              <ul className="policy-ul">
                <li>In the rare event of a duplicate deduction, the extra charge is refunded automatically by Razorpay within <strong>5–7 business days</strong></li>
                <li>If not auto-resolved, contact us immediately with your bank statement screenshot showing both debits</li>
              </ul>
            </div>

            {/* 6 */}
            <div className="policy-section" id="pay-6">
              <div className="policy-section-header">
                <div className="policy-section-num">6</div>
                <h2>EMI & Buy Now Pay Later</h2>
              </div>
              <p>
                We offer flexible payment options through Razorpay for eligible orders:
              </p>

              <h3>Credit Card EMI</h3>
              <ul className="policy-ul">
                <li>Available on orders above ₹3,000 for cards issued by HDFC, ICICI, SBI, Axis, Kotak, and other major banks</li>
                <li>Tenure options: 3, 6, 9, 12, and 24 months depending on your bank and card</li>
                <li>No-cost EMI options (where interest is subvented) are clearly marked at checkout; standard EMI options display the applicable interest rate</li>
                <li>EMI processing is entirely managed by Razorpay and your issuing bank; Kamali Gifts does not handle EMI approvals or denials</li>
                <li>Pre-closure of EMI is subject to your bank's terms</li>
              </ul>

              <h3>Buy Now Pay Later (BNPL)</h3>
              <ul className="policy-ul">
                <li>BNPL options (Simpl, LazyPay, ZestMoney) are available at checkout where supported by Razorpay for your account</li>
                <li>BNPL credit limits and repayment terms are governed entirely by the respective BNPL provider, not Kamali Gifts</li>
                <li>Refunds for BNPL orders are processed back to the BNPL provider, who adjusts your outstanding balance accordingly</li>
              </ul>
            </div>

            {/* 7 */}
            <div className="policy-section" id="pay-7">
              <div className="policy-section-header">
                <div className="policy-section-num">7</div>
                <h2>Currency & Taxes</h2>
              </div>
              <ul className="policy-ul">
                <li>All transactions are processed in <strong>Indian Rupees (INR)</strong> only; international currencies are not supported</li>
                <li>Product prices displayed on Kamali Gifts are <strong>inclusive of GST</strong> (Goods and Services Tax) at the applicable rate unless explicitly stated otherwise</li>
                <li>A detailed tax invoice including HSN codes and GST breakdowns is emailed to you upon order confirmation; it is also available to download from your account under "My Orders"</li>
                <li>Corporate buyers requiring GSTIN-linked invoices must provide their GSTIN at checkout; post-order invoice amendments are not guaranteed</li>
                <li>Shipping charges displayed at checkout are exclusive of any GST applicable on logistics services, which is charged separately where applicable</li>
              </ul>
            </div>

            {/* 8 */}
            <div className="policy-section" id="pay-8">
              <div className="policy-section-header">
                <div className="policy-section-num">8</div>
                <h2>Refunds via Razorpay</h2>
              </div>
              <p>All approved refunds are processed through Razorpay back to the original payment source. Refunds are initiated by Kamali Gifts within 24–48 hours of approval; the time to reflect in your account depends on Razorpay's processing and your bank's settlement cycle.</p>

              <div className="policy-info-grid">
                <div className="policy-info-card">
                  <div className="label">Credit / Debit Card</div>
                  <div className="value">5–7 Business Days</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Razorpay → Card issuer → Your account</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">UPI</div>
                  <div className="value">2–5 Business Days</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Direct to your UPI-linked bank account</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Net Banking</div>
                  <div className="value">5–7 Business Days</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Back to originating bank account</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Wallets</div>
                  <div className="value">1–3 Business Days</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Back to original wallet balance</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">EMI</div>
                  <div className="value">5–7 Business Days</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Refunded to card; bank adjusts EMI</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">COD Portion</div>
                  <div className="value">5–7 Business Days</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>NEFT/UPI to bank account you provide</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">BNPL</div>
                  <div className="value">3–7 Business Days</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Credited to BNPL outstanding balance</div>
                </div>
                <div className="policy-info-card">
                  <div className="label">Store Credit</div>
                  <div className="value">Within 24 Hours</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Added to your Kamali Gifts wallet</div>
                </div>
              </div>

              <div className="policy-highlight" style={{ marginTop: 16 }}>
                <p>Kamali Gifts initiates refunds promptly upon approval. However, bank-side processing delays are beyond our control. If a refund has not reflected after <strong>10 business days</strong>, contact your bank first; if unresolved, escalate to us at <strong>Kamalireturngifts@gmail.com</strong> with your Razorpay payment ID.</p>
              </div>
            </div>

            {/* 9 */}
            <div className="policy-section" id="pay-9">
              <div className="policy-section-header">
                <div className="policy-section-num">9</div>
                <h2>Chargebacks & Disputes</h2>
              </div>
              <p>
                A chargeback occurs when a customer disputes a transaction directly with their bank or card issuer, asking the bank to reverse the charge. While chargebacks exist to protect consumers, misuse of this mechanism on legitimate transactions is considered fraud.
              </p>
              <ul className="policy-ul">
                <li>If you have an issue with an order, we strongly request that you <strong>contact us first</strong> at <strong>Kamalireturngifts@gmail.com</strong> before raising a chargeback; most issues are resolved within 24–48 hours</li>
                <li>For unresolved disputes, Kamali Gifts will respond to all Razorpay-mediated chargeback requests with order evidence including dispatch records, tracking details, and customer communication logs</li>
                <li>Chargeback claims filed for orders that have been validly fulfilled and delivered will be disputed and may result in account suspension on Kamali Gifts</li>
                <li>Razorpay's dispute resolution process and timelines govern the outcome of chargeback proceedings; Kamali Gifts is bound by their decisions</li>
                <li>Customers found to have filed fraudulent chargebacks will be permanently banned from Kamali Gifts and may be reported to Razorpay's risk teams</li>
              </ul>
            </div>

            {/* 10 */}
            <div className="policy-section" id="pay-10">
              <div className="policy-section-header">
                <div className="policy-section-num">10</div>
                <h2>Fraud Prevention</h2>
              </div>
              <p>Kamali Gifts takes payment fraud seriously. The following practices protect both our customers and our platform:</p>
              <ul className="policy-ul">
                <li>Razorpay's real-time fraud detection engine screens every transaction before authorization using ML-based risk scoring</li>
                <li>Orders flagged as high-risk by Razorpay may require additional verification before processing; our support team will contact you if this occurs</li>
                <li>Orders with mismatched billing and shipping addresses for high-value items may be held for manual verification</li>
                <li>Multiple failed payment attempts from the same device or IP within a short period triggers a temporary block for security</li>
                <li>Kamali Gifts reserves the right to cancel any order suspected of fraudulent intent, with a full refund issued via Razorpay</li>
                <li>Verified fraud attempts will be reported to Razorpay, the relevant bank, and Indian cybercrime authorities under applicable law</li>
              </ul>
              <div className="policy-warning">
                <strong>Phishing Warning:</strong> Kamali Gifts or Razorpay will <strong>never</strong> send you links to re-enter payment details or request your OTP via SMS, WhatsApp, or email. Do not share OTPs with anyone claiming to be from our support team.
              </div>
            </div>

            {/* 11 */}
            <div className="policy-section" id="pay-11">
              <div className="policy-section-header">
                <div className="policy-section-num">11</div>
                <h2>Contact for Payment Issues</h2>
              </div>
              <p>For payment-related queries, always include your <strong>Order ID</strong> and <strong>Razorpay Payment ID</strong> (found in your confirmation email). This allows us to locate your transaction instantly in Razorpay's dashboard.</p>
              <div className="policy-contact-box">
                <div>
                  <h3>Payment Support</h3>
                  <p>Mon–Sat, 9 AM – 6 PM IST. We coordinate directly with Razorpay on your behalf.</p>
                </div>
                <div className="policy-contact-items">
                  <div className="policy-contact-item"><span>Email</span> Kamalireturngifts@gmail.com</div>
                  <div className="policy-contact-item"><span>WhatsApp</span> +91 73388 14319</div>
                  <div className="policy-contact-item"><span>Response</span> Within 24 business hours</div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default PaymentPolicy;