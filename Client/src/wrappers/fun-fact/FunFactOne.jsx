import PropTypes from "prop-types";
import clsx from "clsx";
import { useSelector } from "react-redux";
import defaultFunFactData from "../../data/fun-fact/fun-fact-one.json";
import FunFactOneSingle from "../../components/fun-fact/FunFactOneSingle.jsx";

const FunFactOne = ({ spaceTopClass, spaceBottomClass, bgClass }) => {
  const { settings } = useSelector(state => state.settings);

  const funFactData = [
    {
      id: "1",
      iconClass: "pe-7s-gift",
      countNum: Number(settings?.stat1Count || defaultFunFactData[0]?.countNum || 1200),
      title: settings?.stat1Label || defaultFunFactData[0]?.title || "gifts delivered"
    },
    {
      id: "2",
      iconClass: "pe-7s-smile",
      countNum: Number(settings?.stat2Count || defaultFunFactData[1]?.countNum || 850),
      title: settings?.stat2Label || defaultFunFactData[1]?.title || "happy customers"
    },
    {
      id: "3",
      iconClass: "pe-7s-star",
      countNum: Number(settings?.stat3Count || defaultFunFactData[2]?.countNum || 25),
      title: settings?.stat3Label || defaultFunFactData[2]?.title || "event categories"
    },
    {
      id: "4",
      iconClass: "pe-7s-like2",
      countNum: Number(settings?.stat4Count || defaultFunFactData[3]?.countNum || 500),
      title: settings?.stat4Label || defaultFunFactData[3]?.title || "5 star reviews"
    }
  ];

  return (
    <div className={clsx("funfact-area", spaceTopClass, spaceBottomClass, bgClass)}>
      <div className="container">
        <div className="row">
          {funFactData.map((single, key) => (
            <div className="col-lg-3 col-md-6 col-sm-6" key={key}>
              <FunFactOneSingle
                data={single}
                spaceBottomClass="mb-30"
                textAlignClass="text-center"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

FunFactOne.propTypes = {
  bgClass: PropTypes.string,
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string
};

export default FunFactOne;

