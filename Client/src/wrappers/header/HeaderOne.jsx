import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import clsx from "clsx";
import Logo from "../../components/header/Logo";
import NavMenu from "../../components/header/NavMenu";
import IconGroup from "../../components/header/IconGroup";
import MobileMenu from "../../components/header/MobileMenu";
import HeaderTop from "../../components/header/HeaderTop";

const HeaderOne = ({
  layout,
  top,
  borderStyle,
  headerPaddingClass,
  headerPositionClass,
  headerBgClass
}) => {
  const [scroll, setScroll] = useState(0);
  const [headerTop, setHeaderTop] = useState(0);

  useEffect(() => {
    const header = document.querySelector(".sticky-bar");
    setHeaderTop(header.offsetTop);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScroll = () => setScroll(window.scrollY);

  const isSticky = scroll > headerTop;

  return (
    <header className={clsx("header-area clearfix header-padding-1", headerBgClass, headerPositionClass)} style={{ borderTop: "4px solid transparent", borderImage: "var(--theme-gradient) 1" }}>
      {/* Top bar */}
      
        <div className={clsx("header-top-area d-none d-lg-block", headerPaddingClass, borderStyle === "fluid-border" && "border-none")}>
          <div className="w-100">
            <HeaderTop borderStyle={borderStyle} />
          </div>
        </div>
  
      {/* Main bar */}
      <div className={clsx("sticky-bar header-res-padding clearfix", headerPaddingClass, isSticky && "stick")}>
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-3 col-md-4 col-4 d-flex justify-content-start align-items-center">
              <Logo imageUrl="/assets/img/logo.png" logoClass="logo" />
            </div>

            {/* Nav — takes remaining left space */}
            <div className="col-lg-6 d-none d-lg-flex justify-content-center">
              <NavMenu />
            </div>

            {/* Icons — right side */}
           <div className="col-lg-3 col-md-8 col-8 d-flex justify-content-end align-items-center" style={{ flexWrap: "nowrap", gap: "8px"}}>
  <IconGroup />
</div>

          </div>
        </div>
        <MobileMenu />
      </div>
    </header>
  );
};

HeaderOne.propTypes = {
  borderStyle: PropTypes.string,
  headerPaddingClass: PropTypes.string,
  headerPositionClass: PropTypes.string,
  layout: PropTypes.string,
  top: PropTypes.string,
  headerBgClass: PropTypes.string,
};

export default HeaderOne;
