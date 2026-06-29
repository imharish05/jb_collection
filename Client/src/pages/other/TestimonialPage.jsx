import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import TestimonialOneSingle from "../../components/testimonial/TestimonialOneSingle";
import { fetchTestimonials } from "../../store/services/testimonialService";

const TestimonialPage = () => {
  const dispatch = useDispatch();
  const { testimonials, loading } = useSelector((state) => state.testimonial);

  useEffect(() => {
    fetchTestimonials(dispatch);
  }, [dispatch]);

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

  return (
    <section className="testimonial-section pt-100 pb-100">
      <div className="container">
        <div className="section-title text-center mb-60">
          <h2>Happy Tales from Parents & Kids</h2>
          <p>What families say about our personalized gifts & stationery</p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
            <p>Loading testimonials...</p>
          </div>
        ) : testimonials && testimonials.length > 0 ? (
          <Slider {...settings} className="testimonial-slick-wrapper">
            {testimonials.map((single) => (
              <div key={single.id} className="px-3">
                <TestimonialOneSingle data={single} />
              </div>
            ))}
          </Slider>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
            <p>No testimonials available yet.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialPage;
