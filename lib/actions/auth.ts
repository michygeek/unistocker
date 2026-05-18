"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { auth, signIn } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { addActivityLogJob } from "@/lib/queue";
import { revalidatePath } from "next/cache";
import { sendPasswordResetEmail } from "@/lib/email";
import type { UserRole } from "@prisma/client";

const RegisterSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(2).max(100),
  role: z.enum(["BOSS", "MANAGER", "STAFF"]).default("BOSS"),
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

  const { name, email, password, organizationName } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: { email: ["Email already registered"] } };

  const hash = await bcrypt.hash(password, 12);
  const slug = await uniqueSlug(organizationName);

  const org = await db.organization.create({
    data: { name: organizationName, slug },
  });

  await db.user.create({
    data: {
      name,
      email,
      password: hash,
      role: "BOSS",
      organizationId: org.id,
    },
  });

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
    },
  });

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
