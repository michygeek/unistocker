import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PlanType } from "@/lib/plans";
import { awardReferralPoints } from "@/lib/referrals";
import type { BillingCycle } from "@prisma/client";

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;
  const expected = createHmac("sha512", secret).update(body).digest("hex");
  return expected === signature;
}

function planFromCode(planCode: string | undefined): PlanType | null {
  if (!planCode) return null;
  if (planCode === process.env.PAYSTACK_BUSINESS_PLAN_CODE) return "BUSINESS";
  return null;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    data: Record<string, unknown>;
  };

  const data = event.data as Record<string, unknown>;

  switch (event.event) {
    case "charge.success": {
      const metadata = data.metadata as Record<string, string> | undefined;
      const organizationId = metadata?.organizationId;
      const plan = (metadata?.plan ?? null) as PlanType | null;
      const billingCycle = (metadata?.billingCycle ?? "MONTHLY") as BillingCycle;
      const redeemedPoints = Number(metadata?.redeemedPoints ?? 0);

      if (!organizationId || !plan || plan === "FREE") break;

      const periodDays = billingCycle === "YEARLY" ? 365 : 30;
      const currentPeriodEnd = new Date(Date.now() + periodDays * 86400000);
      const customer = data.customer as { customer_code: string } | undefined;
      const subscription = data.subscription as { subscription_code?: string; plan_code?: string } | undefined;

      await db.subscription.upsert({
        where: { organizationId },
        create: {
          organizationId,
          plan,
          status: "ACTIVE",
          billingCycle,
          currentPeriodEnd,
          paystackCustomerCode: customer?.customer_code ?? null,
          paystackSubscriptionCode: subscription?.subscription_code ?? null,
          paystackPlanCode: subscription?.plan_code ?? null,
        },
        update: {
          plan,
          status: "ACTIVE",
          billingCycle,
          currentPeriodEnd,
          trialEndsAt: null,
          paystackCustomerCode: customer?.customer_code ?? null,
          paystackSubscriptionCode: subscription?.subscription_code ?? null,
          paystackPlanCode: subscription?.plan_code ?? null,
        },
      });

      // Referral award/redemption live here exclusively (not in the callback-page
      // path) since increment/decrement isn't naturally idempotent like the
      // plan/status upsert above.
      await awardReferralPoints(organizationId);
      if (redeemedPoints > 0) {
        await db.organization.updateMany({
          where: { id: organizationId, referralPoints: { gte: redeemedPoints } },
          data: { referralPoints: { decrement: redeemedPoints } },
        });
      }
      break;
    }

    case "subscription.create": {
      const sub = data as {
        customer?: { customer_code?: string };
        plan?: { plan_code?: string };
        subscription_code?: string;
        metadata?: Record<string, string>;
      };
      const organizationId = sub.metadata?.organizationId;
      if (!organizationId) break;

      await db.subscription.updateMany({
        where: { organizationId },
        data: {
          paystackSubscriptionCode: sub.subscription_code ?? null,
          paystackCustomerCode: sub.customer?.customer_code ?? null,
          paystackPlanCode: sub.plan?.plan_code ?? null,
        },
      });
      break;
    }

    case "invoice.payment_success": {
      const subscription = data.subscription as { subscription_code?: string } | undefined;
      const subscriptionCode = subscription?.subscription_code;
      if (!subscriptionCode) break;

      const existing = await db.subscription.findFirst({
        where: { paystackSubscriptionCode: subscriptionCode },
      });
      if (!existing) break;

      // Extend period from the later of now vs current end, by the org's billing cycle
      const base = existing.currentPeriodEnd
        ? Math.max(existing.currentPeriodEnd.getTime(), Date.now())
        : Date.now();
      const periodDays = existing.billingCycle === "YEARLY" ? 365 : 30;
      const newEnd = new Date(base + periodDays * 86400000);

      await db.subscription.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", currentPeriodEnd: newEnd, trialEndsAt: null },
      });
      break;
    }

    case "subscription.disable": {
      const sub = data as { subscription_code?: string };
      if (!sub.subscription_code) break;

      await db.subscription.updateMany({
        where: { paystackSubscriptionCode: sub.subscription_code },
        data: { plan: "FREE", status: "CANCELLED", currentPeriodEnd: null },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
