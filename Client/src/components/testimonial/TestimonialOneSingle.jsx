import PropTypes from "prop-types";

const IMG_URL = process.env.REACT_APP_IMG_URL || "";

const resolveImg = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  const clean = image.replace(/^\/?uploads\//, "");
  return `${IMG_URL}/uploads/${clean}`;
};

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
        <img src={resolveImg(data.image)} alt={data.name} className="img-fluid" />
      </div>
    </div>
  );
};

TestimonialOneSingle.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    designation: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
  }).isRequired,
};

export default TestimonialOneSingle;