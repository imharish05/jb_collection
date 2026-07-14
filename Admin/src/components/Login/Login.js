import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiMailLine, RiLockPasswordLine, RiEyeLine, RiEyeOffLine, RiArrowRightLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import './Login.css';
import { loginAdmin } from '../../redux/services/authService';
import logo from "../../assets/image.png"

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const showToastMsg = useCallback(Object.assign(
    (msg) => toast(msg),
    {
      loading: (msg) => toast.loading(msg),
      success: (msg, id) => id ? toast.success(msg, { id }) : toast.success(msg),
      error:   (msg, id) => id ? toast.error(msg, { id })   : toast.error(msg),
    }
  ), []);

  const ErrorMsg = ({ field }) =>
    errors[field] ? <div className="glass-error-msg">{errors[field]}</div> : null;

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (newErrors.email) showToastMsg.error(newErrors.email);
    if (newErrors.password) showToastMsg.error(newErrors.password);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login with toast feedback
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    await loginAdmin(navigate, { email, password }, onLoginSuccess, showToastMsg);
    setLoading(false);
  };

  return (
    <div className="glass-contact-wrapper center-mode">
      <div className="glass-shape shape-1" />
      <div className="glass-shape shape-2" />
      <div className="container d-flex justify-content-center">
        <div className="glass-card-center">
          <div className="glass-card-inner">
            <header className="glass-header-center">
              <div className="logo-badge" >
                <img src={logo}/>
              </div>
              <span className="glass-tag">Admin Access</span>
              <h2 className="glass-title">Welcome <span>Back.</span></h2>
            </header>
            {errors.server && <div className="glass-server-error">{errors.server}</div>}
            <form className="glass-form" onSubmit={handleLogin}>
              <div className="glass-input-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <RiMailLine className="input-icon" />
                  <input type="email" placeholder="Enter email address" value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: null }); }} />
                </div>
                <ErrorMsg field="email" />
              </div>
              <div className="glass-input-group">
                <label>Password</label>
                <div className="input-with-icon">
                  <RiLockPasswordLine className="input-icon" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: null }); }} />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                  </button>
                </div>
                <ErrorMsg field="password" />
              </div>
              <button type="submit" className="glass-button w-100" disabled={loading}>
                {loading ? 'Verifying...' : <> Sign In <RiArrowRightLine /></>}
              </button>
            </form>
            <footer className="glass-footer-center">
              <p>© 2026 JB House of Fashion (JB Tex & Tailors)</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
