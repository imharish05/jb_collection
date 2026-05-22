import PropTypes from "prop-types";
import { Fragment, useState } from "react";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { addToCartService, addToWishlistService } from "../../store/services";

import { getDiscountPrice } from "../../helpers/product";
import ProductModal from "./ProductModal";




const ProductGridSingleEleven = ({
  product,
  currency,
  cartItem,
  wishlistItem,
  spaceBottomClass,
  colorClass,
  productGridStyleClass
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
        <div className={clsx("product-wrap-10", spaceBottomClass, colorClass, productGridStyleClass)}>
          <div className="product-img">
            <Link to={process.env.PUBLIC_URL + "/product/" + product.id}>
              <img
                className="default-img img-fluid"
                src={getImgUrl(product.image[0])}
                alt=""
              />
              {product.image.length > 1 ? (
                <img
                  className="hover-img img-fluid"
                  src={getImgUrl(product.image[1])}
                  alt=""
                />
              ) : (
                ""
              )}
            </Link>
            {product.discount || product.new ? (
              <div className="product-img-badges">
                {product.discount ? <span>-{product.discount}%</span> : ""}
                {product.new ? <span>New</span> : ""}
              </div>
            ) : (
              ""
            )}

            <div className="product-action-2">
              {product.affiliateLink ? (
                <a
                  href={product.affiliateLink}
                  rel="noopener noreferrer"
                  target="_blank"
                  title="Buy now"
                >
                  {" "}
                  <i className="fa fa-shopping-cart"></i>{" "}
                </a>
              ) : (product.variation && product.variation.length >= 1) || (Array.isArray(product.Variants) && product.Variants.length > 0) ? (
                <Link
                  to={`${process.env.PUBLIC_URL}/product/${product.id}`}
                  title="Select options"
                >
                  <i className="fa fa-cog"></i>
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
                  {" "}
                  <i className="fa fa-shopping-cart"></i>{" "}
                </button>
              ) : (
                <button disabled className="active" title="Out of stock">
                  <i className="fa fa-shopping-cart"></i>
                </button>
              )}

              {/* <button onClick={() => setModalShow(true)} title="Quick View">
                <i className="fa fa-eye"></i>
              </button> */}

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
                <i className="fa fa-heart-o" />
              </button>
            </div>
          </div>
          <div className="product-content-2">
            <div className="title-price-wrap-2">
              <h3>
                <Link to={process.env.PUBLIC_URL + "/product/" + product.id}>
                  {product.name}
                </Link>
              </h3>
              <div className="price-2">
                {discountedPrice !== null ? (
                  <Fragment>
                    <span className="old">
                      ₹{finalProductPrice}
                    </span>
                    <span>
                      ₹{finalDiscountedPrice}
                    </span>{" "}
                  </Fragment>
                ) : (
                  <span>₹{finalProductPrice} </span>
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

ProductGridSingleEleven.propTypes = {
  cartItem: PropTypes.shape({}),
  currency: PropTypes.shape({}),
  product: PropTypes.shape({}),
  spaceBottomClass: PropTypes.string,
  colorClass: PropTypes.string,
  wishlistItem: PropTypes.shape({})
};

export default ProductGridSingleEleven;

