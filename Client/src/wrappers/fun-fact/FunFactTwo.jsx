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
      style={{ backgroundColor: "#b60410", padding: "80px 0", position: "relative", overflow: "hidden" }}
    >
      <style>
        {`
          @keyframes wave-sway-1 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-80px, 3px); }
          }
          @keyframes wave-sway-2 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(70px, -4px); }
          }
          @keyframes wave-sway-3 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-50px, 2px); }
          }
          .wave-path-1 { animation: wave-sway-1 4s ease-in-out infinite; }
          .wave-path-2 { animation: wave-sway-2 5s ease-in-out infinite; }
          .wave-path-3 { animation: wave-sway-3 6s ease-in-out infinite; }
        `}
      </style>
      {/* Top curvy border */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', overflow: 'hidden', lineHeight: 0, zIndex: 10 }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ position: 'relative', display: 'block', width: 'calc(100% + 240px)', height: '40px', marginLeft: '-120px' }}>
          <path className="wave-path-1" d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="#ffffff"></path>
          <path className="wave-path-2" d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="#ffffff"></path>
          <path className="wave-path-3" d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="#ffffff"></path>
        </svg>
      </div>
      <div className="container">
        <div className="row justify-content-center align-items-center">
          {funFactData.map((single, key) => (
            <div 
              className={clsx(
                "col-lg-3 col-md-6 col-sm-6 position-relative text-center",
                key !== funFactData.length - 1 ? "mb-4 mb-lg-0" : ""
              )}
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

      {/* Bottom curvy border */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', overflow: 'hidden', lineHeight: 0, zIndex: 10, transform: 'rotate(180deg)' }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ position: 'relative', display: 'block', width: 'calc(100% + 240px)', height: '40px', marginLeft: '-120px' }}>
          <path className="wave-path-1" d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="#ffffff"></path>
          <path className="wave-path-2" d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="#ffffff"></path>
          <path className="wave-path-3" d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="#ffffff"></path>
        </svg>
      </div>
    </div>
  );
};

FunFactTwo.propTypes = {
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string
};

export default FunFactTwo;
