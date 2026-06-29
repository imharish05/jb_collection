import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const BreadcrumbWrap = ({pages}) => {
  return (
    <div className="breadcrumb-area" style={{ 
      padding: "20px 0", 
      background: "var(--theme-gradient)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div className="container" style={{ display: "flex", justifyContent: "center" }}>
        <nav aria-label="breadcrumb">
          <ol style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            listStyle: "none",
            margin: 0,
            padding: 0,
            gap: "10px",
            flexWrap: "wrap"
          }}>
            {pages?.map(({ path, label }, i) => {
              const isFirst = i === 0;
              const isLast = i === pages.length - 1;
              
              // Helper for the pill container styles
              const pillStyle = {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#fff",
                borderRadius: "30px",
                padding: isFirst ? "8px 12px" : "8px 20px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                color: "var(--theme-color)",
                fontSize: "14px",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "1px",
                textDecoration: "none",
                transition: "transform 0.2s, box-shadow 0.2s"
              };

              // Home icon SVG
              const homeIcon = (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              );

              return (
                <li key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {!isLast ? (
                    <>
                      <Link 
                        to={path} 
                        style={pillStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 15px rgba(0,0,0,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
                        }}
                      >
                        {isFirst ? homeIcon : label}
                      </Link>
                      <i className="fa fa-angle-right" style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", fontWeight: "bold" }} />
                    </>
                  ) : (                
                    <span style={{ ...pillStyle, cursor: "default" }}>
                      {isFirst ? homeIcon : label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};

BreadcrumbWrap.propTypes = {
  pages: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired
  })).isRequired
}

export default BreadcrumbWrap;
