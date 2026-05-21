import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { ExportReportsButton } from "@/components/reports/export-reports-button";
import { Package, TrendingUp, ShoppingCart, DollarSign, BarChart3 } from "lucide-react";
import { format, subDays, startOfDay, startOfMonth, endOfMonth } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role === "STAFF") redirect("/dashboard");

  const now = new Date();

  const [allTimeRevenue, monthRevenue, topProducts, chartData] = await Promise.all([
    db.sale.aggregate({ _sum: { total: true, profit: true }, _count: { id: true } }),
    db.sale.aggregate({
      _sum: { total: true, profit: true },
      where: { createdAt: { gte: startOfMonth(now), lte: endOfMonth(now) } },
    }),
    db.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    Promise.all(
      Array.from({ length: 30 }, (_, i) => {
        const day = subDays(now, 29 - i);
        const start = startOfDay(day);
        const end = new Date(start.getTime() + 86400000);
        return db.sale.aggregate({
          _sum: { total: true, profit: true },
          where: { createdAt: { gte: start, lt: end } },
        }).then((r) => ({
          date: format(day, "MMM d"),
          revenue: Number(r._sum.total ?? 0),
          profit: Number(r._sum.profit ?? 0),
        }));
      })
    ),
  ]);

  const productIds = topProducts.map((t) => t.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  });

  const topWithNames = topProducts.map((t) => ({
    ...t,
    product: products.find((p) => p.id === t.productId),
    total: Number(t._sum.total ?? 0),
    qty: Number(t._sum.quantity ?? 0),
  }));

  const rankColors = ["#0D9488", "#60a5fa", "#c084fc", "#fbbf24", "#fb923c"];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header title="Reports & Analytics" />
      <div className="animate-in" style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Analytics Overview</h2>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>Last 30 days and all-time stats</p>
          </div>
          <ExportReportsButton />
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          <StatsCard title="All-Time Revenue"    value={`₦${Number(allTimeRevenue._sum.total ?? 0).toLocaleString()}`} icon={DollarSign}   color="green"  />
          <StatsCard title="All-Time Profit"     value={`₦${Number(allTimeRevenue._sum.profit ?? 0).toLocaleString()}`} icon={TrendingUp}  color="blue"   />
          <StatsCard title="Total Transactions"  value={allTimeRevenue._count.id}                                         icon={ShoppingCart} color="purple" />
          <StatsCard title="This Month Revenue"  value={`₦${Number(monthRevenue._sum.total ?? 0).toLocaleString()}`}     icon={BarChart3}   color="indigo" />
        </div>

        {/* Chart */}
        <SalesChart data={chartData} />

        {/* Top products */}
        <div className="uni-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <Package size={16} style={{ color: "var(--accent)" }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Top Selling Products</h2>
          </div>
          {topWithNames.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
              No sales data yet
            </div>
          ) : (
            <div>
              {topWithNames.map((item, i) => (
                <div key={item.productId} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 20px",
                  borderBottom: i < topWithNames.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: `${rankColors[i]}20`, color: rankColors[i],
                    fontSize: 12, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.product?.name ?? "—"}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                      {item.product?.sku} · {item.qty} units sold
                    </p>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", flexShrink: 0 }}>
                    ₦{item.total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
