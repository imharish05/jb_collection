import PropTypes from "prop-types";
import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { addToCartService, addToWishlistService } from "../../store/services";

import clsx from "clsx";
import { getDiscountPrice } from "../../helpers/product";
import Rating from "./sub-components/ProductRating";
import ProductModal from "./ProductModal";




const ProductGridSingleEight = ({
  product,
  currency,
  cartItem,
  wishlistItem,
  spaceBottomClass,
  colorClass
}) => {
  const [modalShow, setModalShow] = useState(false);
  const discountedPrice = getDiscountPrice(product.price, product.discount);
  const currencyRate = currency?.currencyRate || 1;
  const currencySymbol = currency?.currencySymbol || "₹";
  const finalProductPrice = +(product.price * currencyRate).toFixed(2);
  const finalDiscountedPrice = +(
    discountedPrice * currencyRate
  ).toFixed(2);
  

  return (
    <Fragment>
      <div className={clsx("product-wrap-8", spaceBottomClass, colorClass)}>
        <div className="product-img">
          <Link to={process.env.PUBLIC_URL + "/product/" + product.id}>
            <img
              className="default-img img-fluid"
              src={getImgUrl(product.image[0])}
              alt=""
            />
          </Link>
          {product.discount || product.new ? (
            <div className="product-img-badges">
              {product.discount ? (
                <span className="pink">-{product.discount}%</span>
              ) : (
                ""
              )}
              {product.new ? <span className="purple">New</span> : ""}
            </div>
          ) : (
            ""
          )}
        </div>
        <div className="product-content">
          <h3>
            <Link to={process.env.PUBLIC_URL + "/product/" + product.id}>
              {product.name}
            </Link>
          </h3>

          <div className="product-price">
            {discountedPrice !== null ? (
              <Fragment>
                <span className="old">
                  ₹{finalProductPrice}
                </span>
                <span>₹{finalDiscountedPrice}</span>
              </Fragment>
            ) : (
              <span>{currencySymbol + finalProductPrice} </span>
            )}
          </div>

          {product.rating && product.rating > 0 ? (
            <div className="product-rating">
              <Rating ratingValue={product.rating} />
            </div>
          ) : (
            ""
          )}

          <div className="product-action">
            <div className="pro-same-action pro-wishlist">
              <button
                className={wishlistItem !== undefined ? "active" : ""}
                disabled={wishlistItem !== undefined}
                title={
                  wishlistItem !== undefined
                    ? "Added to wishlist"
                    : "Add to wishlist"
                }
                onClick={() => addToWishlistService(product)}
              >
                <i className="pe-7s-like" />
              </button>
            </div>
            <div className="pro-same-action pro-cart">
              {product.affiliateLink ? (
                <a
                  href={product.affiliateLink}
                  rel="noopener noreferrer"
                  target="_blank"
                  title="Buy now"
                >
                  <i className="pe-7s-cart"></i>
                </a>
              ) : (product.variation && product.variation.length >= 1) || (Array.isArray(product.Variants) && product.Variants.length > 0) ? (
                <Link
                  to={`${process.env.PUBLIC_URL}/product/${product.id}`}
                  title="Select option"
                >
                  <i className="pe-7s-cart"></i>
                </Link>
              ) : product.stock && product.stock > 0 ? (
                <button
                  onClick={() => addToCartService(product)}
                  className={
                    cartItem !== undefined && cartItem.quantity > 0
                      ? "active"
                      : ""
                  }
                  disabled={cartItem !== undefined && cartItem.quantity > 0}
                  title={
                    cartItem !== undefined ? "Added to cart" : "Add to cart"
                  }
                >
                  <i className="pe-7s-cart"></i>
                </button>
              ) : (
                <button disabled className="active" title="Out of stock">
                  <i className="pe-7s-cart"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* product modal */}
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

ProductGridSingleEight.propTypes = {
  cartItem: PropTypes.shape({}),
  currency: PropTypes.shape({}),
  product: PropTypes.shape({}),
  sliderClassName: PropTypes.string,
  spaceBottomClass: PropTypes.string,
  colorClass: PropTypes.string,
  wishlistItem: PropTypes.shape({})
};

export default ProductGridSingleEight;

