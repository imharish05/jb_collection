import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import * as LucideIcons from "lucide-react";

const FeatureIconSingle = ({ singleFeature }) => {
  const IconComponent = LucideIcons[singleFeature.icon] || LucideIcons.Truck;

  return (
    <Link to={`/${singleFeature.link}`} className="support-wrap-28">
      <div className="support-icon-28">
        <IconComponent 
          className={`feature-icon-svg icon-${(singleFeature.icon || "Truck").toLowerCase()}`} 
          strokeWidth={1.8}
          color="#ffffff"
          stroke="#ffffff"
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
    icon: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    link: PropTypes.string
  })
};

export default FeatureIconSingle;
