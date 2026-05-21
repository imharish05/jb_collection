import { useRef, useEffect } from 'react';
import { EffectFade, Autoplay, Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import HeroSliderFourSingle from "../../components/hero-slider/HeroSliderFourSingle.jsx";
import { useSelector } from 'react-redux';

const HeroSliderFour = () => {
  const heroSliderData = useSelector((state) => state.headerSlider?.slides || []);
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const swiperRef = useRef(null);

  // After everything mounts, wire the real DOM buttons into swiper
  useEffect(() => {
    if (!swiperRef.current) return;
    const swiper = swiperRef.current;
    swiper.params.navigation.prevEl = prevRef.current;
    swiper.params.navigation.nextEl = nextRef.current;
    swiper.navigation.destroy();
    swiper.navigation.init();
    swiper.navigation.update();
  }, [heroSliderData]);

  return (
    <div className="slider-area">
      <div className="slider-active position-relative">
        {heroSliderData?.length > 0 && (
          <div style={{ position: 'relative' }}>
            {/* Buttons BEFORE Swiper so refs are populated when onSwiper fires */}
            <button ref={prevRef} className="hero-nav-btn hero-nav-prev">
              <i className="fa fa-angle-left"></i>
            </button>
            <button ref={nextRef} className="hero-nav-btn hero-nav-next">
              <i className="fa fa-angle-right"></i>
            </button>

            <Swiper
              modules={[EffectFade, Autoplay, Navigation]}
              effect="fade"
              fadeEffect={{ crossFade: true }}
              loop={true}
              speed={400}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
              onSwiper={(swiper) => { swiperRef.current = swiper; }}
              observer={true}
              observeParents={true}
            >
              {heroSliderData.map((single, key) => (
                <SwiperSlide key={key}>
                  <HeroSliderFourSingle data={single} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroSliderFour;