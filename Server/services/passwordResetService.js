const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { User, PasswordResetOtp } = require("../models");
const nodemailer = require("nodemailer");
const { getPasswordResetEmailTemplate } = require("../utils/passwordResetEmail");

// ── Mailer (reuse env vars already in project) ────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Cryptographically secure 6-digit OTP */
const generateOtp = () => {
  const buf = crypto.randomBytes(4);
  return String(parseInt(buf.toString("hex"), 16) % 1_000_000).padStart(6, "0");
};

const OTP_EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS = 5;

// ── 1. Forgot Password: send OTP ─────────────────────────────────────────────
const sendPasswordResetOtp = async (email) => {
  // Always return the same message — never expose user existence
  const safeMsg = "If an account exists with that email, a password reset OTP has been sent.";

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[ForgotPassword] EMAIL_USER / EMAIL_PASS not configured");
    // Return success anyway to avoid leaking info; log for ops
    return { message: safeMsg };
  }

  const user = await User.findOne({ where: { email } });
  if (!user) return { message: safeMsg }; // user not found — silent

  // Invalidate any existing unused OTPs for this user
  await PasswordResetOtp.update(
    { used: true },
    { where: { user_id: user.id, used: false } }
  );

  const otp = generateOtp();
  const expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await PasswordResetOtp.create({
    user_id: user.id,
    otp,
    expires_at,
    used: false,
    verified: false,
    attempts: 0,
  });

  const html = getPasswordResetEmailTemplate(user.name, otp);

  await transporter.sendMail({
    from: `"Kamali Gifts" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Reset Your Password – Kamali Gifts",
    html,
  });

  console.log(`[ForgotPassword] OTP sent to ${user.email}`);
  return { message: safeMsg };
};

// ── 2. Verify OTP ─────────────────────────────────────────────────────────────
const verifyOtp = async (email, otp) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const err = new Error("Invalid or expired OTP.");
    err.statusCode = 400;
    throw err;
  }

  const record = await PasswordResetOtp.findOne({
    where: {
      user_id: user.id,
      used: false,
      verified: false,
      expires_at: { [Op.gt]: new Date() },
    },
    order: [["created_at", "DESC"]],
  });

  if (!record) {
    const err = new Error("OTP has expired or already been used. Please request a new one.");
    err.statusCode = 400;
    throw err;
  }

  // Brute-force guard
  if (record.attempts >= MAX_ATTEMPTS) {
    await record.update({ used: true }); // invalidate
    const err = new Error("Too many failed attempts. Please request a new OTP.");
    err.statusCode = 429;
    throw err;
  }

  if (record.otp !== String(otp).trim()) {
    await record.increment("attempts");
    const remaining = MAX_ATTEMPTS - (record.attempts + 1);
    const err = new Error(
      remaining > 0
        ? `Incorrect OTP. ${remaining} attempt(s) remaining.`
        : "Incorrect OTP. No attempts remaining — please request a new one."
    );
    err.statusCode = 400;
    throw err;
  }

  // Mark as verified (not yet used — still needed for reset step)
  await record.update({ verified: true });

  return { message: "OTP verified successfully." };
};

// ── 3. Resend OTP ─────────────────────────────────────────────────────────────
const resendOtp = async (email) => sendPasswordResetOtp(email);

// ── 4. Reset Password ─────────────────────────────────────────────────────────
const resetPassword = async (email, newPassword) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const err = new Error("Session expired. Please start the forgot password flow again.");
    err.statusCode = 400;
    throw err;
  }

  // Find a verified, unused, non-expired OTP
  const record = await PasswordResetOtp.findOne({
    where: {
      user_id: user.id,
      used: false,
      verified: true,
      expires_at: { [Op.gt]: new Date() },
    },
    order: [["created_at", "DESC"]],
  });

  if (!record) {
    const err = new Error("OTP session expired or invalid. Please restart the password reset process.");
    err.statusCode = 400;
    throw err;
  }

  // Hash password manually (model hook will double-hash via beforeUpdate)
  const hashed = await bcrypt.hash(newPassword, 10);
  await User.update(
    { password: hashed },
    { where: { id: user.id }, individualHooks: false } // skip beforeUpdate to avoid double-hash
  );

  // Invalidate OTP immediately
  await record.update({ used: true, verified: false });

  // Invalidate all other pending OTPs for this user (cleanup)
  await PasswordResetOtp.update(
    { used: true },
    { where: { user_id: user.id, used: false } }
  );

  console.log(`[ForgotPassword] Password reset for ${user.email}`);
  return { message: "Password reset successfully. You can now sign in with your new password." };
};

module.exports = { sendPasswordResetOtp, verifyOtp, resendOtp, resetPassword };