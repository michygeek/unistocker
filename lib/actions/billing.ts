"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { paystackInitialize } from "@/lib/paystack";
import { yearlyPriceKobo, type PlanType } from "@/lib/plans";
import { computePointsRedemption } from "@/lib/referrals";
import type { BillingCycle } from "@prisma/client";

const PLAN_PRICES_KOBO: Record<"BUSINESS", number> = {
  BUSINESS: 499900, // ₦4,999
};

export async function initializePayment(cycle: BillingCycle, useReferralPoints: boolean) {
  const session = await auth();
  if (!session?.user || session.user.role !== "BOSS") throw new Error("Forbidden");

  const orgId = session.user.organizationId;
  const email = session.user.email;
  if (!orgId || !email) throw new Error("Missing organization or email");

  const basePrice = cycle === "YEARLY" ? yearlyPriceKobo(PLAN_PRICES_KOBO.BUSINESS) : PLAN_PRICES_KOBO.BUSINESS;

  let redeemedPoints = 0;
  let amount = basePrice;
  if (useReferralPoints) {
    const org = await db.organization.findUnique({ where: { id: orgId }, select: { referralPoints: true } });
    const { pointsUsed, discountKobo } = computePointsRedemption(org?.referralPoints ?? 0, basePrice);
    redeemedPoints = pointsUsed;
    amount = basePrice - discountKobo;
  }

  const planCode = cycle === "YEARLY" ? process.env.PAYSTACK_BUSINESS_PLAN_CODE_YEARLY : process.env.PAYSTACK_BUSINESS_PLAN_CODE;

  const callbackUrl = `${process.env.NEXTAUTH_URL}/billing/callback`;

  const result = await paystackInitialize({
    email,
    amount,
    planCode: planCode || undefined,
    callbackUrl,
    metadata: { organizationId: orgId, plan: "BUSINESS", billingCycle: cycle, redeemedPoints, userId: session.user.id },
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

// Called by the Paystack callback page after verifying a successful payment.
// Only touches plan/status/period — referral points award & redemption happen
// exclusively in the webhook (see app/api/paystack/webhook/route.ts) so they
// can't be double-counted if both paths fire for the same payment.
export async function activateSubscription(organizationId: string, plan: PlanType, billingCycle: BillingCycle = "MONTHLY") {
  const periodDays = billingCycle === "YEARLY" ? 365 : 30;
  const currentPeriodEnd = new Date(Date.now() + periodDays * 86400000);

  await db.subscription.upsert({
    where: { organizationId },
    create: { organizationId, plan, status: "ACTIVE", billingCycle, currentPeriodEnd },
    update: { plan, status: "ACTIVE", billingCycle, currentPeriodEnd, trialEndsAt: null },
  });

  revalidatePath("/billing");
  revalidatePath("/dashboard");
}
