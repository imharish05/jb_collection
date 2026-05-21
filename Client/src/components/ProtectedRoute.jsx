import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

/**
 * ProtectedRoute
 * Wraps routes that require authentication.
 * If not logged in → redirects to /login with `?redirect=<intended path>`
 * After login, authService navigates back to the redirect URL.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return (
      <Navigate
        to={`${process.env.PUBLIC_URL}/login?redirect=${redirectTo}`}
        replace
      />
    );
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;