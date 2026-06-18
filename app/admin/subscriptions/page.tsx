import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_BADGE } from "@/lib/plans";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Subscriptions — Admin" };
export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ACTIVE:    { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
  TRIAL:     { bg: "rgba(245,158,11,0.15)", color: "#fbbf24" },
  EXPIRED:   { bg: "rgba(239,68,68,0.15)",  color: "#f87171" },
  CANCELLED: { bg: "rgba(100,116,139,0.15)",color: "#94a3b8" },
};

const PLAN_MRR: Record<string, number> = { FREE: 0, PRO: 2999, BUSINESS: 6999 };

export default async function AdminSubscriptionsPage() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) redirect("/auth/login");

  const subs = await db.subscription.findMany({
    orderBy: { updatedAt: "desc" },
    include: { organization: { select: { name: true, slug: true } } },
  });

  const activeMrr = subs
    .filter(s => s.status === "ACTIVE" && s.plan !== "FREE")
    .reduce((sum, s) => sum + (PLAN_MRR[s.plan] ?? 0), 0);

  const trialCount = subs.filter(s => s.status === "TRIAL").length;
  const activeCount = subs.filter(s => s.status === "ACTIVE" && s.plan !== "FREE").length;
  const expiredCount = subs.filter(s => s.status === "EXPIRED").length;

  const COL = "rgba(255,255,255,0.35)";

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
          Subscriptions
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: COL }}>{subs.length} total subscriptions</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Monthly Revenue", value: `₦${activeMrr.toLocaleString()}`, color: "#10b981" },
          { label: "Active Paid", value: activeCount, color: "#0D9488" },
          { label: "On Trial", value: trialCount, color: "#f59e0b" },
          { label: "Expired", value: expiredCount, color: "#f87171" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#0C1528", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, letterSpacing: "-0.03em" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: COL, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#0C1528", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 0.8fr 0.8fr 1.2fr 1.2fr 1.2fr",
          padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11, fontWeight: 700, color: COL, textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          <span>Organization</span>
          <span>Plan</span>
          <span>Status</span>
          <span>Trial Ends</span>
          <span>Period End</span>
          <span>Updated</span>
        </div>

        {subs.map((sub, i) => {
          const plan = sub.plan as keyof typeof PLAN_BADGE;
          const badge = PLAN_BADGE[plan];
          const statusStyle = STATUS_STYLE[sub.status] ?? STATUS_STYLE.ACTIVE;
          const isEven = i % 2 === 0;

          return (
            <div key={sub.id} style={{
              display: "grid", gridTemplateColumns: "2fr 0.8fr 0.8fr 1.2fr 1.2fr 1.2fr",
              padding: "13px 18px", alignItems: "center",
              background: isEven ? "transparent" : "rgba(255,255,255,0.015)",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{sub.organization.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: COL }}>{sub.organization.slug}</p>
              </div>
              <span style={{ padding: "3px 9px", borderRadius: 99, background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 800 }}>
                {sub.plan}
              </span>
              <span style={{ padding: "3px 9px", borderRadius: 99, background: statusStyle.bg, color: statusStyle.color, fontSize: 11, fontWeight: 700 }}>
                {sub.status}
              </span>
              <span style={{ fontSize: 12, color: sub.trialEndsAt ? "#fbbf24" : COL }}>
                {sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </span>
              <span style={{ fontSize: 12, color: sub.currentPeriodEnd ? "#34d399" : COL }}>
                {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </span>
              <span style={{ fontSize: 12, color: COL }}>
                {new Date(sub.updatedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
