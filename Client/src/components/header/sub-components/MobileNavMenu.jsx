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

/* ── Subcategory row component inside CategoryRow to allow nesting sub-subcategories ── */
const SubCategoryRow = ({ catValue, sub, closeMenu }) => {
  const [open, setOpen] = useState(false);
  const subsubs = sub.subsubcategories ?? [];
  const hasSS = subsubs.length > 0;

  return (
    <div className="mob-subcat-row-container" style={{ width: "100%" }}>
      <div className="mob-list-row mob-list-row--sub" style={{ paddingLeft: "15px", borderLeft: "2px solid #f0e0ff", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "36px" }}>
        <Link
          to={`${S}?category=${catValue}&subcategory=${sub.value}`}
          className="mob-list-row__label"
          style={{ fontSize: "12px", color: "#555", flexGrow: 1, textDecoration: "none" }}
          onClick={closeMenu}
        >
          {sub.label}
        </Link>
        {hasSS && (
          <button
            className="mob-list-row__chevron"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <svg className={`mob-chevron-svg${open ? " mob-chevron-svg--open" : ""}`}
              width="9" height="5" viewBox="0 0 12 7" fill="none" style={{ transition: "transform 0.2s" }}>
              <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {open && hasSS && (
        <div className="mob-subsubcat-list" style={{ paddingLeft: "30px", borderLeft: "2px dashed #f0e0ff", display: "flex", flexDirection: "column", gap: "8px", margin: "6px 0" }}>
          <Link
            to={`${S}?category=${catValue}&subcategory=${sub.value}`}
            className="mob-subsubcat-list__item"
            style={{ fontSize: "11px", color: "#888", textDecoration: "none" }}
            onClick={closeMenu}
          >
            All {sub.label}
          </Link>
          {subsubs.map(ss => (
            <Link
              key={ss.id}
              to={`${S}?category=${catValue}&subcategory=${sub.value}&subsubcategory=${ss.value}`}
              className="mob-subsubcat-list__item"
              style={{ fontSize: "11px", color: "#888", textDecoration: "none" }}
              onClick={closeMenu}
            >
              {ss.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

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
          onClick={closeMenu}
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
        <div className="mob-subcat-list" style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "15px" }}>
          <Link
            to={`${S}?category=${item.value}`}
            className="mob-subcat-list__item mob-subcat-list__item--all"
            style={{ fontSize: "12px", color: "#777", textDecoration: "none", padding: "4px 0" }}
            onClick={closeMenu}
          >
            All {item.label}
          </Link>
          {subs.map(sub => (
            <SubCategoryRow key={sub.id} catValue={item.value} sub={sub} closeMenu={closeMenu} />
          ))}
        </div>
      )}
    </>
  );
};

/* ── Section label ── */
const SectionLabel = ({ title, accent }) => (
  <div className="mob-section-label" style={{ "--accent": accent }}>{title}</div>
);

const MobileNavMenu = () => {
  const { categories = [] } = useSelector((s) => s.navMenu || {});
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

              <SectionLabel title="Products" accent="var(--theme-color)" />
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
                  <SectionLabel title="Categories" accent="var(--theme-color)" />
                  
                  {categories.map(cat => (
                    <CategoryRow key={cat.value ?? cat.id} item={cat} closeMenu={closeMenu} />
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
