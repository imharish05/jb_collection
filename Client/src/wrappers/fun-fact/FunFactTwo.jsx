import PropTypes from "prop-types";
import clsx from "clsx";
import { useSelector } from "react-redux";
import defaultFunFactData from "../../data/fun-fact/fun-fact-one.json";
import FunFactTwoSingle from "../../components/fun-fact/FunFactTwoSingle.jsx";

const FunFactTwo = ({ spaceTopClass, spaceBottomClass }) => {
  const { settings } = useSelector(state => state.settings);

  const funFactData = [
    {
      id: "1",
      countNum: parseInt(settings?.stat1Count || defaultFunFactData[0]?.countNum || 1200, 10) || 1200,
      title: settings?.stat1Label || defaultFunFactData[0]?.title || "PRODUCTS DELIVERED"
    },
    {
      id: "2",
      countNum: parseInt(settings?.stat2Count || defaultFunFactData[1]?.countNum || 850, 10) || 850,
      title: settings?.stat2Label || defaultFunFactData[1]?.title || "HAPPY CUSTOMERS"
    },
    {
      id: "3",
      countNum: parseInt(settings?.stat3Count || defaultFunFactData[2]?.countNum || 2500, 10) || 2500,
      title: settings?.stat3Label || defaultFunFactData[2]?.title || "INSTAGRAM FAMILIES"
    },
    {
      id: "4",
      countNum: parseInt(settings?.stat4Count || defaultFunFactData[3]?.countNum || 500, 10) || 500,
      title: settings?.stat4Label || defaultFunFactData[3]?.title || "5 STAR REVIEWS"
    }
  ];

  return (
    <div 
      className={clsx("funfact-two-area", spaceTopClass, spaceBottomClass)} 
      style={{ backgroundColor: "#f5d56e", padding: "40px 0" }}
    >
      <div className="container">
        <div className="row justify-content-center align-items-center">
          {funFactData.map((single, key) => (
            <div 
              className="col-lg-3 col-md-6 col-sm-6 position-relative text-center" 
              key={key}
            >
              <FunFactTwoSingle
                data={single}
              />
              {/* Add a vertical separator if it's not the last element, but hide on small screens if desired */}
              {key !== funFactData.length - 1 && (
                <div 
                  className="d-none d-md-block position-absolute"
                  style={{
                    right: 0,
                    top: "10%",
                    height: "80%",
                    width: "1px",
                    backgroundColor: "rgba(182, 4, 16, 0.3)"
                  }}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

FunFactTwo.propTypes = {
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string
};

export default FunFactTwo;
