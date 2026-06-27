import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useSelector } from "react-redux";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

const IMG_BASE = process.env.REACT_APP_IMG_URL + "/uploads/";
const imgSrc = (path) =>
  path ? `${IMG_BASE}${path.replace(/^\/?( uploads\/)?/, "")}` : null;

/* ─── Portal wrapper — positions the dropdown via fixed coords ─── */
const PortalDropdown = ({ anchorRef, open, onMouseEnter, onMouseLeave, children }) => {
  const [style, setStyle] = useState({});

  const reposition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setStyle({
      position: "fixed",
      top: rect.bottom + 2,
      left: rect.left,
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener("scroll", reposition, { passive: true });
    window.addEventListener("resize", reposition, { passive: true });
    return () => {
      window.removeEventListener("scroll", reposition);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  if (!open) return null;

  return createPortal(
    <div
      className={clsx("kg-collections-panel", open && "kg-collections-panel--open")}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>,
    document.body
  );
};

/* ─── Category row (left column) ─── */
const CategoryRow = ({ cat, isHovered, onHover, shopBase }) => {
  const hasSubs = cat.subcategories && cat.subcategories.length > 0;
  return (
    <div
      className={clsx("kg-col-cat-row", isHovered && "kg-col-cat-row--active")}
      onMouseEnter={() => onHover(cat.id)}
    >
      {/* Category image */}
      <span className="kg-col-cat-row__icon">
        {cat.image ? (
          <img
            src={imgSrc(cat.image)}
            alt={cat.label}
            className="kg-col-cat-row__img"
            onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
          />
        ) : null}
        <span className="kg-col-cat-row__emoji" style={{ display: cat.image ? "none" : "flex" }}>🗂️</span>
      </span>

      {/* Category name — clicking navigates */}
      <Link
        to={cat.value ? `${shopBase}?category=${cat.value}` : shopBase}
        className="kg-col-cat-row__name"
      >
        {cat.label}
      </Link>

      {/* Arrow indicator when subs exist */}
      {hasSubs && (
        <span className="kg-col-cat-row__arrow">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  );
};

/* ─── Subcategory panel (right column) ─── */
const SubPanel = ({ cat, shopBase }) => {
  if (!cat) return null;
  const subs = cat.subcategories || [];
  return (
    <div className="kg-col-sub-panel">
      <p className="kg-col-sub-panel__heading">
        <span className="kg-col-sub-panel__heading-dot" />
        {cat.label}
      </p>

      {subs.length === 0 ? (
        <Link
          to={cat.value ? `${shopBase}?category=${cat.value}` : shopBase}
          className="kg-col-sub-pill kg-col-sub-pill--all"
        >
          View All Products
        </Link>
      ) : (
        <div className="kg-col-sub-list">
          {/* "View All" shortcut */}
          <Link
            to={cat.value ? `${shopBase}?category=${cat.value}` : shopBase}
            className="kg-col-sub-pill kg-col-sub-pill--all"
          >
            View All
          </Link>
          {subs.map((sub) => (
            <Link
              key={sub.id}
              to={sub.value ? `${shopBase}?subcategory=${sub.value}` : `${shopBase}?category=${cat.value}`}
              className="kg-col-sub-pill"
            >
              {sub.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Main NavMenu ─── */
const NavMenu = ({ menuWhiteClass, sidebarMenu }) => {
  const { categories = [] } = useSelector((state) => state.navMenu || {});
  const location = useLocation();
  const S = process.env.PUBLIC_URL + "/shop";
  const C = process.env.PUBLIC_URL + "/catalogue";

  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [hoveredCatId, setHoveredCatId] = useState(null);
  const closeTimer = useRef(null);
  const anchorRef = useRef(null);

  const isActive = (path) => {
    const basePath = process.env.PUBLIC_URL || "";
    const currentPath = location.pathname.replace(basePath, "") || "/";
    const targetPath = path.replace(basePath, "") || "/";
    return currentPath === targetPath || currentPath === targetPath + "/";
  };

  const openPanel = useCallback(() => {
    clearTimeout(closeTimer.current);
    setCollectionsOpen(true);
    // Auto-hover first category
    if (categories.length > 0 && hoveredCatId === null) {
      setHoveredCatId(categories[0].id);
    }
  }, [categories, hoveredCatId]);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setCollectionsOpen(false);
      setHoveredCatId(null);
    }, 180);
  }, []);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Set first category as default hover when panel opens
  useEffect(() => {
    if (collectionsOpen && categories.length > 0 && hoveredCatId === null) {
      setHoveredCatId(categories[0].id);
    }
  }, [collectionsOpen, categories, hoveredCatId]);

  const activeCat = categories.find((c) => c.id === hoveredCatId) || categories[0] || null;

  return (
    <div className={clsx(sidebarMenu ? "sidebar-menu" : `main-menu ${menuWhiteClass || ""}`, "kg-nav")}>
      <nav>
        <ul>
          <li className={isActive(process.env.PUBLIC_URL + "/") ? "active" : ""}>
            <Link to={process.env.PUBLIC_URL + "/"}>Home</Link>
          </li>
          <li className={isActive(process.env.PUBLIC_URL + "/about") ? "active" : ""}>
            <Link to={process.env.PUBLIC_URL + "/about"}>About</Link>
          </li>

          {/* Collections with two-level flyout */}
          <li
            ref={anchorRef}
            className={clsx(
              "kg-catalogue-item",
              collectionsOpen && "kg-catalogue-item--open",
              isActive(S) ? "active" : ""
            )}
            onMouseEnter={openPanel}
            onMouseLeave={scheduleClose}
          >
            <Link to={S} className="kg-catalogue-trigger">
              Collections
              <span className="kg-chevron">
                <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
                  <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>

            {!sidebarMenu && (
              <PortalDropdown
                anchorRef={anchorRef}
                open={collectionsOpen}
                onMouseEnter={openPanel}
                onMouseLeave={scheduleClose}
              >
                {/* Left: category list */}
                <div className="kg-col-left">
                  {categories.map((cat) => (
                    <CategoryRow
                      key={cat.id}
                      cat={cat}
                      isHovered={hoveredCatId === cat.id}
                      onHover={setHoveredCatId}
                      shopBase={S}
                    />
                  ))}
                  {/* View all link */}
                  <Link to={S} className="kg-col-view-all">
                    View all collections →
                  </Link>
                </div>

                {/* Right: subcategory flyout */}
                {activeCat && (
                  <SubPanel cat={activeCat} shopBase={S} />
                )}
              </PortalDropdown>
            )}
          </li>

          <li className={isActive(process.env.PUBLIC_URL + "/contact") ? "active" : ""}>
            <Link to={process.env.PUBLIC_URL + "/contact"}>Contact Us</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

NavMenu.propTypes = { menuWhiteClass: PropTypes.string, sidebarMenu: PropTypes.bool };
export default NavMenu;