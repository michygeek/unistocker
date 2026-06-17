import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { ExportReportsButton } from "@/components/reports/export-reports-button";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { Package, TrendingUp, ShoppingCart, DollarSign, BarChart3 } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role === "STAFF") redirect("/dashboard");

  const params = await searchParams;
  const now = new Date();

  // Parse date range — default last 30 days
  const defaultFrom = new Date(now.getTime() - 29 * 86400000);
  const fromDate = params.from ? startOfDay(new Date(params.from)) : startOfDay(defaultFrom);
  const toDate = params.to ? endOfDay(new Date(params.to)) : endOfDay(now);

  const fromStr = toInputDate(fromDate);
  const toStr = toInputDate(toDate);

  const [allTimeStats, rangeStats, rangeSales, topProducts] = await Promise.all([
    // All-time totals (never filtered)
    db.sale.aggregate({ _sum: { total: true, profit: true }, _count: { id: true } }),

    // Stats for selected range
    db.sale.aggregate({
      _sum: { total: true, profit: true },
      _count: { id: true },
      where: { createdAt: { gte: fromDate, lte: toDate } },
    }),

    // Individual sales in range for chart (single query, grouped in JS)
    db.sale.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate } },
      select: { createdAt: true, total: true, profit: true },
      orderBy: { createdAt: "asc" },
    }),

    // Top products in range
    db.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, total: true },
      where: { sale: { createdAt: { gte: fromDate, lte: toDate } } },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
  ]);

  // Build chart data: one entry per day in range
  const dayMap = new Map<string, { revenue: number; profit: number }>();

  // Pre-fill every day in range with zeros so the chart has no gaps
  const msPerDay = 86400000;
  for (let d = new Date(fromDate); d <= toDate; d = new Date(d.getTime() + msPerDay)) {
    dayMap.set(format(d, "MMM d"), { revenue: 0, profit: 0 });
  }

  for (const sale of rangeSales) {
    const key = format(new Date(sale.createdAt), "MMM d");
    const existing = dayMap.get(key) ?? { revenue: 0, profit: 0 };
    dayMap.set(key, {
      revenue: existing.revenue + Number(sale.total),
      profit: existing.profit + Number(sale.profit),
    });
  }

  const chartData = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }));

  // If range spans > 60 days, thin down labels (show every Nth day)
  const tickInterval = chartData.length > 60 ? Math.ceil(chartData.length / 30) : 1;
  const thinChartData = chartData.map((d, i) => ({
    ...d,
    date: i % tickInterval === 0 ? d.date : "",
  }));

  // Resolve product names for top products
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

  const rangeLabel = fromStr === toStr
    ? format(fromDate, "MMM d, yyyy")
    : `${format(fromDate, "MMM d, yyyy")} – ${format(toDate, "MMM d, yyyy")}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header title="Reports & Analytics" />
      <div className="animate-in" style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Analytics Overview</h2>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{rangeLabel}</p>
          </div>
          <ExportReportsButton />
        </div>

        {/* Date range picker */}
        <DateRangePicker from={fromStr} to={toStr} />

        {/* Stats: 2 all-time + 3 range */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16 }}>
          <StatsCard title="All-Time Revenue"    value={`₦${Number(allTimeStats._sum.total ?? 0).toLocaleString()}`}  icon={DollarSign}   color="green"  badge="All time" />
          <StatsCard title="All-Time Profit"     value={`₦${Number(allTimeStats._sum.profit ?? 0).toLocaleString()}`} icon={TrendingUp}   color="blue"   badge="All time" />
          <StatsCard title="Range Revenue"       value={`₦${Number(rangeStats._sum.total ?? 0).toLocaleString()}`}    icon={BarChart3}    color="indigo" badge="Selected" />
          <StatsCard title="Range Profit"        value={`₦${Number(rangeStats._sum.profit ?? 0).toLocaleString()}`}   icon={TrendingUp}   color="purple" badge="Selected" />
          <StatsCard title="Transactions"        value={rangeStats._count.id}                                          icon={ShoppingCart} color="green"  badge="Selected" />
        </div>

        {/* Chart */}
        <SalesChart data={thinChartData} rangeLabel={rangeLabel} />

        {/* Top products */}
        <div className="uni-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Package size={16} style={{ color: "var(--accent)" }} />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Top Selling Products</h2>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>{rangeLabel}</span>
          </div>
          {topWithNames.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
              No sales in this date range
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
