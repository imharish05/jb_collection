// src/wrappers/product/ProductgridList.jsx
import PropTypes from "prop-types";
import React, { Fragment } from "react";
import { useSelector } from "react-redux";
import ProductGridListSingle from "../../components/product/ProductGridListSingle";
import ComboCard from "../../components/product/ComboCard";
import ProductSkeleton from "../../components/product/ProductSkeleton";

const ProductGridList = ({ products, spaceBottomClass, layout, isLoadingMore }) => {
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

  if (!products || (products.length === 0 && !isLoadingMore)) {
    return (
      <div className="col-12 text-center" style={{ padding: "40px 0", color: "#aaa" }}>
        <p>No items found matching your filters.</p>
      </div>
    );
  }

  return (
    <Fragment>
      {products.map(item => (
        <div className={colClass} key={item.id}>
          {item.isCombo ? (
            <ComboCard combo={item} spaceBottomClass={spaceBottomClass} />
          ) : (
            <ProductGridListSingle
              spaceBottomClass={spaceBottomClass}
              layout={layout}
              product={item}
              currency={currency}
              cartItem={cartItems.find(i => i.id === item.id)}
              cartItems={cartItems.filter(i => i.id === item.id)}
              wishlistItems={wishlistItems.filter(i => i.id === item.id)}
              compareItem={compareItems.find(i => i.id === item.id)}
            />
          )}
        </div>
      ))}
      
      {isLoadingMore && (
        <Fragment>
          {Array.from({ length: 4 }).map((_, index) => (
            <div className={colClass} key={`skeleton-${index}`}>
              <ProductSkeleton spaceBottomClass={spaceBottomClass} />
            </div>
          ))}
        </Fragment>
      )}
    </Fragment>
  );
};

ProductGridList.propTypes = {
  products: PropTypes.array,
  spaceBottomClass: PropTypes.string,
  layout: PropTypes.string,
};

export default ProductGridList;
