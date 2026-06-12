import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { callClaudeJSON, isCacheFresh } from "@/lib/ai/claude";
import { subDays, format, addDays } from "date-fns";
import { notifyAllBossUsers } from "@/lib/notifications";

// Vercel Cron: Add to vercel.json:
// {
//   "crons": [{ "path": "/api/cron/stock-predictions", "schedule": "0 */6 * * *" }]
// }
// Also set CRON_SECRET env var and add to Vercel dashboard

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await db.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, quantity: true, lowStockAlert: true },
  });

  let processed = 0;
  let criticalCount = 0;

  for (const product of products) {
    const existing = await db.stockPrediction.findUnique({ where: { productId: product.id } });
    if (existing && isCacheFresh(existing.updatedAt)) {
      if (existing.urgencyLevel === "CRITICAL") criticalCount++;
      processed++;
      continue;
    }

    const since7 = subDays(new Date(), 7);
    const since14 = subDays(new Date(), 14);
    const since30 = subDays(new Date(), 30);

    const [s7, s14, s30] = await Promise.all([
      db.saleItem.aggregate({ _sum: { quantity: true }, where: { productId: product.id, sale: { createdAt: { gte: since7 } } } }),
      db.saleItem.aggregate({ _sum: { quantity: true }, where: { productId: product.id, sale: { createdAt: { gte: since14 } } } }),
      db.saleItem.aggregate({ _sum: { quantity: true }, where: { productId: product.id, sale: { createdAt: { gte: since30 } } } }),
    ]);

    const avg7 = Number(s7._sum.quantity ?? 0) / 7;
    const avg14 = Number(s14._sum.quantity ?? 0) / 14;
    const avg30 = Number(s30._sum.quantity ?? 0) / 30;
    const trend = avg7 > avg14 * 1.1 ? "accelerating" : avg7 < avg14 * 0.9 ? "decelerating" : "stable";

    try {
      const result = await callClaudeJSON<{
        daysUntilStockout: number; urgencyLevel: string;
        dailyVelocity: number; suggestedReorderLevel: number | null; reorderLevelReason: string | null;
      }>(
        `You are a stock depletion AI. Return ONLY valid JSON: {"daysUntilStockout":number,"urgencyLevel":"CRITICAL"|"WARNING"|"WATCH"|"HEALTHY","dailyVelocity":float,"suggestedReorderLevel":integer|null,"reorderLevelReason":string|null}`,
        `Product: ${product.name}\nStock: ${product.quantity}\nReorder level: ${product.lowStockAlert}\nAvg daily — 7d:${avg7.toFixed(2)}, 14d:${avg14.toFixed(2)}, 30d:${avg30.toFixed(2)}\nTrend:${trend}\nToday:${format(new Date(), "yyyy-MM-dd")}`,
        "cron-stock"
      );

      const daysUntil = Math.max(0, result.daysUntilStockout);
      await db.stockPrediction.upsert({
        where: { productId: product.id },
        create: {
          productId: product.id, currentStock: product.quantity,
          dailyVelocity: result.dailyVelocity, daysUntilStockout: daysUntil,
          predictedStockoutDate: addDays(new Date(), daysUntil),
          urgencyLevel: result.urgencyLevel,
          suggestedReorderLevel: result.suggestedReorderLevel,
          reorderLevelReason: result.reorderLevelReason,
        },
        update: {
          currentStock: product.quantity, dailyVelocity: result.dailyVelocity,
          daysUntilStockout: daysUntil, predictedStockoutDate: addDays(new Date(), daysUntil),
          urgencyLevel: result.urgencyLevel,
          suggestedReorderLevel: result.suggestedReorderLevel,
          reorderLevelReason: result.reorderLevelReason,
        },
      });

      if (result.urgencyLevel === "CRITICAL") {
        criticalCount++;
        void notifyAllBossUsers(
          "Critical Stock Alert",
          `"${product.name}" runs out in ${Math.round(daysUntil)} days — ${product.quantity} units left.`,
          "CRITICAL_STOCK",
          { productId: product.id }
        );
      }
    } catch {
      console.error(`[cron:stock] failed for ${product.id}`);
    }

    processed++;
    await new Promise((r) => setTimeout(r, 200));
  }

  return NextResponse.json({ ok: true, processed, criticalCount });
}
