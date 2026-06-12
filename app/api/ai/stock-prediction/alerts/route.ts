import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const alerts = await db.stockPrediction.findMany({
      where: {
        urgencyLevel: { in: ["CRITICAL", "WARNING"] },
        product: {
          isActive: true,
          ...(session.user.organizationId ? { organizationId: session.user.organizationId } : {}),
        },
      },
      include: {
        product: { select: { id: true, name: true, sku: true, quantity: true, lowStockAlert: true } },
      },
      orderBy: { daysUntilStockout: "asc" },
    });

    return NextResponse.json({ alerts });
  } catch (err) {
    console.error("[AI:stock-alerts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
