import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateWeeklyInsight } from "@/lib/ai/weekly-insight";
import { notifyAllOrgUsers } from "@/lib/notifications";

// Vercel Cron: see vercel.json ("0 6 * * 1" — every Monday 6am UTC).
// Set CRON_SECRET env var.

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgs = await db.organization.findMany({
    where: {
      subscription: {
        plan: { in: ["BUSINESS", "ENTERPRISE"] },
        status: { in: ["ACTIVE", "TRIAL"] },
      },
    },
    select: { id: true, name: true },
  });

  let processed = 0;
  const errors: string[] = [];

  for (const org of orgs) {
    try {
      const insight = await generateWeeklyInsight(org.id);
      await notifyAllOrgUsers(
        org.id,
        "Your weekly business summary is ready",
        "AI-generated performance summary for this week is now available.",
        "WEEKLY_SUMMARY",
        { insightId: insight.id }
      );
      processed++;
    } catch (err) {
      console.error(`[cron:weekly-insights] failed for org ${org.id}`, err);
      errors.push(org.name);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  return NextResponse.json({ ok: true, processed, total: orgs.length, errors });
}
