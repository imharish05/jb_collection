import PropTypes from "prop-types";
import clsx from "clsx";

const SectionTitleWithText = ({ spaceTopClass, spaceBottomClass }) => {
  return (
    <div className={clsx("welcome-area", spaceTopClass, spaceBottomClass)}>
      <div className="container">
        <div className="row align-items-center">
          {/* Image Side */}
          <div className="col-lg-6 col-md-6">
            <div className="welcome-image-wrapper">
              <img 
                src="/assets/img/about.jpg" 
                alt="Kamali Gifts" 
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
              <h5 className="sub-title">Who Are We</h5>
              <h2 className="main-title">Welcome To <span>Kamali Gifts</span></h2>
              <p className="description">
                At Kamali Gift Factory, we believe every gift should tell a story. 
                Established in 2025, we are a complete gift solution hub dedicated 
                to curating and customizing thoughtful gifts for every occasion.
              </p>
              <p className="description-secondary">
                With a focus on creativity, quality, and affordability, we transform 
                simple ideas into meaningful keepsakes. Whether you are looking for 
                personalized return gifts or unique handcrafted items, we ensure 
                every piece is made with care.
              </p>
              <div className="welcome-signature">
                <p>Making your special moments even more memorable.</p>
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