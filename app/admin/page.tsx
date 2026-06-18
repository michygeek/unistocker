import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Building2, Users, CreditCard, TrendingUp, Package, ShoppingCart } from "lucide-react";
import { PLAN_BADGE } from "@/lib/plans";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — UniStocker" };
export const dynamic = "force-dynamic";

const PLAN_MRR: Record<string, number> = { FREE: 0, PRO: 2999, BUSINESS: 6999 };

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

  const planBreakdown = { FREE: 0, PRO: 0, BUSINESS: 0 } as Record<string, number>;
  subscriptions.forEach(s => { planBreakdown[s.plan] = (planBreakdown[s.plan] ?? 0) + 1; });

  const stats = [
    { label: "Organizations", value: orgCount, icon: Building2, color: "#0D9488", bg: "rgba(13,148,136,0.12)" },
    { label: "Total Users", value: userCount, icon: Users, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    { label: "Active Subscriptions", value: activeSubscriptions.length, icon: CreditCard, color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
    { label: "Monthly Revenue (₦)", value: `₦${mrr.toLocaleString()}`, icon: TrendingUp, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    { label: "Total Products", value: productCount.toLocaleString(), icon: Package, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    { label: "Total Sales", value: saleCount.toLocaleString(), icon: ShoppingCart, color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  ];

  return (
    <div style={{ padding: "32px 32px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
          Platform Overview
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
          Real-time stats across all UniStocker organizations
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            background: "#0C1528", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "20px 22px", display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan breakdown + recent orgs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
        {/* Plan breakdown */}
        <div style={{ background: "#0C1528", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px" }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Plan Breakdown</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(["FREE", "PRO", "BUSINESS"] as const).map((plan) => {
              const count = planBreakdown[plan] ?? 0;
              const pct = orgCount > 0 ? Math.round((count / orgCount) * 100) : 0;
              const badge = PLAN_BADGE[plan];
              return (
                <div key={plan}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                    <span style={{ fontWeight: 700, color: badge.color }}>{plan}</span>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>{count} org{count !== 1 ? "s" : ""} · {pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: badge.color, borderRadius: 99, opacity: 0.7 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent orgs */}
        <div style={{ background: "#0C1528", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Recent Signups</h2>
            <a href="/admin/organizations" style={{ fontSize: 12, color: "#0D9488", textDecoration: "none", fontWeight: 600 }}>View all →</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {recentOrgs.map((org) => {
              const plan = (org.subscription?.plan ?? "FREE") as keyof typeof PLAN_BADGE;
              const badge = PLAN_BADGE[plan];
              return (
                <div key={org.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                  borderRadius: 10, background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(13,148,136,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0D9488" }}>{org.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{org._count.users} user{org._count.users !== 1 ? "s" : ""} · {org._count.products} products</p>
                  </div>
                  <span style={{ padding: "2px 9px", borderRadius: 99, background: badge.bg, color: badge.color, fontSize: 10, fontWeight: 800 }}>{plan}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>
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
