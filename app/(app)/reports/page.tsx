import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
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

  return (
    <div className="flex flex-col flex-1">
      <Header title="Reports & Analytics" />
      <div className="flex-1 p-6 space-y-6 animate-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="All-Time Revenue" value={`₦${Number(allTimeRevenue._sum.total ?? 0).toFixed(2)}`} icon={DollarSign} color="green" />
          <StatsCard title="All-Time Profit" value={`₦${Number(allTimeRevenue._sum.profit ?? 0).toFixed(2)}`} icon={TrendingUp} color="blue" />
          <StatsCard title="Total Transactions" value={allTimeRevenue._count.id} icon={ShoppingCart} color="purple" />
          <StatsCard title="This Month Revenue" value={`₦${Number(monthRevenue._sum.total ?? 0).toFixed(2)}`} icon={BarChart3} color="indigo" />
        </div>

        <SalesChart data={chartData} />

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Top Selling Products</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {topWithNames.map((item, i) => (
              <div key={item.productId} className="px-6 py-4 flex items-center gap-4">
                <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product?.name ?? "—"}</p>
                  <p className="text-xs text-gray-400">{item.product?.sku} · {item.qty} units sold</p>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">₦{item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
