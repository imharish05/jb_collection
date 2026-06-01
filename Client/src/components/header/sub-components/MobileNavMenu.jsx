import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logoutAction } from "../../../store/slices/authSlice";
import cogoToast from "cogo-toast";

const S = process.env.PUBLIC_URL + "/shop";
const IMG_BASE = process.env.REACT_APP_IMG_URL + "/uploads/";
const imgSrc = (p) => p ? `${IMG_BASE}${p.replace(/^\/?(uploads\/)?/, "")}` : null;

/* ── Horizontal scrollable row of image pills ── */
const ImageRow = ({ items, toFn, labelKey, imageKey, emoji }) => (
  <div className="mob-img-row">
    {items.map((item) => {
      const key   = item.value ?? item.id;
      const label = item[labelKey] ?? item.label ?? item.name;
      const img   = item[imageKey] ?? item.image;
      return (
        <Link key={key} to={toFn(item)} className="mob-img-card">
          <span className="mob-img-card__circle">
            {img
              ? <img src={imgSrc(img)} alt={label} className="mob-img-card__img" onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
              : null}
            <span className="mob-img-card__fallback" style={{ display: img ? "none" : "flex" }}>{emoji}</span>
          </span>
          <span className="mob-img-card__label">{label}</span>
        </Link>
      );
    })}
  </div>
);

/* ── Collapsible catalogue section ── */
const Section = ({ title, accent, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="mob-section">
      <button
        className="mob-section__toggle"
        style={{ "--accent": accent }}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="mob-section__title">{title}</span>
        <svg
          className={`mob-section__chevron${open ? " mob-section__chevron--open" : ""}`}
          width="12" height="7" viewBox="0 0 12 7" fill="none"
        >
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div className="mob-section__body">{children}</div>}
    </div>
  );
};

const MobileNavMenu = () => {
  const { categories = [], events = [], rootCombos = [] } = useSelector((s) => s.navMenu || {});
  const { isAuthenticated } = useSelector((s) => s.auth);
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [catalogueOpen, setCatalogueOpen] = useState(false);

  const closeMenu = () => {
    document.querySelector("#offcanvas-mobile-menu")?.classList.remove("active");
  };

  const handleLogout = () => {
    dispatch(logoutAction());
    cogoToast.success("Logged out successfully", { position: "top-center" });
    closeMenu();
    navigate(process.env.PUBLIC_URL + "/");
  };

  return (
    <nav className="mob-nav" id="offcanvas-navigation">
      <ul className="mob-nav__list">

        {/* Home */}
        <li className="mob-nav__item">
          <Link to={process.env.PUBLIC_URL + "/"} className="mob-nav__link" onClick={closeMenu}>
            Home
          </Link>
        </li>

        {/* About */}
        <li className="mob-nav__item">
          <Link to={process.env.PUBLIC_URL + "/about"} className="mob-nav__link" onClick={closeMenu}>
            About
          </Link>
        </li>

        {/* Catalogue accordion */}
        <li className={`mob-nav__item mob-nav__item--parent${catalogueOpen ? " mob-nav__item--open" : ""}`}>
          <div className="mob-nav__row">
            <Link to={process.env.PUBLIC_URL + "/catalogue"} className="mob-nav__link" onClick={closeMenu}>
              Catalogue
            </Link>
            <button
              className="mob-nav__expand"
              onClick={() => setCatalogueOpen(o => !o)}
              aria-expanded={catalogueOpen}
              aria-label="Toggle catalogue"
            >
              <svg
                className={`mob-nav__arrow${catalogueOpen ? " mob-nav__arrow--open" : ""}`}
                width="12" height="7" viewBox="0 0 12 7" fill="none"
              >
                <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {catalogueOpen && (
            <div className="mob-catalogue-panel">

              {categories.length > 0 && (
                <Section title="Categories" accent="#db1a5d">
                  <ImageRow
                    items={categories}
                    toFn={(c) => c.value ? `${S}?category=${c.value}` : S}
                    labelKey="label"
                    imageKey="image"
                    emoji="🗂️"
                  />
                </Section>
              )}

              {events.length > 0 && (
                <Section title="Events" accent="#f59e0b">
                  <ImageRow
                    items={events}
                    toFn={(e) => `${S}?event=${e.value}`}
                    labelKey="label"
                    imageKey="image"
                    emoji="🎉"
                  />
                </Section>
              )}

              {rootCombos.length > 0 && (
                <Section title="Combos" accent="#10b981">
                  <ImageRow
                    items={rootCombos}
                    toFn={(c) => `${S}?combo=${c.id}`}
                    labelKey="name"
                    imageKey="image"
                    emoji="🎁"
                  />
                </Section>
              )}

              <Link
                to={process.env.PUBLIC_URL + "/catalogue"}
                className="mob-catalogue-cta"
                onClick={closeMenu}
              >
                View full catalogue →
              </Link>
            </div>
          )}
        </li>

        {/* My Account */}
        {isAuthenticated ? (
          <li className="mob-nav__item">
            <Link to={process.env.PUBLIC_URL + "/my-account"} className="mob-nav__link" onClick={closeMenu}>
              My Account
            </Link>
            <div className="mob-account-links">
              <Link to={process.env.PUBLIC_URL + "/my-account?tab=orders"} className="mob-account-link" onClick={closeMenu}>My Orders</Link>
              <button className="mob-account-link mob-account-link--logout" onClick={handleLogout}>Logout</button>
            </div>
          </li>
        ) : (
          <li className="mob-nav__item">
            <Link to={process.env.PUBLIC_URL + "/login"} className="mob-nav__link" onClick={closeMenu}>
              My Account
            </Link>
            <div className="mob-account-links">
              <Link to={process.env.PUBLIC_URL + "/login"} className="mob-account-link" onClick={closeMenu}>Login</Link>
              <Link to={process.env.PUBLIC_URL + "/register"} className="mob-account-link" onClick={closeMenu}>Register</Link>
            </div>
          </li>
        )}

        {/* Contact */}
        <li className="mob-nav__item">
          <Link to={process.env.PUBLIC_URL + "/contact"} className="mob-nav__link" onClick={closeMenu}>
            Contact Us
          </Link>
        </li>

      </ul>
    </nav>
  );
};

export default MobileNavMenu;