import { Fragment } from "react";
import { useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import { getImgUrl } from "../../helpers/imageUrl";

const CircleCard = ({ to, imgSrc, label, emoji = "🎁" }) => (
  <Link
    to={to}
    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textDecoration: "none", width: 100 }}
  >
    <span style={{
      width: 80, height: 80, borderRadius: "50%", overflow: "hidden",
      border: "2px solid #eee", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f8f8f8", flexShrink: 0,
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#db1a5d"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(219, 26, 93,0.15)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#eee"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {imgSrc ? (
        <img src={imgSrc} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
      ) : null}
      <span style={{ fontSize: 28, display: imgSrc ? "none" : "flex" }}>{emoji}</span>
    </span>
    <span style={{ fontSize: 12, color: "#333", textAlign: "center", lineHeight: 1.4, fontWeight: 500 }}>{label}</span>
  </Link>
);

const CombosPage = () => {
  const { pathname } = useLocation();
  const { rootCombos = [] } = useSelector((state) => state.navMenu || {});
  const S = process.env.PUBLIC_URL + "/shop";

  return (
    <Fragment>
      <SEO titleTemplate="Combos" description="Browse all our combo offers." />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Combos", path: process.env.PUBLIC_URL + pathname },
          ]}
        />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 20px 80px" }}>

          {/* Combos */}
          {rootCombos.length > 0 && (
            <section>
              <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#999", marginBottom: 28 }}>
                🎁 All Combos
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "28px 20px" }}>
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

          {rootCombos.length === 0 && (
            <p style={{ color: "#aaa", textAlign: "center", marginTop: 80 }}>No combos found.</p>
          )}
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default CombosPage;
