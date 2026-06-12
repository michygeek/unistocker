import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { callClaudeJSON } from "@/lib/ai/claude";
import { subDays, startOfWeek, endOfWeek, format } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const branchId: string | undefined = body.branchId ?? session.user.branchId ?? undefined;

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const prevWeekStart = subDays(weekStart, 7);

    const [salesThisWeek, salesLastWeek, topProductsRaw, slowestRaw, staffPerf] = await Promise.all([
      db.sale.aggregate({
        _sum: { total: true, profit: true },
        _count: true,
        where: {
          createdAt: { gte: weekStart, lte: weekEnd },
          ...(branchId ? { branchId } : {}),
        },
      }),
      db.sale.aggregate({
        _sum: { total: true, profit: true },
        _count: true,
        where: {
          createdAt: { gte: prevWeekStart, lt: weekStart },
          ...(branchId ? { branchId } : {}),
        },
      }),
      db.$queryRaw<Array<{ name: string; revenue: number; units: number }>>`
        SELECT p.name, SUM(si.total)::float AS revenue, SUM(si.quantity)::int AS units
        FROM "SaleItem" si
        JOIN "Product" p ON p.id = si."productId"
        JOIN "Sale" s ON s.id = si."saleId"
        WHERE s."createdAt" >= ${weekStart} AND s."createdAt" <= ${weekEnd}
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
        LIMIT 5
      `,
      db.$queryRaw<Array<{ name: string; revenue: number; units: number }>>`
        SELECT p.name, SUM(si.total)::float AS revenue, SUM(si.quantity)::int AS units
        FROM "SaleItem" si
        JOIN "Product" p ON p.id = si."productId"
        JOIN "Sale" s ON s.id = si."saleId"
        WHERE s."createdAt" >= ${weekStart} AND s."createdAt" <= ${weekEnd}
        GROUP BY p.id, p.name
        ORDER BY units ASC
        LIMIT 3
      `,
      db.$queryRaw<Array<{ name: string; totalSales: number; revenue: number }>>`
        SELECT u.name, COUNT(s.id)::int AS "totalSales", SUM(s.total)::float AS revenue
        FROM "Sale" s
        JOIN "User" u ON u.id = s."userId"
        WHERE s."createdAt" >= ${weekStart} AND s."createdAt" <= ${weekEnd}
        GROUP BY u.id, u.name
        ORDER BY revenue DESC
        LIMIT 5
      `,
    ]);

    const revenue = Number(salesThisWeek._sum.total ?? 0);
    const profit = Number(salesThisWeek._sum.profit ?? 0);
    const prevRevenue = Number(salesLastWeek._sum.total ?? 0);
    const revTrend = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

    const systemPrompt = `You are a business intelligence assistant for a small African business on UniStocker.
Generate a weekly business summary report. Return ONLY valid JSON:
{
  "summary": "3-4 paragraph narrative summary of the week",
  "topProducts": [{"name": string, "revenue": number, "units": number}],
  "alerts": [{"type": string, "message": string}],
  "highlights": [{"metric": string, "value": string, "trend": "up"|"down"|"stable"}]
}
Format all currency as ₦ with commas. Be specific and data-driven.`;

    const userMessage = `Week: ${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}
This week revenue: ₦${revenue.toLocaleString()}, Profit: ₦${profit.toLocaleString()}, Sales: ${salesThisWeek._count}
Last week revenue: ₦${prevRevenue.toLocaleString()}, Revenue trend: ${revTrend.toFixed(1)}%
Top products: ${JSON.stringify(topProductsRaw.map((p) => ({ name: p.name, revenue: Number(p.revenue), units: Number(p.units) })))}
Slowest products: ${JSON.stringify(slowestRaw.map((p) => ({ name: p.name, units: Number(p.units) })))}
Staff performance: ${JSON.stringify(staffPerf.map((s) => ({ name: s.name, sales: s.totalSales, revenue: Number(s.revenue) })))}`;

    let result: { summary: string; topProducts: object[]; alerts: object[]; highlights: object[] };
    try {
      result = await callClaudeJSON(systemPrompt, userMessage, "weekly-insight");
    } catch {
      return NextResponse.json({ error: "AI temporarily unavailable" }, { status: 503 });
    }

    const insight = await db.weeklyInsight.create({
      data: {
        branchId: branchId ?? null,
        weekOf: weekStart,
        summary: result.summary,
        topProducts: result.topProducts,
        alerts: result.alerts,
        highlights: result.highlights,
      },
    });

    return NextResponse.json({ insight });
  } catch (err) {
    console.error("[AI:weekly]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
