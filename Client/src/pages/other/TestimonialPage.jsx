import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import TestimonialOneSingle from "../../components/testimonial/TestimonialOneSingle";

const TestimonialPage = () => {
  const testimonialData = [
    { id: 1, name: "Sarah Jenkins", designation: "CEO at TechFlow", text: "The attention to detail and the sleek design language they brought to our project was transformative.", image: "/assets/img/team/team-1.jpg" },
    { id: 2, name: "Marcus Thorne", designation: "Founder of CreativeCo", text: "Efficiency and elegance. The team delivered a product that not only looks stunning but performs flawlessly.", image: "/assets/img/team/team-2.jpg" },
    { id: 3, name: "Elena Rodriguez", designation: "Marketing Director", text: "Working with them was a breeze. They understood our core mission immediately.", image: "/assets/img/team/team-3.jpg" },
    { id: 4, name: "David Chen", designation: "Product Lead", text: "Exceptional quality and communication throughout the entire development process.", image: "/assets/img/team/team-4.jpg" }
  ];

const settings = {
  dots: true,
  infinite: true,
  speed: 800,
  slidesToShow: 1, // Focus on one high-quality testimonial at a time
  slidesToScroll: 1,
  autoplay: true,
  arrows: true, // Enable arrows for an editorial feel
  fade: true,   // Use fade transition for a "premium" effect
  cssEase: 'linear'
};

  return (
    <section className="testimonial-section pt-100 pb-100">
      <div className="container">
        <div className="section-title text-center mb-60">
          <h2>Client Success Stories</h2>
          <p>What Our Partners Say</p>
        </div>
        
        <Slider {...settings} className="testimonial-slick-wrapper">
          {testimonialData.map((single) => (
            <div key={single.id} className="px-3">
              <TestimonialOneSingle data={single} />
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default TestimonialPage;