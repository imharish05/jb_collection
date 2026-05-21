import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiMailLine, RiLockPasswordLine, RiEyeLine, RiEyeOffLine, RiArrowRightLine } from 'react-icons/ri';
import Swal from 'sweetalert2';
import './Login.css';
import { loginAdmin } from '../../redux/services/authService';
import { useDispatch } from "react-redux";
import logo from "../../assets/image.png"

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const dispatch = useDispatch()

  const ErrorMsg = ({ field }) =>
    errors[field] ? <div className="glass-error-msg">{errors[field]}</div> : null;

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Remove useDispatch — not needed
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    await loginAdmin(navigate, { email, password }, onLoginSuccess); // ← fixed
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
                  <input type="email" placeholder="admin@kamaligifts.com" value={email}
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
              <p>© 2026 Kamali Gift Factory</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
