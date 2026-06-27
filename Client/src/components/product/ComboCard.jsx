// src/components/product/ComboCard.jsx
import { Link } from "react-router-dom";
import clsx from "clsx";
import { getImgUrl } from "../../helpers/imageUrl";

// Resolve image: prefer variant[0].image → product.image[0] → null
function getFirstProductImg(comboProducts) {
  if (!Array.isArray(comboProducts) || comboProducts.length === 0) return null;
  for (const cp of comboProducts) {
    const prod = cp.product;
    if (!prod) continue;
    // Prefer first variant image
    if (Array.isArray(prod.Variants) && prod.Variants.length > 0) {
      const vImg = prod.Variants[0]?.image;
      if (vImg) return getImgUrl(vImg);
    }
    // Fall back to product image array
    let imgs = prod.image;
    if (typeof imgs === "string") { try { imgs = JSON.parse(imgs); } catch { imgs = [imgs]; } }
    if (Array.isArray(imgs) && imgs[0]) return getImgUrl(imgs[0]);
  }
  return null;
}

const ComboCard = ({ combo, spaceBottomClass }) => {
  const comboPrice = parseFloat(combo.comboPrice || 0);
  const originalPrice = parseFloat(combo.originalPrice || 0);
  const hasSavings = originalPrice > comboPrice && comboPrice > 0;
  const savingsPct = hasSavings
    ? Math.round(((originalPrice - comboPrice) / originalPrice) * 100)
    : 0;

  // Own image → first included product's variant image → null
  const comboImg = combo.image
    ? getImgUrl(combo.image)
    : getFirstProductImg(combo.comboProducts);
  const detailUrl = process.env.PUBLIC_URL + "/combo/root/" + (combo.slug || combo.rootComboId) + "?type=" + combo.type;

  const typeBadgeStyle = combo.type === "fixed"
    ? { background: "rgba(30, 58, 138, 0.3)", color: "#93c5fd" }
    : { background: "rgba(180, 83, 9, 0.3)", color: "#fde047" };

  const typeLabel = combo.type === "fixed" ? "Fixed Combo" : "Mix & Match";

  return (
    <div className={clsx("product-card-premium", spaceBottomClass, "single-image-card")}>
      <div className="product-img-container">
        <Link to={detailUrl}>
          {comboImg ? (
            <img className="main-img" src={comboImg} alt={combo.name} />
          ) : (
            <div style={{
              width: "100%", paddingTop: "100%", position: "relative",
              background: "#1e1e1e", display: "flex", alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)", fontSize: 48, color: "#383838",
              }}>🎁</span>
            </div>
          )}
        </Link>
        <div className="premium-badges">
          {savingsPct > 0 && <span className="badge-pink">-{savingsPct}%</span>}
          <span className="badge-navy" style={typeBadgeStyle}>
            {typeLabel}
          </span>
        </div>
        <div className="cart-action-overlay">
          <Link className="cart-action-btn" to={detailUrl}>
            View Combo
          </Link>
        </div>
      </div>
      <div className="product-details-premium">
        <span className="product-cat-tag" style={typeBadgeStyle}>
          {typeLabel}
        </span>
        <h4>
          <Link to={detailUrl}>{combo.name}</Link>
        </h4>
        <div className="price-rating-row">
          <div className="premium-price">
            {hasSavings ? (
              <>
                <span className="new-price">₹{comboPrice.toLocaleString("en-IN")}</span>
                <span className="old-price">₹{originalPrice.toLocaleString("en-IN")}</span>
              </>
            ) : (
              <span className="new-price">₹{comboPrice.toLocaleString("en-IN")}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComboCard;