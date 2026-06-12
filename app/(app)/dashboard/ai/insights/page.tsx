import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { InsightsChatPanel } from "@/components/ai/insights-chat-panel";
import { InsightsTimeline } from "@/components/ai/insights-timeline";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Business Insights" };
export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, readAt: null, status: "SENT" },
  });

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
