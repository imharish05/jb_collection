// src/wrappers/product/ShopProducts.jsx
import PropTypes from "prop-types";
import clsx from "clsx";
import ProductgridList from "./ProductgridList";

const ShopProducts = ({ products, layout, isComboMode, childCombos }) => {
  const displayItems = isComboMode
    ? (childCombos || []).map(c => ({ ...c, isCombo: true }))
    : products;

  return (
    <div className="shop-bottom-area mt-35">
      <div className={clsx("row", layout)}>
        <ProductgridList
          products={displayItems}
          layout={layout}
          spaceBottomClass="mb-25"
        />
      </div>
    </div>
  );
};

ShopProducts.propTypes = {
  layout: PropTypes.string,
  products: PropTypes.array,
  isComboMode: PropTypes.bool,
  childCombos: PropTypes.array,
};

export default ShopProducts;