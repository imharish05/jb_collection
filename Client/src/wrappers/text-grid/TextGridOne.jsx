import PropTypes from "prop-types";
import clsx from "clsx";
import textGridData from "../../data/text-grid/text-grid-one.json";
import TextGridOneSingle from "../../components/text-grid/TextGridOneSingle.jsx";

const TextGridOne = ({ spaceBottomClass }) => {
  return (
    <section className={clsx("text-grid-wrapper", spaceBottomClass)}>
      <div className="container">
        {/* Added a Header section for context */}
        <div className="section-title text-center mb-40">
          <h2>Our Core Mission</h2>
          <p>We focus on delivering value through three pillars.</p>
        </div>
        
        <div className="row g-4"> {/* g-4 adds consistent Bootstrap gutter spacing */}
          {textGridData?.map((single, key) => (
            <div className="col-lg-4 col-md-6" key={key}>
              <TextGridOneSingle data={single} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

TextGridOne.propTypes = {
  spaceBottomClass: PropTypes.string
};

export default TextGridOne;