const express = require("express");
const router = express.Router();
const { register, login, getMe, updateMe, updatePassword, adminLogin } = require("../controllers/authController");
const { forgotPassword, verifyPasswordOtp, resendPasswordOtp, resetUserPassword } = require("../controllers/passwordResetController");
const { protect } = require("../middleware/auth");
const { forgotPasswordLimiter, verifyOtpLimiter, resendOtpLimiter } = require("../middleware/rateLimiters");

router.post("/register", register);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/update-password", protect, updatePassword);

// ── Password Reset (OTP-based) ────────────────────────────────────────────────
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/verify-otp",      verifyOtpLimiter,     verifyPasswordOtp);
router.post("/resend-otp",      resendOtpLimiter,     resendPasswordOtp);
router.post("/reset-password",  resetUserPassword);

module.exports = router;