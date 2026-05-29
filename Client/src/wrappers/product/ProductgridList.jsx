// src/wrappers/product/ProductgridList.jsx
import PropTypes from "prop-types";
import React, { Fragment } from "react";
import { useSelector } from "react-redux";
import ProductGridListSingle from "../../components/product/ProductGridListSingle";
import ComboCard from "../../components/product/ComboCard";

const ProductGridList = ({ products, spaceBottomClass, layout, isComboMode, childCombos }) => {
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

  // ── Combo mode: render ComboCards instead of product cards ──
  if (isComboMode) {
    if (childCombos && childCombos.length > 0) {
      return (
        <Fragment>
          {childCombos.map(combo => (
            <div className={colClass} key={combo.id}>
              <ComboCard combo={combo} spaceBottomClass={spaceBottomClass} />
            </div>
          ))}
        </Fragment>
      );
    }
    return (
      <div className="col-12 text-center" style={{ padding: "40px 0", color: "#aaa" }}>
        <p>No combo offers found under this combo category.</p>
      </div>
    );
  }

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
            cartItems={cartItems.filter(i => i.id === product.id)}
            wishlistItems={wishlistItems.filter(i => i.id === product.id)}
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
  isComboMode: PropTypes.bool,
  childCombos: PropTypes.array,
};

export default ProductGridList;