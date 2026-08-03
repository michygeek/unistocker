import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { callClaudeJSON, isCacheFresh, CHEAP_MODEL } from "@/lib/ai/claude";
import { checkAiLimit, logAiRequest } from "@/lib/subscription";
import { subDays, addDays, format } from "date-fns";

interface ForecastResponse {
  next7Days: number;
  next14Days: number;
  next30Days: number;
  reorderQty: number;
  reorderByDate: string;
  confidence: number;
  reasoning: string;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId } = await params;

    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, quantity: true, lowStockAlert: true, organizationId: true },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Return fresh cache if available
    const cached = await db.demandForecast.findFirst({
      where: { productId },
      orderBy: { createdAt: "desc" },
    });
    if (cached && isCacheFresh(cached.createdAt)) {
      return NextResponse.json({ forecast: cached, cached: true });
    }

    const gate = await checkAiLimit(session.user.organizationId, session.user.id, session.user.role);
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason }, { status: 403 });
    }

    // Fetch last 90 days of sales grouped by day
    const since = subDays(new Date(), 90);
    const salesRaw = await db.saleItem.findMany({
      where: {
        productId,
        sale: { createdAt: { gte: since } },
      },
      include: { sale: { select: { createdAt: true } } },
    });

    // Aggregate by day
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
Sales history (last 90 days, date→units sold):
${JSON.stringify(salesHistory, null, 2)}
Today: ${format(new Date(), "yyyy-MM-dd")}`;

    let result: ForecastResponse;
    try {
      result = await callClaudeJSON<ForecastResponse>(systemPrompt, userMessage, "forecast", CHEAP_MODEL);
    } catch {
      return NextResponse.json({ error: "AI temporarily unavailable. Please try again later." }, { status: 503 });
    }
    await logAiRequest(session.user.organizationId!, session.user.id, "forecast");

    // Validate required fields
    if (
      typeof result.next7Days !== "number" ||
      typeof result.next14Days !== "number" ||
      typeof result.next30Days !== "number" ||
      typeof result.reorderQty !== "number" ||
      !result.reorderByDate ||
      typeof result.confidence !== "number"
    ) {
      return NextResponse.json({ error: "AI returned invalid data. Please retry." }, { status: 500 });
    }

    const forecast = await db.demandForecast.create({
      data: {
        productId,
        branchId: session.user.branchId ?? null,
        next7Days: result.next7Days,
        next14Days: result.next14Days,
        next30Days: result.next30Days,
        reorderQty: Math.round(result.reorderQty),
        reorderByDate: new Date(result.reorderByDate),
        confidence: Math.min(1, Math.max(0, result.confidence)),
        reasoning: result.reasoning,
      },
    });

    return NextResponse.json({ forecast, cached: false });
  } catch (err) {
    console.error("[AI:forecast]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
