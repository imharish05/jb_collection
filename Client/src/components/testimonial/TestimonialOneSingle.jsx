import PropTypes from "prop-types";

const IMG_URL = process.env.REACT_APP_IMG_URL || "";

const resolveImg = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  const clean = image.replace(/^\/?uploads\//, "");
  return `${IMG_URL}/uploads/${clean}`;
};

const TestimonialOneSingle = ({ data }) => {
  const rawRating = Number(data.rating ?? data.stars ?? 5);
  const rating = Number.isFinite(rawRating) ? Math.min(5, Math.max(0, rawRating)) : 5;

  return (
    <div className="testimonial-card">
      {/* Stars */}
      <div className="tc-stars" aria-label={`${rating} out of 5`}>
        {[0, 1, 2, 3, 4].map((s) => (
          <i key={s} className={`fa ${s < Math.round(rating) ? "fa-star" : "fa-star-o"}`} />
        ))}
      </div>

      {/* Quote */}
      <p className="tc-quote">{data.text}</p>

      {/* Author */}
      <div className="tc-author">
        <img
          src={resolveImg(data.image)}
          alt={data.name}
          className="tc-avatar"
        />
        <div className="tc-author-divider" />
        <div className="tc-author-info">
          <h4 className="tc-name">{data.name}</h4>
          <span className="tc-designation">{data.designation}</span>
        </div>
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
    rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    stars: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
};

export default TestimonialOneSingle;
