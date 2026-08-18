import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { callClaudeJSON, isCacheFresh, CHEAP_MODEL } from "@/lib/ai/claude";
import { checkAiLimit, logAiRequest } from "@/lib/subscription";
import { subDays, format, addDays } from "date-fns";
import { notifyAllBossUsers } from "@/lib/notifications";

interface PredictionResponse {
  daysUntilStockout: number;
  urgencyLevel: "CRITICAL" | "WARNING" | "WATCH" | "HEALTHY";
  dailyVelocity: number;
  suggestedReorderLevel: number | null;
  reorderLevelReason: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const productIds: string[] | undefined = body.productIds;

    const gate = await checkAiLimit(session.user.organizationId, session.user.id, session.user.role);
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason }, { status: 403 });
    }
    await logAiRequest(session.user.organizationId!, session.user.id, "stock-prediction");

    const products = await db.product.findMany({
      where: {
        isActive: true,
        organizationId: session.user.organizationId ?? "none",
        ...(productIds ? { id: { in: productIds } } : {}),
      },
      select: { id: true, name: true, quantity: true, lowStockAlert: true, organizationId: true },
    });

    const results: Array<{ productId: string; prediction: object }> = [];

    for (const product of products) {
      // Check cache
      const existing = await db.stockPrediction.findUnique({ where: { productId: product.id } });
      if (existing && isCacheFresh(existing.updatedAt)) {
        results.push({ productId: product.id, prediction: existing });
        continue;
      }

      const since7 = subDays(new Date(), 7);
      const since14 = subDays(new Date(), 14);
      const since30 = subDays(new Date(), 30);

      const [sales7, sales14, sales30] = await Promise.all([
        db.saleItem.aggregate({ _sum: { quantity: true }, where: { productId: product.id, sale: { createdAt: { gte: since7 } } } }),
        db.saleItem.aggregate({ _sum: { quantity: true }, where: { productId: product.id, sale: { createdAt: { gte: since14 } } } }),
        db.saleItem.aggregate({ _sum: { quantity: true }, where: { productId: product.id, sale: { createdAt: { gte: since30 } } } }),
      ]);

      const avg7 = (Number(sales7._sum.quantity ?? 0)) / 7;
      const avg14 = (Number(sales14._sum.quantity ?? 0)) / 14;
      const avg30 = (Number(sales30._sum.quantity ?? 0)) / 30;

      const trend = avg7 > avg14 * 1.1 ? "accelerating" : avg7 < avg14 * 0.9 ? "decelerating" : "stable";

      const systemPrompt = `You are a stock depletion AI for African inventory management.
Return ONLY valid JSON:
{
  "daysUntilStockout": number,
  "urgencyLevel": "CRITICAL" | "WARNING" | "WATCH" | "HEALTHY",
  "dailyVelocity": float,
  "suggestedReorderLevel": integer or null,
  "reorderLevelReason": string or null
}
CRITICAL = under 3 days, WARNING = 3-7 days, WATCH = 7-14 days, HEALTHY = over 14 days.
If sales are accelerating, use the 7-day rate not the 30-day average.
A product running out in 2 days is CRITICAL even if above reorder level.`;

      const userMessage = `Product: ${product.name}
Current stock: ${product.quantity} units
Reorder level: ${product.lowStockAlert} units
Avg daily sales — 7d: ${avg7.toFixed(2)}, 14d: ${avg14.toFixed(2)}, 30d: ${avg30.toFixed(2)}
Trend: ${trend}
Today: ${format(new Date(), "yyyy-MM-dd")}`;

      let result: PredictionResponse;
      try {
        result = await callClaudeJSON<PredictionResponse>(systemPrompt, userMessage, "stock-prediction", CHEAP_MODEL);
      } catch {
        console.error(`[AI:stock-prediction] failed for product ${product.id}`);
        continue;
      }

      const daysUntil = Math.max(0, result.daysUntilStockout);
      const stockoutDate = addDays(new Date(), daysUntil);

      const prediction = await db.stockPrediction.upsert({
        where: { productId: product.id },
        create: {
          productId: product.id,
          currentStock: product.quantity,
          dailyVelocity: result.dailyVelocity,
          daysUntilStockout: daysUntil,
          predictedStockoutDate: stockoutDate,
          urgencyLevel: result.urgencyLevel,
          suggestedReorderLevel: result.suggestedReorderLevel,
          reorderLevelReason: result.reorderLevelReason,
        },
        update: {
          currentStock: product.quantity,
          dailyVelocity: result.dailyVelocity,
          daysUntilStockout: daysUntil,
          predictedStockoutDate: stockoutDate,
          urgencyLevel: result.urgencyLevel,
          suggestedReorderLevel: result.suggestedReorderLevel,
          reorderLevelReason: result.reorderLevelReason,
        },
      });

      if (result.urgencyLevel === "CRITICAL" && product.organizationId) {
        void notifyAllBossUsers(
          product.organizationId,
          "Critical Stock Alert",
          `"${product.name}" will run out in ${Math.round(daysUntil)} days — only ${product.quantity} units left.`,
          "CRITICAL_STOCK",
          { productId: product.id }
        );
      }

      results.push({ productId: product.id, prediction });
    }

    return NextResponse.json({ results, processed: results.length });
  } catch (err) {
    console.error("[AI:stock-prediction]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
