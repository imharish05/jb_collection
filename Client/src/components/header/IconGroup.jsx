import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { logoutAction } from "../../store/slices/authSlice";
import cogoToast from "cogo-toast";

const IconGroup = ({ iconWhiteClass }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { cartItems } = useSelector((state) => state.cart);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Close search on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchActive(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(process.env.PUBLIC_URL + "/shop?search=" + encodeURIComponent(searchQuery.trim()));
      setSearchQuery("");
      setIsSearchActive(false);
    }
  };

  const handleClick = (e) => {
    e.currentTarget.nextSibling.classList.toggle("active");
  };

  const handleLogout = () => {
    dispatch(logoutAction());
    cogoToast.success("Logged out successfully", { position: "top-center" });
    navigate(process.env.PUBLIC_URL + "/");
  };

  const triggerMobileMenu = () => {
    const el = document.querySelector("#offcanvas-mobile-menu");
    if (el) el.classList.add("active");
  };

  return (
    <div className={clsx("header-right-wrap", iconWhiteClass)} style={{ width: "100%" }}>
      {/* Search Bar */}
      <div
        ref={searchRef}
        className={clsx("flexible-search-bar d-none d-lg-flex", isSearchActive && "is-active")}
      >
        <button className="search-icon-btn" onClick={() => setIsSearchActive(!isSearchActive)}>
          <i className="pe-7s-search" />
        </button>
        <form onSubmit={handleSearchSubmit} className="search-form-wrap">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus={isSearchActive}
          />
        </form>
      </div>

      {/* Account Icon — behaviour changes based on auth state */}
      <div className="same-style account-setting d-none d-lg-block">
        <button className="account-setting-active" onClick={handleClick}>
          <i className="pe-7s-user-female" />
        </button>
        <div className="account-dropdown">
          <ul>
            {isAuthenticated ? (
              /* ── LOGGED IN ── */
              <>
                <li className="dropdown-divider"></li>
                <li>
                  <Link to={process.env.PUBLIC_URL + "/my-account"}>My Account</Link>
                </li>
                <li>
                  <Link to={process.env.PUBLIC_URL + "/my-account?tab=orders"}>My Orders</Link>
                </li>
                <li className="dropdown-divider"></li>
                <li>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0",
                      color: "#d9534f",
                      fontSize: "14px",
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              /* ── LOGGED OUT ── */
              <>
                <li>
                  <Link to={process.env.PUBLIC_URL + "/login"}>Login</Link>
                </li>
                <li>
                  <Link to={process.env.PUBLIC_URL + "/register"}>Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Wishlist */}
      <div className="same-style header-wishlist">
        <Link to={process.env.PUBLIC_URL + "/wishlist"}>
          <i className="pe-7s-like" />
          <span className="count-style">
            {wishlistItems?.length || 0}
          </span>
        </Link>
      </div>

      {/* Cart Desktop */}
      <div className="same-style cart-wrap d-none d-lg-block">
        <Link to={process.env.PUBLIC_URL + "/cart"}>
           <i className="pe-7s-shopbag" />
          <span className="count-style">{cartItems?.length || 0}</span>
        </Link>
      </div>

      {/* Cart Mobile */}
      <div className="same-style cart-wrap d-block d-lg-none">
        <Link className="icon-cart" to={process.env.PUBLIC_URL + "/cart"}>
          <i className="pe-7s-shopbag" />
          <span className="count-style">{cartItems?.length || 0}</span>
        </Link>
      </div>

      {/* Mobile Menu Trigger */}
      <div className="same-style mobile-off-canvas d-block d-lg-none">
        <button className="mobile-aside-button" onClick={triggerMobileMenu}>
          <i className="pe-7s-menu" />
        </button>
      </div>
    </div>
  );
};

IconGroup.propTypes = {
  iconWhiteClass: PropTypes.string,
};

export default IconGroup;
