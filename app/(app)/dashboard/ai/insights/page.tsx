import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { InsightsChatPanel } from "@/components/ai/insights-chat-panel";
import { InsightsTimeline } from "@/components/ai/insights-timeline";
import { PlanGate } from "@/components/billing/plan-gate";
import { getOrgSubscription } from "@/lib/subscription";
import { PLAN_FEATURES } from "@/lib/plans";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Business Insights" };
export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [unreadCount, subscription] = await Promise.all([
    db.notification.count({ where: { userId: session.user.id, readAt: null, status: "SENT" } }),
    session.user.organizationId ? getOrgSubscription(session.user.organizationId) : null,
  ]);

  if (!subscription || !PLAN_FEATURES[subscription.plan].ai) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Header title="AI Business Insights" unreadCount={unreadCount} />
        <PlanGate requiredPlan="PRO" feature="AI Business Insights" />
      </div>
    );
  }

  const weeklyInsights = await db.weeklyInsight.findMany({
    orderBy: { weekOf: "desc" },
    take: 8,
  });

  const serialised = weeklyInsights.map((w) => ({
    id: w.id,
    weekOf: w.weekOf.toISOString(),
    summary: w.summary,
    topProducts: w.topProducts,
    alerts: w.alerts,
    highlights: w.highlights,
    createdAt: w.createdAt.toISOString(),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header title="AI Business Insights" unreadCount={unreadCount} />
      <div className="animate-in" style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, flex: 1 }}>
          <InsightsChatPanel />
          <InsightsTimeline insights={serialised} />
        </div>
      </div>
    </div>
  );
}
