import React, { Fragment, useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom"; // Add useNavigate
import { useDispatch, useSelector } from "react-redux"; // Add Redux hooks
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, Phone } from "lucide-react";

// Import your service functions
import { loginFunction,registerFunction } from "../../store/services/authService";

const LoginRegister = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get loading state from Redux to disable button while processing
  const { loading } = useSelector((state) => state.auth);

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (location.pathname.includes("register")) {
      setIsLogin(false);
    }
  }, [location.pathname]);

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 10) {
      setPhone(value);
    }
  };

  const validate = () => {
    let newErrors = {};
    if (!isLogin && !fullName.trim()) newErrors.fullName = "Full name is required";
    
    if (!isLogin) {
      if (!phone.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (phone.length < 10) {
        newErrors.phone = "Phone number must be 10 digits";
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      if (isLogin) {
        // CALL LOGIN SERVICE
        // Backend expects { email, password } based on your controller
        loginFunction(dispatch, navigate, { email, password });
      } else {
        // CALL REGISTER SERVICE
        // Backend expects { name, email, password, phone }
        const userData = { name: fullName, email, password, phone };
        registerFunction(dispatch, navigate, userData);
      }
    }
  };

  const ErrorMsg = ({ field }) => 
    errors[field] ? (
      <div style={{ color: "#d9534f", fontSize: "11px", marginTop: "-12px", marginBottom: "12px", paddingLeft: "10px", fontWeight: "500" }}>
        {errors[field]}
      </div>
    ) : null;

  return (
    <Fragment>
      <SEO titleTemplate={isLogin ? "Sign In" : "Register"} />
      <LayoutOne headerTop="visible">
        <div className="vibrant-auth-wrapper">
          <div className="vibrant-bg-header">
            <div className="header-content">
              <span className="brand-tag">JB House of Fashion</span>
              <h1>{isLogin ? "Welcome Back" : "Create Account"}</h1>
              <p>{isLogin ? "Sign in to manage your orders." : "Join us for personalized gifting experiences."}</p>
            </div>
          </div>

          <div className="vibrant-form-card">
            <div className="card-inner">
              <div className="custom-tab-row">
                <button 
                  className={isLogin ? "active" : ""} 
                  onClick={() => { setIsLogin(true); setErrors({}); setEmail(''); setPassword(''); setFullName(''); setPhone(''); }}
                  disabled={loading}
                >
                  Login
                </button>
                <button 
                  className={!isLogin ? "active" : ""} 
                  onClick={() => { setIsLogin(false); setErrors({}); setEmail(''); setPassword(''); setFullName(''); setPhone(''); }}
                  disabled={loading}
                >
                  Register
                </button>
              </div>

              <div className="form-body">
                <form onSubmit={handleSubmit} noValidate>
                  {!isLogin && (
                    <>
                      <div className="vibrant-input-group">
                        <User size={18} />
                        <input 
                          type="text" 
                          placeholder="Full Name" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                      <ErrorMsg field="fullName" />
                    </>
                  )}

                  {!isLogin && (
                    <>
                      <div className="vibrant-input-group">
                        <Phone size={18} />
                        <input 
                          type="tel" 
                          placeholder="Phone Number" 
                          value={phone}
                          onChange={handlePhoneChange}
                        />
                      </div>
                      <ErrorMsg field="phone" />
                    </>
                  )}

                  <div className="vibrant-input-group">
                    <Mail size={18} />
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <ErrorMsg field="email" />

                  <div className="vibrant-input-group">
                    <Lock size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <ErrorMsg field="password" />

                  {isLogin && (
                    <div className="auth-utility">
                      <Link to="/forgot-password" style={{ color: "#b60410", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>Forgot password?</Link>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="vibrant-submit-btn" 
                    disabled={loading}
                    style={{ opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? "Processing..." : (isLogin ? "Sign In" : "Register Now")}
                    {!loading && <ArrowRight size={20} />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default LoginRegister;