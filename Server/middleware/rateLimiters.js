const rateLimit = require("express-rate-limit");

/** Forgot-password: 5 requests / 15 min per IP */
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many password reset requests from this IP. Please try again after 15 minutes.",
  },
  skipSuccessfulRequests: false,
});

/** OTP verification: 10 requests / 15 min per IP */
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many OTP verification attempts. Please try again after 15 minutes.",
  },
});

/** Resend OTP: 3 requests / 15 min per IP */
const resendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many OTP resend requests. Please wait 15 minutes before trying again.",
  },
});

module.exports = { forgotPasswordLimiter, verifyOtpLimiter, resendOtpLimiter };