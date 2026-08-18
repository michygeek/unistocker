import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { callClaudeStream } from "@/lib/ai/claude";
import { checkAiLimit, logAiRequest } from "@/lib/subscription";
import { subDays } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const messages: Array<{ role: "user" | "assistant"; content: string }> = body.messages ?? [];
    const chatId: string | undefined = body.chatId;

    if (!messages.length) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const gate = await checkAiLimit(session.user.organizationId, session.user.id, session.user.role);
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason }, { status: 403 });
    }
    await logAiRequest(session.user.organizationId!, session.user.id, "chat");

    // Fetch live business context — strictly scoped to the caller's organization
    const orgId = session.user.organizationId ?? "none";
    const since30 = subDays(new Date(), 30);
    const since7 = subDays(new Date(), 7);

    const [salesSummary30, salesSummary7, topProducts, lowStockProducts, recentActivity] = await Promise.all([
      db.sale.aggregate({
        _sum: { total: true, profit: true },
        _count: true,
        where: { organizationId: orgId, createdAt: { gte: since30 } },
      }),
      db.sale.aggregate({
        _sum: { total: true, profit: true },
        _count: true,
        where: { organizationId: orgId, createdAt: { gte: since7 } },
      }),
      db.$queryRaw<Array<{ name: string; revenue: number; units: number }>>`
        SELECT p.name, SUM(si.total)::float AS revenue, SUM(si.quantity)::int AS units
        FROM "SaleItem" si
        JOIN "Product" p ON p.id = si."productId"
        JOIN "Sale" s ON s.id = si."saleId"
        WHERE s."createdAt" >= ${since30} AND s."organizationId" = ${orgId}
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
        LIMIT 10
      `,
      db.product.findMany({
        where: { isActive: true, organizationId: orgId, quantity: { lte: db.product.fields.lowStockAlert } },
        select: { name: true, quantity: true, lowStockAlert: true },
        take: 5,
      }).catch(() => []),
      db.activityLog.findMany({
        where: { user: { organizationId: orgId } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, role: true } } },
      }),
    ]);

    const businessContext = {
      period: "Last 30 days",
      revenue30d: Number(salesSummary30._sum.total ?? 0),
      profit30d: Number(salesSummary30._sum.profit ?? 0),
      sales30d: salesSummary30._count,
      revenue7d: Number(salesSummary7._sum.total ?? 0),
      profit7d: Number(salesSummary7._sum.profit ?? 0),
      sales7d: salesSummary7._count,
      topProducts: topProducts.map((p) => ({ name: p.name, revenue: Number(p.revenue), units: Number(p.units) })),
      lowStockAlerts: lowStockProducts.map((p) => ({ name: p.name, stock: p.quantity, threshold: p.lowStockAlert })),
      recentActivity: recentActivity.slice(0, 5).map((a) => ({ action: a.action, entity: a.entity, description: a.description, user: a.user.name })),
    };

    const systemPrompt = `You are a business intelligence assistant for a small African business on UniStocker.
Answer questions directly using the real data provided.
If asked in Pidgin English, respond in Pidgin.
Always back answers with specific numbers.
Never invent data — if you don't have it, say so.
Keep responses under 150 words unless a breakdown is explicitly asked for.
Format all currency as ₦ with commas.
BUSINESS DATA: ${JSON.stringify(businessContext)}`;

    // Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        try {
          for await (const delta of callClaudeStream(systemPrompt, messages)) {
            fullResponse += delta;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
          }

          // Save conversation
          const updatedMessages = [
            ...messages,
            { role: "assistant" as const, content: fullResponse, timestamp: new Date().toISOString() },
          ];

          if (chatId) {
            await db.insightChat.update({
              where: { id: chatId },
              data: { messages: updatedMessages },
            });
          } else {
            await db.insightChat.create({
              data: { userId: session.user.id, messages: updatedMessages },
            });
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        } catch (err) {
          console.error("[AI:chat]", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "AI temporarily unavailable" })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[AI:chat]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
