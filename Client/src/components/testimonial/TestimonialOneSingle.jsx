import PropTypes from "prop-types";

const TestimonialOneSingle = ({ data }) => {
  return (
    <div className="editorial-testimonial">
      <div className="testimonial-content">
        <div className="quote-badge">
          <i className="fa fa-quote-right"></i>
        </div>
        
        <p className="main-quote">{data.text}</p>
        
        <div className="author-details">
          <h4 className="author-name">{data.name}</h4>
          <span className="author-job">{data.designation}</span>
        </div>
      </div>

      <div className="author-image-wrapper">
        <div className="image-bg-shape"></div>
        <img src={data.image} alt={data.name} className="img-fluid" />
      </div>
    </div>
  );
};

export default TestimonialOneSingle;