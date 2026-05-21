import PropTypes from "prop-types";

import { getImgUrl } from "../../helpers/imageUrl";
import Swiper, { SwiperSlide } from "../../components/swiper";

const ProductImageGallerySlider = ({ product }) => {
  // swiper slider settings
  const gallerySwiperParams = {
    spaceBetween: 15,
    slidesPerView: 3,
    loop: true,
    navigation: true,
    breakpoints: {
      320: {
        slidesPerView: 1
      },
      640: {
        slidesPerView: 2
      },
      768: {
        slidesPerView: 2
      },
      1024: {
        slidesPerView: 3
      }
    }
  };
  return (
    <div className="product-large-image-wrapper product-large-image-wrapper--slider">
      {product?.image?.length ? (
        <Swiper options={gallerySwiperParams}>
          {product.image.map((single, key) => (
            <SwiperSlide key={key}>
              <div className="single-image">
                <img
                  src={getImgUrl(single)}
                  className="img-fluid"
                  alt=""
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      ): null}
    </div>
  );
};

ProductImageGallerySlider.propTypes = {
  product: PropTypes.shape({})
};

export default ProductImageGallerySlider;

