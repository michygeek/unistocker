import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "notifications@unistocker.app";
const APP_NAME = "UniStocker";

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

export function buildNotificationEmail(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
          .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
          .header { background: #6366f1; padding: 24px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 22px; }
          .body { padding: 32px 24px; }
          .body p { color: #374151; line-height: 1.6; margin: 0 0 16px; }
          .footer { padding: 16px 24px; background: #f9fafb; text-align: center; font-size: 12px; color: #9ca3af; }
          .cta { display: inline-block; background: #6366f1; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>${APP_NAME}</h1></div>
          <div class="body">
            <h2 style="color:#111827;margin:0 0 16px;">${title}</h2>
            <p>${body}</p>
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="cta">View Dashboard</a>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br/>
            You're receiving this because you have an account on ${APP_NAME}.
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendStockAlertEmail(
  to: string,
  productName: string,
  currentQty: number,
  threshold: number
) {
  return sendEmail(
    to,
    `Low Stock Alert: ${productName}`,
    buildNotificationEmail(
      `Low Stock Alert: ${productName}`,
      `The stock for <strong>${productName}</strong> has dropped to <strong>${currentQty} units</strong>, which is below your threshold of ${threshold} units. Please restock soon.`
    )
  );
}
