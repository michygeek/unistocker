import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { StockAlertsView } from "@/components/ai/stock-alerts-view";
import { PlanGate } from "@/components/billing/plan-gate";
import { getOrgSubscription } from "@/lib/subscription";
import { PLAN_FEATURES } from "@/lib/plans";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Smart Stock Alerts" };
export const dynamic = "force-dynamic";

export default async function StockAlertsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [unreadCount, subscription] = await Promise.all([
    db.notification.count({ where: { userId: session.user.id, readAt: null, status: "SENT" } }),
    session.user.organizationId ? getOrgSubscription(session.user.organizationId) : null,
  ]);

  if (!subscription || !PLAN_FEATURES[subscription.plan].ai) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Header title="Smart Stock Alerts" unreadCount={unreadCount} />
        <PlanGate requiredPlan="BUSINESS" feature="Smart Stock Alerts" />
      </div>
    );
  }

  const predictions = await db.stockPrediction.findMany({
    where: { product: { organizationId: session.user.organizationId ?? "none" } },
    include: {
      product: { select: { id: true, name: true, sku: true, quantity: true, lowStockAlert: true } },
    },
    orderBy: { daysUntilStockout: "asc" },
  });

  const rows = predictions.map((p) => ({
    id: p.id,
    productId: p.productId,
    productName: p.product.name,
    productSku: p.product.sku,
    currentStock: p.currentStock,
    dailyVelocity: p.dailyVelocity,
    daysUntilStockout: p.daysUntilStockout,
    predictedStockoutDate: p.predictedStockoutDate.toISOString(),
    urgencyLevel: p.urgencyLevel,
    suggestedReorderLevel: p.suggestedReorderLevel,
    reorderLevelReason: p.reorderLevelReason,
    lowStockAlert: p.product.lowStockAlert,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header title="Smart Stock Alerts" unreadCount={unreadCount} />
      <div className="animate-in" style={{ flex: 1, padding: "24px" }}>
        <StockAlertsView predictions={rows} />
      </div>
    </div>
  );
}
