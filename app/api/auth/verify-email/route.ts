import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");
  const base = new URL("/", request.url).origin;

  if (!token || !email) {
    return Response.redirect(`${base}/auth/login?error=invalid-link`);
  }

  const record = await db.verificationToken.findUnique({ where: { token } });

  if (!record || record.identifier !== email) {
    return Response.redirect(`${base}/auth/login?error=invalid-link`);
  }

  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } }).catch(() => {});
    return Response.redirect(`${base}/auth/verify-email?expired=1&email=${encodeURIComponent(email)}`);
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { name: true, organizationId: true, organization: { select: { name: true } } },
  });

  await db.user.update({ where: { email }, data: { emailVerified: new Date() } });
  await db.verificationToken.delete({ where: { token } });

  // Welcome email now that they're verified
  if (user) {
    sendWelcomeEmail(
      email,
      user.name ?? "there",
      user.organization?.name ?? "your organization"
    ).catch(console.error);
  }

  return Response.redirect(`${base}/auth/login?verified=1`);
}
