import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import { Package, ShoppingCart, TrendingUp, AlertTriangle, DollarSign, Users } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);

  const [
    totalProducts,
    totalSalesCount,
    revenueData,
    lowStockProducts,
    recentLogs,
    totalStaff,
    unreadCount,
  ] = await Promise.all([
    db.product.count({ where: { isActive: true } }),
    db.sale.count(),
    db.sale.aggregate({
      _sum: { total: true, profit: true },
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    db.$queryRaw<{ id: string; name: string; sku: string; quantity: number; lowStockAlert: number }[]>`
      SELECT id, name, sku, quantity, "lowStockAlert"
      FROM "Product"
      WHERE "isActive" = true AND quantity <= "lowStockAlert"
      ORDER BY quantity ASC
      LIMIT 5
    `,
    db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.user.count({ where: { isActive: true } }),
    db.notification.count({ where: { userId: session.user.id, readAt: null, status: "SENT" } }),
  ]);

  const chartData = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const day = subDays(now, 6 - i);
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
  );

  const totalRevenue = Number(revenueData._sum.total ?? 0);
  const totalProfit = Number(revenueData._sum.profit ?? 0);

  return (
    <div className="flex flex-col flex-1">
      <Header title="Dashboard" unreadCount={unreadCount} />
      <div className="flex-1 p-6 space-y-6 animate-in">
        <div>
          <h2 className="text-gray-500 dark:text-gray-400 text-sm mb-1">
            Welcome back, <span className="text-gray-900 dark:text-white font-semibold">{session.user.name ?? session.user.email}</span>
          </h2>
          <p className="text-xs text-gray-400">Here&apos;s what&apos;s happening in your store today.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatsCard title="Total Products" value={totalProducts} icon={Package} color="indigo" change="Active items" changeType="neutral" />
          <StatsCard title="Total Sales" value={totalSalesCount} icon={ShoppingCart} color="purple" change="All time" changeType="neutral" />
          <StatsCard title="7-Day Revenue" value={`₦${totalRevenue.toFixed(2)}`} icon={DollarSign} color="green" change="Last 7 days" changeType="up" />
          <StatsCard title="7-Day Profit" value={`₦${totalProfit.toFixed(2)}`} icon={TrendingUp} color="blue" change="Last 7 days" changeType="up" />
          <StatsCard title="Low Stock" value={lowStockProducts.length} icon={AlertTriangle} color="yellow" change="Need restock" changeType={lowStockProducts.length > 0 ? "down" : "neutral"} />
          <StatsCard title="Staff" value={totalStaff} icon={Users} color="red" change="Active accounts" changeType="neutral" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
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
    </div>
  );
}
