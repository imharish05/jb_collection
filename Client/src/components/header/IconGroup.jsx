import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { logoutAction } from "../../store/slices/authSlice";
import cogoToast from "cogo-toast";
// import "./IconGroup.css";

const IconGroup = ({ iconWhiteClass }) => {
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchActive, setSearchActive]   = useState(false);
  const [accountOpen,  setAccountOpen]    = useState(false);
  const searchRef  = useRef(null);
  const accountRef = useRef(null);
  const inputRef   = useRef(null);
  const navigate   = useNavigate();
  const dispatch   = useDispatch();

  const { wishlistItems } = useSelector((s) => s.wishlist);
  const { cartItems }     = useSelector((s) => s.cart);
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  /* close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current  && !searchRef.current.contains(e.target))  setSearchActive(false);
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* focus input when search opens */
  useEffect(() => {
    if (searchActive) inputRef.current?.focus();
  }, [searchActive]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(process.env.PUBLIC_URL + "/shop?search=" + encodeURIComponent(searchQuery.trim()));
      setSearchQuery("");
      setSearchActive(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutAction());
    cogoToast.success("Logged out successfully", { position: "top-center" });
    setAccountOpen(false);
    navigate(process.env.PUBLIC_URL + "/");
  };

  const triggerMobileMenu = () =>
    document.querySelector("#offcanvas-mobile-menu")?.classList.add("active");

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : null;

  return (
    <div className={clsx("header-right-wrap ig-wrap", iconWhiteClass)} style={{ width: "100%" }}>

      {/* ── Search ── */}
      <div ref={searchRef} className={clsx("ig-search d-none d-lg-flex", searchActive && "ig-search--open")}>
        <button
          className="ig-search__icon-btn"
          onClick={() => setSearchActive((v) => !v)}
          aria-label="Search"
        >
          {searchActive
            ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            : <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.7"/><path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
          }
        </button>
        <form onSubmit={handleSearchSubmit} className="ig-search__form">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ig-search__input"
          />
          {searchQuery && (
            <button type="submit" className="ig-search__submit" aria-label="Go">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </form>
      </div>

      {/* ── Account dropdown ── */}
      <div
        ref={accountRef}
        className={clsx("ig-account d-none d-lg-block", accountOpen && "ig-account--open")}
      >
        <button
          className="ig-account__trigger"
          onClick={() => setAccountOpen((v) => !v)}
          aria-expanded={accountOpen}
          aria-label="My account"
        >
          {isAuthenticated && initials ? (
            <span className="ig-account__avatar">{initials}</span>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
              <path d="M3 19c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        <div className="ig-account__panel">
          {isAuthenticated ? (
            <>
              {/* user header */}
              <div className="ig-account__user-header">
                <span className="ig-account__user-avatar">{initials ?? "👤"}</span>
                <div>
                  <p className="ig-account__user-name">{user?.name ?? "Welcome"}</p>
                  <p className="ig-account__user-email">{user?.email ?? ""}</p>
                </div>
              </div>
              <div className="ig-account__divider" />
              <Link to={process.env.PUBLIC_URL + "/my-account"} className="ig-account__item" onClick={() => setAccountOpen(false)}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M1 14c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                My Account
              </Link>
              <Link to={process.env.PUBLIC_URL + "/my-account?tab=orders"} className="ig-account__item" onClick={() => setAccountOpen(false)}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="1" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 5h5M5 8h5M5 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                My Orders
              </Link>
              <div className="ig-account__divider" />
              <button className="ig-account__item ig-account__item--logout" onClick={handleLogout}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M5 7.5h8M10 4.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13H8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                Logout
              </button>
            </>
          ) : (
            <>
              <p className="ig-account__guest-title">Welcome!</p>
              <p className="ig-account__guest-sub">Sign in to view orders & wishlist</p>
              <div className="ig-account__auth-btns">
                <Link to={process.env.PUBLIC_URL + "/login"} className="ig-account__btn-primary" onClick={() => setAccountOpen(false)}>Login</Link>
                <Link to={process.env.PUBLIC_URL + "/register"} className="ig-account__btn-outline" onClick={() => setAccountOpen(false)}>Register</Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Wishlist ── */}
      <div className="same-style header-wishlist" style={{ display: 'flex', alignItems: 'center' }}>
        <Link to={process.env.PUBLIC_URL + "/wishlist"} style={{ position: 'relative', display: 'flex', alignItems: 'center', color: '#333', padding: '5px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span style={{ position: 'absolute', top: '0px', right: '-4px', backgroundColor: '#e11d48', color: '#fff', fontSize: '10px', fontWeight: 'bold', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '2px solid #fff' }}>
            {wishlistItems?.length || 0}
          </span>
        </Link>
      </div>

      {/* ── Cart ── */}
      <div className="same-style cart-wrap d-none d-lg-flex" style={{ alignItems: 'center' }}>
        <Link to={process.env.PUBLIC_URL + "/cart"} style={{ position: 'relative', display: 'flex', alignItems: 'center', color: '#333', padding: '5px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }}>
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span style={{ position: 'absolute', top: '0px', right: '-4px', backgroundColor: 'var(--theme-color, #10b981)', color: '#fff', fontSize: '10px', fontWeight: 'bold', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '2px solid #fff' }}>
            {cartItems?.length || 0}
          </span>
        </Link>
      </div>
      <div className="same-style cart-wrap d-flex d-lg-none" style={{ alignItems: 'center' }}>
        <Link to={process.env.PUBLIC_URL + "/cart"} style={{ position: 'relative', display: 'flex', alignItems: 'center', color: '#333', padding: '5px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s" }}>
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span style={{ position: 'absolute', top: '0px', right: '-4px', backgroundColor: 'var(--theme-color, #10b981)', color: '#fff', fontSize: '10px', fontWeight: 'bold', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '2px solid #fff' }}>
            {cartItems?.length || 0}
          </span>
        </Link>
      </div>

      {/* ── Mobile menu trigger ── */}
      <div className="same-style mobile-off-canvas d-block d-lg-none">
        <button className="mobile-aside-button" onClick={triggerMobileMenu}>
          <i className="pe-7s-menu" />
        </button>
      </div>
    </div>
  );
};

IconGroup.propTypes = { iconWhiteClass: PropTypes.string };
export default IconGroup;
