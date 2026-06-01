import { Fragment } from "react";
import { useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";

const IMG_BASE = process.env.REACT_APP_IMG_URL;

const getImgUrl = (path) => {
  if (!path) return null;
  return `${IMG_BASE}/uploads/${path.replace(/^\/?(uploads\/)?/, "")}`;
};

const CircleCard = ({ to, imgSrc, label, emoji = "🗂️" }) => (
  <Link
    to={to}
    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", textDecoration: "none" }}
    className="catalogue-card"
  >
    <span style={{
      width: "100%", aspectRatio: "1", borderRadius: "50%", overflow: "hidden",
      border: "2px solid #eee", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f8f8f8", flexShrink: 0,
      transition: "all 0.3s ease",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#db1a5d"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(219, 26, 93, 0.2)"; e.currentTarget.style.transform = "scale(1.05)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#eee"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "scale(1)"; }}
    >
      {imgSrc ? (
        <img src={imgSrc} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
      ) : null}
      <span style={{ fontSize: "max(24px, 4vw)", display: imgSrc ? "none" : "flex" }}>{emoji}</span>
    </span>
    <span style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "#333", textAlign: "center", lineHeight: 1.3, fontWeight: 500, width: "100%" }}>{label}</span>
  </Link>
);

const Catalogue = () => {
  const { pathname } = useLocation();
  const { categories = [], events = [], rootCombos = [] } = useSelector((state) => state.navMenu || {});
  const S = process.env.PUBLIC_URL + "/shop";

  return (
    <Fragment>
      <SEO titleTemplate="Catalogue" description="Browse all our product categories and events." />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Catalogue", path: process.env.PUBLIC_URL + pathname },
          ]}
        />

        <div style={{ width: "100%", padding: "60px 0 80px" }}>
          
          {/* Categories */}
          {categories.length > 0 && (
            <section style={{ marginBottom: 56, padding: "0 20px" }}>
              <h4 style={{ fontSize: "clamp(13px, 2.5vw, 16px)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#999", marginBottom: 28, maxWidth: 1100, margin: "0 auto 28px" }}>
                Categories
              </h4>
              <div style={{ 
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                gap: "clamp(16px, 3vw, 32px)",
                maxWidth: 1100,
                margin: "0 auto",
                padding: "0 12px"
              }}>
                {categories.map((cat) => (
                  <CircleCard
                    key={cat.value ?? cat.id}
                    to={cat.value ? `${S}?category=${cat.value}` : S}
                    imgSrc={cat.image ? getImgUrl(cat.image) : null}
                    label={cat.label}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Events */}
          {events.length > 0 && (
            <section style={{ marginBottom: 56, padding: "0 20px" }}>
              <h4 style={{ fontSize: "clamp(13px, 2.5vw, 16px)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#999", marginBottom: 28, maxWidth: 1100, margin: "0 auto 28px" }}>
                Shop by Event
              </h4>
              <div style={{ 
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                gap: "clamp(16px, 3vw, 32px)",
                maxWidth: 1100,
                margin: "0 auto",
                padding: "0 12px"
              }}>
                {events.map((evt) => (
                  <CircleCard
                    key={evt.value}
                    to={`${S}?event=${evt.value}`}
                     imgSrc={evt.image ? getImgUrl(evt.image) : null}
                    label={evt.label}
                    emoji="🎉"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Combos */}
          {rootCombos.length > 0 && (
            <section style={{ padding: "0 20px" }}>
              <h4 style={{ fontSize: "clamp(13px, 2.5vw, 16px)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#999", marginBottom: 28, maxWidth: 1100, margin: "0 auto 28px" }}>
                🎁 Combos
              </h4>
              <div style={{ 
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                gap: "clamp(16px, 3vw, 32px)",
                maxWidth: 1100,
                margin: "0 auto",
                padding: "0 12px"
              }}>
                {rootCombos.map((combo) => (
                  <CircleCard
                    key={combo.id}
                    to={`${S}?combo=${combo.id}`}
                    imgSrc={combo.image ? getImgUrl(combo.image) : null}
                    label={combo.name}
                    emoji="🎁"
                  />
                ))}
              </div>
            </section>
          )}

          {categories.length === 0 && events.length === 0 && rootCombos.length === 0 && (
            <p style={{ color: "#aaa", textAlign: "center", marginTop: 80 }}>No categories found.</p>
          )}
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default Catalogue;
