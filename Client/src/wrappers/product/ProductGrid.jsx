import { Fragment } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { getProducts } from "../../helpers/product";
import ProductGridSingle from "../../components/product/ProductGridSingle";

const ProductGrid = ({
  spaceBottomClass,
  category,
  type,
  limit,
  productsList
}) => {
  const { products } = useSelector((state) => state.product);
  const currency = useSelector((state) => state.currency || { currencyName: "INR", currencyRate: 1, currencySymbol: "₹" });
  const { cartItems } = useSelector((state) => state.cart);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { compareItems } = useSelector((state) => state.compare);
  const prods = Array.isArray(productsList) ? productsList.slice(0, limit ? limit : productsList.length) : getProducts(products, category, type, limit)
  
  return (
    <Fragment>
      {prods?.map(product => {
        return (
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12" key={product.id}>
            <ProductGridSingle
              spaceBottomClass={spaceBottomClass}
              product={product}
              currency={currency}
              cartItem={
                cartItems.find((cartItem) => cartItem.id === product.id)
              }
              wishlistItem={
                wishlistItems.find(
                  (wishlistItem) => wishlistItem.id === product.id
                )
              }
              compareItem={
                compareItems.find(
                  (compareItem) => compareItem.id === product.id
                )
              }
            />
          </div>
        );
      })}
    </Fragment>
  );
};

ProductGrid.propTypes = {
  spaceBottomClass: PropTypes.string,
  category: PropTypes.string,
  type: PropTypes.string,
  limit: PropTypes.number
};



export default ProductGrid;

