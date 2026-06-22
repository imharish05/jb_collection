import PropTypes from "prop-types";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import TestimonialOneSingle from "../../components/testimonial/TestimonialOneSingle";
import SectionTitle from "../../components/section-title/SectionTitle";
import { fetchTestimonials } from "../../store/services/testimonialService";

const settings = {
  dots: true,
  infinite: true,
  speed: 800,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  arrows: true,
  fade: true,
  cssEase: "linear",
};

const TestimonialSlider = ({ spaceBottomClass, spaceTopClass, title, subtitle }) => {
  const dispatch = useDispatch();
  const { testimonials, loading } = useSelector((state) => state.testimonial);

  useEffect(() => {
    if (!testimonials || testimonials.length === 0) {
      fetchTestimonials(dispatch);
    }
  }, [dispatch, testimonials]);

  if (loading) {
    return (
      <div className={clsx("testimonial-area", spaceBottomClass, spaceTopClass)}>
        <div className="container">
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
            <p>Loading testimonials...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <div className={clsx("testimonial-area", spaceBottomClass, spaceTopClass)}>
      <div className="container">
        {(title || subtitle) && (
          <SectionTitle
            titleText={title || "Client Success Stories"}
            positionClass="text-center"
            spaceClass="mb-60"
          />
        )}

        <Slider {...settings} className="testimonial-slick-wrapper">
          {testimonials.map((single) => (
            <div key={single.id} className="px-3">
              <TestimonialOneSingle data={single} />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

TestimonialSlider.propTypes = {
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

TestimonialSlider.defaultProps = {
  title: "Happy Tales from Parents & Kids",
  subtitle: "What families say about our personalized gifts & stationery",
};

export default TestimonialSlider;
