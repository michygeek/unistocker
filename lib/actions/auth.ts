"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { auth, signIn } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { addActivityLogJob } from "@/lib/queue";
import { revalidatePath } from "next/cache";
import { sendPasswordResetEmail, sendWelcomeEmail, sendStaffInviteEmail, sendVerificationEmail } from "@/lib/email";
import { checkStaffLimit } from "@/lib/subscription";
import { uniqueReferralCode } from "@/lib/referrals";
import type { UserRole } from "@prisma/client";

const RegisterSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(2).max(100),
  role: z.enum(["BOSS", "MANAGER", "STAFF"]).default("BOSS"),
  referralCode: z.string().trim().optional(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  const slug = slugify(base);
  const existing = await db.organization.findUnique({ where: { slug } });
  if (!existing) return slug;
  return `${slug}-${Date.now()}`;
}

export async function registerUser(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { name, email, password, organizationName, referralCode } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: { email: ["Email already registered"] } };

  const hash = await bcrypt.hash(password, 12);
  const slug = await uniqueSlug(organizationName);
  const newReferralCode = await uniqueReferralCode();

  // A stale/mistyped referral code shouldn't block signup — just skip linking it.
  let referredByOrgId: string | null = null;
  if (referralCode) {
    const referrer = await db.organization.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
      select: { id: true },
    });
    referredByOrgId = referrer?.id ?? null;
  }

  const org = await db.organization.create({
    data: { name: organizationName, slug, referralCode: newReferralCode, referredByOrgId },
  });

  await db.subscription.create({
    data: { organizationId: org.id, plan: "FREE", status: "ACTIVE" },
  });

  await db.user.create({
    data: {
      name,
      email,
      password: hash,
      role: "BOSS",
      organizationId: org.id,
      // emailVerified stays null until they click the verification link
    },
  });

  // Create verification token (24 h)
  await db.verificationToken.deleteMany({ where: { identifier: email } });
  const verifyToken = randomBytes(32).toString("hex");
  await db.verificationToken.create({
    data: {
      identifier: email,
      token: verifyToken,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`;

  sendVerificationEmail(email, name, verifyUrl).catch((err) =>
    console.error("Verification email failed:", err)
  );

  return { success: true };
}

/* ── Email verification helpers ───────────────────────────────────────────── */

export async function checkEmailVerification(email: string): Promise<{ verified: boolean }> {
  const user = await db.user.findUnique({ where: { email }, select: { emailVerified: true } });
  if (!user) return { verified: true }; // No account — let signIn fail normally
  return { verified: !!user.emailVerified };
}

export async function resendVerificationEmail(email: string): Promise<{ success: boolean }> {
  const user = await db.user.findUnique({
    where: { email },
    select: { name: true, emailVerified: true },
  });
  if (!user || user.emailVerified) return { success: true }; // Silent — no info leakage

  await db.verificationToken.deleteMany({ where: { identifier: email } });
  const token = randomBytes(32).toString("hex");
  await db.verificationToken.create({
    data: { identifier: email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  sendVerificationEmail(email, user.name ?? "there", verifyUrl).catch(console.error);
  return { success: true };
}

export async function loginUser(email: string, password: string) {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return { success: true };
  } catch {
    return { error: "Invalid credentials" };
  }
}

/* ── Forgot password ──────────────────────────────────────────────────────── */

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim() ?? "";

  if (!z.string().email().safeParse(email).success) {
    return { error: "Please enter a valid email address." };
  }

  // Always respond with success to prevent email enumeration
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { success: true };

  // Invalidate any existing reset tokens for this email
  await db.verificationToken.deleteMany({ where: { identifier: email } });

  const rawToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.verificationToken.create({
    data: { identifier: email, token: rawToken, expires },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  try {
    await sendPasswordResetEmail(email, resetUrl, user.name ?? undefined);
  } catch (err) {
    console.error("Failed to send reset email:", err);
    // Don't expose email delivery failures to the user
  }

  return { success: true };
}

/* ── Reset password ───────────────────────────────────────────────────────── */

const ResetSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function resetPassword(formData: FormData) {
  const raw = {
    token: formData.get("token"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = ResetSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  const { token, email, password } = parsed.data;

  const record = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.identifier !== email) {
    return { error: "This reset link is invalid. Please request a new one." };
  }

  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return { error: "This reset link has expired. Please request a new one." };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Account not found." };
  }

  const hash = await bcrypt.hash(password, 12);
  await db.user.update({ where: { email }, data: { password: hash } });
  await db.verificationToken.delete({ where: { token } });

  return { success: true };
}

/* ── Staff management ─────────────────────────────────────────────────────── */

export async function createStaffMember(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!hasPermission(session.user.role, "staff:write")) throw new Error("Forbidden");

  if (session.user.organizationId) {
    const limit = await checkStaffLimit(session.user.organizationId);
    if (!limit.allowed) {
      return { error: { _limit: [`Staff limit reached (${limit.current}/${limit.max} on ${limit.plan} plan). Upgrade to add more staff.`] } };
    }
  }

  const raw = Object.fromEntries(formData.entries());
  const schema = z.object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["BOSS", "MANAGER", "STAFF"]).default("STAFF"),
  });

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { name, email, password, role } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: { email: ["Email already registered"] } };

  const hash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hash,
      role: role as UserRole,
      branchId: session.user.branchId ?? undefined,
      organizationId: session.user.organizationId ?? undefined,
      emailVerified: new Date(), // Admin-created accounts are pre-verified
    },
  });

  // Fetch org name for the invite email
  const org = session.user.organizationId
    ? await db.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { name: true },
      })
    : null;

  sendStaffInviteEmail(
    email,
    name,
    org?.name ?? "your organization",
    session.user.name ?? session.user.email ?? "Your manager",
    password
  ).catch((err) => console.error("Staff invite email failed:", err));

  await addActivityLogJob({
    userId: session.user.id,
    action: "CREATE_STAFF",
    entity: "User",
    entityId: user.id,
    description: `Created staff account for ${name} (${email}) with role ${role}`,
  });

  revalidatePath("/settings/staff");
  return { success: true };
}

export async function updateStaffStatus(userId: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!hasPermission(session.user.role, "staff:write")) throw new Error("Forbidden");

  // Managers cannot activate/deactivate a boss account
  if (session.user.role === "MANAGER") {
    const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (target?.role === "BOSS") throw new Error("Managers cannot modify boss accounts");
  }

  await db.user.update({ where: { id: userId }, data: { isActive } });

  await addActivityLogJob({
    userId: session.user.id,
    action: isActive ? "ACTIVATE_STAFF" : "DEACTIVATE_STAFF",
    entity: "User",
    entityId: userId,
    description: `${isActive ? "Activated" : "Deactivated"} staff account`,
  });

  revalidatePath("/settings/staff");
  return { success: true };
}
