import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const FeatureIconSingle = ({ singleFeature }) => {

  

  return (
   <Link to={`/${singleFeature.link}`} className="support-wrap-28">
      
      <div className="support-icon-28">
        <img
          src={process.env.PUBLIC_URL + singleFeature.image}
          alt={singleFeature.title}
        />
      </div>
      <div className="support-content-28">
        <h5>{singleFeature.title}</h5>
        <p>{singleFeature.subtitle}</p>
      </div>
    </Link>
  );
};

FeatureIconSingle.propTypes = {
  singleFeature: PropTypes.shape({
    image: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string
  })
};

export default FeatureIconSingle;