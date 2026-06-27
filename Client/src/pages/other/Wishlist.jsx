import { Fragment } from "react";
import { useSelector } from "react-redux";
import {
  addToCartService,
  deleteFromWishlistService,
  deleteAllFromWishlistService,
} from "../../store/services";
import { Link, useLocation } from "react-router-dom";
import { getImgUrl } from "../../helpers/imageUrl";
import { isColourKey, isHexColor } from "../../helpers/product";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";


// ── helpers ───────────────────────────────────────────────────────────────────
const parseJson = (val) => {
  if (!val || typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return val; }
};
const getFirstImage = (img) => {
  const arr = Array.isArray(img) ? img : parseJson(img);
  return Array.isArray(arr) ? arr[0] : arr || "";
};
const getSecondImage = (img) => {
  const arr = Array.isArray(img) ? img : parseJson(img);
  return Array.isArray(arr) && arr.length > 1 ? arr[1] : null;
};

// Get display price + strike price from item (respects selectedVariant)
const getPrices = (item, rate = 1) => {
  const v = item.selectedVariant;
  if (v) {
    const sp = parseFloat(v.salesPrice);
    const mrp = parseFloat(v.mrp);
    return {
      price:  +(sp  * rate).toFixed(2),
      strike: mrp > sp ? +(mrp * rate).toFixed(2) : null,
    };
  }
  const price  = parseFloat(item.price || 0);
  const disc   = parseFloat(item.discount || 0);
  const strike = disc > 0 ? +(price * rate).toFixed(2) : null;
  const final  = disc > 0 ? +((price - price * disc / 100) * rate).toFixed(2) : +(price * rate).toFixed(2);
  return { price: final, strike };
};

// Get stock from item's selected variant or product directly
const getStock = (item) => {
  if (item.selectedVariant) return Number(item.selectedVariant.stock ?? 0);
  return Number(item.stock ?? 0);
};

// Parse variant attributes for display: [{key, value}, ...]
const safeAttrs = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};
const getVariantAttrs = (variant) => {
  if (!variant) return [];
  return safeAttrs(variant.attributes).filter(a => a.key && a.value && a.key !== "Custom Note");
};

/* ── Variant chip with color swatch support ── */
const VariantChips = ({ attrs, fontSize = 10, swatchSize = 12 }) => {
  if (!attrs || attrs.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {attrs.map((a, i) => {
        const isCol = isColourKey(a.key);
        const hasPreview = isCol && isHexColor(a.value);
        const displayVal = hasPreview ? a.value.toUpperCase() : a.value;
        return (
          <span
            key={i}
            style={{
              fontSize,
              color: "#666",
              background: "#f5f5f5",
              borderRadius: 4,
              padding: "2px 6px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>{a.key}:</span>
            {hasPreview ? (
              <span
                style={{
                  width: swatchSize,
                  height: swatchSize,
                  borderRadius: "50%",
                  border: "1px solid #dcdcdc",
                  backgroundColor: displayVal,
                  display: "inline-block",
                  flexShrink: 0,
                }}
                title={displayVal}
              />
            ) : (
              <span>{displayVal}</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   Wishlist Page — 4-column, compact, variant-aware
══════════════════════════════════════════════════════════════════════════ */
const Wishlist = () => {
  const { pathname } = useLocation();
  const currency = useSelector(
    (state) => state.currency || { currencyName: "INR", currencyRate: 1, currencySymbol: "₹" }
  );
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { cartItems }     = useSelector((state) => state.cart);

  return (
    <Fragment>
      <SEO title="My Wishlist" titleTemplate="Saved Gifts & Items - Kamali Gifts" description="Your saved wishlist of personalized and customized gifts. Save your favorite items for later purchase." keywords="wishlist, saved items, gift wishlist" />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home",     path: process.env.PUBLIC_URL + "/" },
            { label: "Wishlist", path: process.env.PUBLIC_URL + pathname },
          ]}
        />

        {/* Scoped styles: compact image + smaller text for 4-col grid */}
        <style>{`
          .wl-grid .product-img-container { aspect-ratio: 1 / 0.9 !important; }
          .wl-grid .product-details-premium { padding: 10px 12px 12px !important; }
          .wl-grid .product-details-premium h4 { font-size: 12px !important; margin-bottom: 4px !important; }
          .wl-grid .product-details-premium .new-price { font-size: 13px !important; }
          .wl-grid .product-details-premium .old-price { font-size: 11px !important; }
          .wl-grid .product-cat-tag { font-size: 10px !important; margin-bottom: 3px !important; }
          .wl-grid .cart-action-overlay button,
          .wl-grid .cart-action-overlay a.cart-action-btn { padding: 8px !important; font-size: 10px !important; }
          .wl-variant-chips { display:flex; flex-wrap:wrap; gap:4px; margin-top:4px; }
          .wl-variant-chip {
            display:inline-flex; align-items:center; gap:2px;
            font-size:10px; font-weight:600; padding:2px 7px;
            border-radius:4px; background:#f3f4f6; color:#374151;
            border:1px solid #e5e7eb;
          }
          .wl-variant-chip span.k { color:#9ca3af; font-weight:500; }
        `}</style>

        {wishlistItems && wishlistItems.length >= 1 ? (
          <div className="shop-area pt-60 pb-80">
            <div className="container">

              {/* ── Header ── */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:28 }}>
                <div>
                  <h4 style={{ margin:0, fontSize:22, fontWeight:800, color:"#111" }}>My Wishlist</h4>
                  <p style={{ margin:"4px 0 0", fontSize:13, color:"#888" }}>
                    {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved
                  </p>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <Link
                    to={process.env.PUBLIC_URL + "/shop"}
                    style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 20px", background:"#fff", border:"1.5px solid #e0e0e0", borderRadius:10, fontSize:13, fontWeight:700, color:"#333", textDecoration:"none" }}
                  >
                    ← Shop More
                  </Link>
                  <button
                    onClick={() => deleteAllFromWishlistService()}
                    style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 20px", background:"#fff5f8", border:"1.5px solid #fca5a5", borderRadius:10, fontSize:13, fontWeight:700, color:"#b60410", cursor:"pointer" }}
                  >
                    🗑 Clear Wishlist
                  </button>
                </div>
              </div>

              {/* ── 4-column grid ── */}
              <div className="shop-bottom-area mt-10 wl-grid">
                <div className="row grid three-column">
                  {wishlistItems.map((item) => {
                    const rate        = currency?.currencyRate || 1;
                    const { price, strike } = getPrices(item, rate);
                    const stock       = getStock(item);
                    const hasVariants = Array.isArray(item.Variants) && item.Variants.length > 0;

                    // Image: prefer variant image if set, else product image
                    const variantImg  = item.selectedVariant?.image || null;
                    const rawImg      = variantImg || getFirstImage(item.image);
                    const mainImage   = getImgUrl(rawImg);
                    const hoverRaw    = !variantImg ? getSecondImage(item.image) : null;
                    const hoverImage  = hoverRaw ? getImgUrl(hoverRaw) : null;

                    // Variant attribute chips
                    const attrs       = getVariantAttrs(item.selectedVariant);

                    // Cart state — match by productId + variantId
                    const cartItem    = cartItems.find(c =>
                      c.id === item.id &&
                      (item.selectedVariantId != null
                        ? String(c.selectedVariantId) === String(item.selectedVariantId)
                        : !c.selectedVariantId)
                    );
                    const inCart = cartItem !== undefined && cartItem.quantity > 0;

                    // Build the product payload for addToCartService
                    const cartPayload = {
                      ...item,
                      selectedVariantId:   item.selectedVariantId ?? null,
                      selectedVariantName: item.selectedVariant?.variantName ?? null,
                      price: item.selectedVariant
                        ? parseFloat(item.selectedVariant.salesPrice)
                        : parseFloat(item.price || 0),
                      stock,
                    };

                    return (
                      <div className="col-xl-3 col-sm-6 col-12" key={item.wishlistItemId || `${item.id}-${item.selectedVariantId}`}>
                        <div className={`product-card-premium mb-25${!hoverImage ? " single-image-card" : ""}`}>

                          {/* Image */}
                          <div className="product-img-container">
                            <Link to={`${process.env.PUBLIC_URL}/product/${item.slug || item.id}`}>
                              <img
                                className="main-img"
                                src={mainImage}
                                alt={item.name}
                                onError={(e) => { e.target.src = "/assets/img/products/products-1.jpeg"; }}
                              />
                              {hoverImage && (
                                <img
                                  className="secondary-img"
                                  src={hoverImage}
                                  alt={item.name}
                                  onError={(e) => { e.target.style.display = "none"; }}
                                />
                              )}
                            </Link>

                            {/* Badges */}
                            <div className="premium-badges">
                              {strike && <span className="badge-pink">SALE</span>}
                              {item.new === true && <span className="badge-navy">NEW</span>}
                              {stock <= 0 && <span className="badge-pink">OUT OF STOCK</span>}
                            </div>

                            {/* Remove button */}
                            <div className="premium-action-list">
                              <button
                                onClick={() => deleteFromWishlistService(item.wishlistItemId)}
                                title="Remove from wishlist"
                                className="active"
                              >
                                <i className="pe-7s-close" />
                              </button>
                            </div>

                            {/* Cart overlay */}
                            <div className="cart-action-overlay">
                              {item.affiliateLink ? (
                                <a href={item.affiliateLink} rel="noopener noreferrer" target="_blank" className="cart-action-btn">
                                  BUY NOW ↗
                                </a>
                              ) : hasVariants && !item.selectedVariantId ? (
                                // Product has variants but none selected — send to product page
                                <Link to={`${process.env.PUBLIC_URL}/product/${item.slug || item.id}`} className="cart-action-btn">
                                  SELECT OPTIONS
                                </Link>
                              ) : stock > 0 ? (
                                inCart ? (
                                  <Link to="/cart" className="cart-action-btn in-cart">
                                    GO TO CART →
                                  </Link>
                                ) : (
                                  <button onClick={() => addToCartService(cartPayload)}>
                                    ADD TO CART
                                  </button>
                                )
                              ) : (
                                <button disabled className="out-of-stock">OUT OF STOCK</button>
                              )}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="product-details-premium">
                            <span className="product-cat-tag">Collection</span>
                            <h4>
                              <Link to={`${process.env.PUBLIC_URL}/product/${item.slug || item.id}`}>
                                {item.name}
                              </Link>
                            </h4>

                            {/* Variant attribute chips */}
                            {attrs.length > 0 && (
                              <div className="wl-variant-chips">
                                <VariantChips attrs={attrs} fontSize={10} swatchSize={12} />
                              </div>
                            )}

                            <div className="price-rating-row" style={{ marginTop: attrs.length ? 6 : 0 }}>
                              <div className="premium-price">
                                {strike ? (
                                  <>
                                    <span className="new-price">₹{price}</span>
                                    <span className="old-price">₹{strike}</span>
                                  </>
                                ) : (
                                  <span className="new-price">₹{price}</span>
                                )}
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Empty State ── */
          <div style={{ textAlign:"center", padding:"100px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:18 }}>
            <div style={{ width:90, height:90, borderRadius:"50%", background:"#fff5f8", border:"2px solid #fce7f3", display:"flex", alignItems:"center", justifyContent:"center", fontSize:38 }}>
              <img src="/assets/img/icon-img/wishlist.png" className="img-fluid p-2" alt="" />
            </div>
            <h3 style={{ fontSize:22, fontWeight:800, color:"#111", margin:0 }}>Your wishlist is empty</h3>
            <p style={{ fontSize:14, color:"#888", margin:0 }}>Save items you love and come back to them anytime.</p>
            <Link
              to={process.env.PUBLIC_URL + "/shop"}
              style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"13px 28px", background:"linear-gradient(135deg,#b60410,#c01550)", color:"#fff", borderRadius:12, fontSize:14, fontWeight:700, textDecoration:"none", boxShadow:"0 4px 14px rgba(219,26,93,0.28)", marginTop:4 }}
            >
              Explore Products →
            </Link>
          </div>
        )}
      </LayoutOne>
    </Fragment>
  );
};

export default Wishlist;