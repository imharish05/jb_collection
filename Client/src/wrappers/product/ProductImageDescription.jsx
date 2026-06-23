import PropTypes from "prop-types";
import { useState } from "react";
import { useSelector } from "react-redux";
import clsx from "clsx";
import { getDiscountPrice } from "../../helpers/product";
import ProductImageGallery from "../../components/product/ProductImageGallery";
import ProductDescriptionInfo from "../../components/product/ProductDescriptionInfo";
import ProductImageGallerySideThumb from "../../components/product/ProductImageGallerySideThumb";
import ProductImageFixed from "../../components/product/ProductImageFixed";

const ProductImageDescription = ({ spaceTopClass, spaceBottomClass, galleryType, product }) => {
  const currency = useSelector((state) => state.currency || { currencyName: "INR", currencyRate: 1, currencySymbol: "₹" });
  const { cartItems } = useSelector((state) => state.cart);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { compareItems } = useSelector((state) => state.compare);
  // Pass full list — ProductDescriptionInfo matches by productId+variantId
  const wishlistItemsForProduct = wishlistItems.filter(item => item.id === product.id);
  const compareItem = compareItems.find(item => item.id === product.id);

  const discountedPrice = getDiscountPrice(product.price, product.discount);
  const currencyRate = currency?.currencyRate || 1;
  const finalProductPrice = +(product.price * currencyRate).toFixed(2);
  const finalDiscountedPrice = +(discountedPrice * currencyRate).toFixed(2);

  // Variant image override — set when customer picks a colour/variant that has its own image.
  // Initialise with the first variant's image so the gallery shows the variant (not product default) on load.
  const firstVariantImage =
    Array.isArray(product.Variants) && product.Variants.length > 0
      ? (product.Variants.find(v => v.image)?.image || null)
      : null;
  const [variantImage, setVariantImage] = useState(firstVariantImage);

  // Build gallery: selected variant image FIRST, then all OTHER variant images, then product-level images.
  // This populates the thumb strip even when product.image is empty (each variant has its own image).
  const allVariantImgs = Array.isArray(product.Variants)
    ? product.Variants.map(v => v.image).filter(Boolean)
    : [];
  const productImgs = Array.isArray(product.image)
    ? product.image.filter(Boolean)
    : typeof product.image === "string"
      ? (() => { try { const p = JSON.parse(product.image); return Array.isArray(p) ? p.filter(Boolean) : [product.image]; } catch { return [product.image]; } })()
      : [];

  const buildGallery = () => {
    if (!variantImage) {
      const extra = allVariantImgs.filter(img => !productImgs.includes(img));
      return [...productImgs, ...extra];
    }
    const otherVariantImgs = allVariantImgs.filter(img => img !== variantImage);
    const prodExtra = productImgs.filter(img => img !== variantImage && !otherVariantImgs.includes(img));
    return [variantImage, ...otherVariantImgs, ...prodExtra];
  };

  const galleryProduct = { ...product, image: buildGallery() };

  return (
    <div className={clsx("shop-area", spaceTopClass, spaceBottomClass)}>
      <div className="container">
        <div className="row">
          <div className="col-lg-6 col-md-6">
            {galleryType === "leftThumb" ? (
              <ProductImageGallerySideThumb key={`${product.id}-${variantImage || "default"}`} product={galleryProduct} thumbPosition="left" />
            ) : galleryType === "rightThumb" ? (
              <ProductImageGallerySideThumb key={`${product.id}-${variantImage || "default"}`} product={galleryProduct} />
            ) : galleryType === "fixedImage" ? (
              <ProductImageFixed product={galleryProduct} />
            ) : (
              <ProductImageGallery product={galleryProduct} />
            )}
          </div>
          <div className="col-lg-6 col-md-6">
            <ProductDescriptionInfo
              product={product}
              discountedPrice={discountedPrice}
              currency={currency}
              finalDiscountedPrice={finalDiscountedPrice}
              finalProductPrice={finalProductPrice}
              cartItems={cartItems}
              wishlistItems={wishlistItemsForProduct}
              compareItem={compareItem}
              onVariantImageChange={setVariantImage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

ProductImageDescription.propTypes = {
  galleryType: PropTypes.string,
  product: PropTypes.shape({}),
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string,
};

export default ProductImageDescription;