import React, { Fragment, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import api from "../../api/axios";
import cogoToast from "cogo-toast";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const loader = cogoToast.loading("Sending OTP...", { hideAfter: 0 });

    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });

      // Hide loader FIRST, show success, then navigate after short delay
      if (loader?.hide) loader.hide();
      setTimeout(() => cogoToast.success("OTP sent! Check your inbox."), 50);
      setTimeout(() => {
        navigate("/verify-otp", { state: { email: email.trim().toLowerCase() } });
      }, 900);
    } catch (err) {
      if (loader?.hide) loader.hide();
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      setTimeout(() => cogoToast.error(msg), 50);
      setLoading(false);
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
      <SEO titleTemplate="Forgot Password" />
      <LayoutOne headerTop="visible">
        <div className="vibrant-auth-wrapper">
          <div className="vibrant-bg-header">
            <div className="header-content">
              <span className="brand-tag">Kamali Gifts</span>
              <h1>Forgot Password</h1>
              <p>Enter your registered email and we'll send you an OTP to reset your password.</p>
            </div>
          </div>

          <div className="vibrant-form-card">
            <div className="card-inner">
              <div className="form-body" style={{ paddingTop: "12px" }}>

                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <div style={{
                    width: "72px", height: "72px", borderRadius: "50%",
                    background: "linear-gradient(135deg,rgba(219,26,93,0.12),rgba(241,90,36,0.12))",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid rgba(219,26,93,0.2)"
                  }}>
                    <Mail size={32} color="#db1a5d" />
                  </div>
                  <h3 style={{ margin: "12px 0 4px", fontSize: "18px", fontWeight: "700", color: "#2c2c2c" }}>
                    Reset Your Password
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#777" }}>
                    A 6-digit OTP will be sent to your email.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="vibrant-input-group">
                    <Mail size={18} />
                    <input
                      type="email"
                      placeholder="Registered Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                  <ErrorMsg field="email" />

                  <button
                    type="submit"
                    className="vibrant-submit-btn"
                    disabled={loading}
                    style={{ opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                    {!loading && <ArrowRight size={20} />}
                  </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <Link
                    to="/login"
                    style={{ color: "#db1a5d", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600" }}
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default ForgotPassword;