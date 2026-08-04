import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays, differenceInDays, format } from "date-fns";
import { notifyAllBossUsers } from "@/lib/notifications";

// Vercel Cron: Add to vercel.json:
// { "crons": [{ "path": "/api/cron/expiry-check", "schedule": "0 8 * * *" }] }
// Set CRON_SECRET env var.

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in60Days = addDays(now, 60);

  const products = await db.product.findMany({
    where: {
      isActive: true,
      expirationDate: { not: null, lte: in60Days },
    },
    select: { id: true, name: true, expirationDate: true, organizationId: true },
  });

  let notified = 0;

  for (const product of products) {
    if (!product.expirationDate || !product.organizationId) continue;
    const daysLeft = differenceInDays(product.expirationDate, now);
    const expiryStr = format(product.expirationDate, "MMM d, yyyy");

    if (daysLeft <= 30) {
      await notifyAllBossUsers(
        product.organizationId,
        "Product Expiring Soon — 1 Month",
        `"${product.name}" expires on ${expiryStr} (${daysLeft} day${daysLeft !== 1 ? "s" : ""} left).`,
        "EXPIRY_1M",
        { productId: product.id, expirationDate: product.expirationDate.toISOString() },
        "BOTH"
      );
      notified++;
    } else if (daysLeft <= 60) {
      await notifyAllBossUsers(
        product.organizationId,
        "Product Expiring in 2 Months",
        `"${product.name}" expires on ${expiryStr} (${daysLeft} days left).`,
        "EXPIRY_2M",
        { productId: product.id, expirationDate: product.expirationDate.toISOString() },
        "BOTH"
      );
      notified++;
    }
  }

  return NextResponse.json({ ok: true, checked: products.length, notified });
}
