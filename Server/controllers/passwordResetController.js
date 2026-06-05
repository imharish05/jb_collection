const {
  sendPasswordResetOtp,
  verifyOtp,
  resendOtp,
  resetPassword,
} = require("../services/passwordResetService");

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const result = await sendPasswordResetOtp(email.trim().toLowerCase());
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-otp
const verifyPasswordOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    if (!/^\d{6}$/.test(String(otp).trim())) {
      return res.status(400).json({ message: "OTP must be a 6-digit number." });
    }

    const result = await verifyOtp(email.trim().toLowerCase(), String(otp).trim());
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/resend-otp
const resendPasswordOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required." });
    }

    const result = await resendOtp(email.trim().toLowerCase());
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
const resetUserPassword = async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const result = await resetPassword(email.trim().toLowerCase(), newPassword);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { forgotPassword, verifyPasswordOtp, resendPasswordOtp, resetUserPassword };