import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import { SmartAlertBanner } from "@/components/ai/smart-alert-banner";
import { WeeklyInsightCard } from "@/components/ai/weekly-insight-card";
import { AIAssistant } from "@/components/ai/ai-assistant";
import { Package, ShoppingCart, TrendingUp, AlertTriangle, DollarSign, Users } from "lucide-react";
import Link from "next/link";
import { format, subDays, startOfDay } from "date-fns";
import { getActiveBranchId, getProductBranchConditions, getSaleBranchConditions } from "@/lib/branch-filter";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);

  const orgId = session.user.organizationId ?? "none";
  const activeBranchId = await getActiveBranchId(session.user);
  const productBranchConds = getProductBranchConditions(session.user.organizationId, activeBranchId);
  const saleBranchConds = getSaleBranchConditions(session.user.organizationId, activeBranchId);

  const [
    totalProducts,
    totalSalesCount,
    revenueData,
    lowStockProducts,
    recentLogs,
    totalStaff,
    unreadCount,
    criticalStockCount,
    needReorderCount,
    latestWeeklyInsight,
  ] = await Promise.all([
    db.product.count({ where: { AND: [{ isActive: true }, ...productBranchConds] } }),
    db.sale.count({ where: { AND: saleBranchConds } }),
    db.sale.aggregate({
      _sum: { total: true, profit: true },
      where: { AND: [{ createdAt: { gte: sevenDaysAgo } }, ...saleBranchConds] },
    }),
    db.product.findMany({
      where: { AND: [{ isActive: true }, ...productBranchConds] },
      select: { id: true, name: true, sku: true, quantity: true, lowStockAlert: true },
      orderBy: { quantity: "asc" },
    }).then((rows) => rows.filter((p) => p.quantity <= p.lowStockAlert).slice(0, 5)),
    db.activityLog.findMany({
      where: { user: { organizationId: orgId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.user.count({ where: { isActive: true, isSuperAdmin: false, organizationId: orgId, ...(activeBranchId ? { branchId: activeBranchId } : {}) } }),
    db.notification.count({ where: { userId: session.user.id, readAt: null, status: "SENT" } }),
    db.stockPrediction.count({ where: { urgencyLevel: "CRITICAL", product: { isActive: true, organizationId: orgId } } }),
    db.demandForecast.count({
      where: {
        reorderByDate: { lte: new Date(Date.now() + 7 * 86400000) },
        createdAt: { gte: subDays(new Date(), 4) },
        product: { organizationId: orgId },
      },
    }),
    db.weeklyInsight.findFirst({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }),
  ]);

  const chartData = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const day = subDays(now, 6 - i);
      const start = startOfDay(day);
      const end = new Date(start.getTime() + 86400000);
      return db.sale.aggregate({
        _sum: { total: true, profit: true },
        where: { AND: [{ createdAt: { gte: start, lt: end } }, ...saleBranchConds] },
      }).then((r) => ({
        date: format(day, "MMM d"),
        revenue: Number(r._sum.total ?? 0),
        profit: Number(r._sum.profit ?? 0),
      }));
    })
  );

  const totalRevenue = Number(revenueData._sum.total ?? 0);
  const totalProfit = Number(revenueData._sum.profit ?? 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header title="Dashboard" unreadCount={unreadCount} />
      <div className="animate-in" style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 2 }}>
            Welcome back, <span style={{ color: "var(--text)", fontWeight: 700 }}>{session.user.name ?? session.user.email}</span>
          </p>
          <p style={{ fontSize: 12, color: "var(--text-3)" }}>Here&apos;s what&apos;s happening in your store today.</p>
        </div>

        {/* AI Overview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SmartAlertBanner criticalCount={criticalStockCount} />

          <style>{`
            @media (max-width: 767px) {
              .dash-ai-grid   { grid-template-columns: 1fr !important; }
              .dash-chart-grid { grid-template-columns: 1fr !important; }
              .dash-chart-main { grid-column: span 1 !important; }
            }
          `}</style>

          <div className="dash-ai-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <WeeklyInsightCard insight={latestWeeklyInsight ? {
              id: latestWeeklyInsight.id,
              weekOf: latestWeeklyInsight.weekOf.toISOString(),
              summary: latestWeeklyInsight.summary,
              topProducts: latestWeeklyInsight.topProducts as never,
              alerts: latestWeeklyInsight.alerts as never,
              highlights: latestWeeklyInsight.highlights as never,
              createdAt: latestWeeklyInsight.createdAt.toISOString(),
            } : null} />

            <div className="uni-card" style={{ padding: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>AI Overview</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link href="/dashboard/ai/forecasting" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "var(--bg-input)", border: "1px solid var(--border)", textDecoration: "none", transition: "all 0.15s" }} className="ai-overview-link">
                  <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>Demand Forecasting</span>
                  {needReorderCount > 0 ? (
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: "rgba(239,68,68,0.10)", color: "var(--danger)" }}>
                      {needReorderCount} need reorder
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>All healthy</span>
                  )}
                </Link>
                <Link href="/dashboard/ai/stock-alerts" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "var(--bg-input)", border: "1px solid var(--border)", textDecoration: "none" }} className="ai-overview-link">
                  <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>Smart Stock Alerts</span>
                  {criticalStockCount > 0 ? (
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: "rgba(239,68,68,0.10)", color: "var(--danger)" }}>
                      {criticalStockCount} critical
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>All healthy</span>
                  )}
                </Link>
                <Link href="/dashboard/ai/insights" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "var(--bg-input)", border: "1px solid var(--border)", textDecoration: "none" }} className="ai-overview-link">
                  <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>Business Insights</span>
                  <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>Ask anything →</span>
                </Link>
              </div>
              <style>{`.ai-overview-link:hover{border-color:var(--border-2)!important;background:var(--bg-card-2)!important}`}</style>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          <StatsCard title="Total Products" value={totalProducts} icon={Package} color="indigo" change="Active items" changeType="neutral" />
          <StatsCard title="Total Sales" value={totalSalesCount} icon={ShoppingCart} color="purple" change="All time" changeType="neutral" />
          <StatsCard title="7-Day Revenue" value={`₦${totalRevenue.toFixed(2)}`} icon={DollarSign} color="green" change="Last 7 days" changeType="up" />
          <StatsCard title="7-Day Profit" value={`₦${totalProfit.toFixed(2)}`} icon={TrendingUp} color="blue" change="Last 7 days" changeType="up" />
          <StatsCard title="Low Stock" value={lowStockProducts.length} icon={AlertTriangle} color="yellow" change="Need restock" changeType={lowStockProducts.length > 0 ? "down" : "neutral"} />
          <StatsCard title="Staff" value={totalStaff} icon={Users} color="red" change="Active accounts" changeType="neutral" />
        </div>

        <div className="dash-chart-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          <div className="dash-chart-main" style={{ gridColumn: "span 2" }}>
            <SalesChart data={chartData} />
          </div>
          <div>
            <LowStockAlert products={lowStockProducts} />
          </div>
        </div>

        <RecentActivity logs={recentLogs.map((l) => ({
          id: l.id,
          action: l.action,
          entity: l.entity,
          description: l.description,
          createdAt: l.createdAt,
          user: { name: l.user.name, email: l.user.email },
        }))} />
      </div>
      <AIAssistant />
    </div>
  );
}
