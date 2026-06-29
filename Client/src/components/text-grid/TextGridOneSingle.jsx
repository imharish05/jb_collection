import PropTypes from "prop-types";
import clsx from "clsx";

const TextGridOneSingle = ({ data, spaceBottomClass }) => {
  return (
    <div className={clsx("premium-elevated-card", spaceBottomClass)}>
      {/* Decorative top accent line */}
      <div className="accent-line"></div>
      
      <div className="card-body">
        <div className="icon-box">
          <i className={data.icon || "fa fa-lightbulb-o"}></i>
        </div>
        
        <div className="text-content">
          <h3>{data.title}</h3>
          <p>{data.text}</p>
        </div>
      </div>
    </div>
  );
};

TextGridOneSingle.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string,
    text: PropTypes.string,
    icon: PropTypes.string
  }),
  spaceBottomClass: PropTypes.string
};

export default TextGridOneSingle;
