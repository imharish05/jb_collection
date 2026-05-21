import PropTypes from "prop-types";
import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { addToCartService, addToWishlistService } from "../../store/services";

import clsx from "clsx";
import { getDiscountPrice } from "../../helpers/product";
import ProductModal from "./ProductModal";




const ProductGridSingleFive = ({
  product,
  currency,
  cartItem,
  wishlistItem,
  spaceBottomClass
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
      <div className={clsx("product-wrap-3 scroll-zoom", spaceBottomClass)}>
        <div className="product-img">
          <Link to={process.env.PUBLIC_URL + "/product/" + product.id}>
            <img
              className="default-img"
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

          <div className="product-content-3-wrap">
            <div className="product-content-3">
              <div className="product-title">
                <h3>
                  <Link
                    to={process.env.PUBLIC_URL + "/product/" + product.id}
                  >
                    {product.name}
                  </Link>
                </h3>
              </div>
              <div className="price-3">
                {discountedPrice !== null ? (
                  <Fragment>
                    <span>
                      ₹{finalDiscountedPrice}
                    </span>{" "}
                    <span className="old">
                      ₹{finalProductPrice}
                    </span>
                  </Fragment>
                ) : (
                  <span>₹{finalProductPrice} </span>
                )}
              </div>
              <div className="product-action-3">
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
                    <i className="fa fa-heart-o" />
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
                      {" "}
                      <i className="fa fa-shopping-cart"></i>{" "}
                    </a>
                  ) : (product.variation && product.variation.length >= 1) || (Array.isArray(product.Variants) && product.Variants.length > 0) ? (
                    <Link
                      to={`${process.env.PUBLIC_URL}/product/${product.id}`}
                      title="Select options"
                    >
                      <i class="fa fa-cog"></i>
                    </Link>
                  ) : product.stock && product.stock > 0 ? (
                    <button
                      onClick={() => addToCartService(product)}
                      className={
                        cartItem !== undefined && cartItem.quantity > 0
                          ? "active"
                          : ""
                      }
                      disabled={
                        cartItem !== undefined && cartItem.quantity > 0
                      }
                      title={
                        cartItem !== undefined
                          ? "Added to cart"
                          : "Add to cart"
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
                </div>


                <div className="pro-same-action pro-quickview">
                  <button
                    onClick={() => setModalShow(true)}
                    title="Quick View"
                  >
                    <i className="fa fa-eye"></i>
                  </button>
                </div>
              </div>
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

ProductGridSingleFive.propTypes = {
  cartItem: PropTypes.shape({}),
  wishlistItem: PropTypes.shape({}),
  currency: PropTypes.shape({}),
  product: PropTypes.shape({}),
  spaceBottomClass: PropTypes.string
};

export default ProductGridSingleFive;

