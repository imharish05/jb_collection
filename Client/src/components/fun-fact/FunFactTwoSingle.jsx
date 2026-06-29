import PropTypes from "prop-types";
import { useState } from "react";
import CountUp from "react-countup";
import VisibilitySensor from "react-visibility-sensor";

const FunFactTwoSingle = ({ data }) => {
  const [didViewCountUp, setDidViewCountUp] = useState(false);

  const onVisibilityChange = isVisible => {
    if (isVisible) {
      setDidViewCountUp(true);
    }
  };
  return (
    <div className="single-count-two">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        `}
      </style>
      <h2 
        className="count" 
        style={{ 
          color: "#000000", // Black color
          fontSize: "42px", 
          fontWeight: "700",
          fontFamily: "'Playfair Display', serif",
          marginBottom: "5px"
        }}
      >
        <VisibilitySensor
          onChange={onVisibilityChange}
          offset={{ top: 10 }}
          delayedCall
        >
          <CountUp end={didViewCountUp ? data.countNum : 0} />
        </VisibilitySensor>
        {data.countNum > 0 ? "+" : ""}
      </h2>
      <span 
        style={{ 
          color: "#ffffff", 
          fontSize: "12px", 
          fontWeight: "500",
          letterSpacing: "1px",
          textTransform: "uppercase" 
        }}
      >
        {data.title}
      </span>
    </div>
  );
};

FunFactTwoSingle.propTypes = {
  data: PropTypes.shape({})
};

export default FunFactTwoSingle;
