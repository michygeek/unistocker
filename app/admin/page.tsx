import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Building2, Users, CreditCard, TrendingUp, Package, ShoppingCart } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PLAN_BADGE } from "@/lib/plans";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — UniStocker" };
export const dynamic = "force-dynamic";

// Enterprise is custom-priced per deal — not tracked here, so it contributes 0 to this estimate.
const PLAN_MRR: Record<string, number> = { FREE: 0, BUSINESS: 4999, ENTERPRISE: 0 };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) redirect("/auth/login");

  const [
    orgCount,
    userCount,
    productCount,
    saleCount,
    subscriptions,
    recentOrgs,
  ] = await Promise.all([
    db.organization.count(),
    db.user.count({ where: { isSuperAdmin: false } }),
    db.product.count(),
    db.sale.count(),
    db.subscription.findMany({ select: { plan: true, status: true } }),
    db.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, name: true, slug: true, createdAt: true,
        subscription: { select: { plan: true, status: true } },
        _count: { select: { users: true, products: true } },
      },
    }),
  ]);

  const activeSubscriptions = subscriptions.filter(s => s.status === "ACTIVE" || s.status === "TRIAL");
  const mrr = subscriptions
    .filter(s => s.status === "ACTIVE")
    .reduce((sum, s) => sum + (PLAN_MRR[s.plan] ?? 0), 0);

  const planBreakdown = { FREE: 0, BUSINESS: 0, ENTERPRISE: 0 } as Record<string, number>;
  subscriptions.forEach(s => { planBreakdown[s.plan] = (planBreakdown[s.plan] ?? 0) + 1; });

  const stats = [
    { title: "Organizations", value: orgCount, icon: Building2, color: "green" as const },
    { title: "Total Users", value: userCount, icon: Users, color: "blue" as const },
    { title: "Active Subscriptions", value: activeSubscriptions.length, icon: CreditCard, color: "purple" as const },
    { title: "Monthly Revenue", value: `₦${mrr.toLocaleString()}`, icon: TrendingUp, color: "green" as const },
    { title: "Total Products", value: productCount.toLocaleString(), icon: Package, color: "yellow" as const },
    { title: "Total Sales", value: saleCount.toLocaleString(), icon: ShoppingCart, color: "red" as const },
  ];

  return (
    <div style={{ flex: 1, padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="lg:ml-0" style={{ margin: "0 0 4px", marginLeft: 48, fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
          Platform Overview
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)" }}>
          Real-time stats across all UniStocker organizations
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        {stats.map((s) => (
          <StatsCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      {/* Plan breakdown + recent orgs */}
      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        <style>{`@media (max-width: 900px) { .admin-grid { grid-template-columns: 1fr !important; } }`}</style>

        {/* Plan breakdown */}
        <div className="uni-card" style={{ padding: "22px 24px" }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Plan Breakdown</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(["FREE", "BUSINESS", "ENTERPRISE"] as const).map((plan) => {
              const count = planBreakdown[plan] ?? 0;
              const pct = orgCount > 0 ? Math.round((count / orgCount) * 100) : 0;
              const badge = PLAN_BADGE[plan];
              return (
                <div key={plan}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                    <span style={{ fontWeight: 700, color: badge.color }}>{plan}</span>
                    <span style={{ color: "var(--text-2)" }}>{count} org{count !== 1 ? "s" : ""} · {pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--bg-input)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: badge.color, borderRadius: 99, opacity: 0.7 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent orgs */}
        <div className="uni-card" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Recent Signups</h2>
            <a href="/admin/organizations" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>View all →</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {recentOrgs.map((org) => {
              const plan = (org.subscription?.plan ?? "FREE") as keyof typeof PLAN_BADGE;
              const badge = PLAN_BADGE[plan];
              return (
                <div key={org.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                  borderRadius: 10, background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent-sub)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>{org.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--text-3)" }}>{org._count.users} user{org._count.users !== 1 ? "s" : ""} · {org._count.products} products</p>
                  </div>
                  <span style={{ padding: "2px 9px", borderRadius: 99, background: badge.bg, color: badge.color, fontSize: 10, fontWeight: 800 }}>{plan}</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>
                    {new Date(org.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
