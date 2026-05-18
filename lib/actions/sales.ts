"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/auth/permissions";
import { addActivityLogJob } from "@/lib/queue";
import { notifyAllBossUsers } from "@/lib/notifications";

const SaleItemSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().positive(),
});

const SaleSchema = z.object({
  items: z.array(SaleItemSchema).min(1),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

function generateReceiptNumber(): string {
  const date = new Date();
  const prefix = `REC-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const suffix = Math.floor(Math.random() * 9000 + 1000).toString();
  return `${prefix}-${suffix}`;
}

export async function recordSale(data: z.infer<typeof SaleSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!hasPermission(session.user.role, "sales:write")) throw new Error("Forbidden");

  const parsed = SaleSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { items, discount, tax, notes } = parsed.data;

  const productIds = items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (products.length !== productIds.length) {
    return { error: "One or more products not found" };
  }

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || product.quantity < item.quantity) {
      return { error: `Insufficient stock for "${product?.name ?? item.productId}"` };
    }
  }

  let subtotal = 0;
  let totalProfit = 0;

  const saleItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const total = item.quantity * item.unitPrice;
    const cost = item.quantity * Number(product.costPrice);
    subtotal += total;
    totalProfit += total - cost;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPrice: Number(product.costPrice),
      total,
    };
  });

  const taxAmount = subtotal * (tax / 100);
  const finalTotal = subtotal - discount + taxAmount;
  const receiptNumber = generateReceiptNumber();

  const sale = await db.$transaction(async (tx) => {
    const newSale = await tx.sale.create({
      data: {
        receiptNumber,
        subtotal,
        discount,
        tax: taxAmount,
        total: finalTotal,
        profit: totalProfit,
        notes,
        userId: session.user.id,
        branchId: session.user.branchId ?? undefined,
        saleItems: { create: saleItems },
      },
      include: { saleItems: { include: { product: true } } },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });

      await tx.inventoryTransaction.create({
        data: {
          type: "STOCK_OUT",
          quantity: item.quantity,
          notes: `Sale #${receiptNumber}`,
          productId: item.productId,
          userId: session.user.id,
        },
      });
    }

    return newSale;
  });

  const itemNames = sale.saleItems.map((i) => i.product.name).join(", ");

  await addActivityLogJob({
    userId: session.user.id,
    action: "SALE",
    entity: "Sale",
    entityId: sale.id,
    description: `Recorded sale #${receiptNumber} — $${finalTotal.toFixed(2)} for ${items.length} item(s): ${itemNames}`,
    metadata: { receiptNumber, total: finalTotal, items: items.length },
  });

  await notifyAllBossUsers(
    "New Sale Recorded",
    `${session.user.name ?? session.user.email} recorded a sale of $${finalTotal.toFixed(2)} (Receipt: ${receiptNumber})`,
    "SALE_RECORDED",
    { saleId: sale.id, total: finalTotal }
  );

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)!;
    const newQty = product.quantity - item.quantity;
    if (newQty <= product.lowStockAlert) {
      await notifyAllBossUsers(
        `Low Stock: ${product.name}`,
        `After this sale, "${product.name}" has only ${newQty} units left.`,
        "LOW_STOCK",
        { productId: product.id, newQty }
      );
    }
  }

  revalidatePath("/sales");
  revalidatePath("/inventory");
  return { success: true, sale };
}
