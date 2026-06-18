"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { paystackInitialize } from "@/lib/paystack";
import { getOrgSubscription } from "@/lib/subscription";
import type { PlanType } from "@/lib/plans";

const PLAN_PRICES_KOBO: Record<"PRO" | "BUSINESS", number> = {
  PRO: 299900,      // ₦2,999
  BUSINESS: 699900, // ₦6,999
};

export async function startTrial(plan: "PRO" | "BUSINESS") {
  const session = await auth();
  if (!session?.user || session.user.role !== "BOSS") throw new Error("Forbidden");

  const orgId = session.user.organizationId;
  if (!orgId) throw new Error("No organization");

  const current = await getOrgSubscription(orgId);
  if (current.plan !== "FREE") {
    return { error: "You already have a paid plan or an active trial" };
  }

  const trialEndsAt = new Date(Date.now() + 30 * 86400000);

  await db.subscription.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId, plan, status: "TRIAL", trialEndsAt },
    update: { plan, status: "TRIAL", trialEndsAt, currentPeriodEnd: null },
  });

  revalidatePath("/billing");
  return { success: true };
}

export async function initializePayment(plan: "PRO" | "BUSINESS") {
  const session = await auth();
  if (!session?.user || session.user.role !== "BOSS") throw new Error("Forbidden");

  const orgId = session.user.organizationId;
  const email = session.user.email;
  if (!orgId || !email) throw new Error("Missing organization or email");

  const planCode =
    plan === "PRO"
      ? process.env.PAYSTACK_PRO_PLAN_CODE
      : process.env.PAYSTACK_BUSINESS_PLAN_CODE;

  const callbackUrl = `${process.env.NEXTAUTH_URL}/billing/callback`;

  const result = await paystackInitialize({
    email,
    amount: PLAN_PRICES_KOBO[plan],
    planCode: planCode || undefined,
    callbackUrl,
    metadata: { organizationId: orgId, plan, userId: session.user.id },
  });

  if (!result.status) return { error: result.message ?? "Payment initialization failed" };
  return { url: result.data.authorization_url };
}

export async function cancelSubscription() {
  const session = await auth();
  if (!session?.user || session.user.role !== "BOSS") throw new Error("Forbidden");

  const orgId = session.user.organizationId;
  if (!orgId) throw new Error("No organization");

  await db.subscription.update({
    where: { organizationId: orgId },
    data: { plan: "FREE", status: "CANCELLED", currentPeriodEnd: null, trialEndsAt: null },
  });

  revalidatePath("/billing");
  return { success: true };
}

// Called by the Paystack callback page after verifying a successful payment
export async function activateSubscription(organizationId: string, plan: PlanType) {
  const currentPeriodEnd = new Date(Date.now() + 30 * 86400000);

  await db.subscription.upsert({
    where: { organizationId },
    create: { organizationId, plan, status: "ACTIVE", currentPeriodEnd },
    update: { plan, status: "ACTIVE", currentPeriodEnd, trialEndsAt: null },
  });

  revalidatePath("/billing");
  revalidatePath("/dashboard");
}
