import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const IMG_URL = process.env.REACT_APP_IMG_URL || "";

const resolveImg = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  const clean = image.replace(/^\/?uploads\//, "");
  return `${IMG_URL}/uploads/${clean}`;
};

const HeroSliderFourSingle = ({ data }) => {
  return (
    <div
      className="kg-slide"
      style={{ backgroundImage: `url(${resolveImg(data.image)})` }}
    >
      {/* dark gradient overlay */}
      <div className="kg-slide__overlay" />

      <div className="container kg-slide__container">
        <div className="kg-slide__content">
          {data.title && (
            <p className="kg-slide__subtitle animated">{data.title}</p>
          )}
          {data.subtitle && (
            <h1
              className="kg-slide__title animated"
              dangerouslySetInnerHTML={{ __html: data.subtitle }}
            />
          )}
          <div className="kg-slide__cta animated">
            <Link
              to={process.env.PUBLIC_URL + (data.url || "/shop")}
              className="kg-slide__btn"
            >
              Explore Now
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
                <path d="M1 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

HeroSliderFourSingle.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string,
    subtitle: PropTypes.string,
    url: PropTypes.string,
    image: PropTypes.string,
  }),
};

export default HeroSliderFourSingle;