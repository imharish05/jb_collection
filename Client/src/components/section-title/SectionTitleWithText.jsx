import PropTypes from "prop-types";
import clsx from "clsx";
import { useSelector } from "react-redux";

const SectionTitleWithText = ({ spaceTopClass, spaceBottomClass }) => {
  const { settings } = useSelector(state => state.settings);
  const IMG_BASE_URL = process.env.REACT_APP_IMG_URL || 'http://localhost:5000';

  const resolvedImage = settings?.aboutImageUrl 
    ? `${IMG_BASE_URL}/${settings.aboutImageUrl}` 
    : "/assets/img/about.jpg";

  const subtitle = settings?.aboutSubtitle || "Who Are We";
  const title = settings?.aboutTitle || "Welcome To JB House of Fashion (JB Tex & Tailors)";
  const primaryDesc = settings?.aboutDescPrimary || "At JB House of Fashion (JB Tex & Tailors), we believe every gift should tell a story. Established in 2025, we are a complete gift solution hub dedicated to curating and customizing thoughtful gifts for every occasion.";
  const secondaryDesc = settings?.aboutDescSecondary || "With a focus on creativity, quality, and affordability, we transform simple ideas into meaningful keepsakes. Whether you are looking for personalized return gifts or unique handcrafted items, we ensure every piece is made with care.";
  const signature = settings?.aboutSignature || "Making your special moments even more memorable.";

  return (
    <div className={clsx("welcome-area pt-30", spaceBottomClass)}>
      <div className="container">
        <div className="row align-items-center">
          {/* Image Side */}
          <div className="col-lg-6 col-md-6">
            <div className="welcome-image-wrapper">
              <img 
                src={resolvedImage} 
                alt="JB House of Fashion (JB Tex & Tailors)" 
                className="img-fluid"
              />
              {/* Optional: A small "since" badge for authority */}
              <div className="experience-badge">
                <span>Est.</span>
                <span className="year">2025</span>
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div className="col-lg-6 col-md-6">
            <div className="welcome-content-two">
              <h5 className="sub-title">{subtitle}</h5>
              <h2 className="main-title">{title}</h2>
              <p className="description text-align-justify">
                {primaryDesc}
              </p>
              {secondaryDesc && (
                <p className="description-secondary">
                  {secondaryDesc}
                </p>
              )}
              <div className="welcome-signature">
                <p>{signature}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

SectionTitleWithText.propTypes = {
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string
};

export default SectionTitleWithText;
