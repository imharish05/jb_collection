import { Fragment, useState, useMemo } from "react";
import PropTypes from "prop-types";
import { EffectFade, Thumbs } from 'swiper';
import { Modal } from "react-bootstrap";
import { useSelector } from "react-redux";
import { addToWishlistService, addToCompareService, addToCartService } from "../../store/services";

import Rating from "./sub-components/ProductRating";
import Swiper, { SwiperSlide } from "../../components/swiper";
import { getProductCartQuantity } from "../../helpers/product";

const IMG_URL = process.env.REACT_APP_IMG_URL || "";

const resolveImg = (img) => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  if (img.startsWith("/assets")) return process.env.PUBLIC_URL + img;
  const clean = img.replace(/^\/?uploads\//, "");
  return `${IMG_URL}/uploads/${clean}`;
};

// ─── variant helpers (same logic as ProductDescriptionInfo) ───────────────────

function safeAttrs(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}

const hasBackendVariants = (p) => Array.isArray(p.Variants) && p.Variants.length > 0;
const hasOldVariation = (p) =>
  Array.isArray(p.variation) && p.variation.length > 0 && p.variation[0]?.color !== undefined;
const safeSize = (variation) => Array.isArray(variation?.size) ? variation.size : [];

const COLOR_MAP = {
  red:"#e53935",crimson:"#c62828",maroon:"#800000",scarlet:"#FF2400",ruby:"#9B111E",
  cherry:"#DE3163",orange:"#fb8c00",coral:"#ff7043",yellow:"#fdd835",gold:"#ffc107",
  amber:"#ffb300",green:"#43a047",olive:"#827717",lime:"#cddc39",emerald:"#50C878",
  teal:"#00897b",cyan:"#00bcd4",turquoise:"#26c6da",blue:"#1e88e5",navy:"#1a237e",
  skyblue:"#29b6f6","sky blue":"#29b6f6",cobalt:"#0047AB",indigo:"#3949ab",
  purple:"#7b1fa2",violet:"#6a1b9a",lavender:"#b39ddb",magenta:"#8e24aa",
  pink:"#e91e63",rose:"#f48fb1",white:"#ffffff",ivory:"#fffff0",cream:"#fffde7",
  silver:"#bdbdbd",grey:"#757575",gray:"#757575",charcoal:"#424242",black:"#212121",
  brown:"#795548",tan:"#a1887f",beige:"#f5f5dc",bronze:"#CD7F32",
  multicolour:"linear-gradient(135deg,#f06,#0cf,#fc0)",
  "gold-plated":"#CFB53B","rose gold":"#b76e79",
  all: "linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)",
};
const LIGHT_COLORS = new Set(["white","ivory","cream","yellow","lime","gold","amber","silver","bronze"]);
const dynamicColorMap = {};

function toHex(name) {
  if (!name) return null;
  const l = name.trim().toLowerCase();
  if (l.startsWith("#")) return l;
  return dynamicColorMap[l] || COLOR_MAP[l] || null;
}

const KEY_ALIASES = { color: "Colour", colour: "Colour", size: "Size", material: "Material", finish: "Finish", capacity: "Capacity" };
function normalKey(k) {
  if (!k) return "";
  const lower = k.trim().toLowerCase();
  if (KEY_ALIASES[lower]) return KEY_ALIASES[lower];
  return k.trim().charAt(0).toUpperCase() + k.trim().slice(1).toLowerCase();
}
const KEY_ORDER = ["Colour", "Size", "Material", "Finish", "Capacity"];

function buildOptionMap(variants) {
  const map = {};
  variants.forEach(v => {
    safeAttrs(v.attributes).forEach(a => {
      if (!a.key || !a.value || a.key === "Custom Note") return;
      const k = normalKey(a.key);
      if (!map[k]) map[k] = new Set();
      map[k].add(a.value);
    });
  });
  return map;
}

function compatibleValues(variants, selections, targetKey) {
  const compatible = new Set();
  variants.forEach(v => {
    const attrs = {};
    safeAttrs(v.attributes)
      .filter(a => a.key && a.value && a.key !== "Custom Note")
      .forEach(a => {
        const k = normalKey(a.key);
        if (!attrs[k]) attrs[k] = [];
        attrs[k].push(a.value);
      });
    const othersMatch = Object.entries(selections).every(([k, val]) => {
      if (k === targetKey || !val) return true;
      return attrs[k] && attrs[k].includes(val);
    });
    if (othersMatch && attrs[targetKey]) attrs[targetKey].forEach(val => compatible.add(val));
  });
  return compatible;
}

function findMatchingVariant(variants, selections) {
  const entries = Object.entries(selections).filter(([, v]) => v);
  if (!entries.length) return variants[0] || null;
  const exact = variants.find(v => {
    const attrs = {};
    safeAttrs(v.attributes).filter(a => a.key && a.value).forEach(a => {
      const k = normalKey(a.key);
      if (!attrs[k]) attrs[k] = [];
      attrs[k].push(a.value);
    });
    return entries.every(([k, val]) => attrs[k] && attrs[k].includes(val));
  });
  if (exact) return exact;
  let best = null, bestScore = -1;
  variants.forEach(v => {
    const attrs = {};
    safeAttrs(v.attributes).filter(a => a.key && a.value).forEach(a => {
      const k = normalKey(a.key);
      if (!attrs[k]) attrs[k] = [];
      attrs[k].push(a.value);
    });
    const score = entries.filter(([k, val]) => attrs[k] && attrs[k].includes(val)).length;
    if (score > bestScore) { bestScore = score; best = v; }
  });
  return best;
}

const ORANGE = "var(--theme-color)";
const ORANGE_LIGHT = "#FEF0EB";

// ─── AttributeGroup — identical UI to ProductDescriptionInfo ─────────────────
function AttributeGroup({ attrKey, allValues, selectedValue, compatibleSet, onSelect }) {
  const isColour = /colou?r/i.test(attrKey);
  return (
    <div style={{ marginBottom: 14, flex: "0 1 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 7 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {attrKey}
        </span>
        {selectedValue && (
          <span style={{ fontSize: 12, color: ORANGE, fontWeight: 600 }}>— {selectedValue}</span>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: isColour ? 10 : 8 }}>
        {[...allValues].map(val => {
          const isSelected = selectedValue === val;
          const isDisabled = !compatibleSet.has(val);
          const hex = isColour ? toHex(val) : null;
          const isLight = LIGHT_COLORS.has(val.toLowerCase());
          if (isColour && hex) {
            return (
              <button key={val} title={val} disabled={isDisabled} onClick={() => onSelect(isSelected ? null : val)}
                style={{
                  position:"relative", width:30, height:30, borderRadius:"50%", background:hex,
                  border: isSelected ? `3px solid ${ORANGE}` : isLight ? "2px solid #ccc" : "2px solid transparent",
                  boxShadow: isSelected ? `0 0 0 2px ${ORANGE_LIGHT},0 0 0 4px ${ORANGE}` : "0 1px 4px rgba(0,0,0,0.18)",
                  cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.35 : 1,
                  flexShrink:0, padding:0, overflow:"hidden",
                }}>
                {isDisabled && <span style={{ position:"absolute",inset:0,borderRadius:"50%",background:"repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.25) 4px,rgba(0,0,0,0.25) 5px)" }} />}
                {isSelected && <span style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:isLight?"#333":"#fff",fontSize:13,fontWeight:900 }}>✓</span>}
              </button>
            );
          }
          return (
            <button key={val} disabled={isDisabled} onClick={() => onSelect(isSelected ? null : val)}
              style={{
                position:"relative", padding:"5px 12px",
                border: `2px solid ${isSelected ? ORANGE : isDisabled ? "#e5e7eb" : "#d1d5db"}`,
                borderRadius:6,
                background: isSelected ? ORANGE_LIGHT : isDisabled ? "#f9fafb" : "#fff",
                color: isSelected ? ORANGE : isDisabled ? "#c0c4cc" : "#374151",
                fontWeight: isSelected ? 700 : 400, fontSize:13,
                cursor: isDisabled ? "not-allowed" : "pointer",
                fontFamily:"inherit", overflow:"hidden",
              }}>
              {isDisabled && <span style={{ position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%) rotate(-15deg)",width:"110%",height:1,background:"#d1d5db",pointerEvents:"none" }} />}
              {val}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
function ProductModal({ product, currency, discountedPrice, finalProductPrice, finalDiscountedPrice, show, onHide, wishlistItem, compareItem }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const { cartItems } = useSelector((state) => state.cart);

  // Populate dynamicColorMap from current variants
  if (product && Array.isArray(product.Variants)) {
    product.Variants.forEach(v => {
      let attrs = [];
      if (typeof v.attributes === "string") {
        try { attrs = JSON.parse(v.attributes); } catch (e) { attrs = []; }
      } else if (Array.isArray(v.attributes)) {
        attrs = v.attributes;
      }
      const colAttr = attrs.find(a => /colou?r/i.test(a.key));
      const hexAttr = attrs.find(a => /colourhex/i.test(a.key));
      if (colAttr && hexAttr) {
        dynamicColorMap[colAttr.value.toLowerCase().trim()] = hexAttr.value.trim();
      }
    });
  }

  const hasNewVar = hasBackendVariants(product);
  const hasOldVar = !hasNewVar && hasOldVariation(product);

  // ── Backend variant state: grouped selections ─────────────────────────────
  const optionMap = useMemo(() => hasNewVar ? buildOptionMap(product.Variants) : {}, [product]);
  const orderedKeys = useMemo(() => {
    if (!hasNewVar) return [];
    const keys = Object.keys(optionMap);
    return [...KEY_ORDER.filter(k => keys.includes(k)), ...keys.filter(k => !KEY_ORDER.includes(k))];
  }, [optionMap, hasNewVar]);

  const [selections, setSelections] = useState(() => {
    if (!hasNewVar || !product.Variants?.length) return {};
    const first = product.Variants[0];
    const init = {};
    safeAttrs(first.attributes).forEach(a => {
      if (a.key && a.value && a.key !== "Custom Note") init[normalKey(a.key)] = a.value;
    });
    return init;
  });

  const selectedVariant = useMemo(() =>
    hasNewVar ? findMatchingVariant(product.Variants, selections) : null,
    [selections, hasNewVar, product]
  );

  // ── Old variation state ───────────────────────────────────────────────────
  const firstVariation = hasOldVar ? product.variation[0] : null;
  const firstSize = firstVariation ? safeSize(firstVariation)[0] : null;
  const [selectedProductColor, setSelectedProductColor] = useState(hasOldVar ? (firstVariation?.color || "") : "");
  const [selectedProductSize, setSelectedProductSize] = useState(hasOldVar ? (firstSize?.name || "") : "");
  const [productStock, setProductStock] = useState(
    hasOldVar ? (firstSize?.stock ?? 10) : hasNewVar ? (product.Variants[0]?.stock ?? 10) : (product.stock ?? 10)
  );
  const [quantityCount, setQuantityCount] = useState(1);

  const effectiveStock = selectedVariant
    ? Number(selectedVariant.stock ?? 0)
    : productStock;

  const productCartQty = useMemo(() => {
    if (hasNewVar && selectedVariant) {
      const match = cartItems?.find(i => i.id === product.id && i.selectedVariantId === selectedVariant.id);
      return match ? match.quantity : 0;
    }
    return getProductCartQuantity(cartItems, product, selectedProductColor, selectedProductSize);
  }, [cartItems, product, selectedVariant, hasNewVar, selectedProductColor, selectedProductSize]);

  const handleSelect = (key, val) => {
    setSelections(prev => ({ ...prev, [key]: val || undefined }));
    setQuantityCount(1);
  };

  const gallerySwiperParams = {
    spaceBetween: 10, loop: true, effect: "fade",
    fadeEffect: { crossFade: true },
    thumbs: { swiper: thumbsSwiper },
    modules: [EffectFade, Thumbs],
  };
  const thumbnailSwiperParams = {
    onSwiper: setThumbsSwiper, spaceBetween: 10, slidesPerView: 4,
    touchRatio: 0.2, freeMode: true, loop: true, slideToClickedSlide: true, navigation: true,
  };

  const onCloseModal = () => { setThumbsSwiper(null); onHide(); };
  const images = Array.isArray(product.image) ? product.image : (product.image ? [product.image] : []);
  const currencySymbol = currency?.currencySymbol || "₹";

  return (
    <Modal show={show} onHide={onCloseModal} className="product-quickview-modal-wrapper">
      <Modal.Header closeButton></Modal.Header>

      <div className="modal-body">
        <div className="row">
          <div className="col-md-5 col-sm-12 col-xs-12">
            <div className="product-large-image-wrapper">
              <Swiper options={gallerySwiperParams}>
                {images.map((img, i) => (
                  <SwiperSlide key={i}>
                    <div className="single-image">
                      <img src={resolveImg(img)} className="img-fluid" alt="Product" />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            <div className="product-small-image-wrapper mt-15">
              <Swiper options={thumbnailSwiperParams}>
                {images.map((img, i) => (
                  <SwiperSlide key={i}>
                    <div className="single-image">
                      <img src={resolveImg(img)} className="img-fluid" alt="" />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          <div className="col-md-7 col-sm-12 col-xs-12">
            <div className="product-details-content quickview-content">
              <h2>{product.name}</h2>

              {/* Price */}
              <div className="product-details-price">
                {selectedVariant ? (
                  <Fragment>
                    <span>{currencySymbol}{parseFloat(selectedVariant.salesPrice).toFixed(2)}</span>
                    {Number(selectedVariant.mrp) > Number(selectedVariant.salesPrice) && (
                      <>{" "}<span className="old">{currencySymbol}{parseFloat(selectedVariant.mrp).toFixed(2)}</span></>
                    )}
                  </Fragment>
                ) : discountedPrice !== null ? (
                  <Fragment>
                    <span>{currencySymbol + finalDiscountedPrice}</span>{" "}
                    <span className="old">{currencySymbol + finalProductPrice}</span>
                  </Fragment>
                ) : (
                  <span>{currencySymbol + finalProductPrice}</span>
                )}
              </div>

              {product.rating && product.rating > 0 ? (
                <div className="pro-details-rating-wrap">
                  <div className="pro-details-rating">
                    <Rating ratingValue={product.rating} />
                  </div>
                </div>
              ) : null}

              <div className="pro-details-list">
                <p>{product.shortDescription}</p>
              </div>

              {/* ── Backend grouped variant selectors (same as product page) ── */}
              {hasNewVar && (
                <div className="pro-details-size-color" style={{ marginBottom: 8, display: "flex", flexWrap: "wrap", gap: "20px" }}>
                  {orderedKeys.map(key => (
                    <AttributeGroup
                      key={key}
                      attrKey={key}
                      allValues={optionMap[key]}
                      selectedValue={selections[key] || null}
                      compatibleSet={compatibleValues(product.Variants, selections, key)}
                      onSelect={(val) => handleSelect(key, val)}
                    />
                  ))}
                  {/* Stock badge */}
                  {selectedVariant && (
                    <div style={{ fontSize: 12, color: effectiveStock > 0 ? "#16a34a" : "#dc2626", fontWeight: 600, marginTop: 4 }}>
                      {effectiveStock > 0 ? `${effectiveStock} in stock` : "Out of stock"}
                    </div>
                  )}
                </div>
              )}

              {/* ── Old color/size variation ── */}
              {!hasNewVar && hasOldVar && (
                <div className="pro-details-size-color">
                  <div className="pro-details-color-wrap">
                    <span>Color</span>
                    <div className="pro-details-color-content">
                      {product.variation.map((single, key) => (
                        <label className={`pro-details-color-content--single ${single.color}`} key={key}>
                          <input type="radio" value={single.color} name="product-color"
                            checked={single.color === selectedProductColor ? "checked" : ""}
                            onChange={() => {
                              const sizes = safeSize(single);
                              setSelectedProductColor(single.color);
                              setSelectedProductSize(sizes[0]?.name || "");
                              setProductStock(sizes[0]?.stock ?? 10);
                              setQuantityCount(1);
                            }} />
                          <span className="checkmark"></span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="pro-details-size">
                    <span>Size</span>
                    <div className="pro-details-size-content">
                      {product.variation.map((single) =>
                        single.color === selectedProductColor
                          ? safeSize(single).map((singleSize, key) => (
                              <label className="pro-details-size-content--single" key={key}>
                                <input type="radio" value={singleSize.name}
                                  checked={singleSize.name === selectedProductSize ? "checked" : ""}
                                  onChange={() => { setSelectedProductSize(singleSize.name); setProductStock(singleSize.stock); setQuantityCount(1); }} />
                                <span className="size-name">{singleSize.name}</span>
                              </label>
                            ))
                          : ""
                      )}
                    </div>
                  </div>
                </div>
              )}

              {product.affiliateLink ? (
                <div className="pro-details-quality">
                  <div className="pro-details-cart btn-hover">
                    <a href={product.affiliateLink} rel="noopener noreferrer" target="_blank">Buy Now</a>
                  </div>
                </div>
              ) : (
                <div className="pro-details-quality">
                  <div className="cart-plus-minus">
                    <button onClick={() => setQuantityCount(quantityCount > 1 ? quantityCount - 1 : 1)} className="dec qtybutton">-</button>
                    <input className="cart-plus-minus-box" type="text" value={quantityCount} readOnly />
                    <button onClick={() => setQuantityCount(quantityCount < effectiveStock - productCartQty ? quantityCount + 1 : quantityCount)} className="inc qtybutton">+</button>
                  </div>
                  <div className="pro-details-cart btn-hover">
                    {effectiveStock > 0 ? (
                      <button
                        onClick={() => {
                          let variantColor = null, variantSize = null;
                          if (selectedVariant && Array.isArray(selectedVariant.attributes)) {
                            selectedVariant.attributes.forEach(a => {
                              const k = (a.key || "").toLowerCase();
                              if (k === "colour" || k === "color") variantColor = a.value;
                              if (k === "size") variantSize = a.value;
                            });
                          }
                          addToCartService({
                            ...product,
                            quantity: quantityCount,
                            price: selectedVariant ? parseFloat(selectedVariant.salesPrice) : (product.price || 0),
                            selectedVariantId: selectedVariant?.id || null,
                            selectedVariantName: selectedVariant?.variantName || null,
                            selectedProductColor: hasNewVar ? variantColor : selectedProductColor,
                            selectedProductSize: hasNewVar ? variantSize : selectedProductSize,
                          });
                        }}
                        disabled={productCartQty >= effectiveStock}
                      >
                        Add To Cart
                      </button>
                    ) : (
                      <button disabled>Out of Stock</button>
                    )}
                  </div>
                  <div className="pro-details-wishlist">
                    <button
                      className={wishlistItem !== undefined ? "active" : ""}
                      disabled={wishlistItem !== undefined}
                      title={wishlistItem !== undefined ? "Added to wishlist" : "Add to wishlist"}
                      onClick={() => addToWishlistService(product)}
                    >
                      <i className="pe-7s-like" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

ProductModal.propTypes = {
  currency: PropTypes.shape({}),
  discountedPrice: PropTypes.number,
  finalDiscountedPrice: PropTypes.number,
  finalProductPrice: PropTypes.number,
  onHide: PropTypes.func,
  product: PropTypes.shape({}),
  show: PropTypes.bool,
  wishlistItem: PropTypes.shape({}),
  compareItem: PropTypes.shape({}),
};

export default ProductModal;
