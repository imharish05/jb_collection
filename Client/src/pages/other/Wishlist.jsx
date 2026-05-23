import { Fragment } from "react";
import { useSelector } from "react-redux";
import {
  addToCartService,
  deleteFromWishlistService,
  deleteAllFromWishlistService,
} from "../../store/services";
import { Link, useLocation } from "react-router-dom";
import { getDiscountPrice } from "../../helpers/product";
import { getImgUrl } from "../../helpers/imageUrl";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";

const parseJson = (val) => {
  if (!val || typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
};

const getFirstImage = (img) => {
  const arr = Array.isArray(img) ? img : parseJson(img);
  return Array.isArray(arr) ? arr[0] : arr || "";
};

/* ─── Inline styles ─────────────────────────────────────────────────────── */
const S = {
  page: {
    background: "#f7f8fa",
    minHeight: "60vh",
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 20px",
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#111",
    marginBottom: 24,
    letterSpacing: "-0.4px",
  },
  /* ── Grid of cards ── */
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 20,
    marginBottom: 32,
  },
  /* ── Single card ── */
  card: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #f0f0f0",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "box-shadow 0.2s, transform 0.2s",
    position: "relative",
  },
  imgWrap: {
    position: "relative",
    width: "100%",
    paddingBottom: "100%",
    background: "#f9f9f9",
    overflow: "hidden",
  },
  img: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.35s ease",
  },
  removeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.92)",
    border: "1.5px solid #f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 14,
    color: "#db1a5d",
    boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
    zIndex: 2,
    transition: "background 0.15s, transform 0.15s",
  },
  cardBody: {
    padding: "14px 16px 16px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111",
    textDecoration: "none",
    lineHeight: 1.4,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  priceRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  priceDiscounted: {
    fontSize: 16,
    fontWeight: 800,
    color: "#db1a5d",
  },
  priceOriginal: {
    fontSize: 13,
    color: "#aaa",
    textDecoration: "line-through",
  },
  priceNormal: {
    fontSize: 16,
    fontWeight: 800,
    color: "#111",
  },
  addToCartBtn: {
    marginTop: "auto",
    width: "100%",
    padding: "11px 0",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #db1a5d, #c01550)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.15s",
    boxShadow: "0 3px 10px rgba(219,26,93,0.25)",
    letterSpacing: "0.2px",
  },
  addToCartBtnAdded: {
    background: "#e5e7eb",
    color: "#888",
    boxShadow: "none",
    cursor: "not-allowed",
  },
  selectOptionBtn: {
    marginTop: "auto",
    display: "block",
    width: "100%",
    padding: "11px 0",
    borderRadius: 10,
    border: "1.5px solid #db1a5d",
    background: "#fff",
    color: "#db1a5d",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "center",
    textDecoration: "none",
    transition: "background 0.15s, color 0.15s",
    boxSizing: "border-box",
  },
  outOfStockBtn: {
    marginTop: "auto",
    width: "100%",
    padding: "11px 0",
    borderRadius: 10,
    border: "none",
    background: "#f3f4f6",
    color: "#aaa",
    fontSize: 13,
    fontWeight: 700,
    cursor: "not-allowed",
  },
  /* ── Footer row ── */
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  continueShopping: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "11px 22px",
    background: "#fff",
    border: "1.5px solid #e0e0e0",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    color: "#333",
    textDecoration: "none",
    transition: "border-color 0.2s, background 0.2s",
  },
  clearBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "11px 22px",
    background: "#fff5f8",
    border: "1.5px solid #fca5a5",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    color: "#db1a5d",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  /* ── Empty state ── */
  emptyWrap: {
    textAlign: "center",
    padding: "80px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: "50%",
    background: "#fff5f8",
    border: "2px solid #fce7f3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 38,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#111",
    margin: 0,
  },
  emptySub: {
    fontSize: 14,
    color: "#888",
    margin: 0,
  },
  emptyShopBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "13px 28px",
    background: "linear-gradient(135deg, #db1a5d, #c01550)",
    color: "#fff",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    boxShadow: "0 4px 14px rgba(219,26,93,0.28)",
    transition: "opacity 0.2s",
    marginTop: 4,
  },
  itemCount: {
    fontSize: 13,
    color: "#888",
    marginBottom: 20,
    fontWeight: 500,
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   Wishlist Component
══════════════════════════════════════════════════════════════════════════ */
const Wishlist = () => {
  const { pathname } = useLocation();

  const currency = useSelector(
    (state) =>
      state.currency || { currencyName: "INR", currencyRate: 1, currencySymbol: "₹" }
  );
  const { wishlistItems } = useSelector((state) => state.wishlist || []);
  const { cartItems } = useSelector((state) => state.cart);

  return (
    <Fragment>
      <SEO
        titleTemplate="Wishlist — Kamali Gifts"
        description="Your saved wishlist items."
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Wishlist", path: process.env.PUBLIC_URL + pathname },
          ]}
        />

        <div style={S.page}>
          <div style={S.container}>

            {wishlistItems && wishlistItems.length >= 1 ? (
              <Fragment>
                <h3 style={S.pageTitle}>My Wishlist</h3>
                <p style={S.itemCount}>
                  {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved
                </p>

                {/* ── Card Grid ── */}
                <div style={S.grid}>
                  {wishlistItems.map((item, key) => {
                    // ── Mirror variant-aware price logic from ProductGridListSingle ──
                    const hasVariants = Array.isArray(item.Variants) && item.Variants.length > 0;
                    const firstVariant = hasVariants ? item.Variants[0] : null;
                    const firstVariantSalesPrice = firstVariant ? parseFloat(firstVariant.salesPrice || 0) : 0;
                    const firstVariantMrp = firstVariant ? parseFloat(firstVariant.mrp || 0) : 0;

                    // basePrice = first variant salesPrice if available, else item.price
                    const basePrice = firstVariantSalesPrice > 0 ? firstVariantSalesPrice : item.price;
                    // mrpPrice = show strikethrough only when mrp > salesPrice
                    const mrpPrice = firstVariantMrp > firstVariantSalesPrice ? firstVariantMrp : null;

                    const finalPrice = mrpPrice
                      ? +(mrpPrice * currency.currencyRate).toFixed(2)
                      : +(basePrice * currency.currencyRate).toFixed(2);

                    const finalDiscounted = mrpPrice
                      ? +(firstVariantSalesPrice * currency.currencyRate).toFixed(2)
                      : getDiscountPrice(basePrice, item.discount)
                        ? +(getDiscountPrice(basePrice, item.discount) * currency.currencyRate).toFixed(2)
                        : null;
                    const cartItem = cartItems.find((c) => c.id === item.id);
                    const inCart = cartItem !== undefined && cartItem.quantity > 0;

                    return (
                      <div
                        key={key}
                        style={S.card}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow =
                            "0 8px 28px rgba(219,26,93,0.13)";
                          e.currentTarget.style.transform = "translateY(-3px)";
                          const img = e.currentTarget.querySelector(".wl-img");
                          if (img) img.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow =
                            "0 2px 12px rgba(0,0,0,0.05)";
                          e.currentTarget.style.transform = "translateY(0)";
                          const img = e.currentTarget.querySelector(".wl-img");
                          if (img) img.style.transform = "scale(1)";
                        }}
                      >
                        {/* Remove button */}
                        <button
                          style={S.removeBtn}
                          onClick={() => deleteFromWishlistService(item.id)}
                          title="Remove from wishlist"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#db1a5d";
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "rgba(255,255,255,0.92)";
                            e.currentTarget.style.color = "#db1a5d";
                          }}
                        >
                          ✕
                        </button>

                        {/* Image */}
                        <Link
                          to={`${process.env.PUBLIC_URL}/product/${item.id}`}
                          style={S.imgWrap}
                        >
                          <img
                            className="wl-img"
                            style={S.img}
                            src={getImgUrl(getFirstImage(item.image))}
                            alt={item.name}
                            onError={(e) => {
                              e.target.src = "/assets/img/products/products-1.jpeg";
                            }}
                          />
                        </Link>

                        {/* Body */}
                        <div style={S.cardBody}>
                          <Link
                            to={`${process.env.PUBLIC_URL}/product/${item.id}`}
                            style={S.productName}
                          >
                            {item.name}
                          </Link>

                          {/* Price */}
                          <div style={S.priceRow}>
                            {finalDiscounted ? (
                              <>
                                <span style={S.priceDiscounted}>₹{finalDiscounted}</span>
                                <span style={S.priceOriginal}>₹{finalPrice}</span>
                              </>
                            ) : (
                              <span style={S.priceNormal}>₹{finalPrice}</span>
                            )}
                          </div>

                          {/* CTA */}
                          {item.affiliateLink ? (
                            <a
                              href={item.affiliateLink}
                              rel="noopener noreferrer"
                              target="_blank"
                              style={S.addToCartBtn}
                            >
                              Buy Now ↗
                            </a>
                          ) : item.variation && item.variation.length >= 1 ? (
                            <Link
                              to={`${process.env.PUBLIC_URL}/product/${item.id}`}
                              style={S.selectOptionBtn}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#db1a5d";
                                e.currentTarget.style.color = "#fff";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#fff";
                                e.currentTarget.style.color = "#db1a5d";
                              }}
                            >
                              Select Options
                            </Link>
                          ) : item.stock && item.stock > 0 ? (
                            <button
                              style={
                                inCart
                                  ? { ...S.addToCartBtn, ...S.addToCartBtnAdded }
                                  : S.addToCartBtn
                              }
                              onClick={() => !inCart && addToCartService(item)}
                              disabled={inCart}
                              onMouseEnter={(e) => {
                                if (!inCart) e.currentTarget.style.opacity = "0.88";
                              }}
                              onMouseLeave={(e) => {
                                if (!inCart) e.currentTarget.style.opacity = "1";
                              }}
                            >
                              {inCart ? "✓ Added to Cart" : "Add to Cart"}
                            </button>
                          ) : (
                            <button style={S.outOfStockBtn} disabled>
                              Out of Stock
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Footer actions ── */}
                <div style={S.footer}>
                  <Link
                    to={process.env.PUBLIC_URL + "/shop"}
                    style={S.continueShopping}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#db1a5d";
                      e.currentTarget.style.background = "#fff5f8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e0e0e0";
                      e.currentTarget.style.background = "#fff";
                    }}
                  >
                    ← Continue Shopping
                  </Link>
                  <button
                    style={S.clearBtn}
                    onClick={() => deleteAllFromWishlistService()}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fee2e2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff5f8";
                    }}
                  >
                    🗑 Clear Wishlist
                  </button>
                </div>
              </Fragment>
            ) : (
              /* ── Empty State ── */
              <div style={S.emptyWrap}>
                <div style={S.emptyIconCircle}>🤍</div>
                <h3 style={S.emptyTitle}>Your wishlist is empty</h3>
                <p style={S.emptySub}>
                  Save items you love and come back to them anytime.
                </p>
                <Link
                  to={process.env.PUBLIC_URL + "/shop"}
                  style={S.emptyShopBtn}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Explore Products →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Responsive overrides via <style> tag ── */}
        <style>{`
          @media (max-width: 600px) {
            .wl-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 12px !important;
            }
          }
          @media (max-width: 360px) {
            .wl-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </LayoutOne>
    </Fragment>
  );
};

export default Wishlist;