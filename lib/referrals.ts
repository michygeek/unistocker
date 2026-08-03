import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { POINTS_PER_REFERRAL, NAIRA_PER_POINT } from "@/lib/referral-constants";

export { POINTS_PER_REFERRAL, NAIRA_PER_POINT };

export function generateReferralCode(): string {
  return randomBytes(5).toString("hex").toUpperCase();
}

export async function uniqueReferralCode(): Promise<string> {
  for (;;) {
    const code = generateReferralCode();
    const existing = await db.organization.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }
}

// Award the referrer 10 points the first (and only the first) time the
// referred org converts to a paid subscription. Safe to call repeatedly —
// no-ops once referralRewardGiven is true.
export async function awardReferralPoints(organizationId: string): Promise<void> {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { referredByOrgId: true, referralRewardGiven: true },
  });
  if (!org?.referredByOrgId || org.referralRewardGiven) return;

  await db.$transaction([
    db.organization.update({ where: { id: organizationId }, data: { referralRewardGiven: true } }),
    db.organization.update({
      where: { id: org.referredByOrgId },
      data: { referralPoints: { increment: POINTS_PER_REFERRAL } },
    }),
  ]);
}

// Whole-point redemption only, capped so the discount never exceeds the price.
export function computePointsRedemption(pointsBalance: number, priceKobo: number): { pointsUsed: number; discountKobo: number } {
  const nairaPerPointKobo = NAIRA_PER_POINT * 100;
  const maxByBalanceKobo = pointsBalance * nairaPerPointKobo;
  const cappedKobo = Math.min(maxByBalanceKobo, priceKobo);
  const pointsUsed = Math.floor(cappedKobo / nairaPerPointKobo);
  return { pointsUsed, discountKobo: pointsUsed * nairaPerPointKobo };
}
