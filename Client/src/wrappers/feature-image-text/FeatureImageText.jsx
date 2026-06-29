import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

const FeatureImageText = ({ spaceTopClass, spaceBottomClass }) => {
  return (
    <div 
      className={clsx("feature-image-text-area", spaceTopClass, spaceBottomClass)}
      style={{ 
        backgroundColor: "#f9cbf1", 
        padding: "80px 0",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Top curvy border */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', overflow: 'hidden', lineHeight: 0, zIndex: 10 }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ position: 'relative', display: 'block', width: 'calc(100% + 1.3px)', height: '40px' }}>
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="#ffffff"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="#ffffff"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="#ffffff"></path>
        </svg>
      </div>

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <div className="row align-items-center">
          <div className="col-lg-6 col-md-12 mb-4 mb-lg-0 text-center text-lg-start">
            <div 
              style={{
                position: "relative",
                display: "inline-block",
                padding: "15px",
                backgroundColor: "#00a859",
                borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
                transform: "rotate(-5deg)",
                boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
                width: "90%",
                maxWidth: "450px"
              }}
            >
              {/* Image masked exactly inside the green organic shape */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  overflow: "hidden",
                  borderRadius: "28% 68% 68% 28% / 28% 28% 68% 68%",
                  transform: "rotate(5deg)", // Counter-rotate the image so it stands straight inside the blob
                }}
              >
                <img 
                  src={process.env.PUBLIC_URL + "/assets/img/about.jpg"} 
                  alt="Feature" 
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block"
                  }}
                />
              </div>
            </div>
          </div>
          <div className="col-lg-6 col-md-12">
            <div style={{ paddingLeft: "15px" }}>
              <h2 style={{ fontWeight: "700", marginBottom: "30px", fontSize: "32px", color: "#000" }}>
                Quality products that <span style={{ position: "relative", display: "inline-block" }}>
                  actually work
                  <svg 
                    style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "115%", height: "130%", zIndex: 0 }} 
                    viewBox="0 0 100 40" 
                    preserveAspectRatio="none"
                  >
                    <path d="M5,20 Q50,5 95,20 Q50,35 5,20 Z" fill="transparent" stroke="#fff" strokeWidth="2" />
                  </svg>
                </span>
              </h2>
              <ul style={{ listStyleType: "none", padding: 0 }}>
                {[
                  { icon: "pe-7s-diamond", text: "Premium quality" },
                  { icon: "pe-7s-cash", text: "No hidden charges" },
                  { icon: "pe-7s-plane", text: "Timely delivery" },
                 
                  { icon: "pe-7s-like2", text: "100% satisfaction" }
                ].map((item, index) => (
                  <li 
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "15px",
                      paddingBottom: "15px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.5)",
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#000"
                    }}
                  >
                    <i className={item.icon} style={{ fontSize: "24px", marginRight: "15px" }}></i>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom curvy border */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', overflow: 'hidden', lineHeight: 0, zIndex: 10, transform: 'rotate(180deg)' }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ position: 'relative', display: 'block', width: 'calc(100% + 1.3px)', height: '40px' }}>
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="#ffffff"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="#ffffff"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="#ffffff"></path>
        </svg>
      </div>

    </div>
  );
};

FeatureImageText.propTypes = {
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string
};

export default FeatureImageText;
