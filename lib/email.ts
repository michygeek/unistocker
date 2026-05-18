import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
const APP_NAME = "UniStocker";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  userName?: string
) {
  const greeting = userName ? `Hi ${userName},` : "Hi,";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#0F2030,#1B3D4F);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
        <div style="display:inline-block;background:#2EBD78;border-radius:12px;padding:10px 16px;margin-bottom:16px;">
          <span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:-0.02em;">${APP_NAME}</span>
        </div>
        <p style="color:#7EB8A8;font-size:13px;margin:0;">Inventory Management</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:36px 40px;">
        <p style="font-size:16px;color:#374151;margin:0 0 8px;">${greeting}</p>
        <h1 style="font-size:22px;font-weight:800;color:#0F2030;margin:0 0 16px;letter-spacing:-0.02em;">
          Reset your password
        </h1>
        <p style="font-size:14px;color:#6b7280;line-height:1.65;margin:0 0 28px;">
          We received a request to reset your password. Click the button below to choose
          a new password. This link expires in <strong>1 hour</strong>.
        </p>

        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding-bottom:28px;">
            <a href="${resetUrl}"
               style="display:inline-block;background:#2EBD78;color:#ffffff;font-size:15px;font-weight:700;
                      text-decoration:none;padding:14px 36px;border-radius:10px;
                      box-shadow:0 4px 14px rgba(46,189,120,0.35);">
              Reset Password
            </a>
          </td></tr>
        </table>

        <!-- Fallback URL -->
        <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0 0 24px;">
          If the button doesn't work, copy and paste this link into your browser:<br />
          <a href="${resetUrl}" style="color:#2EBD78;word-break:break-all;">${resetUrl}</a>
        </p>

        <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;" />
        <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.6;">
          If you didn't request a password reset, you can safely ignore this email —
          your password will not change.
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
        <p style="font-size:12px;color:#9ca3af;margin:0;">
          &copy; ${new Date().getFullYear()} ${APP_NAME}. Built for African businesses.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`,
  });
}
