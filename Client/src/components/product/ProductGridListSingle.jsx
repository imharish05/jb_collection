// src/components/product/ProductGridListSingle.jsx
import { Fragment, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { addToCartService, addToWishlistService } from "../../store/services";
import { getDiscountPrice } from "../../helpers/product";
import Rating from "./sub-components/ProductRating";
import ProductModal from "./ProductModal";
import { getImgUrl } from "../../helpers/imageUrl";


const ProductGridListSingle = ({
  product, currency, cartItem, wishlistItem, spaceBottomClass, layout
}) => {
  const [modalShow, setModalShow] = useState(false);

  const images = Array.isArray(product.image)
    ? product.image.filter(Boolean)
    : product.image
      ? [product.image]
      : [];
  const mainImage = images[0] ? getImgUrl(images[0]) : "/assets/img/products/products-1.jpeg";
  const hoverImage = images.length > 1 ? getImgUrl(images[1]) : null;
  const hasVariants = Array.isArray(product.Variants) && product.Variants.length > 0;

  const currencyRate = currency?.currencyRate || 1;

  // ── Use first variant price (salesPrice / mrp), fall back to product.price ──
  const firstVariant = hasVariants ? product.Variants[0] : null;
  const firstVariantSalesPrice = firstVariant ? parseFloat(firstVariant.salesPrice || 0) : 0;
  const firstVariantMrp = firstVariant ? parseFloat(firstVariant.mrp || 0) : 0;

  // basePrice = first variant salesPrice if available, else product.price
  const basePrice = firstVariantSalesPrice > 0 ? firstVariantSalesPrice : product.price;

  // Compute discount from first variant's mrp vs salesPrice (real discount)
  // Fall back to product.discount if no variant data
  let variantDiscount = product.discount;
  if (firstVariant && firstVariantMrp > 0 && firstVariantSalesPrice > 0 && firstVariantMrp > firstVariantSalesPrice) {
    variantDiscount = Math.round((1 - firstVariantSalesPrice / firstVariantMrp) * 100);
  }

  // mrpPrice = first variant mrp for strikethrough display
  const mrpPrice = firstVariantMrp > firstVariantSalesPrice ? firstVariantMrp : null;

  const discountedPrice = mrpPrice
    ? +(firstVariantSalesPrice * currencyRate).toFixed(2)
    : getDiscountPrice(basePrice, product.discount)
      ? +(getDiscountPrice(basePrice, product.discount) * currencyRate).toFixed(2)
      : null;

  const finalProductPrice = mrpPrice
    ? +(mrpPrice * currencyRate).toFixed(2)
    : +(basePrice * currencyRate).toFixed(2);

  const finalDiscountedPrice = discountedPrice;

  return (
    <Fragment>

      {/* ── LIST VIEW ── only when layout === "list" */}
      {layout === "list" ? (
        <div className="shop-list-wrap-premium mb-30">
          <div className="row align-items-center">
            <div className="col-xl-4 col-md-5 col-sm-6">
              <div className="list-image-container">
                <Link to={process.env.PUBLIC_URL + "/product/" + product.id}>
                  <img
                    className="default-img img-fluid"
                    src={getImgUrl(product.image[0])}
                    alt={product.name}
                  />
                </Link>
                {variantDiscount > 0 && <span className="list-badge">-{variantDiscount}%</span>}
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
                    {discountedPrice !== null ? (
                      <>
                        <span className="new-price">₹{finalDiscountedPrice}</span>
                        <span className="old-price">₹{finalProductPrice}</span>
                      </>
                    ) : (
                      <span className="new-price">₹{finalProductPrice}</span>
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
                  ) : (
                    <button
                      className="list-cart-btn"
                      onClick={() => addToCartService(product)}
                      disabled={cartItem !== undefined && cartItem.quantity > 0}
                    >
                      {cartItem !== undefined && cartItem.quantity > 0 ? "Added to Cart" : "Add to Cart"}
                    </button>
                  )}
                  <button
                    className={clsx("list-icon-btn", wishlistItem && "active")}
                    onClick={() => addToWishlistService(product)}
                  >
                    <i className="pe-7s-like" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      ) : (
        /* ── GRID VIEW ── for two-column and three-column */
        <div className={clsx("product-card-premium", spaceBottomClass, !hoverImage && "single-image-card")}>
          <div className="product-img-container">
            <Link to={process.env.PUBLIC_URL + "/product/" + product.id}>
              <img className="main-img" src={mainImage} alt={product.name} />
              {hoverImage && (
                <img className="secondary-img" src={hoverImage} alt={product.name} />
              )}
            </Link>
            {/* CORRECT - only renders when discount is actually > 0 */}
<div className="premium-badges">
  {variantDiscount > 0 && <span className="badge-pink">-{variantDiscount}%</span>}
  {product.new === true && <span className="badge-navy">NEW</span>}
</div>
            <div className="premium-action-list">
              <button
                onClick={() => addToWishlistService(product)}
                className={wishlistItem !== undefined ? "active" : ""}
                title="Wishlist"
              >
                <i className="pe-7s-like" />
              </button>
              {/* <button title="Quick View" onClick={() => setModalShow(true)}>
                <i className="pe-7s-look" />
              </button> */}
            </div>
            <div className="cart-action-overlay">
              {hasVariants ? (
                <Link
                  className="cart-action-btn"
                  to={process.env.PUBLIC_URL + "/product/" + product.id}
                >
                  View Product
                </Link>
              ) : product.stock && product.stock > 0 ? (
                <button
                  onClick={() => addToCartService(product)}
                  disabled={cartItem !== undefined && cartItem.quantity > 0}
                >
                  {cartItem !== undefined && cartItem.quantity > 0 ? "IN CART" : "ADD TO CART"}
                </button>
              ) : (
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
                {discountedPrice !== null ? (
                  <>
                    <span className="new-price">₹{finalDiscountedPrice}</span>
                    <span className="old-price">₹{finalProductPrice}</span>
                  </>
                ) : (
                  <span className="new-price">₹{finalProductPrice}</span>
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
        discountedPrice={discountedPrice}
        finalProductPrice={finalProductPrice}
        finalDiscountedPrice={finalDiscountedPrice}
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