import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useSelector } from "react-redux";
import { useState, useRef, useEffect, useCallback } from "react";

/* ─── Main NavMenu ─── */
const NavMenu = ({ menuWhiteClass, sidebarMenu }) => {
  const { categories = [] } = useSelector((state) => state.navMenu || {});
  const location = useLocation();
  const S = process.env.PUBLIC_URL + "/shop";

  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const isActive = (path) => {
    const basePath = process.env.PUBLIC_URL || "";
    const currentPath = location.pathname.replace(basePath, "") || "/";
    const targetPath = path.replace(basePath, "") || "/";
    return currentPath === targetPath || currentPath === targetPath + "/";
  };

  const checkScroll = useCallback(() => {
    if (!scrollRef.current || sidebarMenu) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollWidth - scrollLeft - clientWidth > 5);
  }, [sidebarMenu]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -180 : 180;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
    }
    window.addEventListener("resize", checkScroll);
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories, checkScroll]);

  // If sidebar menu (mobile/side navigation drawer), render a simplified vertical layout
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
            {categories.map((cat) => {
              const hasSubs = cat.subcategories && cat.subcategories.length > 0;
              return (
                <li key={cat.id} className={clsx(hasSubs && "kg-dropdown-item")}>
                  <Link to={`${S}?category=${cat.value}`}>
                    {cat.label}
                  </Link>
                </li>
              );
            })}
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
      <nav className="kg-scroll-nav-wrapper">
        {/* Scroll Left Button */}
        {showLeftArrow && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="kg-nav-scroll-btn kg-nav-scroll-btn--left"
            aria-label="Scroll menu left"
          >
            ‹
          </button>
        )}

        <div className="kg-scroll-nav-container" ref={scrollRef}>
          <ul className="kg-scroll-nav-list">
            {/* Home */}
            <li className={isActive(process.env.PUBLIC_URL + "/") ? "active" : ""}>
              <Link to={process.env.PUBLIC_URL + "/"}>Home</Link>
            </li>

            {/* About */}
            <li className={isActive(process.env.PUBLIC_URL + "/about") ? "active" : ""}>
              <Link to={process.env.PUBLIC_URL + "/about"}>About</Link>
            </li>

            {/* Render Category Menus Dynamically */}
            {categories.map((cat) => {
              const subs = cat.subcategories || [];
              const hasSubs = subs.length > 0;
              const catUrl = `${S}?category=${cat.value}`;

              return (
                <li
                  key={cat.id}
                  className={clsx(
                    hasSubs && "kg-dropdown-item",
                    location.search.includes(`category=${cat.value}`) && "active"
                  )}
                >
                  <Link to={catUrl} className="kg-category-trigger">
                    {cat.label}
                    {hasSubs && (
                      <span className="kg-chevron">
                        <svg width="9" height="6" viewBox="0 0 9 6" fill="none">
                          <path d="M1 1l3.5 3.5L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </Link>

                  {/* Standard clean hover dropdown for subcategories */}
                  {hasSubs && (
                    <ul className="kg-sub-dropdown">
                      <li>
                        <Link to={catUrl} style={{ fontWeight: 600 }}>
                          View All
                        </Link>
                      </li>
                      {subs.map((sub) => (
                        <li key={sub.id}>
                          <Link to={`${S}?subcategory=${sub.value}`}>
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}

            {/* Contact Us */}
            <li className={isActive(process.env.PUBLIC_URL + "/contact") ? "active" : ""}>
              <Link to={process.env.PUBLIC_URL + "/contact"}>Contact Us</Link>
            </li>
          </ul>
        </div>

        {/* Scroll Right Button */}
        {showRightArrow && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="kg-nav-scroll-btn kg-nav-scroll-btn--right"
            aria-label="Scroll menu right"
          >
            ›
          </button>
        )}
      </nav>
    </div>
  );
};

NavMenu.propTypes = { menuWhiteClass: PropTypes.string, sidebarMenu: PropTypes.bool };
export default NavMenu;