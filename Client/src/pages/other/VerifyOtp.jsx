import React, { Fragment, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import { ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import api from "../../api/axios";
import cogoToast from "cogo-toast";

const RESEND_COOLDOWN = 60;

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email    = location.state?.email || "";

  const [otp, setOtp]             = useState(["", "", "", "", "", ""]);
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  const timerRef  = useRef(null);

  useEffect(() => {
    if (!email) {
      cogoToast.error("Session expired. Please start again.");
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const startCountdown = useCallback(() => {
    setCanResend(false);
    setCountdown(RESEND_COOLDOWN);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => clearInterval(timerRef.current);
  }, [startCountdown]);

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    setErrors({});
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const otpValue = otp.join("");

  const validate = () => {
    if (otpValue.length !== 6) {
      setErrors({ otp: "Please enter the complete 6-digit OTP." });
      return false;
    }
    return true;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const loader = cogoToast.loading("Verifying OTP...", { hideAfter: 0 });

    try {
      await api.post("/auth/verify-otp", { email, otp: otpValue });

      // Hide loader first, then success toast, then navigate
      if (loader?.hide) loader.hide();
      setTimeout(() => cogoToast.success("OTP verified! Set your new password."), 50);
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 900);
    } catch (err) {
      if (loader?.hide) loader.hide();
      const msg = err.response?.data?.message || "Invalid OTP. Please try again.";
      setErrors({ otp: msg });
      setTimeout(() => cogoToast.error(msg), 50);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    const loader = cogoToast.loading("Resending OTP...", { hideAfter: 0 });

    try {
      await api.post("/auth/resend-otp", { email });
      if (loader?.hide) loader.hide();
      setTimeout(() => cogoToast.success("New OTP sent! Check your inbox."), 50);
      setOtp(["", "", "", "", "", ""]);
      setErrors({});
      startCountdown();
      inputRefs.current[0]?.focus();
    } catch (err) {
      if (loader?.hide) loader.hide();
      const msg = err.response?.data?.message || "Failed to resend OTP.";
      setTimeout(() => cogoToast.error(msg), 50);
    } finally {
      setResending(false);
    }
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Fragment>
      <SEO titleTemplate="Verify OTP" />
      <LayoutOne headerTop="visible">
        <div className="vibrant-auth-wrapper">
          <div className="vibrant-bg-header">
            <div className="header-content">
              <span className="brand-tag">JB House of Fashion</span>
              <h1>Verify OTP</h1>
              <p>We've sent a 6-digit code to your email address.</p>
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
                    <ShieldCheck size={32} color="#b60410" />
                  </div>
                  <h3 style={{ margin: "12px 0 4px", fontSize: "18px", fontWeight: "700", color: "#2c2c2c" }}>
                    Enter Verification Code
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#777" }}>
                    OTP sent to <strong style={{ color: "#b60410" }}>{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerify} noValidate>
                  <div
                    style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "8px" }}
                    onPaste={handlePaste}
                  >
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        disabled={loading}
                        style={{
                          width: "46px", height: "54px", textAlign: "center",
                          fontSize: "22px", fontWeight: "700",
                          border: errors.otp ? "2px solid #d9534f" : "2px solid #e5e5e5",
                          borderRadius: "10px", outline: "none",
                          background: "#fafafa", color: "#2c2c2c",
                          transition: "border-color 0.2s",
                          fontFamily: "'Courier New', monospace",
                          caretColor: "#b60410",
                        }}
                        onFocus={(e) => { e.target.style.borderColor = "#b60410"; }}
                        onBlur={(e) => { if (!errors.otp) e.target.style.borderColor = "#e5e5e5"; }}
                      />
                    ))}
                  </div>

                  {errors.otp && (
                    <div style={{ color: "#d9534f", fontSize: "11px", textAlign: "center", marginBottom: "12px", fontWeight: "500" }}>
                      {errors.otp}
                    </div>
                  )}

                  <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    {!canResend ? (
                      <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
                        Resend OTP in{" "}
                        <span style={{ color: "#b60410", fontWeight: "700", fontFamily: "monospace" }}>
                          {formatTime(countdown)}
                        </span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "#b60410", fontSize: "13px", fontWeight: "600",
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          opacity: resending ? 0.6 : 1,
                        }}
                      >
                        <RefreshCw size={14} /> {resending ? "Resending..." : "Resend OTP"}
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="vibrant-submit-btn"
                    disabled={loading || otpValue.length < 6}
                    style={{ opacity: (loading || otpValue.length < 6) ? 0.7 : 1 }}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                    {!loading && <ShieldCheck size={20} />}
                  </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <Link
                    to="/forgot-password"
                    style={{ color: "#b60410", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600" }}
                  >
                    <ArrowLeft size={14} /> Use a different email
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

export default VerifyOtp;