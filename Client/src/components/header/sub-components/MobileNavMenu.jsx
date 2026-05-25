import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logoutAction } from "../../../store/slices/authSlice";
import cogoToast from "cogo-toast";

const S = process.env.PUBLIC_URL + "/shop";

const MobileNavMenu = () => {
  const { categories = [], events = [], combos = [] } = useSelector((state) => state.navMenu || {});
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutAction());
    cogoToast.success("Logged out successfully", { position: "top-center" });
    const menu = document.querySelector("#offcanvas-mobile-menu");
    if (menu) menu.classList.remove("active");
    navigate(process.env.PUBLIC_URL + "/");
  };

  return (
    <nav className="offcanvas-navigation" id="offcanvas-navigation">
      <ul>
        <li>
          <Link to={process.env.PUBLIC_URL + "/"}>Home</Link>
        </li>

        <li>
          <Link to={process.env.PUBLIC_URL + "/about"}>About</Link>
        </li>

        {/* Catalogue — circular images for all categories + events */}
<li className="menu-item-has-children">
  <Link to={process.env.PUBLIC_URL + "/catalogue"}>Catalogue</Link>
  <ul className="sub-menu">

    {/* Categories as circles */}
    {categories.length > 0 && (
      <li style={{ padding: "10px 0 4px" }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#aaa", display: "block", marginBottom: 10, paddingLeft: 4 }}>Categories</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 10px", paddingLeft: 4 }}>
          {categories.map((cat) => (
            <Link
              key={cat.value ?? cat.id}
              to={cat.value ? `${process.env.PUBLIC_URL}/shop?category=${cat.value}` : `${process.env.PUBLIC_URL}/shop`}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, textDecoration: "none", width: 60 }}
            >
              <span style={{
                width: 48, height: 48, borderRadius: "50%", overflow: "hidden",
                border: "2px solid #e8e8e8", display: "flex", alignItems: "center",
                justifyContent: "center", background: "#f5f5f5", flexShrink: 0,
              }}>
                {cat.image ? (
                  <img
                    src={`${process.env.REACT_APP_IMG_URL}/uploads/${cat.image.replace(/^\/?(uploads\/)?/, "")}`}
                    alt={cat.label}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <span style={{ fontSize: 18 }}>🗂️</span>
                )}
              </span>
              <span style={{ fontSize: 10, color: "#444", textAlign: "center", lineHeight: 1.3, fontWeight: 500 }}>{cat.label}</span>
            </Link>
          ))}
        </div>
      </li>
    )}

    {/* Events as circles */}
    {events.length > 0 && (
      <li style={{ padding: "10px 0 4px" }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#aaa", display: "block", marginBottom: 10, paddingLeft: 4 }}>Events</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 10px", paddingLeft: 4 }}>
          {events.map((evt) => (
            <Link
              key={evt.value}
              to={`${process.env.PUBLIC_URL}/shop?event=${evt.value}`}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, textDecoration: "none", width: 60 }}
            >
              <span style={{
                width: 48, height: 48, borderRadius: "50%", overflow: "hidden",
                border: "2px solid #e8e8e8", display: "flex", alignItems: "center",
                justifyContent: "center", background: "#f5f5f5", flexShrink: 0,
              }}>
                {evt.image ? (
                  <img
                    src={`${process.env.REACT_APP_IMG_URL}/uploads/${evt.image.replace(/^\/?(uploads\/)?/, "")}`}
                    alt={evt.label}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <span style={{ fontSize: 18 }}>🗂️</span>
                )}
              </span>
              <span style={{ fontSize: 10, color: "#444", textAlign: "center", lineHeight: 1.3, fontWeight: 500 }}>{evt.label}</span>
            </Link>
          ))}
        </div>
      </li>
    )}

    {/* Combos as circles */}
    {combos.length > 0 && (
      <li style={{ padding: "10px 0 4px" }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#aaa", display: "block", marginBottom: 10, paddingLeft: 4 }}>Combos</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 10px", paddingLeft: 4 }}>
          {combos.map((combo) => (
            <Link
              key={combo.value ?? combo.id}
              to={combo.id ? `${process.env.PUBLIC_URL}/shop?combo=${combo.id}` : `${process.env.PUBLIC_URL}/shop?combo=all`}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, textDecoration: "none", width: 60 }}
            >
              <span style={{
                width: 48, height: 48, borderRadius: "50%", overflow: "hidden",
                border: "2px solid #e8e8e8", display: "flex", alignItems: "center",
                justifyContent: "center", background: "#f5f5f5", flexShrink: 0,
              }}>
                {combo.image ? (
                  <img
                    src={`${process.env.REACT_APP_IMG_URL}/uploads/${combo.image.replace(/^\/?(uploads\/)?/, "")}`}
                    alt={combo.label}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <span style={{ fontSize: 18 }}>🎁</span>
                )}
              </span>
              <span style={{ fontSize: 10, color: "#444", textAlign: "center", lineHeight: 1.3, fontWeight: 500 }}>{combo.label}</span>
            </Link>
          ))}
        </div>
      </li>
    )}

  </ul>
</li>
        {/* My Account — auth-aware */}
        {isAuthenticated ? (
          <li className="menu-item-has-children">
            <Link to={process.env.PUBLIC_URL + "/my-account"}>
              My Profile
            </Link>
            <ul className="sub-menu">
              <li>
                <Link to={process.env.PUBLIC_URL + "/my-account"}>My Account</Link>
              </li>
              <li>
                <Link to={process.env.PUBLIC_URL + "/my-account?tab=orders"}>My Orders</Link>
              </li>
              <li>
                <a
                  href="#logout"
                  onClick={(e) => { e.preventDefault(); handleLogout(); }}
                  style={{ color: "#d9534f", fontWeight: 500 }}
                >
                  Logout
                </a>
              </li>
            </ul>
          </li>
        ) : (
          <li className="menu-item-has-children">
            <Link to={process.env.PUBLIC_URL + "/login"}>My Account</Link>
            <ul className="sub-menu">
              <li>
                <Link to={process.env.PUBLIC_URL + "/login"}>Login</Link>
              </li>
              <li>
                <Link to={process.env.PUBLIC_URL + "/register"}>Register</Link>
              </li>
            </ul>
          </li>
        )}

        <li>
          <Link to={process.env.PUBLIC_URL + "/contact"}>Contact Us</Link>
        </li>
      </ul>
    </nav>
  );
};

export default MobileNavMenu;
