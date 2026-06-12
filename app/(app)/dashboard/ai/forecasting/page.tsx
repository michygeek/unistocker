import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { ForecastingDashboard } from "@/components/ai/forecasting-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Demand Forecasting" };
export const dynamic = "force-dynamic";

export default async function ForecastingPage() {
  const session = await auth();
  if (!session?.user) return null;

  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, readAt: null, status: "SENT" },
  });

  // Load all active products with their latest forecast
  const products = await db.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      lowStockAlert: true,
      demandForecasts: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  const rows = products.map((p) => {
    const f = p.demandForecasts[0] ?? null;
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      quantity: p.quantity,
      lowStockAlert: p.lowStockAlert,
      forecast: f
        ? {
            id: f.id,
            next7Days: f.next7Days,
            next14Days: f.next14Days,
            next30Days: f.next30Days,
            reorderQty: f.reorderQty,
            reorderByDate: f.reorderByDate.toISOString(),
            confidence: f.confidence,
            reasoning: f.reasoning,
            createdAt: f.createdAt.toISOString(),
          }
        : null,
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header title="AI Demand Forecasting" unreadCount={unreadCount} />
      <div className="animate-in" style={{ flex: 1, padding: "24px" }}>
        <ForecastingDashboard products={rows} />
      </div>
    </div>
  );
}
