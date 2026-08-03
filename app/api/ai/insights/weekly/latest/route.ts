import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const insight = await db.weeklyInsight.findFirst({
      where: { organizationId: session.user.organizationId ?? "none", branchId: session.user.branchId ?? null },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ insight });
  } catch (err) {
    console.error("[AI:weekly-latest]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
