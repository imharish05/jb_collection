import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import "./HeaderTop.css";

const HeaderTop = () => {
  const reduxMessages = useSelector((state) => state.marquee?.messages);
  const messages = reduxMessages?.length > 0 ? reduxMessages : [
    "Complimentary Worldwide <em>Shipping</em>",
    "The <em>Pink</em> Collection — Now Available",
    "Subscribe for <em>15% Off</em> Your First Order"
  ];

  // Join messages with a spacer bullet
  const marqueeContent = messages.join(" &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp; ");

  return (
    <div className="luxury-top-bar">
      {/* FULL WIDTH: Continuous Marquee */}
      <div className="marquee-container">
        <div className="marquee-track">
          <span className="marquee-text" dangerouslySetInnerHTML={{ __html: marqueeContent }} />
          <span className="marquee-text" dangerouslySetInnerHTML={{ __html: marqueeContent }} />
        </div>
      </div>
    </div>
  );
};

export default HeaderTop;