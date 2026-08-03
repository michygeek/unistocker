import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { callClaudeJSON, isCacheFresh, CHEAP_MODEL } from "@/lib/ai/claude";
import { checkAiLimit, logAiRequest } from "@/lib/subscription";
import { subDays, format } from "date-fns";

const DELAY_MS = 200;
const BATCH_LIMIT = 50;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const branchId = body.branchId ?? session.user.branchId ?? undefined;

    const gate = await checkAiLimit(session.user.organizationId, session.user.id, session.user.role);
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason }, { status: 403 });
    }
    await logAiRequest(session.user.organizationId!, session.user.id, "forecast-batch");

    const products = await db.product.findMany({
      where: {
        isActive: true,
        ...(branchId ? { branchId } : { organizationId: session.user.organizationId ?? undefined }),
      },
      select: { id: true, name: true, quantity: true, lowStockAlert: true },
      take: BATCH_LIMIT,
    });

    const since = subDays(new Date(), 90);
    let processed = 0;
    let needReorderCount = 0;
    const errors: string[] = [];

    for (const product of products) {
      // Skip if fresh cache exists
      const cached = await db.demandForecast.findFirst({
        where: { productId: product.id },
        orderBy: { createdAt: "desc" },
      });
      if (cached && isCacheFresh(cached.createdAt)) {
        processed++;
        const reorderBy = new Date(cached.reorderByDate);
        const daysUntil = (reorderBy.getTime() - Date.now()) / 86400000;
        if (daysUntil <= 7) needReorderCount++;
        continue;
      }

      try {
        const salesRaw = await db.saleItem.findMany({
          where: { productId: product.id, sale: { createdAt: { gte: since } } },
          include: { sale: { select: { createdAt: true } } },
        });

        const byDay: Record<string, number> = {};
        for (const item of salesRaw) {
          const day = format(item.sale.createdAt, "yyyy-MM-dd");
          byDay[day] = (byDay[day] ?? 0) + item.quantity;
        }
        const salesHistory = Object.entries(byDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, qty]) => ({ date, qty }));

        const systemPrompt = `You are a demand forecasting AI for African small businesses.
Analyse the sales data and return ONLY valid JSON — no markdown, no extra text:
{
  "next7Days": number,
  "next14Days": number,
  "next30Days": number,
  "reorderQty": number,
  "reorderByDate": "ISO date string",
  "confidence": 0-1 float,
  "reasoning": "2-3 sentence plain English explanation mentioning specific trends noticed"
}
Consider weekday/weekend patterns, trend direction, spikes, and current stock burn rate.`;

        const userMessage = `Product: ${product.name}
Current stock: ${product.quantity} units
Reorder level: ${product.lowStockAlert} units
Sales history (last 90 days): ${JSON.stringify(salesHistory)}
Today: ${format(new Date(), "yyyy-MM-dd")}`;

        const result = await callClaudeJSON<{
          next7Days: number; next14Days: number; next30Days: number;
          reorderQty: number; reorderByDate: string; confidence: number; reasoning: string;
        }>(systemPrompt, userMessage, "forecast-batch", CHEAP_MODEL);

        const forecast = await db.demandForecast.create({
          data: {
            productId: product.id,
            branchId: branchId ?? null,
            next7Days: result.next7Days,
            next14Days: result.next14Days,
            next30Days: result.next30Days,
            reorderQty: Math.round(result.reorderQty),
            reorderByDate: new Date(result.reorderByDate),
            confidence: Math.min(1, Math.max(0, result.confidence)),
            reasoning: result.reasoning,
          },
        });

        const daysUntil = (forecast.reorderByDate.getTime() - Date.now()) / 86400000;
        if (daysUntil <= 7) needReorderCount++;
      } catch (err) {
        console.error(`[AI:forecast-batch] product=${product.id}`, err);
        errors.push(product.name);
      }

      processed++;
      await sleep(DELAY_MS);
    }

    return NextResponse.json({ processed, needReorderCount, errors, total: products.length });
  } catch (err) {
    console.error("[AI:forecast-batch]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
