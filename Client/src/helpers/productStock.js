export const STOCK_STATES = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
  TEMPORARILY_UNAVAILABLE: "Temporarily Unavailable",
  DISCONTINUED: "Discontinued"
};

export function getProductStockState(product, selectedVariant = null) {
  // Check discontinued status on variant or product
  const pStatus = (product?.status || "").trim();
  const pStockStatus = (product?.stockStatus || "").trim();
  const vStatus = selectedVariant ? (selectedVariant.status || "").trim() : "";
  const vStockStatus = selectedVariant ? (selectedVariant.stockStatus || "").trim() : "";

  // 1. Discontinued
  if (pStatus === "Discontinued" || pStockStatus === "Discontinued" ||
      vStatus === "Discontinued" || vStockStatus === "Discontinued" ||
      pStatus === "Inactive" || vStatus === "Inactive") {
    return {
      state: STOCK_STATES.DISCONTINUED,
      label: "Discontinued",
      isPurchasable: false,
      buttonText: "Discontinued",
      message: "This product is discontinued and no longer available.",
      badgeClass: "is-discontinued",
      btnClass: "pdp-btn--disabled"
    };
  }

  // 2. Temporarily Unavailable
  if (pStockStatus === "Temporarily Unavailable" || vStockStatus === "Temporarily Unavailable") {
    return {
      state: STOCK_STATES.TEMPORARILY_UNAVAILABLE,
      label: "Temporarily Unavailable",
      isPurchasable: false,
      buttonText: "Temporarily Unavailable",
      message: "This item is temporarily unavailable and cannot be ordered.",
      allowNotify: true,
      badgeClass: "is-unavailable",
      btnClass: "pdp-btn--disabled"
    };
  }

  // Stock quantities & thresholds
  const stock = selectedVariant ? Number(selectedVariant.stock ?? 0) : Number(product?.stock ?? 0);
  const threshold = selectedVariant ? Number(selectedVariant.warningThreshold ?? 5) : Number(product?.warningThreshold ?? 5);

  // 3. Out of Stock
  if (stock <= 0) {
    return {
      state: STOCK_STATES.OUT_OF_STOCK,
      label: "Out of Stock",
      isPurchasable: false,
      buttonText: "Out of Stock",
      message: "This item is currently out of stock.",
      allowNotify: true,
      badgeClass: "is-out",
      btnClass: "pdp-btn--disabled"
    };
  }

  // 4. Low Stock
  if (stock <= threshold) {
    return {
      state: STOCK_STATES.LOW_STOCK,
      label: "Low Stock",
      isPurchasable: true,
      buttonText: "Add to Cart",
      message: `Only ${stock} left — selling fast!`,
      badgeClass: "is-low",
      btnClass: "pdp-btn--primary",
      maxQty: stock
    };
  }

  // 5. In Stock
  return {
    state: STOCK_STATES.IN_STOCK,
    label: "In Stock",
    isPurchasable: true,
    buttonText: "Add to Cart",
    message: "In Stock",
    badgeClass: "is-in",
    btnClass: "pdp-btn--primary",
    showDeliveryEstimate: true
  };
}
