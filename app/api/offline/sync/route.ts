import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordSale } from "@/lib/actions/sales";
import { adjustStock } from "@/lib/actions/products";
import type { PendingOp } from "@/lib/offline-queue";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ops } = (await req.json()) as { ops: PendingOp[] };
  if (!Array.isArray(ops) || ops.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const results = await Promise.all(
    ops.map(async (op) => {
      try {
        if (op.type === "SALE") {
          const p = op.payload as {
            items: { productId: string; quantity: number; unitPrice: number }[];
            discount: number;
            tax: number;
            notes?: string;
          };
          const result = await recordSale(p);
          if ("error" in result) {
            return { id: op.id, success: false, error: String(result.error) };
          }
          return { id: op.id, success: true, data: result.sale };
        }

        if (op.type === "STOCK_IN" || op.type === "STOCK_OUT") {
          const p = op.payload as { productId: string; quantity: number; notes?: string };
          const result = await adjustStock(p.productId, p.quantity, op.type, p.notes);
          if (result && "error" in result) {
            return { id: op.id, success: false, error: String(result.error) };
          }
          return { id: op.id, success: true };
        }

        return { id: op.id, success: false, error: `Unknown op type: ${op.type}` };
      } catch (err) {
        return { id: op.id, success: false, error: err instanceof Error ? err.message : "Unknown error" };
      }
    })
  );

  return NextResponse.json({ results });
}
