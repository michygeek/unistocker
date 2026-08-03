// Client-safe constants — no server-only imports (e.g. lib/db) here, since
// this is imported directly by client components as well as lib/referrals.ts.
export const POINTS_PER_REFERRAL = 10;
export const NAIRA_PER_POINT = 80; // 10 points = ₦800
