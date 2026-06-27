import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { logoutAction } from "../../../store/slices/authSlice";
import cogoToast from "cogo-toast";

const S = process.env.PUBLIC_URL + "/shop";
const IMG_BASE = process.env.REACT_APP_IMG_URL + "/uploads/";
const imgSrc = (p) => p ? `${IMG_BASE}${p.replace(/^\/?(uploads\/)?/, "")}` : null;

/* ── 40×40 thumbnail ── */
const Thumb = ({ img, alt }) => (
  <span className="mob-thumb">
    {img
      ? <img src={imgSrc(img)} alt={alt} className="mob-thumb__img"
          onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
      : null}
    <span className="mob-thumb__fallback" style={{ display: img ? "none" : "flex" }}>🖼</span>
  </span>
);

/* ── Category row (image + label + optional subcategory expand) ── */
const CategoryRow = ({ item, closeMenu }) => {
  const [open, setOpen] = useState(false);
  const subs = item.subcategories ?? [];
  const hasS = subs.length > 0;

  return (
    <>
      <div className="mob-list-row">
        <Thumb img={item.image} alt={item.label} />
        <Link
          to={`${S}?category=${item.value}`}
          className="mob-list-row__label"
          onClick={hasS ? e => { e.preventDefault(); setOpen(o => !o); } : closeMenu}
        >
          {item.label}
        </Link>
        {hasS && (
          <button
            className="mob-list-row__chevron"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-label={`Toggle ${item.label} subcategories`}
          >
            <svg className={`mob-chevron-svg${open ? " mob-chevron-svg--open" : ""}`}
              width="11" height="7" viewBox="0 0 12 7" fill="none">
              <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {open && hasS && (
        <div className="mob-subcat-list">
          <Link
            to={`${S}?category=${item.value}`}
            className="mob-subcat-list__item mob-subcat-list__item--all"
            onClick={closeMenu}
          >
            All {item.label}
          </Link>
          {subs.map(sub => (
            <Link
              key={sub.id}
              to={`${S}?category=${item.value}&subcategory=${sub.value}`}
              className="mob-subcat-list__item"
              onClick={closeMenu}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

/* ── Generic image row (events / combos) ── */
const SimpleRow = ({ item, to, label, img, closeMenu }) => (
  <div className="mob-list-row">
    <Thumb img={img} alt={label} />
    <Link to={to} className="mob-list-row__label" onClick={closeMenu}>
      {label}
    </Link>
  </div>
);

/* ── Section label ── */
const SectionLabel = ({ title, accent }) => (
  <div className="mob-section-label" style={{ "--accent": accent }}>{title}</div>
);

const MobileNavMenu = () => {
  const { categories = [], events = [], rootCombos = [] } = useSelector((s) => s.navMenu || {});
  const { isAuthenticated } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  // Helper function to check if a path is active
  const isActive = (path) => {
    const basePath = process.env.PUBLIC_URL || "";
    const currentPath = location.pathname.replace(basePath, "") || "/";
    const targetPath = path.replace(basePath, "") || "/";
    return currentPath === targetPath || currentPath === targetPath + "/";
  };

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
          <Link to={process.env.PUBLIC_URL + "/"} className={`mob-nav__link${isActive(process.env.PUBLIC_URL + "/") ? " active" : ""}`} onClick={closeMenu}>
            Home
          </Link>
        </li>

        {/* About */}
        <li className="mob-nav__item">
          <Link to={process.env.PUBLIC_URL + "/about"} className={`mob-nav__link${isActive(process.env.PUBLIC_URL + "/about") ? " active" : ""}`} onClick={closeMenu}>
            About
          </Link>
        </li>

        {/* Collections */}
        <li className={`mob-nav__item mob-nav__item--parent${catalogueOpen ? " mob-nav__item--open" : ""}`}>
          <div className="mob-nav__row">
            <Link to={S} className={`mob-nav__link${isActive(S) ? " active" : ""}`} onClick={closeMenu}>
              Collections
            </Link>
            <button
              className="mob-nav__expand"
              onClick={() => setCatalogueOpen(o => !o)}
              aria-expanded={catalogueOpen}
              aria-label="Toggle collections"
            >
              <svg className={`mob-nav__arrow${catalogueOpen ? " mob-nav__arrow--open" : ""}`}
                width="12" height="7" viewBox="0 0 12 7" fill="none">
                <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {catalogueOpen && (
            <div className="mob-catalogue-panel">

                          <SectionLabel title="Products" accent="#b60410" />
              <div className="mob-list-row mob-list-row--all-products">
                <span className="mob-thumb mob-thumb--all">
                  <span className="mob-thumb__fallback" style={{ display: "flex" }}>✨</span>
                </span>
                <Link to={S} className="mob-list-row__label mob-list-row__label--bold" onClick={closeMenu}>
                  All Products
                </Link>
              </div>

              {categories.length > 0 && (
                <>
                  <SectionLabel title="Categories" accent="#b60410" />
                  
                  {categories.map(cat => (
                    <CategoryRow key={cat.value ?? cat.id} item={cat} closeMenu={closeMenu} />
                  ))}
                </>
              )}

              {events.length > 0 && (
                <>
                  <SectionLabel title="Events" accent="#f59e0b" />
                  {events.map(ev => (
                    <SimpleRow
                      key={ev.value ?? ev.id}
                      item={ev}
                      to={`${S}?event=${ev.value}`}
                      label={ev.label}
                      img={ev.image}
                      closeMenu={closeMenu}
                    />
                  ))}
                </>
              )}

              {rootCombos.length > 0 && (
                <>
                  <SectionLabel title="Combos" accent="#10b981" />
                  {rootCombos.map(c => (
                    <SimpleRow
                      key={c.id}
                      item={c}
                      to={`${S}?combo=${c.id}`}
                      label={c.name}
                      img={c.image}
                      closeMenu={closeMenu}
                    />
                  ))}
                </>
              )}

              <Link
                to={S}
                className="mob-catalogue-cta"
                onClick={closeMenu}
              >
                View all products →
              </Link>
            </div>
          )}
        </li>

        {/* My Account */}
        <li className={`mob-nav__item mob-nav__item--parent${accountOpen ? " mob-nav__item--open" : ""}`}>
          <div className="mob-nav__row">
            <span className="mob-nav__link mob-nav__link--toggle">My Account</span>
            <button
              className="mob-nav__expand"
              onClick={() => setAccountOpen(o => !o)}
              aria-expanded={accountOpen}
              aria-label="Toggle account menu"
            >
              <svg className={`mob-nav__arrow${accountOpen ? " mob-nav__arrow--open" : ""}`}
                width="12" height="7" viewBox="0 0 12 7" fill="none">
                <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {accountOpen && (
            <div className="mob-account-dropdown">
              {isAuthenticated ? (
                <>
                  <Link to={process.env.PUBLIC_URL + "/my-account"} className="mob-account-dropdown__item" onClick={closeMenu}>
                    <i className="fa fa-user-o"></i> My Account
                  </Link>
                  <Link to={process.env.PUBLIC_URL + "/my-account?tab=orders"} className="mob-account-dropdown__item" onClick={closeMenu}>
                    <i className="fa fa-shopping-bag"></i> My Orders
                  </Link>
                  <button className="mob-account-dropdown__item mob-account-dropdown__item--logout" onClick={handleLogout}>
                    <i className="fa fa-sign-out"></i> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to={process.env.PUBLIC_URL + "/login"} className="mob-account-dropdown__item" onClick={closeMenu}>
                    <i className="fa fa-sign-in"></i> Login
                  </Link>
                  <Link to={process.env.PUBLIC_URL + "/register"} className="mob-account-dropdown__item" onClick={closeMenu}>
                    <i className="fa fa-user-plus"></i> Register
                  </Link>
                </>
              )}
            </div>
          )}
        </li>

        {/* Contact */}
        <li className="mob-nav__item">
          <Link to={process.env.PUBLIC_URL + "/contact"} className={`mob-nav__link${isActive(process.env.PUBLIC_URL + "/contact") ? " active" : ""}`} onClick={closeMenu}>
            Contact Us
          </Link>
        </li>

      </ul>
    </nav>
  );
};

export default MobileNavMenu;