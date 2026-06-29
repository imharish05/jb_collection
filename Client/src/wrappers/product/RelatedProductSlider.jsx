import PropTypes from "prop-types";
import { useRef } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import clsx from "clsx";
import SectionTitle from "../../components/section-title/SectionTitle";
import ProductGridSingle from "../../components/product/ProductGridSingle";

const RelatedProductSlider = ({ spaceBottomClass, category }) => {
  const scrollRef = useRef(null);
  const { slug: currentProductSlug, id: currentProductId } = useParams();
  const { products } = useSelector((state) => state.product);
  const currency = useSelector((state) => state.currency || { currencyName: "INR", currencyRate: 1, currencySymbol: "₹" });
  const { cartItems } = useSelector((state) => state.cart);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { compareItems } = useSelector((state) => state.compare);

  const currentParam = currentProductSlug || currentProductId;

  let relatedProducts = products.filter(product => {
    if (product.slug && product.slug === currentParam) return false;
    if (String(product.id) === String(currentParam)) return false;
    const hasCategory =
      (Array.isArray(product.category) && product.category.includes(category)) ||
      product.categoryId === category ||
      product.Category?.value === category;
    return hasCategory;
  }).slice(0, 10);

  if (relatedProducts.length === 0) {
    relatedProducts = products
      .filter(p => {
        if (p.slug && p.slug === currentParam) return false;
        if (String(p.id) === String(currentParam)) return false;
        return true;
      })
      .slice(0, 10);
  }

  if (!relatedProducts.length) return null;

  return (
    <div className={clsx("related-product-area pb-30")}>
      <div className="container">
        <SectionTitle
          titleText="Related Products"
          positionClass="text-center"
          spaceClass="mb-50"
        />

        {/* Scrollable track — same pattern as DealSection, no arrows */}
        <div className="deal-scroll-track" ref={scrollRef}>
          <div className="deal-scroll-inner">
            {relatedProducts.map(product => (
              <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12" key={product.id}>
                <ProductGridSingle
                  product={product}
                  currency={currency}
                  cartItem={cartItems.find(c => c.id === product.id)}
                  wishlistItem={wishlistItems.find(w => String(w.id) === String(product.id))}
                  compareItem={compareItems.find(c => c.id === product.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

RelatedProductSlider.propTypes = {
  category: PropTypes.string,
  spaceBottomClass: PropTypes.string,
};

export default RelatedProductSlider;
