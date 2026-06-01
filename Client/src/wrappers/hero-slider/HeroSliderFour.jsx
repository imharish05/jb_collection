import { useRef, useEffect } from 'react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import HeroSliderFourSingle from "../../components/hero-slider/HeroSliderFourSingle.jsx";
import { useSelector } from 'react-redux';

const HeroSliderFour = () => {
  const heroSliderData = useSelector((state) => state.headerSlider?.slides || []);
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    if (!swiperRef.current) return;
    const swiper = swiperRef.current;
    swiper.params.navigation.prevEl = prevRef.current;
    swiper.params.navigation.nextEl = nextRef.current;
    swiper.navigation.destroy();
    swiper.navigation.init();
    swiper.navigation.update();
  }, [heroSliderData]);

  if (!heroSliderData?.length) return null;

  return (
    <div className="kg-hero">
      <button ref={prevRef} className="kg-hero__nav kg-hero__nav--prev" aria-label="Previous slide">
        <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
          <path d="M9 1L1 9l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button ref={nextRef} className="kg-hero__nav kg-hero__nav--next" aria-label="Next slide">
        <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
          <path d="M1 1l8 8-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        loop={true}
        speed={700}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
        pagination={{ el: '.kg-hero__dots', clickable: true, bulletClass: 'kg-hero__dot', bulletActiveClass: 'kg-hero__dot--active' }}
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        observer={true}
        observeParents={true}
        className="kg-hero__swiper"
      >
        {heroSliderData.map((single, key) => (
          <SwiperSlide key={key}>
            <HeroSliderFourSingle data={single} />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="kg-hero__dots" />
    </div>
  );
};

export default HeroSliderFour;