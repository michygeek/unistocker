"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subDays, startOfDay, format } from "date-fns";

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeField(v: unknown): string {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function buildCSV(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeField).join(",")];
  for (const row of rows) lines.push(row.map(escapeField).join(","));
  return "﻿" + lines.join("\r\n"); // BOM → Excel opens with correct encoding
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQ = false;
  const t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQ) {
      if (c === '"' && t[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(field.trim()); field = ""; }
      else if (c === '\n') {
        row.push(field.trim());
        if (row.some(Boolean)) rows.push(row);
        row = []; field = "";
      } else field += c;
    }
  }
  if (field || row.length) {
    row.push(field.trim());
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}

// ─── Export: Inventory ────────────────────────────────────────────────────────

export async function exportInventoryCSV() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const products = await db.product.findMany({
    where: { isActive: true },
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const rows = products.map((p) => [
    p.name,
    p.sku,
    Number(p.sellingPrice),
    Number(p.costPrice),
    p.quantity,
    p.description ?? "",
    p.lowStockAlert,
    p.barcode ?? "",
    p.category?.name ?? "",
  ]);

  return {
    csv: buildCSV(
      ["name", "sku", "selling_price", "cost_price", "quantity", "description", "low_stock_alert", "barcode", "category"],
      rows,
    ),
    filename: `inventory-${format(new Date(), "yyyy-MM-dd")}.csv`,
  };
}

// ─── Export: Reports (30-day daily sales) ────────────────────────────────────

export async function exportReportsCSV() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role === "STAFF") throw new Error("Forbidden");

  const now = new Date();
  const rows = await Promise.all(
    Array.from({ length: 30 }, (_, i) => subDays(now, 29 - i)).map(async (day) => {
      const start = startOfDay(day);
      const end = new Date(start.getTime() + 86400000);
      const r = await db.sale.aggregate({
        _sum: { total: true, profit: true },
        _count: { id: true },
        where: { createdAt: { gte: start, lt: end } },
      });
      return [
        format(day, "yyyy-MM-dd"),
        Number(r._sum.total ?? 0).toFixed(2),
        Number(r._sum.profit ?? 0).toFixed(2),
        r._count.id,
      ];
    }),
  );

  return {
    csv: buildCSV(["date", "revenue", "profit", "transactions"], rows),
    filename: `sales-report-${format(now, "yyyy-MM-dd")}.csv`,
  };
}

// ─── Import: Products ─────────────────────────────────────────────────────────

const REQUIRED_COLS = ["name", "sku", "selling_price", "cost_price", "quantity"] as const;

export async function importProducts(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role === "STAFF") throw new Error("Forbidden");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };
  if (file.size > 5 * 1024 * 1024) return { error: "File exceeds the 5 MB limit" };

  const text = await file.text();
  const all = parseCSV(text);
  if (all.length < 2) return { error: "CSV has no data rows" };

  const headers = all[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  for (const col of REQUIRED_COLS) {
    if (!headers.includes(col)) return { error: `Missing required column: "${col}"` };
  }

  const ci = (name: string) => headers.indexOf(name);
  const dataRows = all.slice(1);

  // Resolve / create categories in one pass
  const catNames = [
    ...new Set(dataRows.map((r) => r[ci("category")]?.trim()).filter(Boolean)),
  ];
  const catMap = new Map<string, string>();
  for (const name of catNames) {
    let c = await db.category.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
    if (!c) c = await db.category.create({ data: { name } });
    catMap.set(name.toLowerCase(), c.id);
  }

  // Bulk-check existing SKUs
  const candidateSkus = dataRows.map((r) => r[ci("sku")]?.trim()).filter(Boolean);
  const existingSkus = new Set(
    (await db.product.findMany({ where: { sku: { in: candidateSkus } }, select: { sku: true } }))
      .map((p) => p.sku),
  );

  let created = 0;
  const skipped: { row: number; sku: string; reason: string }[] = [];
  const seenSkus = new Set<string>();

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    const rowNum = i + 2;
    const name = r[ci("name")]?.trim();
    const sku = r[ci("sku")]?.trim();

    if (!name || !sku) {
      skipped.push({ row: rowNum, sku: sku ?? "?", reason: "Missing name or sku" });
      continue;
    }
    if (existingSkus.has(sku)) {
      skipped.push({ row: rowNum, sku, reason: "SKU already exists in inventory" });
      continue;
    }
    if (seenSkus.has(sku)) {
      skipped.push({ row: rowNum, sku, reason: "Duplicate SKU within this file" });
      continue;
    }

    const sellingPrice = parseFloat(r[ci("selling_price")]?.replace(/[^0-9.]/g, "") ?? "");
    const costPrice    = parseFloat(r[ci("cost_price")]?.replace(/[^0-9.]/g, "") ?? "");
    const quantity     = parseInt(r[ci("quantity")] ?? "", 10);

    if (!sellingPrice || sellingPrice <= 0) { skipped.push({ row: rowNum, sku, reason: "Invalid selling_price" }); continue; }
    if (!costPrice    || costPrice    <= 0) { skipped.push({ row: rowNum, sku, reason: "Invalid cost_price"    }); continue; }
    if (isNaN(quantity) || quantity   <  0) { skipped.push({ row: rowNum, sku, reason: "Invalid quantity"      }); continue; }

    const rawAlert    = ci("low_stock_alert") >= 0 ? r[ci("low_stock_alert")] : "";
    const lowStockAlert = parseInt(rawAlert ?? "10", 10);
    const catName     = ci("category") >= 0 ? r[ci("category")]?.trim() : "";
    const categoryId  = catName ? catMap.get(catName.toLowerCase()) : undefined;

    const product = await db.product.create({
      data: {
        name, sku, sellingPrice, costPrice, quantity,
        description:    r[ci("description")]?.trim()  || null,
        lowStockAlert:  isNaN(lowStockAlert) ? 10 : Math.max(0, lowStockAlert),
        barcode:        (ci("barcode") >= 0 ? r[ci("barcode")]?.trim() : "") || null,
        categoryId,
        createdById:    session.user.id,
        branchId:       session.user.branchId ?? undefined,
      },
    });

    if (quantity > 0) {
      await db.inventoryTransaction.create({
        data: {
          type: "STOCK_IN", quantity,
          notes: "Imported via CSV",
          productId: product.id,
          userId: session.user.id,
        },
      });
    }

    seenSkus.add(sku);
    created++;
  }

  revalidatePath("/inventory");
  return { created, skipped };
}
