import React from 'react';
// get products
const ALL_CATEGORY_VALUES = ["all", "all-categories", "all-products"];

const isAllCategory = value =>
  !value || ALL_CATEGORY_VALUES.includes(String(value).toLowerCase());

export const getProducts = (products, category, type, limit) => {
  const finalProducts = !isAllCategory(category)
    ? products.filter(
        product =>
          product.category?.filter(single => single === category)[0] ||
          product.categoryId === category ||
          product.Category?.value === category
      )
    : products;

  if (type && type === "customisable") {
    const customProducts = finalProducts.filter(single =>
      (single.tag && single.tag.some(t => /custom/i.test(t)))
    );
    return customProducts.slice(0, limit ? limit : customProducts.length);
  }
  if (type && type === "newArrival") {
    const newProducts = finalProducts.filter(single =>
      (single.tag && single.tag.some(t => /new.arrival|✨|\bnew\b/i.test(t))) || single.isNew || single.new
    );
    return newProducts.slice(0, limit ? limit : newProducts.length);
  }
  if (type && (type === "hotDeal" || type === "hotDeals")) {
    const hotProducts = finalProducts.filter(single =>
      (single.tag && single.tag.some(t => /hot.deal|🔥|\bhot\b/i.test(t))) || single.isHotDeal
    );
    return hotProducts.slice(0, limit ? limit : hotProducts.length);
  }
  if (type && type === "bestSeller") {
    return [...finalProducts]
      .sort((a, b) => {
        return b.saleCount - a.saleCount;
      })
      .slice(0, limit ? limit : finalProducts.length);
  }
  if (type && type === "saleItems") {
    const saleItems = finalProducts.filter(
      single => single.discount && single.discount > 0
    );
    return saleItems.slice(0, limit ? limit : saleItems.length);
  }
  return finalProducts.slice(0, limit ? limit : finalProducts.length);
};

// get product discount price
export const getDiscountPrice = (price, discount) => {
  return discount && discount > 0 ? price - price * (discount / 100) : null;
};

export const getProductPrice = (product, variantIndex = 0) => {
  const variants = Array.isArray(product.Variants) ? product.Variants
                 : Array.isArray(product.variants) ? product.variants
                 : [];

  if (variants.length > 0) {
    const v = variants[variantIndex] || variants[0];
    const salesPrice = parseFloat(v.salesPrice || 0);
    const mrp        = parseFloat(v.mrp || 0);

    const displayPrice  = salesPrice > 0 ? salesPrice : mrp;
    const strikePrice   = mrp > salesPrice && salesPrice > 0 ? mrp : null;
    const discountPct   = strikePrice
      ? Math.round((1 - salesPrice / mrp) * 100)
      : null;

    return { displayPrice, strikePrice, discountPct };
  }

  const base = parseFloat(product.price || 0);
  const disc = parseFloat(product.discount || 0);

  return {
    displayPrice: base,
    strikePrice:  null,
    discountPct:  disc > 0 ? disc : null,
  };
};

export const getCartItemPrice = (item) => {
  return parseFloat(item.price || 0);
};

// get product cart quantity
export const getProductCartQuantity = (cartItems, product, color, size) => {
  let productInCart = cartItems.find(
    single =>
      single.id === product.id &&
      (single.selectedProductColor
        ? single.selectedProductColor === color
        : true) &&
      (single.selectedProductSize ? single.selectedProductSize === size : true)
  );
  if (cartItems.length >= 1 && productInCart) {
    if (product.variation) {
      const match = cartItems.find(
        single =>
          single.id === product.id &&
          single.selectedProductColor === color &&
          single.selectedProductSize === size
      );
      return match ? match.quantity : 0;
    } else {
      const match = cartItems.find(single => product.id === single.id);
      return match ? match.quantity : 0;
    }
  } else {
    return 0;
  }
};

export const cartItemStock = (item, color, size) => {
  if (item.stock) {
    return item.stock;
  }

  let variation = item.variation;
  if (typeof variation === "string") {
    try { variation = JSON.parse(variation); } catch { variation = []; }
  }

  if (!Array.isArray(variation) || variation.length === 0) {
    return 0;
  }

  const colorMatch = variation.filter(single => single.color === color)[0];
  if (!colorMatch) return 0;

  const sizeMatch = colorMatch.size && colorMatch.size.filter(single => single.name === size)[0];
  return sizeMatch ? sizeMatch.stock : 0;
};

export const getSortedProducts = (products, sortType, sortValue) => {
  if (products && sortType && sortValue) {
    if (sortType === "search") {
      const q = sortValue.toLowerCase();
      return products.filter(
        product =>
          product.name.toLowerCase().includes(q) ||
          (product.shortDescription && product.shortDescription.toLowerCase().includes(q)) ||
          (product.category && product.category.some(c => c.toLowerCase().includes(q))) ||
          (product.tag && product.tag.some(t => t.toLowerCase().includes(q)))
      );
    }
    if (sortType === "category") {
      if (isAllCategory(sortValue)) return products;
      return products.filter(
        product =>
          product.category?.filter(single => single === sortValue)[0] ||
          product.categoryId === sortValue ||
          product.Category?.value === sortValue
      );
    }
    if (sortType === "combo") {
      if (sortValue === "all") {
        return products.filter(product => product.comboId != null);
      }
      return products.filter(
        product => product.comboId != null && String(product.comboId) === String(sortValue)
      );
    }
    if (sortType === "tag") {
      return products.filter(
        product => product.tag?.filter(single => single === sortValue)[0]
      );
    }
    if (sortType === "color") {
      return products.filter(
        product =>
          product.variation &&
          product.variation.filter(single => single.color === sortValue)[0]
      );
    }
    if (sortType === "size") {
      return products.filter(
        product =>
          product.variation &&
          product.variation.filter(
            single => single.size.filter(single => single.name === sortValue)[0]
          )[0]
      );
    }
    if (sortType === "filterSort") {
      let sortProducts = [...products];
      if (sortValue === "default") {
        return sortProducts;
      }
      if (sortValue === "priceHighToLow") {
        return sortProducts.sort((a, b) => {
          return b.price - a.price;
        });
      }
      if (sortValue === "priceLowToHigh") {
        return sortProducts.sort((a, b) => {
          return a.price - b.price;
        });
      }
    }
  }
  return products;
};

const getIndividualItemArray = array => {
  let individualItemArray = array.filter(function(v, i, self) {
    return i === self.indexOf(v);
  });
  return individualItemArray;
};

export const getIndividualCategories = products => {
  let productCategories = [];
  products &&
    products.map(product => {
      return (
        product.category &&
        product.category.map(single => {
          return productCategories.push(single);
        })
      );
    });
  const individualProductCategories = getIndividualItemArray(productCategories);
  return individualProductCategories;
};

export const getIndividualTags = products => {
  let productTags = [];
  products &&
    products.map(product => {
      return (
        product.tag &&
        product.tag.map(single => {
          return productTags.push(single);
        })
      );
    });
  const individualProductTags = getIndividualItemArray(productTags);
  return individualProductTags;
};

export const getIndividualColors = products => {
  let productColors = [];
  if (Array.isArray(products)) {
    products.forEach(product => {
      if (Array.isArray(product.variation)) {
        product.variation.forEach(single => {
          if (single.color) productColors.push(single.color);
        });
      }
      const variants = Array.isArray(product.Variants) ? product.Variants
                     : Array.isArray(product.variants) ? product.variants
                     : [];
      variants.forEach(v => {
        let attrs = v.attributes;
        if (typeof attrs === "string") {
          try { attrs = JSON.parse(attrs); } catch { attrs = null; }
        }
        if (Array.isArray(attrs)) {
          attrs.forEach(a => {
            if (isColourKey(a.key) && a.value) productColors.push(a.value);
          });
        } else if (v.variantName) {
          const parts = String(v.variantName).split(/\s*(?:·|\||,|\/)\s*/);
          parts.forEach(part => {
            if (part.includes(":")) {
              const [k, ...rest] = part.split(":");
              if (isColourKey(k.trim())) productColors.push(rest.join(":").trim());
            }
          });
        }
      });
    });
  }
  return getIndividualItemArray(productColors);
};

export const getProductsIndividualSizes = products => {
  let productSizes = [];
  if (Array.isArray(products)) {
    products.forEach(product => {
      if (Array.isArray(product.variation)) {
        product.variation.forEach(single => {
          if (Array.isArray(single.size)) {
            single.size.forEach(sz => {
              if (sz.name) productSizes.push(sz.name);
            });
          }
        });
      }
      const variants = Array.isArray(product.Variants) ? product.Variants
                     : Array.isArray(product.variants) ? product.variants
                     : [];
      variants.forEach(v => {
        let attrs = v.attributes;
        if (typeof attrs === "string") {
          try { attrs = JSON.parse(attrs); } catch { attrs = null; }
        }
        if (Array.isArray(attrs)) {
          attrs.forEach(a => {
            if (/size/i.test(a.key) && a.value) productSizes.push(a.value);
          });
        } else if (v.variantName) {
          const parts = String(v.variantName).split(/\s*(?:·|\||,|\/)\s*/);
          parts.forEach(part => {
            if (part.includes(":")) {
              const [k, ...rest] = part.split(":");
              if (/size/i.test(k.trim())) productSizes.push(rest.join(":").trim());
            }
          });
        }
      });
    });
  }
  return getIndividualItemArray(productSizes);
};

export const getIndividualSizes = product => {
  let productSizes = [];
  if (product) {
    if (Array.isArray(product.variation)) {
      product.variation.forEach(single => {
        if (Array.isArray(single.size)) {
          single.size.forEach(sz => {
            if (sz.name) productSizes.push(sz.name);
          });
        }
      });
    }
    const variants = Array.isArray(product.Variants) ? product.Variants
                   : Array.isArray(product.variants) ? product.variants
                   : [];
    variants.forEach(v => {
      let attrs = v.attributes;
      if (typeof attrs === "string") {
        try { attrs = JSON.parse(attrs); } catch { attrs = null; }
      }
      if (Array.isArray(attrs)) {
        attrs.forEach(a => {
          if (/size/i.test(a.key) && a.value) productSizes.push(a.value);
        });
      } else if (v.variantName) {
        const parts = String(v.variantName).split(/\s*(?:·|\||,|\/)\s*/);
        parts.forEach(part => {
          if (part.includes(":")) {
            const [k, ...rest] = part.split(":");
            if (/size/i.test(k.trim())) productSizes.push(rest.join(":").trim());
          }
        });
      }
    });
  }
  return getIndividualItemArray(productSizes);
};

export const setActiveSort = e => {
  const filterButtons = document.querySelectorAll(
    ".sidebar-widget-list-left button, .sidebar-widget-tag button, .product-filter button"
  );
  filterButtons.forEach(item => {
    item.classList.remove("active");
  });
  e.currentTarget.classList.add("active");
};

export const setActiveLayout = e => {
  const gridSwitchBtn = document.querySelectorAll(".shop-tab button");
  gridSwitchBtn.forEach(item => {
    item.classList.remove("active");
  });
  e.currentTarget.classList.add("active");
};

export const toggleShopTopFilter = e => {
  const shopTopFilterWrapper = document.querySelector(
    "#product-filter-wrapper"
  );
  shopTopFilterWrapper.classList.toggle("active");
  if (shopTopFilterWrapper.style.height) {
    shopTopFilterWrapper.style.height = null;
  } else {
    shopTopFilterWrapper.style.height =
      shopTopFilterWrapper.scrollHeight + "px";
  }
  e.currentTarget.classList.toggle("active");
};

export const isHexColor = (value) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value || '').trim());
export const isColourKey = (key) => /colou?r/i.test(key || '');

export const renderVariantLabel = (str, circleSize = 12, spacing = 4) => {
  if (!str) return '—';
  const parts = str.split(/(\s*·\s*|\s*\/\s*)/);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
      {parts.map((part, idx) => {
        if (/^\s*[·/]\s*$/.test(part)) {
          return <span key={idx} style={{ color: '#aaa', margin: '0 4px' }}>{part}</span>;
        }
        if (part.includes(':')) {
          const colonIdx = part.indexOf(':');
          const key = part.slice(0, colonIdx + 1);
          const val = part.slice(colonIdx + 1).trim();
          if (isHexColor(val)) {
            return (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span>{key}</span>
                <span
                  style={{
                    width: circleSize,
                    height: circleSize,
                    borderRadius: '50%',
                    border: '1px solid #dcdcdc',
                    backgroundColor: val,
                    display: 'inline-block',
                    marginLeft: spacing,
                    marginRight: spacing,
                    flexShrink: 0,
                  }}
                />
              </span>
            );
          }
        }
        const trimmed = part.trim();
        if (isHexColor(trimmed)) {
          return (
            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span
                style={{
                  width: circleSize,
                  height: circleSize,
                  borderRadius: '50%',
                  border: '1px solid #dcdcdc',
                  backgroundColor: trimmed,
                  display: 'inline-block',
                  marginRight: spacing,
                  flexShrink: 0,
                }}
              />
            </span>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
};
