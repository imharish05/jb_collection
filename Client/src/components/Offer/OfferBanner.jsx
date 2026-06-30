import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';

const IMG_URL = process.env.REACT_APP_IMG_URL || '';

const resolveImg = (image) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  const clean = image.replace(/^\/?uploads\//, '');
  return `${IMG_URL}/uploads/${clean}`;
};

const OfferBanner = () => {
  const { banners = [] } = useSelector((state) => state.offerBanner || {});
  const swiperRef = useRef(null);

  const activeBanners = banners.filter((b) => b.isActive !== false);
  if (!activeBanners.length) return null;

  const count = activeBanners.length;
  const useSlider = count > 4;

  return (
    <section className="tt-section">
      <style>{`
        .tt-section {
          // padding: 52px 0 60px;
          position: relative;
          overflow: hidden;
        }

        /* Header */
        .tt-header {
          text-align: center;
          margin-bottom: 36px;
        }
        .tt-header-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #c8826a;
          margin-bottom: 10px;
        }
        .tt-header-eyebrow::before,
        .tt-header-eyebrow::after {
          content: '';
          display: block;
          width: 24px;
          height: 1px;
          background: #c8826a;
          opacity: 0.6;
        }
        .tt-header h2 {
          font-size: 28px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 8px;
          letter-spacing: -0.3px;
          line-height: 1.2;
        }
        .tt-header p {
          font-size: 14px;
          color: #999;
          margin: 0;
        }

        /* Grid */
        .tt-grid {
          display: grid;
          gap: 16px;
        }
        .tt-grid.count-1 {
          grid-template-columns: 1fr;
          max-width: 760px;
          margin: 0 auto;
        }
        .tt-grid.count-2 { grid-template-columns: repeat(2, 1fr); }
        .tt-grid.count-3 { grid-template-columns: repeat(3, 1fr); }
        .tt-grid.count-4 { grid-template-columns: repeat(4, 1fr); }

        /* Card */
        .tt-card {
          display: block;
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          text-decoration: none;
          height: 320px;
          background: #eee;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .tt-grid.count-1 .tt-card { height: 280px; }
        .tt-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 32px rgba(0,0,0,0.13);
          text-decoration: none;
        }

        .tt-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease;
        }
        .tt-card:hover .tt-card-img { transform: scale(1.05); }

        .tt-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(10,6,2,0.82) 0%,
            rgba(10,6,2,0.3) 40%,
            transparent 65%
          );
        }

        .tt-badge {
          position: absolute;
          top: 15px;
          left: 15px;
          background: var(--theme-color);
          color: #fff;
          font-size: 12event-section-wrapper pt-30 pb-30;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 20px;
          line-height: 1;
          white-space: nowrap;
          max-width: calc(100% - 28px);
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tt-card-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px 18px 18px;
        }
        .tt-card-title {
          color: #ffffff !important;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 10px;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-shadow: 1px 1px 4px rgba(0,0,0,0.7);
        }
        .tt-card-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #ffffff !important;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.5px;
          transition: gap 0.2s ease, color 0.2s ease;
          text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
        }
        .tt-card:hover .tt-card-cta { gap: 10px; color: #fff; }

        .tt-cta-arrow {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.2s, border-color 0.2s;
        }
        .tt-card:hover .tt-cta-arrow {
          background: #c8826a;
          border-color: #c8826a;
        }
        .tt-cta-arrow svg {
          width: 8px; height: 8px;
          fill: none; stroke: #fff;
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* Swiper */
        .tt-swiper-wrap { position: relative; }
        .tt-swiper-wrap .swiper-slide { height: auto; }
        .tt-swiper-wrap .tt-card { height: 320px; }

        .tt-nav {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-top: 22px;
        }
        .tt-nav-btn {
          width: 38px; height: 38px;
          border-radius: 50%;
          border: 1.5px solid #d5cac4;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .tt-nav-btn:hover { border-color: #c8826a; background: #c8826a; }
        .tt-nav-btn:hover svg { stroke: #fff; }
        .tt-nav-btn svg {
          width: 13px; height: 13px;
          fill: none; stroke: #666;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: stroke 0.2s;
        }
        .tt-nav-count strong { color: #222; font-weight: 600; }

        @media (max-width: 991px) {
          // .tt-section { padding: 44px 0 52px; }
          .tt-header h2 { font-size: 24px; }
          .tt-grid.count-3,
          .tt-grid.count-4 { grid-template-columns: repeat(2, 1fr); }
          .tt-card { height: 280px; }
        }

        @media (max-width: 600px) {
          // .tt-section { padding: 36px 0 44px; }
          .tt-header { margin-bottom: 24px; }
          .tt-header h2 { font-size: 22px; }
          .tt-grid.count-1,
          .tt-grid.count-2,
          .tt-grid.count-3,
          .tt-grid.count-4 { grid-template-columns: 1fr; }
          .tt-card { height: 220px; }
          .tt-grid.count-1 .tt-card { height: 200px; }
          .tt-card-title { font-size: 15px; }
        }
      `}</style>

      <div className="container">
              <div className="section-title text-center mb-50">
          <h2 className="event-title pb-2">Signature Collection</h2>
          <div className="event-subtitle">Handpicked offers for your most cherished moments</div>
        </div>

        {!useSlider ? (
          <div className={`tt-grid count-${count}`}>
            {activeBanners.map((offer) => (
              <BannerCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : (
          <div className="tt-swiper-wrap">
            <Swiper
              modules={[Autoplay, Navigation]}
              spaceBetween={16}
              slidesPerView={1}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              onSwiper={(s) => { swiperRef.current = s; }}
              breakpoints={{
                640:  { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              loop
            >
              {activeBanners.map((offer) => (
                <SwiperSlide key={offer.id}>
                  <BannerCard offer={offer} />
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="tt-nav">
              <button className="tt-nav-btn" onClick={() => swiperRef.current?.slidePrev()}>
                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button className="tt-nav-btn" onClick={() => swiperRef.current?.slideNext()}>
                <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const BannerCard = ({ offer }) => (
  <Link
    to={process.env.PUBLIC_URL + (offer.link || '/shop')}
    className="tt-card"
  >
    <img
      className="tt-card-img"
      src={resolveImg(offer.image)}
      alt={offer.title}
      onError={(e) => { e.target.src = ''; }}
    />
    <div className="tt-card-overlay" />
    {offer.off && <span className="tt-badge">{offer.off}</span>}
    <div className="tt-card-info">
      <h3 className="tt-card-title">{offer.title}</h3>
      <span className="tt-card-cta">
        Shop Collection
        <span className="tt-cta-arrow">
          <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
        </span>
      </span>
    </div>
  </Link>
);

export default OfferBanner;
