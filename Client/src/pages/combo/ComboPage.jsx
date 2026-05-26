import React, { Fragment, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import { getImgUrl } from "../../helpers/imageUrl";
import { addToCartService } from "../../store/services";
import cogoToast from "cogo-toast";

// ─── helpers ─────────────────────────────────────────────────────────────────
const KM = {
  orange: "#F15A24", orangeLight: "#FEF0EB", blue: "#1A3A6B",
  border: "#E5E7EB", text: "#1A1A2E", muted: "#6B7280",
  bg: "#F9FAFB", green: "#22c55e",
};

function parseIds(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return []; } }
  return [];
}

function getProductImg(p) {
  const img = Array.isArray(p.image) ? p.image[0] : p.image;
  return img ? getImgUrl(img) : null;
}

function getProductPrice(p) {
  const v = Array.isArray(p.Variants) && p.Variants.length > 0 ? p.Variants[0] : null;
  return v
    ? { sales: parseFloat(v.salesPrice || 0), mrp: parseFloat(v.mrp || 0) }
    : { sales: parseFloat(p.price || 0), mrp: parseFloat(p.price || 0) };
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ComboProductCard({ product, idx }) {
  const img = getProductImg(product);
  const { sales, mrp } = getProductPrice(product);
  const discount = mrp > 0 && sales < mrp ? Math.round((1 - sales / mrp) * 100) : 0;

  return (
    <Link
      to={`${process.env.PUBLIC_URL}/product/${product.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          background: "#fff", border: `1.5px solid ${KM.border}`,
          borderRadius: 14, overflow: "hidden", display: "flex",
          flexDirection: "column", height: "100%",
          transition: "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = "0 8px 30px rgba(241,90,36,0.15)";
          e.currentTarget.style.borderColor = KM.orange;
          e.currentTarget.style.transform = "translateY(-3px)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = KM.border;
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Image */}
        <div style={{ position: "relative", paddingTop: "75%", background: KM.bg, overflow: "hidden" }}>
          {img ? (
            <img
              src={img} alt={product.name}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { e.target.style.display = "none"; }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: "#e5e7eb" }}>🎁</div>
          )}
          {/* Number badge */}
          <div style={{
            position: "absolute", top: 10, left: 10,
            width: 26, height: 26, borderRadius: "50%",
            background: KM.orange, color: "#fff",
            fontSize: 12, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(241,90,36,0.4)",
          }}>{idx + 1}</div>
          {/* Discount badge */}
          {discount > 0 && (
            <div style={{
              position: "absolute", top: 10, right: 10,
              background: KM.green, color: "#fff",
              fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 7px",
            }}>{discount}% OFF</div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: KM.text, lineHeight: 1.35 }}>
            {product.name}
          </div>
          {product.shortDescription && (
            <div style={{
              fontSize: 12, color: KM.muted, lineHeight: 1.45,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {product.shortDescription}
            </div>
          )}
          {/* Price */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto", paddingTop: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: KM.orange }}>
              ₹{sales.toLocaleString("en-IN")}
            </span>
            {mrp > sales && (
              <span style={{ fontSize: 12, color: KM.muted, textDecoration: "line-through" }}>
                ₹{mrp.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          {/* CTA strip */}
          <div style={{
            marginTop: 8, padding: "7px 0",
            background: KM.orangeLight, borderRadius: 8,
            textAlign: "center", fontSize: 12, fontWeight: 700, color: KM.orange,
          }}>
            View Details →
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ComboPage = () => {
  const { id }        = useParams();
  const { pathname }  = useLocation();
  const dispatch      = useDispatch();
  const { isAuthenticated } = useSelector(s => s.auth);
  const navCombos     = useSelector(s => s.navMenu?.combos  || []);
  const allProducts   = useSelector(s => s.product?.products || []);

  const [addingToCart, setAddingToCart] = useState(false);

  const combo = navCombos.find(c => String(c.id) === String(id) || c.value === id);

  if (!combo) {
    return (
      <LayoutOne headerTop="visible">
        <div style={{ padding: "140px 0", textAlign: "center", color: KM.muted }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: KM.text, marginBottom: 8 }}>Combo not found</div>
          <Link to={`${process.env.PUBLIC_URL}/shop`} style={{ color: KM.orange, fontWeight: 600 }}>← Back to Shop</Link>
        </div>
      </LayoutOne>
    );
  }

  const productIds = parseIds(combo.productIds);
  const comboProducts = productIds.length > 0
    ? productIds.map(pid => allProducts.find(p => String(p.id) === String(pid))).filter(Boolean)
    : allProducts.filter(p => p.comboId && String(p.comboId) === String(combo.id));

  const mrp            = parseFloat(combo.price || 0);
  const discountedPrice = combo.discountedPrice ? parseFloat(combo.discountedPrice) : null;
  const saving          = discountedPrice && mrp > 0 ? Math.round(((mrp - discountedPrice) / mrp) * 100) : 0;
  const displayPrice    = discountedPrice || mrp;
  const comboImg        = combo.image ? getImgUrl(combo.image) : null;

  const handleAddAllToCart = async () => {
    if (!isAuthenticated) {
      cogoToast.warn("Please login to add items to cart", { position: "top-center" });
      return;
    }
    if (!comboProducts.length) return;
    setAddingToCart(true);
    try {
      for (const p of comboProducts) {
        const v = Array.isArray(p.Variants) && p.Variants.length > 0 ? p.Variants[0] : null;
        await addToCartService(
          dispatch,
          { ...p, price: v ? parseFloat(v.salesPrice) : parseFloat(p.price || 0) },
          1, null, v ? v.id : null, v ? v.variantName : null, null, null,
        );
      }
      cogoToast.success(`${comboProducts.length} items added to cart!`, { position: "top-center" });
    } catch {
      cogoToast.error("Failed to add some items", { position: "top-center" });
    }
    setAddingToCart(false);
  };

  return (
    <Fragment>
      <SEO
        titleTemplate={`${combo.name} — Combo`}
        description={combo.description || `${combo.name} combo pack`}
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb pages={[
          { label: "Home",  path: process.env.PUBLIC_URL + "/" },
          { label: "Shop",  path: process.env.PUBLIC_URL + "/shop" },
          { label: combo.name, path: process.env.PUBLIC_URL + pathname },
        ]} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 80px" }}>

          {/* ── Hero ────────────────────────────────────────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1.3fr)",
            gap: 40, marginBottom: 56, alignItems: "stretch",
          }}>
            {/* Image */}
            <div style={{
              borderRadius: 20, overflow: "hidden",
              background: KM.bg, border: `1.5px solid ${KM.border}`,
              aspectRatio: "4/3",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {comboImg
                ? <img src={comboImg} alt={combo.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                : <div style={{ fontSize: 80, color: "#e5e7eb" }}>🎁</div>
              }
            </div>

            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
              {/* Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ background: KM.orangeLight, color: KM.orange, fontSize: 11, fontWeight: 800, borderRadius: 8, padding: "4px 12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  🎁 Combo Pack
                </span>
                <span style={{
                  background: comboProducts.length > 0 ? "#dcfce7" : "#fee2e2",
                  color: comboProducts.length > 0 ? "#16a34a" : "#dc2626",
                  fontSize: 11, fontWeight: 700, borderRadius: 8, padding: "4px 12px",
                }}>
                  {comboProducts.length} {comboProducts.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              <h1 style={{ fontSize: 32, fontWeight: 800, color: KM.text, lineHeight: 1.2, margin: 0 }}>
                {combo.name}
              </h1>

              {combo.description && (
                <p style={{ fontSize: 15, color: KM.muted, lineHeight: 1.7, margin: 0 }}>
                  {combo.description}
                </p>
              )}

              {/* Price block */}
              <div style={{ background: KM.bg, border: `1.5px solid ${KM.border}`, borderRadius: 14, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: KM.orange, lineHeight: 1 }}>
                    ₹{displayPrice.toLocaleString("en-IN")}
                  </span>
                  {discountedPrice && mrp > discountedPrice && (
                    <span style={{ fontSize: 18, color: KM.muted, textDecoration: "line-through", lineHeight: 1.2 }}>
                      ₹{mrp.toLocaleString("en-IN")}
                    </span>
                  )}
                  {saving > 0 && (
                    <span style={{ background: KM.green, color: "#fff", fontSize: 13, fontWeight: 800, borderRadius: 8, padding: "4px 12px" }}>
                      Save {saving}%
                    </span>
                  )}
                </div>
                {discountedPrice && mrp > discountedPrice && (
                  <div style={{ fontSize: 13, color: KM.green, fontWeight: 600 }}>
                    You save ₹{(mrp - discountedPrice).toLocaleString("en-IN")} on this combo!
                  </div>
                )}
              </div>

              {/* CTAs */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={handleAddAllToCart}
                  disabled={addingToCart || comboProducts.length === 0}
                  style={{
                    flex: "1 1 200px", padding: "14px 24px",
                    background: KM.orange, color: "#fff",
                    border: "none", borderRadius: 12,
                    fontSize: 15, fontWeight: 700, cursor: "pointer",
                    opacity: addingToCart ? 0.7 : 1,
                    transition: "transform 0.15s",
                  }}
                  onMouseEnter={e => { if (!addingToCart) e.currentTarget.style.transform = "scale(1.02)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {addingToCart ? "Adding…" : "🛒 Add All to Cart"}
                </button>
                <Link to={`${process.env.PUBLIC_URL}/shop?combo=${combo.value || combo.id}`}>
                  <button style={{
                    padding: "14px 20px", background: "#fff", color: KM.blue,
                    border: `2px solid ${KM.border}`, borderRadius: 12,
                    fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                  }}>
                    Browse in Shop
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* ── Products grid ────────────────────────────────────────────── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, paddingBottom: 16, borderBottom: `2px solid ${KM.border}` }}>
              <div style={{ width: 5, height: 32, borderRadius: 3, background: `linear-gradient(180deg, ${KM.orange}, #e04d19)` }} />
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: KM.text }}>
                  What's Inside This Combo
                </h2>
                <div style={{ fontSize: 13, color: KM.muted, marginTop: 3 }}>
                  {comboProducts.length} product{comboProducts.length !== 1 ? "s" : ""} — click any to view full details
                </div>
              </div>
            </div>

            {comboProducts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: KM.muted, fontSize: 15 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                Products not linked yet. Check back soon.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
                {comboProducts.map((p, idx) => (
                  <ComboProductCard key={p.id} product={p} idx={idx} />
                ))}
              </div>
            )}
          </div>

          {/* ── Bottom summary strip ─────────────────────────────────────── */}
          {comboProducts.length > 0 && (
            <div style={{
              marginTop: 50, padding: "20px 28px",
              background: `linear-gradient(135deg, ${KM.blue} 0%, #2a4f8a 100%)`,
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 16,
            }}>
              <div style={{ color: "#fff" }}>
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Complete combo includes</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  {comboProducts.map(p => p.name).join("  +  ")}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                <div style={{ textAlign: "right", color: "#fff" }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Combo Price</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>₹{displayPrice.toLocaleString("en-IN")}</div>
                </div>
                <button
                  onClick={handleAddAllToCart}
                  disabled={addingToCart}
                  style={{
                    padding: "12px 22px", background: KM.orange,
                    color: "#fff", border: "none", borderRadius: 10,
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                    opacity: addingToCart ? 0.7 : 1,
                  }}
                >
                  {addingToCart ? "Adding…" : "Add All to Cart"}
                </button>
              </div>
            </div>
          )}
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default ComboPage;