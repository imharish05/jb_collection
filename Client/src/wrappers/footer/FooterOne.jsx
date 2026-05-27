import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import clsx from "clsx";

const S = process.env.PUBLIC_URL + "/shop";

const FooterOne = ({ containerClass, extraFooterClass }) => {
  const { categories = [], events = [] } = useSelector((state) => state.navMenu || {});

  return (
    <footer className={clsx("footer-area", extraFooterClass)}>
      <style>{`
        .km-footer {
          background: #ffffff;
          padding: 70px 0 40px;
          font-family: 'Poppins', sans-serif;
          border-top: 1px solid #eeeeee;
        }

        /* ── Desktop: 6 cols ── */
        .km-footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.8fr;
          gap: 24px;
          align-items: start;
        }

        /* Brand */
        .km-brand-logo { height: 60px; width: auto; object-fit: contain; display: block; margin-bottom: 6px; }
        .km-brand-sub  { font-size: 13px; text-transform: uppercase; letter-spacing: 3px; color: #c8826a; margin-bottom: 12px; display: block; }
        .km-brand p    { font-size: 13px; color: #777; line-height: 1.7; max-width: 240px; margin-top: 12px; }

        /* Social icons */
        .km-social { display: flex; gap: 9px; margin-top: 18px; }
        .km-social a {
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px; transition: 0.25s; padding: 8px;
        }
        .km-social svg { width: 100%; height: 100%; fill: #fff; }
        .km-social a.instagram { background: #E1306C; }
        .km-social a.facebook  { background: #1877F2; }
        .km-social a.youtube   { background: #FF0000; }
        .km-social a.whatsapp  { background: #25D366; }
        .km-social a:hover { transform: translateY(-3px); opacity: 0.85; }

        /* Column headings + lists */
        .km-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.8px; margin-bottom: 18px; color: #111; }
        .km-list  { list-style: none; padding: 0; margin: 0; }
        .km-list li { margin-bottom: 9px; }
        .km-list a  { font-size: 13px; color: #666; text-decoration: none; transition: 0.2s; }
        .km-list a:hover { color: #000; padding-left: 3px; }

        /* Address */
        .km-address-item { display: flex; gap: 9px; margin-bottom: 11px; align-items: flex-start; }
        .km-address-item span { font-size: 13px; color: #666; line-height: 1.55; }

        /* Bottom bar */
        .km-bottom {
          margin-top: 50px; padding-top: 22px;
          border-top: 1px solid #eee;
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 12px;
          font-size: 12px; color: #aaa;
        }
        .km-bottom-logos { display: flex; gap: 15px; align-items: center; opacity: 0.45; }

        /* ── Divider stripe between brand and links on tablet ── */
        .km-brand-divider { display: none; }

        /* ──────────────────────────────────────────────
           TABLET  ≤ 1024px  →  2-col brand + 4-col links
           ────────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .km-footer { padding: 56px 0 36px; }

          .km-footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 0;
          }

          /* Brand + Address span full width as a horizontal strip */
          .km-brand-block {
            grid-column: 1 / -1;
            display: flex;
            align-items: flex-start;
            gap: 40px;
            padding-bottom: 32px;
            margin-bottom: 32px;
            border-bottom: 1px solid #eee;
          }
          .km-brand-inner { flex: 1; }
          .km-address-inline { flex: 0 0 220px; }
          .km-address-inline .km-title { margin-bottom: 14px; }

          /* Link columns: 4 equal cols */
          .km-links-block {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }

          /* Hide the standalone address column (now in brand strip) */
          .km-address-col { display: none; }
          .km-brand-col   { display: none; }

          .km-brand p { max-width: 100%; }
        }

        /* ──────────────────────────────────────────────
           MOBILE  ≤ 600px  →  single column, cards
           ────────────────────────────────────────────── */
        @media (max-width: 600px) {
          .km-footer { padding: 44px 0 28px; }

          .km-footer-grid { grid-template-columns: 1fr; gap: 0; }

          .km-brand-block {
            flex-direction: column;
            gap: 24px;
            align-items: center;
            text-align: center;
            padding-bottom: 28px;
            margin-bottom: 28px;
          }

          .km-brand-inner { display: flex; flex-direction: column; align-items: center; }
          .km-brand p { max-width: 280px; }
          .km-social { justify-content: center; }

          .km-address-inline { flex: unset; width: 100%; }
          .km-address-inline .km-title { text-align: center; }
          .km-address-item { justify-content: flex-start; max-width: 220px; margin: 0 auto 11px; }

          .km-links-block {
            grid-template-columns: 1fr 1fr;
            gap: 28px 20px;
          }

          .km-bottom {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 14px;
          }
        }
      `}</style>

      <div className="km-footer">
        <div className={containerClass || "container"}>
          <div className="km-footer-grid">

            {/* ── Desktop: Brand col ── hidden on tablet/mobile (replaced by km-brand-block) */}
            <div className="km-brand-col d-none d-lg-block">
              <Link to={process.env.PUBLIC_URL + "/"}>
                <img
                  src={process.env.PUBLIC_URL + "/assets/img/logo.png"}
                  alt="Kamali Gifts & Crafts"
                  className="km-brand-logo"
                  onError={e => { e.target.style.display = "none"; }}
                />
              </Link>
              <span className="km-brand-sub">Gifts & Crafts</span>
              <p>Curating handcrafted joy and timeless traditions. Made with love in Tamil Nadu.</p>
              <div className="km-social">
                <a href="#" className="instagram">
                  <svg viewBox="0 0 448 512"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
                </a>
                <a href="#" className="facebook"><svg viewBox="0 0 320 512"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg></a>
                <a href="#" className="youtube"><svg viewBox="0 0 576 512"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.781 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg></a>
                <a href="https://wa.me/7338814319" className="whatsapp"><svg viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.1 0-65.6-8.9-94-25.7l-6.7-4-69.8 18.3 18.7-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.2-3.2-5.6-.3-8.6 2.4-11.3 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.5 5.5-9.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg></a>
              </div>
            </div>

            {/* ── Shop ── */}
            <div>
              <p className="km-title">Shop</p>
              <ul className="km-list">
                <li><Link to={S}>All Products</Link></li>
                {categories.length > 0
                  ? categories.map((cat) => (
                      <li key={cat.value ?? cat.id}>
                        <Link to={cat.value ? `${S}?category=${cat.value}` : S}>{cat.label}</Link>
                      </li>
                    ))
                  : <>
                      <li><Link to={`${S}?category=gifts`}>Gifts</Link></li>
                      <li><Link to={`${S}?category=divine`}>Divine</Link></li>
                      <li><Link to={`${S}?category=jewellery`}>Jewellery</Link></li>
                      <li><Link to={`${S}?category=crochet`}>Crochet</Link></li>
                      <li><Link to={`${S}?category=bracelets`}>Bracelets</Link></li>
                    </>
                }
              </ul>
            </div>

            {/* ── Events ── */}
            <div>
              <p className="km-title">Events</p>
              <ul className="km-list">
                {events.length > 0
                  ? events.map((evt) => (
                      <li key={evt.value}>
                        <Link to={`${S}?event=${evt.value}`}>{evt.label}</Link>
                      </li>
                    ))
                  : <>
                      <li><Link to={`${S}?event=birthday`}>Birthday</Link></li>
                      <li><Link to={`${S}?event=wedding`}>Wedding</Link></li>
                      <li><Link to={`${S}?event=engagement`}>Engagement</Link></li>
                      <li><Link to={`${S}?event=baby-shower`}>Baby Shower</Link></li>
                      <li><Link to={`${S}?event=house-warming`}>House Warming</Link></li>
                      <li><Link to={`${S}?event=upanayanam`}>Upanayanam</Link></li>
                    </>
                }
              </ul>
            </div>

            {/* ── Policies ── */}
            <div>
              <p className="km-title">Policies</p>
              <ul className="km-list">
                <li><Link to="#">Shipping Policy</Link></li>
                <li><Link to="#">Refund Policy</Link></li>
                <li><Link to="#">Terms of Service</Link></li>
                <li><Link to="#">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* ── Support ── */}
            <div>
              <p className="km-title">Support</p>
              <ul className="km-list">
                <li><Link to="/contact">Contact Us</Link></li>
                <li><Link to="/faq">FAQs</Link></li>
                <li><Link to="/my-account">My Account</Link></li>
              </ul>
            </div>

            {/* ── Address (desktop) ── */}
            <div className="km-address-col">
              <p className="km-title">Find Us</p>
              <AddressItems />
            </div>

          </div>

          {/* ── Tablet / Mobile combined brand + address strip ── */}
          <div className="km-brand-block d-lg-none">
            <div className="km-brand-inner">
              <Link to={process.env.PUBLIC_URL + "/"}>
                <img
                  src={process.env.PUBLIC_URL + "/assets/img/logo.png"}
                  alt="Kamali Gifts & Crafts"
                  className="km-brand-logo"
                  onError={e => { e.target.style.display = "none"; }}
                />
              </Link>
              <span className="km-brand-sub">Gifts & Crafts</span>
              <p>Curating handcrafted joy and timeless traditions. Made with love in Tamil Nadu.</p>
              <div className="km-social">
                <a href="#" className="instagram">
                  <svg viewBox="0 0 448 512"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
                </a>
                <a href="#" className="facebook"><svg viewBox="0 0 320 512"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg></a>
                <a href="#" className="youtube"><svg viewBox="0 0 576 512"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.781 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg></a>
                <a href="https://wa.me/7338814319" className="whatsapp"><svg viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.1 0-65.6-8.9-94-25.7l-6.7-4-69.8 18.3 18.7-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.2-3.2-5.6-.3-8.6 2.4-11.3 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.5 5.5-9.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg></a>
              </div>
            </div>
            <div className="km-address-inline">
              <p className="km-title">Find Us</p>
              <AddressItems />
            </div>
          </div>

          {/* ── Tablet / Mobile link grid ── */}
          <div className="km-links-block d-lg-none">
            <div>
              <p className="km-title">Shop</p>
              <ul className="km-list">
                <li><Link to={S}>All Products</Link></li>
                {categories.length > 0
                  ? categories.map((cat) => (
                      <li key={cat.value ?? cat.id}>
                        <Link to={cat.value ? `${S}?category=${cat.value}` : S}>{cat.label}</Link>
                      </li>
                    ))
                  : <>
                      <li><Link to={`${S}?category=gifts`}>Gifts</Link></li>
                      <li><Link to={`${S}?category=divine`}>Divine</Link></li>
                      <li><Link to={`${S}?category=jewellery`}>Jewellery</Link></li>
                      <li><Link to={`${S}?category=crochet`}>Crochet</Link></li>
                      <li><Link to={`${S}?category=bracelets`}>Bracelets</Link></li>
                    </>
                }
              </ul>
            </div>
            <div>
              <p className="km-title">Events</p>
              <ul className="km-list">
                {events.length > 0
                  ? events.map((evt) => (
                      <li key={evt.value}>
                        <Link to={`${S}?event=${evt.value}`}>{evt.label}</Link>
                      </li>
                    ))
                  : <>
                      <li><Link to={`${S}?event=birthday`}>Birthday</Link></li>
                      <li><Link to={`${S}?event=wedding`}>Wedding</Link></li>
                      <li><Link to={`${S}?event=engagement`}>Engagement</Link></li>
                      <li><Link to={`${S}?event=baby-shower`}>Baby Shower</Link></li>
                      <li><Link to={`${S}?event=house-warming`}>House Warming</Link></li>
                      <li><Link to={`${S}?event=upanayanam`}>Upanayanam</Link></li>
                    </>
                }
              </ul>
            </div>
            <div>
              <p className="km-title">Policies</p>
              <ul className="km-list">
                <li><Link to="#">Shipping Policy</Link></li>
                <li><Link to="#">Refund Policy</Link></li>
                <li><Link to="#">Terms of Service</Link></li>
                <li><Link to="#">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <p className="km-title">Support</p>
              <ul className="km-list">
                <li><Link to="/contact">Contact Us</Link></li>
                <li><Link to="/faq">FAQs</Link></li>
                <li><Link to="/my-account">My Account</Link></li>
              </ul>
            </div>
          </div>

          {/* ── Bottom bar ── */}
          <div className="km-bottom">
            <span>© {new Date().getFullYear()} Kamali Gifts & Crafts. All rights reserved.</span>
            <div className="km-bottom-logos">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" height="8" alt="Visa" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" height="12" alt="Mastercard" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png" height="10" alt="Paypal" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* Shared address content — rendered in both desktop col and tablet/mobile strip */
const Icon = ({ path, extraPath }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8826a"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, marginTop: 2 }}>
    {path}
    {extraPath}
  </svg>
);

const AddressItems = () => (
  <>
    <div className="km-address-item">
      <Icon
        path={<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>}
        extraPath={<circle cx="12" cy="10" r="3"/>}
      />
      <span>12, Anna Nagar,<br />Madurai – 625 020,<br />Tamil Nadu, India</span>
    </div>
    <div className="km-address-item">
      <Icon path={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l1.62-1.62a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>} />
      <span>+91 73388 14319</span>
    </div>
    <div className="km-address-item">
      <Icon
        path={<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>}
        extraPath={<polyline points="22,6 12,13 2,6"/>}
      />
      <span>hello@kamaligifts.in</span>
    </div>
    <div className="km-address-item">
      <Icon
        path={<circle cx="12" cy="12" r="10"/>}
        extraPath={<polyline points="12 6 12 12 16 14"/>}
      />
      <span>Mon – Sat: 9 AM – 7 PM</span>
    </div>
  </>
);

export default FooterOne;