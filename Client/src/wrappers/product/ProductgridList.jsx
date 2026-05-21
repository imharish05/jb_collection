// src/wrappers/product/ProductgridList.jsx
import PropTypes from "prop-types";
import React, { Fragment } from "react";
import { useSelector } from "react-redux";
import ProductGridListSingle from "../../components/product/ProductGridListSingle";

const ProductGridList = ({ products, spaceBottomClass, layout }) => {
  const currency = useSelector((state) => state.currency || { currencyName: "INR", currencyRate: 1, currencySymbol: "₹" });
  const { cartItems }    = useSelector((state) => state.cart);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { compareItems }  = useSelector((state) => state.compare);

  // Derive column class from layout string
  const colClass = layout === "list"
    ? "col-12"
    : layout?.includes("two-column")
      ? "col-xl-6 col-sm-6"
      : "col-xl-4 col-sm-6"; // default three-column

  return (
    <Fragment>
      {products?.map(product => (
        <div className={colClass} key={product.id}>
          <ProductGridListSingle
            spaceBottomClass={spaceBottomClass}
            layout={layout}
            product={product}
            currency={currency}
            cartItem={cartItems.find(i => i.id === product.id)}
            wishlistItem={wishlistItems.find(i => i.id === product.id)}
            compareItem={compareItems.find(i => i.id === product.id)}
          />
        </div>
      ))}
    </Fragment>
  );
};

ProductGridList.propTypes = {
  products: PropTypes.array,
  spaceBottomClass: PropTypes.string,
  layout: PropTypes.string,
};

export default ProductGridList;