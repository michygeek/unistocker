import { db } from "@/lib/db";
import { PLAN_FEATURES, type PlanType } from "@/lib/plans";
import type { SubscriptionStatus } from "@prisma/client";

export interface OrgSubscription {
  plan: PlanType;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  isActive: boolean;
  trialDaysLeft: number | null;
}

export async function getOrgSubscription(organizationId: string): Promise<OrgSubscription> {
  const sub = await db.subscription.findUnique({ where: { organizationId } });

  if (!sub) {
    return { plan: "FREE", status: "ACTIVE", trialEndsAt: null, currentPeriodEnd: null, isActive: true, trialDaysLeft: null };
  }

  const now = new Date();
  let plan = sub.plan as PlanType;
  let status = sub.status as SubscriptionStatus;

  // Auto-expire trial
  if (status === "TRIAL" && sub.trialEndsAt && now > sub.trialEndsAt) {
    await db.subscription.update({ where: { id: sub.id }, data: { plan: "FREE", status: "EXPIRED", trialEndsAt: null } });
    plan = "FREE";
    status = "EXPIRED";
  }

  // Auto-expire paid subscription
  if (status === "ACTIVE" && plan !== "FREE" && sub.currentPeriodEnd && now > sub.currentPeriodEnd) {
    await db.subscription.update({ where: { id: sub.id }, data: { plan: "FREE", status: "EXPIRED" } });
    plan = "FREE";
    status = "EXPIRED";
  }

  const trialDaysLeft =
    status === "TRIAL" && sub.trialEndsAt
      ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / 86400000))
      : null;

  return {
    plan,
    status,
    trialEndsAt: sub.trialEndsAt,
    currentPeriodEnd: sub.currentPeriodEnd,
    isActive: status === "ACTIVE" || status === "TRIAL",
    trialDaysLeft,
  };
}

export interface LimitCheck {
  allowed: boolean;
  current: number;
  max: number;
  plan: PlanType;
  requiredPlan: PlanType;
}

export async function checkProductLimit(organizationId: string): Promise<LimitCheck> {
  const { plan } = await getOrgSubscription(organizationId);
  const max = PLAN_FEATURES[plan].products;
  const current = await db.product.count({ where: { organizationId, isActive: true } });
  const allowed = max === Infinity || current < max;
  return { allowed, current, max, plan, requiredPlan: plan === "FREE" ? "PRO" : "BUSINESS" };
}

export async function checkStaffLimit(organizationId: string): Promise<LimitCheck> {
  const { plan } = await getOrgSubscription(organizationId);
  const max = PLAN_FEATURES[plan].staff;
  const current = await db.user.count({ where: { organizationId, isActive: true, isSuperAdmin: false } });
  const allowed = current < max;
  return { allowed, current, max, plan, requiredPlan: plan === "FREE" ? "PRO" : "BUSINESS" };
}

export async function checkBranchLimit(organizationId: string): Promise<LimitCheck> {
  const { plan } = await getOrgSubscription(organizationId);
  const max = PLAN_FEATURES[plan].branches;
  const current = await db.branch.count({ where: { organizationId } });
  const allowed = current < max;
  return { allowed, current, max, plan, requiredPlan: plan === "FREE" ? "PRO" : "BUSINESS" };
}
