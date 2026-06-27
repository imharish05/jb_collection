import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useSelector } from "react-redux";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

const IMG_BASE = process.env.REACT_APP_IMG_URL || 'http://localhost:5000';
const imgSrc = (path) => {
  if (!path) return null;
  const cleanBase = IMG_BASE.endsWith('/') ? IMG_BASE : `${IMG_BASE}/`;
  let cleanPath = path.trim().replace(/^\//, '');
  if (!cleanPath.startsWith('uploads/')) {
    cleanPath = `uploads/${cleanPath}`;
  }
  return `${cleanBase}${cleanPath}`;
};

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

/* ─── Subcategory flyout panel (floating box next to row) ─── */
const SubFlyoutPanel = ({ cat, shopBase }) => {
  const subs = cat.subcategories || [];
  return (
    <div className="kg-sub-flyout-panel" onMouseEnter={(e) => e.stopPropagation()}>
      <div className="kg-col-sub-list">
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
    </div>
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
      {/* Category image thumbnail (only shown if present) */}
      {cat.image && (
        <span className="kg-col-cat-row__icon">
          <img
            src={imgSrc(cat.image)}
            alt={cat.label}
            className="kg-col-cat-row__img"
            onError={(e) => { e.target.parentNode.style.display = "none"; }}
          />
        </span>
      )}

      {/* Category name */}
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

      {/* Render subcategories flyout box inline next to row if hovered */}
      {isHovered && hasSubs && (
        <SubFlyoutPanel cat={cat} shopBase={shopBase} />
      )}
    </div>
  );
};

/* ─── Main NavMenu ─── */
const NavMenu = ({ menuWhiteClass, sidebarMenu }) => {
  const { categories = [] } = useSelector((state) => state.navMenu || {});
  const location = useLocation();
  const S = process.env.PUBLIC_URL + "/shop";

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
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setCollectionsOpen(false);
      setHoveredCatId(null);
    }, 180);
  }, []);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Sidebar mobile menu display
  if (sidebarMenu) {
    return (
      <div className="sidebar-menu kg-nav">
        <nav>
          <ul>
            <li className={isActive(process.env.PUBLIC_URL + "/") ? "active" : ""}>
              <Link to={process.env.PUBLIC_URL + "/"}>Home</Link>
            </li>
            <li className={isActive(process.env.PUBLIC_URL + "/about") ? "active" : ""}>
              <Link to={process.env.PUBLIC_URL + "/about"}>About</Link>
            </li>
            <li className={clsx(categories.length > 0 && "kg-dropdown-item")}>
              <Link to={S}>Collections</Link>
              {categories.length > 0 && (
                <ul className="kg-sub-dropdown">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link to={`${S}?category=${cat.value}`}>{cat.label}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            <li className={isActive(process.env.PUBLIC_URL + "/contact") ? "active" : ""}>
              <Link to={process.env.PUBLIC_URL + "/contact"}>Contact Us</Link>
            </li>
          </ul>
        </nav>
      </div>
    );
  }

  return (
    <div className={clsx(`main-menu ${menuWhiteClass || ""}`, "kg-nav")}>
      <nav>
        <ul>
          <li className={isActive(process.env.PUBLIC_URL + "/") ? "active" : ""}>
            <Link to={process.env.PUBLIC_URL + "/"}>Home</Link>
          </li>
          <li className={isActive(process.env.PUBLIC_URL + "/about") ? "active" : ""}>
            <Link to={process.env.PUBLIC_URL + "/about"}>About</Link>
          </li>

          {/* Collections dropdown list */}
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

            <PortalDropdown
              anchorRef={anchorRef}
              open={collectionsOpen}
              onMouseEnter={openPanel}
              onMouseLeave={scheduleClose}
            >
              {/* Categories list */}
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
              </div>
            </PortalDropdown>
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