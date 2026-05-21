import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Import Swiper components and styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const IMG_URL = process.env.REACT_APP_IMG_URL || "";

// Resolve image path — backend returns just filename or "uploads/xxx.jpg"
const resolveImg = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  const clean = image.replace(/^\/?uploads\//, "");
  return `${IMG_URL}/uploads/${clean}`;
};

const OfferBanner = () => {
  const { banners = [] } = useSelector((state) => state.offerBanner || {});

  const isSlider = banners.length > 3;

  return (
    <div className="modern-offer-wrapper pt-40 pb-40">
      <div className="section-title text-center mb-40">
        <h2>Timeless Treasures</h2>
        <p>Curated collections for your special moments</p>
      </div>
      <div className="container">
        {isSlider ? (
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            breakpoints={{
              640: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {banners.map((offer) => (
              <SwiperSlide key={offer.id}>
                <Link to={process.env.PUBLIC_URL + (offer.link || "/shop")} className="modern-banner-card">
                  <div className="banner-visual">
                    <img src={resolveImg(offer.image)} alt={offer.title} />
                  </div>
                  <div className="banner-info">
                    <span className="info-tag">{offer.off}</span>
                    <h3 className="info-title">{offer.title}</h3>
                    <span className="info-btn">Shop Collection <i className="fa fa-arrow-right"></i></span>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="auto-grid-layout">
            {banners.map((offer) => (
              <Link to={process.env.PUBLIC_URL + (offer.link || "/shop")} key={offer.id} className="modern-banner-card">
                <div className="banner-visual">
                  <img src={resolveImg(offer.image)} alt={offer.title} />
                </div>
                <div className="banner-info">
                  <span className="info-tag">{offer.off}</span>
                  <h3 className="info-title">{offer.title}</h3>
                  <span className="info-btn">Shop Collection <i className="fa fa-arrow-right"></i></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferBanner;