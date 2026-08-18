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

  return (
    <div style={{ flex: 1, padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="lg:ml-0" style={{ margin: "0 0 4px", marginLeft: 48, fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
          Subscriptions
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)" }}>{subs.length} total subscriptions</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Monthly Revenue", value: `₦${activeMrr.toLocaleString()}`, color: "var(--accent)" },
          { label: "Active Paid", value: activeCount, color: "#0D9488" },
          { label: "On Trial", value: trialCount, color: "#f59e0b" },
          { label: "Expired", value: expiredCount, color: "#f87171" },
        ].map((s) => (
          <div key={s.label} className="uni-card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, letterSpacing: "-0.03em" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="uni-card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="uni-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Trial Ends</th>
                <th>Period End</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((sub) => {
                const plan = sub.plan as keyof typeof PLAN_BADGE;
                const badge = PLAN_BADGE[plan];
                const statusStyle = STATUS_STYLE[sub.status] ?? STATUS_STYLE.ACTIVE;

                return (
                  <tr key={sub.id}>
                    <td>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{sub.organization.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-3)" }}>{sub.organization.slug}</p>
                    </td>
                    <td>
                      <span style={{ padding: "3px 9px", borderRadius: 99, background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 800 }}>
                        {sub.plan}
                      </span>
                    </td>
                    <td>
                      <span style={{ padding: "3px 9px", borderRadius: 99, background: statusStyle.bg, color: statusStyle.color, fontSize: 11, fontWeight: 700 }}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: sub.trialEndsAt ? "#fbbf24" : "var(--text-3)" }}>
                      {sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ fontSize: 12, color: sub.currentPeriodEnd ? "#34d399" : "var(--text-3)" }}>
                      {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-3)" }}>
                      {new Date(sub.updatedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
