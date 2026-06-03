import PropTypes from "prop-types";
import React from "react";
import { setActiveLayout } from "../../helpers/product";

const ShopTopAction = ({
  getLayout,
  getFilterSortParams,
  productCount,
  sortedProductCount
}) => {
  return (
    <div className="shop-top-bar mb-35">
      <div className="select-shoing-wrap">
        <div className="shop-select">
          <select 
            onChange={e => getFilterSortParams("filterSort", e.target.value)}
            defaultValue="default"
          >
            <option value="default">Sort by: Relevance</option>
            <option value="priceLowToHigh">Price -- Low to High</option>
            <option value="priceHighToLow">Price -- High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
        <p>
          Showing <strong>{sortedProductCount}</strong> of {productCount} products
        </p>
      </div>

      {/* <div className="shop-tab">
        <button
          onClick={e => {
            getLayout("grid two-column");
            setActiveLayout(e);
          }}
        >
          <i className="fa fa-th-large" />
        </button>
        <button
          className="active"
          onClick={e => {
            getLayout("grid three-column");
            setActiveLayout(e);
          }}
        >
          <i className="fa fa-th" />
        </button>
        <button
          onClick={e => {
            getLayout("list");
            setActiveLayout(e);
          }}
        >
          <i className="fa fa-list-ul" />
        </button>
      </div> */}
    </div>
  );
};

ShopTopAction.propTypes = {
  getFilterSortParams: PropTypes.func,
  getLayout: PropTypes.func,
  productCount: PropTypes.number,
  sortedProductCount: PropTypes.number
};

export default ShopTopAction;