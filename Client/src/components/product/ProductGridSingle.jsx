import { getImgUrl } from "../../helpers/imageUrl";
import { Fragment, useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCartService, addToWishlistService } from "../../store/services";
import Rating from "./sub-components/ProductRating";
import { getDiscountPrice } from "../../helpers/product";
import ProductModal from "./ProductModal";
import cogoToast from "cogo-toast";

const ProductGridSingle = ({
  product,
  currency,
  cartItem,
  wishlistItem,
  spaceBottomClass,
}) => {
  const [modalShow, setModalShow] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const currencyRate = currency?.currencyRate || 1;
  const discountedPrice = getDiscountPrice(product.price, product.discount);
  const finalProductPrice = +(product.price * currencyRate).toFixed(2);
  const finalDiscountedPrice = +(discountedPrice * currencyRate).toFixed(2);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      cogoToast.warn("Please login to add items to cart", { position: "top-center" });
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`${process.env.PUBLIC_URL}/login?redirect=${redirect}`);
      return;
    }
    if (Array.isArray(product.Variants) && product.Variants.length > 0) {
      cogoToast.warn("Please select product options first", { position: "top-center" });
      navigate(process.env.PUBLIC_URL + "/product/" + product.id);
      return;
    }
    if (!product.stock || Number(product.stock) <= 0) {
      cogoToast.warn("This product is out of stock", { position: "top-center" });
      return;
    }
    addToCartService(dispatch, product);
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      cogoToast.warn("Please login to save to wishlist", { position: "top-center" });
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`${process.env.PUBLIC_URL}/login?redirect=${redirect}`);
      return;
    }
    addToWishlistService(product);
  };

  return (
    <Fragment>
      <div className={clsx("product-card-premium", spaceBottomClass, product.image?.length === 1 && "single-image-card")}>
        <div className="product-img-container">
          <Link to={process.env.PUBLIC_URL + "/product/" + product.id}>
            <img
              className="main-img"
              src={`${process.env.REACT_APP_IMG_URL}/uploads/${(product.image[0] || '').replace(/^\/?uploads\//, '')}`}
              alt={product.name}
              onError={e => { e.target.src = process.env.PUBLIC_URL + '/assets/img/products/products-1.jpeg'; }}
            />
            {product.image.length > 1 && (
              <img
                className="secondary-img"
                src={`${process.env.REACT_APP_IMG_URL}/uploads/${(product.image[1] || '').replace(/^\/?uploads\//, '')}`}
                alt={product.name}
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
          </Link>

          {/* Badges */}
          <div className="premium-badges">
            {product.discount > 0 && (
              <span className="badge-pink">-{product.discount}%</span>
            )}
            {product.new === true && <span className="badge-navy">NEW</span>}
          </div>

          {/* Floating Actions */}
          <div className="premium-action-list">
            <button
              onClick={handleWishlist}
              className={wishlistItem !== undefined ? "active" : ""}
              title={wishlistItem !== undefined ? "Added to Wishlist" : "Add to Wishlist"}
            >
              <i className="pe-7s-like" />
            </button>
            <button title="Quick View" onClick={() => setModalShow(true)}>
              <i className="pe-7s-look" />
            </button>
          </div>

          {/* Add to Cart Overlay */}
          <div className="cart-action-overlay">
            {product.stock && product.stock > 0 ? (
              Array.isArray(product.Variants) && product.Variants.length > 0 ? (
                <button onClick={handleAddToCart}>
                  SELECT OPTIONS
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={
                    isAuthenticated && cartItem !== undefined && cartItem.quantity > 0
                  }
                >
                  {isAuthenticated && cartItem !== undefined && cartItem.quantity > 0
                    ? "IN CART"
                    : "ADD TO CART"}
                </button>
              )
            ) : (
              <button disabled className="out-of-stock">
                OUT OF STOCK
              </button>
            )}
          </div>
        </div>

        <div className="product-details-premium">
          <span className="product-cat-tag">Collection</span>
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

      {/* Quick View Modal */}
      {modalShow && (
        <ProductModal
          show={modalShow}
          onHide={() => setModalShow(false)}
          product={product}
          currency={currency}
          discountedPrice={discountedPrice}
          finalProductPrice={finalProductPrice}
          finalDiscountedPrice={finalDiscountedPrice}
          cartItem={cartItem}
          wishlistItem={wishlistItem}
        />
      )}
    </Fragment>
  );
};

ProductGridSingle.propTypes = {
  cartItem: PropTypes.shape({}),
  currency: PropTypes.shape({}),
  product: PropTypes.shape({}),
  spaceBottomClass: PropTypes.string,
  wishlistItem: PropTypes.shape({}),
};

export default ProductGridSingle;