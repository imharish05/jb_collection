import React from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useSelector } from "react-redux";

const S = process.env.PUBLIC_URL + "/shop";

const FooterOne = ({ containerClass, extraFooterClass }) => {
  const { settings } = useSelector(state => state.settings);
  const IMG_BASE_URL = process.env.REACT_APP_IMG_URL || 'http://localhost:5000';
  
  const resolvedLogo = settings?.logoUrl 
    ? `${IMG_BASE_URL}/${settings.logoUrl}` 
    : process.env.PUBLIC_URL + "/assets/img/logo.png";

  return (
    <footer className={clsx("footer-area", extraFooterClass)}>
      <style>{`
        /* ── Kamali Footer ── */
        .km-footer {
          // background: #fff;
          padding: 72px 0 0;
          // border-top: 1px solid #eee;
        }

        /* ── Main grid ── */
        .km-footer-inner {
          display: grid;
          grid-template-columns: 2.2fr 1fr 1fr 1.6fr;
          gap: 40px;
          align-items: start;
        }

        /* ── Brand column ── */
        .km-brand-logo {
          height: 58px;
          width: auto;
          object-fit: contain;
          display: block;
          margin-bottom: 4px;
        }
        .km-brand-tagline {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: #c8826a;
          display: block;
          margin-bottom: 16px;
        }
        .km-brand-desc {
          font-size: 13.5px;
          color: #777;
          line-height: 1.75;
          max-width: 240px;
          margin: 0 0 24px;
        }

        /* Social icons */
        .km-social {
          display: flex;
          gap: 8px;
        }
        .km-social a {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 9px;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .km-social a:hover { transform: translateY(-2px); opacity: 0.85; }
        .km-social svg { width: 100%; height: 100%; fill: #fff; display: block; }
        .km-social a.km-ig  { background: #E1306C; }
        .km-social a.km-fb  { background: #1877F2; }
        .km-social a.km-yt  { background: #FF0000; }
        .km-social a.km-wa  { background: #25D366; }

        /* ── Column headings ── */
        .km-col-title {
          font-size: 17px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #111;
          margin: 0 0 20px;
        }

        /* ── Link lists ── */
        .km-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .km-links li { margin-bottom: 10px; }
        .km-links a {
          font-size: 13px;
          color: #666;
          text-decoration: none;
          transition: color 0.2s ease, padding-left 0.2s ease;
        }
        .km-links a:hover { color: #c8826a; padding-left: 4px; }

        /* ── Contact / Find Us column ── */
        .km-contact-item {
          display: flex;
          gap: 11px;
          margin-bottom: 14px;
          align-items: flex-start;
        }
        .km-contact-icon {
          flex-shrink: 0;
          margin-top: 1px;
          color: #c8826a;
        }
        .km-contact-icon svg {
          width: 14px;
          height: 14px;
          stroke: #c8826a;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          display: block;
        }
        .km-contact-text {
          font-size: 13px;
          color: #666;
          line-height: 1.6;
        }
        .km-contact-text a {
          color: #666;
          text-decoration: none;
          transition: color 0.2s;
        }
        .km-contact-text a:hover { color: #c8826a; }

        /* ── Bottom bar ── */
        .km-bottom-bar {
          margin-top: 56px;
          padding: 20px 0;
          border-top: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .km-copyright {
          font-size: 12.5px;
          // color: #aaa;
        }
        .km-payment-logos {
          display: flex;
          gap: 14px;
          align-items: center;
          opacity: 0.4;
        }

        /* ── Tablet (768px – 991px) ── */
        @media (max-width: 991px) {
          .km-footer { padding: 56px 0 0; }
          .km-footer-inner {
            grid-template-columns: 1fr 1fr;
            gap: 36px 28px;
          }
          .km-brand-col { grid-column: span 2; }
          .km-brand-desc { max-width: 100%; }
        }

        /* ── Mobile (≤ 767px) ── */
        @media (max-width: 767px) {
          .km-footer { padding: 44px 0 0; }
          .km-footer-inner {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .km-brand-col { grid-column: auto; text-align: center; }
          .km-brand-logo { margin: 0 auto 4px; }
          .km-brand-desc { max-width: 100%; font-size: 13px; }
          .km-social { justify-content: center; }
          .km-contact-col { grid-column: auto; }
          .km-bottom-bar {
            flex-direction: column;
            align-items: center;
            text-align: center;
            margin-top: 40px;
          }
        }
      `}</style>

      <div className="km-footer">
        <div className={containerClass || "container"}>
          <div className="km-footer-inner">

            {/* ── Brand ── */}
            <div className="km-brand-col">
              <Link to={process.env.PUBLIC_URL + "/"}>
                <img
                  src={resolvedLogo}
                  alt="Kamali Gifts & Crafts"
                  className="km-brand-logo"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </Link>
              <span className="km-brand-tagline">Gifts & Crafts</span>
              <p className="km-brand-desc">
                Curating handcrafted joy and timeless traditions.
                Made with love in Tamil Nadu.
              </p>
              <div className="km-social">
                <a
                  href="https://www.instagram.com/kamaligiftsfactory?utm_source=qr&igsh=MThqdmp6ODBlazdkdw=="
                  className="km-ig"
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 448 512"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
                </a>
                <a
                  href="https://www.facebook.com/share/1F6BNcFs9L/"
                  className="km-fb"
                  aria-label="Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 320 512"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg>
                </a>
                {/* <a href="#" className="km-yt" aria-label="YouTube">
                  <svg viewBox="0 0 576 512"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.781 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg>
                </a> */}
                <a
                  href="https://wa.me/7338814319"
                  className="km-wa"
                  aria-label="WhatsApp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.1 0-65.6-8.9-94-25.7l-6.7-4-69.8 18.3 18.7-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.2-3.2-5.6-.3-8.6 2.4-11.3 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.5 5.5-9.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                </a>
              </div>
            </div>

            {/* ── Shop ── */}
            <div>
              <p className="km-col-title">Quick Links</p>
              <ul className="km-links">
                 <li><Link to="/my-account">My Account</Link></li>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/shop">Shop</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>

            {/* ── Quick Links (Policies + Support merged) ── */}
                      <div>
              <p className="km-col-title">Quick Links</p>
              <ul className="km-links">
               
               
                <li><Link to="/shipping-policy">Shipping Policy</Link></li>
                <li><Link to="/exchange-policy">Refund & Return Policy</Link></li>
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                {/* <li><Link to="/payment-policy">Payment Policy</Link></li> */}
                <li><Link to="/terms-conditions">Terms & Conditions</Link></li>
              </ul>
            </div>

            {/* ── Find Us ── */}
            <div className="km-contact-col">
              <p className="km-col-title">Find Us</p>

              {/* <div className="km-contact-item">
                <span className="km-contact-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </span>
                <span className="km-contact-text">
                  12, Anna Nagar,<br />
                  Madurai – 625 020,<br />
                  Tamil Nadu, India
                </span>
              </div> */}

              <div className="km-contact-item">
                <span className="km-contact-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l1.62-1.62a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </span>
                <span className="km-contact-text">
                  <a href="tel:+917338814319">+91 73388 14319</a>
                </span>
              </div>

              <div className="km-contact-item">
                <span className="km-contact-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <span className="km-contact-text">
                  <a href="mailto:Kamalireturngifts@gmail.com">Kamalireturngifts@gmail.com</a>
                </span>
              </div>

              {/* <div className="km-contact-item">
                <span className="km-contact-icon">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </span>
                <span className="km-contact-text">Mon – Sat: 9 AM – 7 PM</span>
              </div> */}
            </div>

          </div>

          {/* ── Bottom bar ── */}
          <div className="km-bottom-bar">
            <span className="km-copyright">
              © {new Date().getFullYear()} Kamali Gifts & Crafts. All rights reserved.
            </span>
            <span className="km-copyright">
  Developed by{" "}
  <a
    href="https://saitechnosolutions.com/"
    target="_blank"
    rel="noopener noreferrer"
  >
    Sai Techno Solutions
  </a>
</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterOne;