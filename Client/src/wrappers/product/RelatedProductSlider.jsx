import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import clsx from "clsx";
import Swiper, { SwiperSlide } from "../../components/swiper";
import SectionTitle from "../../components/section-title/SectionTitle";
import ProductGridSingle from "../../components/product/ProductGridSingle";
import { getProducts } from "../../helpers/product";

const settings = {
  loop: false,
  slidesPerView: 4,
  grabCursor: true,
  spaceBetween: 30,
  breakpoints: {
    320: {
      slidesPerView: 1
    },
    576: {
      slidesPerView: 2
    },
    768: {
      slidesPerView: 3
    },
    1024: {
      slidesPerView: 4
    }
  }
};


const RelatedProductSlider = ({ spaceBottomClass, category }) => {
  const { slug: currentProductSlug, id: currentProductId } = useParams();
  const { products } = useSelector((state) => state.product);
  const currency = useSelector((state) => state.currency || { currencyName: "INR", currencyRate: 1, currencySymbol: "₹" });
  const { cartItems } = useSelector((state) => state.cart);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { compareItems } = useSelector((state) => state.compare);

  // currentParam is either a slug or a UUID (backward compat)
  const currentParam = currentProductSlug || currentProductId;

  // First, try to get products in the same category
  let relatedProducts = products.filter(product => {
    // Skip the current product — match by slug or id
    if (product.slug && product.slug === currentParam) return false;
    if (String(product.id) === String(currentParam)) return false;

    // Match by category — check multiple sources
    const hasCategory = 
      (Array.isArray(product.category) && product.category.includes(category)) ||
      product.categoryId === category ||
      product.Category?.value === category;

    return hasCategory;
  }).slice(0, 6);

  // FALLBACK: If no category-specific products found, show any other products
  if (relatedProducts.length === 0) {
    relatedProducts = products
      .filter(p => {
        if (p.slug && p.slug === currentParam) return false;
        if (String(p.id) === String(currentParam)) return false;
        return true;
      })
      .slice(0, 6);
  }
  
  return (
    <div className={clsx("related-product-area", spaceBottomClass)}>
      <div className="container">
        <SectionTitle
          titleText="Related Products"
          positionClass="text-center"
          spaceClass="mb-50"
        />
        {relatedProducts?.length > 0 ? (
          <Swiper options={settings}>
              {relatedProducts.map(product => (
                <SwiperSlide key={product.id}>
                  <ProductGridSingle
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
                </SwiperSlide>
              ))}
          </Swiper>
        ) : null}
      </div>
    </div>
  );
};

RelatedProductSlider.propTypes = {
  category: PropTypes.string,
  spaceBottomClass: PropTypes.string
};

export default RelatedProductSlider;