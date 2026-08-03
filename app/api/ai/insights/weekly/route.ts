import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAiLimit, logAiRequest } from "@/lib/subscription";
import { generateWeeklyInsight } from "@/lib/ai/weekly-insight";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!session.user.organizationId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const branchId: string | undefined = body.branchId ?? session.user.branchId ?? undefined;

    const gate = await checkAiLimit(session.user.organizationId, session.user.id, session.user.role);
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason }, { status: 403 });
    }

    let insight;
    try {
      insight = await generateWeeklyInsight(session.user.organizationId, branchId);
    } catch {
      return NextResponse.json({ error: "AI temporarily unavailable" }, { status: 503 });
    }
    await logAiRequest(session.user.organizationId, session.user.id, "weekly-insight");

    return NextResponse.json({ insight });
  } catch (err) {
    console.error("[AI:weekly]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
