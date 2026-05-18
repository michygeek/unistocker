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
      select: { id: true, name: true, sku: true, barcode: true, sellingPrice: true, quantity: true },
      orderBy: { name: "asc" },
    }),
    db.notification.count({ where: { userId: session.user.id, readAt: null, status: "SENT" } }),
  ]);

  return (
    <div className="flex flex-col flex-1">
      <Header title="Sales" unreadCount={unreadCount} />
      <div className="flex-1 p-6 animate-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Records</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{total} total transactions</p>
          </div>
          <NewSaleButton products={products.map((p) => ({ ...p, sellingPrice: Number(p.sellingPrice) }))} />
        </div>

        <SalesTable
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
