import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useSelector } from "react-redux";
import { useState, useRef } from "react";


const IMG_BASE = process.env.REACT_APP_IMG_URL + "/uploads/";

const imgSrc = (path) =>
  path ? `${IMG_BASE}${path.replace(/^\/?(uploads\/)?/, "")}` : null;

/* ── Single image card used in the mega panel ── */
const CatalogueCard = ({ to, image, label, emoji }) => (
  <Link to={to} className="catalogue-card">
    <span className="catalogue-card__img-wrap">
      {image ? (
        <img
          src={imgSrc(image)}
          alt={label}
          className="catalogue-card__img"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      ) : null}
      <span
        className="catalogue-card__fallback"
        style={{ display: image ? "none" : "flex" }}
      >
        {emoji}
      </span>
    </span>
    <span className="catalogue-card__label">{label}</span>
  </Link>
);

/* ── Mega panel section with title + grid of cards ── */
const MegaSection = ({ title, accent, items, renderItem }) =>
  items.length === 0 ? null : (
    <div className="mega-section">
      <p className="mega-section__title" style={{ "--accent": accent }}>
        {title}
      </p>
      <div className="mega-section__grid">{items.map(renderItem)}</div>
    </div>
  );

const NavMenu = ({ menuWhiteClass, sidebarMenu }) => {
  const { categories = [], events = [], rootCombos = [] } = useSelector(
    (state) => state.navMenu || {}
  );

  const S = process.env.PUBLIC_URL + "/shop";
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const closeTimer = useRef(null);

  const openPanel = () => {
    clearTimeout(closeTimer.current);
    setCatalogueOpen(true);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setCatalogueOpen(false), 160);
  };

  const arrow = sidebarMenu ? (
    <span>
      <i className="fa fa-angle-right" />
    </span>
  ) : (
    <i className="fa fa-angle-down" />
  );

  return (
    <div
      className={clsx(
        sidebarMenu ? "sidebar-menu" : `main-menu ${menuWhiteClass || ""}`,
        "kg-nav"
      )}
    >
      <nav>
        <ul>
          <li>
            <Link to={process.env.PUBLIC_URL + "/"}>Home</Link>
          </li>
          <li>
            <Link to={process.env.PUBLIC_URL + "/about"}>About</Link>
          </li>

          {/* ── Catalogue with custom mega panel ── */}
          <li
            className={clsx("kg-catalogue-item", catalogueOpen && "kg-catalogue-item--open")}
            onMouseEnter={openPanel}
            onMouseLeave={scheduleClose}
          >
            <Link to={process.env.PUBLIC_URL + "/catalogue"} className="kg-catalogue-trigger">
              Catalogue
              <span className="kg-chevron">
                <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
                  <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </Link>

            {/* ─────────── MEGA PANEL ─────────── */}
            <div
              className="kg-mega-panel"
              onMouseEnter={openPanel}
              onMouseLeave={scheduleClose}
            >
              <div className="kg-mega-inner">

                <MegaSection
                  title="Categories"
                  accent="#db1a5d"
                  items={categories}
                  renderItem={(cat) => (
                    <CatalogueCard
                      key={cat.value ?? cat.id}
                      to={cat.value ? `${S}?category=${cat.value}` : S}
                      image={cat.image}
                      label={cat.label}
                      emoji="🗂️"
                    />
                  )}
                />

                <MegaSection
                  title="Events"
                  accent="#f59e0b"
                  items={events}
                  renderItem={(evt) => (
                    <CatalogueCard
                      key={evt.value}
                      to={`${S}?event=${evt.value}`}
                      image={evt.image}
                      label={evt.label}
                      emoji="🎉"
                    />
                  )}
                />

                <MegaSection
                  title="Combos"
                  accent="#10b981"
                  items={rootCombos}
                  renderItem={(combo) => (
                    <CatalogueCard
                      key={combo.id}
                      to={`${S}?combo=${combo.id}`}
                      image={combo.image}
                      label={combo.name}
                      emoji="🎁"
                    />
                  )}
                />

                {/* CTA strip */}
                <div className="kg-mega-cta">
                  <Link to={process.env.PUBLIC_URL + "/catalogue"} className="kg-mega-cta__btn">
                    View full catalogue →
                  </Link>
                </div>
              </div>
            </div>
          </li>

          <li>
            <Link to={process.env.PUBLIC_URL + "/contact"}>Contact Us</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

NavMenu.propTypes = { menuWhiteClass: PropTypes.string, sidebarMenu: PropTypes.bool };
export default NavMenu;