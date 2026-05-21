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

// Safe helpers — backend products may have empty/null variation or size
const hasBackendVariants = (p) => Array.isArray(p.Variants) && p.Variants.length > 0;

const hasOldVariation = (p) =>
  Array.isArray(p.variation) &&
  p.variation.length > 0 &&
  p.variation[0]?.color !== undefined;

const safeSize = (variation) =>
  Array.isArray(variation?.size) ? variation.size : [];

function ProductModal({ product, currency, discountedPrice, finalProductPrice, finalDiscountedPrice, show, onHide, wishlistItem, compareItem }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const { cartItems } = useSelector((state) => state.cart);

  const hasOldVar = hasOldVariation(product);
  const firstVariation = hasOldVar ? product.variation[0] : null;
  const firstSize = firstVariation ? safeSize(firstVariation)[0] : null;

  const hasNewVar = hasBackendVariants(product);

  const [selectedVariantId, setSelectedVariantId] = useState(
    hasNewVar ? product.Variants[0].id : null
  );
  const [selectedProductColor, setSelectedProductColor] = useState(
    hasOldVar ? (firstVariation?.color || "") : ""
  );
  const [selectedProductSize, setSelectedProductSize] = useState(
    hasOldVar ? (firstSize?.name || "") : ""
  );
  const [productStock, setProductStock] = useState(
    hasOldVar
      ? (firstSize?.stock ?? 10)
      : hasNewVar
        ? (product.Variants[0]?.stock ?? 10)
        : (product.stock ?? 10)
  );
  const [quantityCount, setQuantityCount] = useState(1);

  const selectedVariant = hasNewVar
    ? (product.Variants.find((v) => v.id === selectedVariantId) || product.Variants[0])
    : null;

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

  const gallerySwiperParams = {
    spaceBetween: 10,
    loop: true,
    effect: "fade",
    fadeEffect: { crossFade: true },
    thumbs: { swiper: thumbsSwiper },
    modules: [EffectFade, Thumbs],
  };

  const thumbnailSwiperParams = {
    onSwiper: setThumbsSwiper,
    spaceBetween: 10,
    slidesPerView: 4,
    touchRatio: 0.2,
    freeMode: true,
    loop: true,
    slideToClickedSlide: true,
    navigation: true,
  };

  const onCloseModal = () => {
    setThumbsSwiper(null);
    onHide();
  };

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

              {/* Backend flat Variants */}
              {hasNewVar && (
                <div className="pro-details-size-color" style={{ marginBottom: 16 }}>
                  <div className="pro-details-size">
                    <span>Variant</span>
                    <div className="pro-details-size-content" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {product.Variants.map((v) => (
                        <label className="pro-details-size-content--single" key={v.id} style={{ cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="product-variant"
                            value={v.id}
                            checked={selectedVariantId === v.id}
                            onChange={() => { setSelectedVariantId(v.id); setQuantityCount(1); }}
                            style={{ display: "none" }}
                          />
                          <span
                            className="size-name"
                            style={{
                              padding: "6px 12px",
                              border: `2px solid ${selectedVariantId === v.id ? "#F15A24" : "#ddd"}`,
                              borderRadius: 6,
                              background: selectedVariantId === v.id ? "#FEF0EB" : "#fff",
                              color: selectedVariantId === v.id ? "#F15A24" : "#333",
                              fontWeight: selectedVariantId === v.id ? 700 : 400,
                              fontSize: 13,
                              display: "block",
                            }}
                          >
                            {v.variantName || `Variant ${v.id}`}
                            {v.salesPrice ? <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.75 }}>₹{v.salesPrice}</span> : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Old color/size variation */}
              {!hasNewVar && hasOldVar && (
                <div className="pro-details-size-color">
                  <div className="pro-details-color-wrap">
                    <span>Color</span>
                    <div className="pro-details-color-content">
                      {product.variation.map((single, key) => (
                        <label className={`pro-details-color-content--single ${single.color}`} key={key}>
                          <input
                            type="radio"
                            value={single.color}
                            name="product-color"
                            checked={single.color === selectedProductColor ? "checked" : ""}
                            onChange={() => {
                              const sizes = safeSize(single);
                              setSelectedProductColor(single.color);
                              setSelectedProductSize(sizes[0]?.name || "");
                              setProductStock(sizes[0]?.stock ?? 10);
                              setQuantityCount(1);
                            }}
                          />
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
                                <input
                                  type="radio"
                                  value={singleSize.name}
                                  checked={singleSize.name === selectedProductSize ? "checked" : ""}
                                  onChange={() => {
                                    setSelectedProductSize(singleSize.name);
                                    setProductStock(singleSize.stock);
                                    setQuantityCount(1);
                                  }}
                                />
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
                    <button
                      onClick={() => setQuantityCount(quantityCount > 1 ? quantityCount - 1 : 1)}
                      className="dec qtybutton"
                    >-</button>
                    <input className="cart-plus-minus-box" type="text" value={quantityCount} readOnly />
                    <button
                      onClick={() =>
                        setQuantityCount(
                          quantityCount < effectiveStock - productCartQty
                            ? quantityCount + 1
                            : quantityCount
                        )
                      }
                      className="inc qtybutton"
                    >+</button>
                  </div>
                  <div className="pro-details-cart btn-hover">
                    {effectiveStock > 0 ? (
                      <button
                        onClick={() => {
                          let variantColor = null, variantSize = null;
                          if (selectedVariant && Array.isArray(selectedVariant.attributes)) {
                            selectedVariant.attributes.forEach(a => {
                              const k = (a.key || '').toLowerCase();
                              if (k === 'colour' || k === 'color') variantColor = a.value;
                              if (k === 'size') variantSize = a.value;
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
                          })
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