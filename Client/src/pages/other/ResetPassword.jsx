import React, { Fragment, useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import api from "../../api/axios";
import cogoToast from "cogo-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email    = location.state?.email || "";

  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [errors, setErrors]                   = useState({});
  const [loading, setLoading]                 = useState(false);

  useEffect(() => {
    if (!email) {
      cogoToast.error("Session expired. Please start again.");
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const validate = () => {
    const newErrors = {};
    if (!newPassword) {
      newErrors.newPassword = "New password is required.";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters.";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const loader = cogoToast.loading("Resetting password...", { hideAfter: 0 });

    try {
      await api.post("/auth/reset-password", { email, newPassword, confirmPassword });

      // Hide loader first, success toast, then navigate
      if (loader?.hide) loader.hide();
      setTimeout(() => cogoToast.success("Password reset successfully! Please sign in."), 50);
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      if (loader?.hide) loader.hide();
      const msg = err.response?.data?.message || "Failed to reset password. Please try again.";
      setTimeout(() => cogoToast.error(msg), 50);
      if (msg.toLowerCase().includes("otp") || msg.toLowerCase().includes("session")) {
        setTimeout(() => navigate("/forgot-password"), 900);
      }
      setLoading(false);
    }
  };

  const ErrorMsg = ({ field }) =>
    errors[field] ? (
      <div style={{ color: "#d9534f", fontSize: "11px", marginTop: "-12px", marginBottom: "12px", paddingLeft: "10px", fontWeight: "500" }}>
        {errors[field]}
      </div>
    ) : null;

  const strength = (() => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 6)  s++;
    if (newPassword.length >= 10) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/\d/.test(newPassword))    s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][strength];
  const strengthColor = ["", "#e53e3e", "#dd6b20", "#d69e2e", "#38a169", "#2b6cb0"][strength];

  return (
    <Fragment>
      <SEO titleTemplate="Reset Password" />
      <LayoutOne headerTop="visible">
        <div className="vibrant-auth-wrapper">
          <div className="vibrant-bg-header">
            <div className="header-content">
              <span className="brand-tag">Kamali Gifts</span>
              <h1>Set New Password</h1>
              <p>Choose a strong password for your account.</p>
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
                    <Lock size={32} color="#b60410" />
                  </div>
                  <h3 style={{ margin: "12px 0 4px", fontSize: "18px", fontWeight: "700", color: "#2c2c2c" }}>
                    Create New Password
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#777" }}>
                    For account <strong style={{ color: "#b60410" }}>{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="vibrant-input-group">
                    <Lock size={18} />
                    <input
                      type={showNew ? "text" : "password"}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowNew(!showNew)}>
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <ErrorMsg field="newPassword" />

                  {newPassword && (
                    <div style={{ marginTop: "-8px", marginBottom: "16px" }}>
                      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                        {[1,2,3,4,5].map((level) => (
                          <div key={level} style={{
                            flex: 1, height: "4px", borderRadius: "4px",
                            background: level <= strength ? strengthColor : "#e5e5e5",
                            transition: "background 0.3s"
                          }} />
                        ))}
                      </div>
                      <p style={{ margin: 0, fontSize: "11px", color: strengthColor, fontWeight: "600" }}>
                        {strengthLabel}
                      </p>
                    </div>
                  )}

                  <div className="vibrant-input-group">
                    <Lock size={18} />
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword === confirmPassword && (
                    <div style={{ color: "#38a169", fontSize: "11px", marginTop: "-12px", marginBottom: "12px", paddingLeft: "10px", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle size={12} /> Passwords match
                    </div>
                  )}
                  <ErrorMsg field="confirmPassword" />

                  <button
                    type="submit"
                    className="vibrant-submit-btn"
                    disabled={loading}
                    style={{ opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                    {!loading && <CheckCircle size={20} />}
                  </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <Link
                    to="/login"
                    style={{ color: "#b60410", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600" }}
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

export default ResetPassword;