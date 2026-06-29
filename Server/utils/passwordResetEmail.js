/**
 * Generates a branded HTML email for OTP-based password reset.
 * @param {string} userName
 * @param {string} otp
 * @returns {string} HTML string
 */
const getPasswordResetEmailTemplate = (userName, otp) => {
  const firstName = (userName || "Customer").split(" ")[0];
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password – JB House of Fashion</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0"
           style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:580px;">

      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <tr>
        <td style="background:linear-gradient(135deg,rgba(219,26,93,0.15) 0%,rgb(255,232,214) 100%);padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#db1a5d;font-size:26px;font-weight:700;letter-spacing:0.5px;">🎁 JB House of Fashion</h1>
          <p style="margin:8px 0 0;color:#555;font-size:14px;">Password Reset Request</p>
        </td>
      </tr>

      <!-- ── Greeting ───────────────────────────────────────────────────── -->
      <tr>
        <td style="padding:36px 40px 24px;text-align:center;">
          <div style="font-size:44px;margin-bottom:12px;">🔐</div>
          <h2 style="margin:0 0 10px;font-size:22px;color:#2c2c2c;font-weight:700;">
            Hi ${firstName},
          </h2>
          <p style="margin:0;color:#666;font-size:15px;line-height:1.6;">
            We received a request to reset your JB House of Fashion account password.<br/>
            Use the OTP below to proceed.
          </p>
        </td>
      </tr>

      <!-- ── OTP Box ─────────────────────────────────────────────────────── -->
      <tr>
        <td style="padding:0 40px 32px;text-align:center;">
          <div style="display:inline-block;background:#fdf0f4;border:2px dashed #db1a5d;border-radius:16px;padding:28px 40px;margin:0 auto;">
            <p style="margin:0 0 8px;font-size:13px;color:#888;font-weight:600;letter-spacing:2px;text-transform:uppercase;">
              Your OTP Code
            </p>
            <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#db1a5d;font-family:'Courier New',monospace;">
              ${otp}
            </div>
            <p style="margin:10px 0 0;font-size:12px;color:#e0555a;font-weight:600;">
              ⏱ Expires in <strong>15 minutes</strong>
            </p>
          </div>
        </td>
      </tr>

      <!-- ── Instructions ───────────────────────────────────────────────── -->
      <tr>
        <td style="padding:0 40px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f9fafb;border-radius:10px;border:1px solid #eee;padding:16px 20px;">
            <tr>
              <td style="padding:12px 16px;">
                <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">
                  <strong>Steps to reset your password:</strong><br/>
                  1. Enter the OTP code on the verification page.<br/>
                  2. Create a new, strong password.<br/>
                  3. You'll be redirected to sign in automatically.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── Security Notice ────────────────────────────────────────────── -->
      <tr>
        <td style="padding:0 40px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:6px;padding:14px 18px;">
            <tr>
              <td style="padding:10px 14px;">
                <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                  ⚠️ <strong>Didn't request this?</strong> If you didn't request a password reset,
                  you can safely ignore this email. Your account remains secure.
                  Never share this OTP with anyone — JB House of Fashion will never ask for it.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── Footer ─────────────────────────────────────────────────────── -->
      <tr>
        <td style="padding:24px 40px;background:#fafafa;text-align:center;border-top:1px solid #f0f0f0;">
          <p style="margin:0 0 6px;font-size:13px;color:#888;">
            Need help? Contact us at
            <a href="mailto:support@kamilagifts.com" style="color:#db1a5d;">support@kamilagifts.com</a>
          </p>
          <p style="margin:0;font-size:12px;color:#bbb;">© ${year} JB House of Fashion. All rights reserved.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
};

module.exports = { getPasswordResetEmailTemplate };