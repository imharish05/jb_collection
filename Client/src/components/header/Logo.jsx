import PropTypes from "prop-types";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Logo = ({ imageUrl, logoClass }) => {
  const { settings } = useSelector(state => state.settings);
  const IMG_BASE_URL = process.env.REACT_APP_IMG_URL || 'http://localhost:5000';
  
  const resolvedLogo = settings?.logoUrl 
    ? `${IMG_BASE_URL}/${settings.logoUrl}` 
    : process.env.PUBLIC_URL + imageUrl;

  return (
    <div>
      <Link to={process.env.PUBLIC_URL + "/"}>
        <img alt="Logo" src={resolvedLogo} className="img-fluid" id="logo" style={{ maxHeight: "60px", width: "auto" }}/>
      </Link>
    </div>
  );
};

Logo.propTypes = {
  imageUrl: PropTypes.string,
  logoClass: PropTypes.string
};

export default Logo;

