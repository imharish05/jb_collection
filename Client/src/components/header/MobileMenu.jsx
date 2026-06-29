import React from "react";
import MobileMenuSearch from "./sub-components/MobileSearch";
import MobileNavMenu from "./sub-components/MobileNavMenu";
import MobileWidgets from "./sub-components/MobileWidgets";
import { Link } from "react-router-dom";

const MobileMenu = () => {
  const closeMobileMenu = () => {
    document.querySelector("#offcanvas-mobile-menu")?.classList.remove("active");
  };

  return (
    <div className="offcanvas-mobile-menu" id="offcanvas-mobile-menu">
      <div className="offcanvas-wrapper">
        {/* Header bar */}
        <div className="offcanvas-header">
          <Link
            to={process.env.PUBLIC_URL + "/"}
            className="offcanvas-header__brand"
            onClick={closeMobileMenu}
          >
            JB House of Fashion
          </Link>
          <button
            className="offcanvas-menu-close"
            id="mobile-menu-close-trigger"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <i className="pe-7s-close"></i>
          </button>
        </div>

        {/* Search */}
        <MobileMenuSearch />

        {/* Scrollable nav area */}
        <div className="offcanvas-inner-content">
          <MobileNavMenu />
          <MobileWidgets />
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;