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
    <div className="slider-height-9 bg-gray d-flex align-items-center custom-hero-bg">
      <div className="container">
        <div className="row align-items-center">
          {/* Text Content */}
          <div className="col-12 col-md-6 order-2 order-md-1">
            <div className="slider-content-11 slider-animated-1">
              <h3 className="animated hero-top-title" style={{ animationDelay: "0.2s" }}>
                {data.title}
              </h3>
              <h1
                className="animated hero-main-title"
                style={{ animationDelay: "0.2s" }}
                dangerouslySetInnerHTML={{ __html: data.subtitle }}
              />
              <div className="slider-btn-11 btn-hover">
                <Link
                  className="animated hero-cta-btn"
                  style={{ animationDelay: "0.3s" }}
                  to={process.env.PUBLIC_URL + (data.url || "/shop")}
                >
                  EXPLORE NOW
                </Link>
              </div>
            </div>
          </div>
          {/* Image Content */}
          <div className="col-12 col-md-6 order-1 order-md-2 text-center">
            <div className="hero-image-wrap slider-animated-1">
              <img
                className="animated hero-slide-img"
                style={{ animationDelay: "0.2s" }}
                src={resolveImg(data.image)}
                alt={data.title}
              />
            </div>
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