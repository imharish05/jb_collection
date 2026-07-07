import PropTypes from "prop-types";
import clsx from "clsx";
import featureIconData from "../../data/feature-icons/feature-icon.json";
import FeatureIconSingle from "../../components/feature-icon/FeatureIconSingle";

const FeatureIcon = ({ spaceTopClass, spaceBottomClass }) => {
  return (
    <div className={clsx("support-area glass-feature-section", spaceTopClass, spaceBottomClass)}>
      <div className="container">
        <div className="section-title text-center mb-40">
          <h2>Designed For You..!</h2>
          <p>Premium quality, seamless delivery, and dedicated support—always.</p>
        </div>
        {/* Row of cards, centered and using grid for spacing */}
        <div className="row g-4 justify-content-around">
          {featureIconData?.map(singleFeature => (
            /* Responsive grid: 1 per row on mobile, 2 on small tablet, 3 on tablet, 5 on desktop (single line) */
            <div className="col-12 col-sm-6 col-md-4 col-xl" key={singleFeature.id}>
              <FeatureIconSingle
                singleFeature={singleFeature}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
FeatureIcon.propTypes = {
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string
};

export default FeatureIcon;
