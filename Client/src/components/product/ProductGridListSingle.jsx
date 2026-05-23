// src/components/product/ProductGridListSingle.jsx
import { Fragment, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { addToCartService, addToWishlistService } from "../../store/services";
import { getProductPrice } from "../../helpers/product";
import Rating from "./sub-components/ProductRating";
import ProductModal from "./ProductModal";
import { getImgUrl } from "../../helpers/imageUrl";

const ProductGridListSingle = ({
  product, currency, cartItem, wishlistItem, spaceBottomClass, layout
}) => {
  const [modalShow, setModalShow] = useState(false);

  // For wishlist: auto-select first active variant (same as what user would see first)
  const firstVariant = (Array.isArray(product.Variants) && product.Variants.length > 0)
    ? product.Variants[0]
    : (Array.isArray(product.variants) && product.variants.length > 0)
      ? product.variants[0]
      : null;

  // Wishlist icon is "active" only if the first variant (or product) is already wishlisted
  const isWishlisted = wishlistItem !== undefined && (
    firstVariant
      ? String(wishlistItem.selectedVariantId) === String(firstVariant.id)
      : true
  );

  const handleWishlistClick = () => {
    addToWishlistService(product, firstVariant?.id ?? null);
  };

  const images = Array.isArray(product.image)
    ? product.image.filter(Boolean)
    : product.image ? [product.image] : [];
  const mainImage  = images[0] ? getImgUrl(images[0]) : "/assets/img/products/products-1.jpeg";
  const hoverImage = images.length > 1 ? getImgUrl(images[1]) : null;
  const hasVariants = (Array.isArray(product.Variants) && product.Variants.length > 0)
                   || (Array.isArray(product.variants) && product.variants.length > 0);

  const rate = currency?.currencyRate || 1;

  // ── Prices straight from backend ──────────────────────────────────────────
  const { displayPrice, strikePrice, discountPct } = getProductPrice(product);
  const finalPrice      = +(displayPrice * rate).toFixed(2);
  const finalStrike     = strikePrice ? +(strikePrice * rate).toFixed(2) : null;

  return (
    <Fragment>

      {/* ── LIST VIEW ── */}
      {layout === "list" ? (
        <div className="shop-list-wrap-premium mb-30">
          <div className="row align-items-center">
            <div className="col-xl-4 col-md-5 col-sm-6">
              <div className="list-image-container">
                <Link to={process.env.PUBLIC_URL + "/product/" + product.id}>
                  <img
                    className="default-img img-fluid"
                    src={mainImage}
                    alt={product.name}
                  />
                </Link>
                {discountPct > 0 && <span className="list-badge">-{discountPct}%</span>}
              </div>
            </div>
            <div className="col-xl-8 col-md-7 col-sm-6">
              <div className="shop-list-content-premium">
                <span className="list-tag">Kamali Exclusive</span>
                <h3>
                  <Link to={process.env.PUBLIC_URL + "/product/" + product.id}>
                    {product.name}
                  </Link>
                </h3>
                <div className="list-price-rating">
                  <div className="premium-price">
                    {finalStrike ? (
                      <>
                        <span className="new-price">₹{finalPrice}</span>
                        <span className="old-price">₹{finalStrike}</span>
                      </>
                    ) : (
                      <span className="new-price">₹{finalPrice}</span>
                    )}
                  </div>
                  {product.rating > 0 && <Rating ratingValue={product.rating} />}
                </div>
                {product.shortDescription && (
                  <p className="list-desc">{product.shortDescription}</p>
                )}
                <div className="list-actions-group">
                  {hasVariants ? (
                    <Link
                      className="list-cart-btn"
                      to={process.env.PUBLIC_URL + "/product/" + product.id}
                    >
                      View Product
                    </Link>
                  ) : (() => {
                    const inCart = cartItem !== undefined && cartItem.quantity > 0;
                    return (
                      <button
                        className={clsx("list-cart-btn", inCart && "in-cart")}
                        onClick={() => !inCart && addToCartService(product)}
                        disabled={inCart}
                      >
                        {inCart ? "Added to Cart ✓" : "Add to Cart"}
                      </button>
                    );
                  })()}
                  <button
                    className={clsx("list-icon-btn", isWishlisted && "active")}
                    onClick={handleWishlistClick}
                  >
                    <i className="pe-7s-like" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      ) : (
        /* ── GRID VIEW ── */
        <div className={clsx("product-card-premium", spaceBottomClass, !hoverImage && "single-image-card")}>
          <div className="product-img-container">
            <Link to={process.env.PUBLIC_URL + "/product/" + product.id}>
              <img className="main-img" src={mainImage} alt={product.name} />
              {hoverImage && (
                <img className="secondary-img" src={hoverImage} alt={product.name} />
              )}
            </Link>
            <div className="premium-badges">
              {discountPct > 0 && <span className="badge-pink">-{discountPct}%</span>}
              {product.new === true && <span className="badge-navy">NEW</span>}
            </div>
            <div className="premium-action-list">
              <button
                onClick={handleWishlistClick}
                className={isWishlisted ? "active" : ""}
                title="Add to Wishlist"
              >
                <i className="pe-7s-like" />
              </button>
            </div>
            <div className="cart-action-overlay">
              {hasVariants ? (
                <Link
                  className="cart-action-btn"
                  to={process.env.PUBLIC_URL + "/product/" + product.id}
                >
                  View Product
                </Link>
              ) : product.stock && product.stock > 0 ? (() => {
                const inCart = cartItem !== undefined && cartItem.quantity > 0;
                return (
                  <button
                    onClick={() => !inCart && addToCartService(product)}
                    disabled={inCart}
                    className={inCart ? "in-cart" : ""}
                  >
                    {inCart ? "IN CART ✓" : "ADD TO CART"}
                  </button>
                );
              })() : (
                <button disabled className="out-of-stock">OUT OF STOCK</button>
              )}
            </div>
          </div>
          <div className="product-details-premium">
            <span className="product-cat-tag">Kamali Exclusive</span>
            <h4>
              <Link to={process.env.PUBLIC_URL + "/product/" + product.id}>
                {product.name}
              </Link>
            </h4>
            <div className="price-rating-row">
              <div className="premium-price">
                {finalStrike ? (
                  <>
                    <span className="new-price">₹{finalPrice}</span>
                    <span className="old-price">₹{finalStrike}</span>
                  </>
                ) : (
                  <span className="new-price">₹{finalPrice}</span>
                )}
              </div>
              {product.rating > 0 && (
                <div className="premium-rating">
                  <Rating ratingValue={product.rating} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ProductModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        product={product}
        currency={currency}
        discountedPrice={finalStrike ? finalPrice : null}
        finalProductPrice={finalStrike || finalPrice}
        finalDiscountedPrice={finalStrike ? finalPrice : null}
        wishlistItem={wishlistItem}
      />
    </Fragment>
  );
};

ProductGridListSingle.propTypes = {
  cartItem: PropTypes.shape({}),
  currency: PropTypes.shape({}),
  product: PropTypes.shape({}),
  spaceBottomClass: PropTypes.string,
  wishlistItem: PropTypes.shape({}),
  layout: PropTypes.string,
};

export default ProductGridListSingle;