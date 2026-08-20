import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const APP_NAME = "UniStocker";

// ── Shared layout helpers ─────────────────────────────────────────────────────

function emailWrapper(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#0F2030,#1B3D4F);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
        <div style="display:inline-block;background:#0C973A;border-radius:12px;padding:10px 16px;margin-bottom:16px;">
          <span style="color:#FFFFFF;font-size:18px;font-weight:800;letter-spacing:-0.02em;">${APP_NAME}</span>
        </div>
        <p style="color:#7EB891;font-size:13px;margin:0;">Inventory Management</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:36px 40px;">
        ${body}
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
</html>`;
}

function ctaButton(href: string, label: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding-bottom:28px;">
      <a href="${href}"
         style="display:inline-block;background:#0C973A;color:#FFFFFF;font-size:15px;font-weight:700;
                text-decoration:none;padding:14px 36px;border-radius:10px;
                box-shadow:0 4px 14px rgba(12,151,58,0.30);">
        ${label}
      </a>
    </td></tr>
  </table>`;
}

// ── Verification email (sent on register) ─────────────────────────────────────

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Verify your ${APP_NAME} email address`,
    html: emailWrapper(`
      <p style="font-size:16px;color:#374151;margin:0 0 8px;">Hi ${name},</p>
      <h1 style="font-size:22px;font-weight:800;color:#0F2030;margin:0 0 16px;letter-spacing:-0.02em;">
        Verify your email address
      </h1>
      <p style="font-size:14px;color:#6b7280;line-height:1.65;margin:0 0 28px;">
        Thanks for signing up for ${APP_NAME}. Click the button below to verify your
        email and activate your account. This link expires in <strong>24 hours</strong>.
      </p>
      ${ctaButton(verifyUrl, "Verify Email Address")}
      <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0 0 24px;">
        If the button doesn't work, copy and paste this link into your browser:<br />
        <a href="${verifyUrl}" style="color:#0C973A;word-break:break-all;">${verifyUrl}</a>
      </p>
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;" />
      <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.6;">
        If you didn't create an account on ${APP_NAME}, you can safely ignore this email.
      </p>
    `),
  });
}

// ── Welcome email (sent to new org owner after email verification) ─────────────

export async function sendWelcomeEmail(to: string, name: string, orgName: string) {
  const greeting = `Hi ${name},`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Welcome to ${APP_NAME} — your account is ready`,
    html: emailWrapper(`
      <p style="font-size:16px;color:#374151;margin:0 0 8px;">${greeting}</p>
      <h1 style="font-size:22px;font-weight:800;color:#0F2030;margin:0 0 16px;letter-spacing:-0.02em;">
        Your store is live 🎉
      </h1>
      <p style="font-size:14px;color:#6b7280;line-height:1.65;margin:0 0 8px;">
        You've successfully created <strong style="color:#0F2030;">${orgName}</strong> on ${APP_NAME}.
        Your free account is active — here's what you can do right now:
      </p>
      <ul style="font-size:14px;color:#6b7280;line-height:1.9;padding-left:20px;margin:0 0 28px;">
        <li>Add your products and track inventory in real time</li>
        <li>Record sales and monitor revenue &amp; profit</li>
        <li>Invite your team members</li>
        <li>Use AI-powered forecasting and stock alerts</li>
      </ul>
      ${ctaButton(`${APP_URL}/dashboard`, "Go to Dashboard")}
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;" />
      <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.6;">
        Need help? Just reply to this email — we're here for you.
      </p>
    `),
  });
}

// ── Staff invite email ─────────────────────────────────────────────────────────

export async function sendStaffInviteEmail(
  to: string,
  staffName: string,
  orgName: string,
  inviterName: string,
  tempPassword: string
) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `You've been added to ${orgName} on ${APP_NAME}`,
    html: emailWrapper(`
      <p style="font-size:16px;color:#374151;margin:0 0 8px;">Hi ${staffName},</p>
      <h1 style="font-size:22px;font-weight:800;color:#0F2030;margin:0 0 16px;letter-spacing:-0.02em;">
        You've been invited
      </h1>
      <p style="font-size:14px;color:#6b7280;line-height:1.65;margin:0 0 24px;">
        <strong style="color:#0F2030;">${inviterName}</strong> has added you to
        <strong style="color:#0F2030;">${orgName}</strong> on ${APP_NAME}.
        Use the credentials below to sign in.
      </p>

      <!-- Credentials box -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Your Login Details</p>
        <p style="margin:0 0 6px;font-size:14px;color:#374151;">
          <span style="color:#6b7280;">Email:</span>&nbsp;&nbsp;<strong>${to}</strong>
        </p>
        <p style="margin:0;font-size:14px;color:#374151;">
          <span style="color:#6b7280;">Password:</span>&nbsp;&nbsp;<strong style="font-family:monospace;background:#e2e8f0;padding:2px 8px;border-radius:4px;">${tempPassword}</strong>
        </p>
      </div>

      ${ctaButton(`${APP_URL}/auth/login`, "Sign In Now")}

      <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;" />
      <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.6;">
        Please change your password after your first login. If you didn't expect this invitation, you can ignore this email.
      </p>
    `),
  });
}

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
        <div style="display:inline-block;background:#0C973A;border-radius:12px;padding:10px 16px;margin-bottom:16px;">
          <span style="color:#FFFFFF;font-size:18px;font-weight:800;letter-spacing:-0.02em;">${APP_NAME}</span>
        </div>
        <p style="color:#7EB891;font-size:13px;margin:0;">Inventory Management</p>
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
               style="display:inline-block;background:#0C973A;color:#FFFFFF;font-size:15px;font-weight:700;
                      text-decoration:none;padding:14px 36px;border-radius:10px;
                      box-shadow:0 4px 14px rgba(12,151,58,0.30);">
              Reset Password
            </a>
          </td></tr>
        </table>

        <!-- Fallback URL -->
        <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0 0 24px;">
          If the button doesn't work, copy and paste this link into your browser:<br />
          <a href="${resetUrl}" style="color:#0C973A;word-break:break-all;">${resetUrl}</a>
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
