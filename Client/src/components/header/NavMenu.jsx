import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useSelector } from "react-redux";

const NavMenu = ({ menuWhiteClass, sidebarMenu }) => {
  const { categories = [], events = [], combos = [] } = useSelector((state) => state.navMenu || {});

  const S = process.env.PUBLIC_URL + "/shop";
  const arrow = sidebarMenu
    ? <span><i className="fa fa-angle-right" /></span>
    : <i className="fa fa-angle-down" />;

  return (
    <div className={clsx(sidebarMenu ? "sidebar-menu" : `main-menu ${menuWhiteClass || ""}`)}>
      <nav>
        <ul>
          <li><Link to={process.env.PUBLIC_URL + "/"}>Home</Link></li>
          <li><Link to={process.env.PUBLIC_URL + "/about"}>About</Link></li>

          {/* Catalogue — mega panel with circular images */}
<li>
  <Link to={process.env.PUBLIC_URL + "/catalogue"}>Catalogue {arrow}</Link>
  <ul className="mega-menu mega-menu-padding" style={{ width: "780px", left: "-120px" }}>
    <li style={{ width: "100%", padding: 0 }}>

      {/* Categories row */}
      {categories.some(c => c.image) && (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#aaa", margin: "0 0 14px", padding: 0 }}>Categories</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 14px", marginBottom: 24 }}>
            {categories.map((cat) => (
              <Link
                key={cat.value ?? cat.id}
                to={cat.value ? `${S}?category=${cat.value}` : S}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textDecoration: "none", width: 72 }}
              >
                <span style={{
                  width: 56, height: 56, borderRadius: "50%", overflow: "hidden",
                  border: "2px solid #f0f0f0", flexShrink: 0, display: "flex",
                  alignItems: "center", justifyContent: "center", background: "#f8f8f8",
                }}>
                  {cat.image ? (
                    <img
                      src={`${process.env.REACT_APP_IMG_URL}/uploads/${cat.image.replace(/^\/?(uploads\/)?/, "")}`}
                      alt={cat.label}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <span style={{ fontSize: 22 }}>🗂️</span>
                  )}
                </span>
                <span style={{ fontSize: 11, color: "#333", textAlign: "center", lineHeight: 1.3, fontWeight: 500 }}>{cat.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Events row */}
      {events.length > 0 && (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#aaa", margin: "0 0 14px", padding: 0 }}>Events</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 14px" }}>
            {events.map((evt) => (
              <Link
                key={evt.value}
                to={`${S}?event=${evt.value}`}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textDecoration: "none", width: 72 }}
              >
                <span style={{
                  width: 56, height: 56, borderRadius: "50%", overflow: "hidden",
                  border: "2px solid #f0f0f0", flexShrink: 0, display: "flex",
                  alignItems: "center", justifyContent: "center", background: "#f8f8f8",
                }}>
                  {evt.image ? (
                    <img
                      src={`${process.env.REACT_APP_IMG_URL}/uploads/${evt.image.replace(/^\/?(uploads\/)?/, "")}`}
                      alt={evt.label}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <span style={{ fontSize: 22 }}>🎉</span>
                  )}
                </span>
                <span style={{ fontSize: 11, color: "#333", textAlign: "center", lineHeight: 1.3, fontWeight: 500 }}>{evt.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Combos row */}
      {combos.length > 0 && (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#aaa", margin: "0 0 14px", padding: 0 }}>Combos</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 14px" }}>
            {combos.map((combo) => (
              <Link
                key={combo.value ?? combo.id}
                to={combo.id ? `${S}?combo=${combo.id}` : `${S}?combo=all`}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textDecoration: "none", width: 72 }}
              >
                <span style={{
                  width: 56, height: 56, borderRadius: "50%", overflow: "hidden",
                  border: "2px solid #f0f0f0", flexShrink: 0, display: "flex",
                  alignItems: "center", justifyContent: "center", background: "#f8f8f8",
                }}>
                  {combo.image ? (
                    <img
                      src={`${process.env.REACT_APP_IMG_URL}/uploads/${combo.image.replace(/^\/?(uploads\/)?/, "")}`}
                      alt={combo.label}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <span style={{ fontSize: 22 }}>🎁</span>
                  )}
                </span>
                <span style={{ fontSize: 11, color: "#333", textAlign: "center", lineHeight: 1.3, fontWeight: 500 }}>{combo.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}

    </li>
  </ul>
</li>
          <li><Link to={process.env.PUBLIC_URL + "/contact"}>Contact Us</Link></li>
        </ul>
      </nav>
    </div>
  );
};

NavMenu.propTypes = { menuWhiteClass: PropTypes.string, sidebarMenu: PropTypes.bool };
export default NavMenu;
