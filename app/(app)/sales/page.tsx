import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { SalesTable } from "@/components/sales/sales-table";
import { NewSaleButton } from "@/components/sales/new-sale-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sales" };
export const dynamic = "force-dynamic";

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth();
  if (!session?.user) return null;

  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const limit = 20;

  const where = session.user.role === "STAFF"
    ? { userId: session.user.id }
    : {};

  const [sales, total, products, unreadCount] = await Promise.all([
    db.sale.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        branch: { select: { name: true } },
        saleItems: {
          include: { product: { select: { name: true, sku: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.sale.count({ where }),
    db.product.findMany({
      where: { isActive: true, quantity: { gt: 0 } },
      select: { id: true, name: true, sku: true, barcode: true, sellingPrice: true, quantity: true, piecesPerCarton: true },
      orderBy: { name: "asc" },
    }),
    db.notification.count({ where: { userId: session.user.id, readAt: null, status: "SENT" } }),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header title="Sales" unreadCount={unreadCount} />
      <div className="animate-in" style={{ flex: 1, padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 }}>Sales Records</h2>
            <p style={{ fontSize: 14, color: "var(--text-2)", marginTop: 2 }}>{total} total transactions</p>
          </div>
          <NewSaleButton
            products={products.map((p) => ({ ...p, sellingPrice: Number(p.sellingPrice), piecesPerCarton: p.piecesPerCarton ?? null }))}
            userName={session.user.name ?? session.user.email ?? "Cashier"}
            organizationName={session.user.organizationName ?? ""}
          />
        </div>

        <SalesTable
          organizationName={session.user.organizationName ?? ""}
          sales={sales.map((s) => ({
            ...s,
            subtotal: Number(s.subtotal),
            discount: Number(s.discount),
            tax: Number(s.tax),
            total: Number(s.total),
            profit: Number(s.profit),
            saleItems: s.saleItems.map((i) => ({
              ...i,
              unitPrice: Number(i.unitPrice),
              costPrice: Number(i.costPrice),
              total: Number(i.total),
            })),
          }))}
          total={total}
          page={page}
          limit={limit}
        />
      </div>
    </div>
  );
}
