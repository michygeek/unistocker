import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { AddProductButton } from "@/components/inventory/add-product-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

interface SearchParams { search?: string; category?: string; status?: string; page?: string; }

export default async function InventoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth();
  if (!session?.user) return null;

  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const limit = 20;
  const search = params.search ?? "";
  const categoryId = params.category;
  const showInactive = params.status === "inactive";

  const [products, total, categories, unreadCount] = await Promise.all([
    db.product.findMany({
      where: {
        isActive: showInactive ? false : true,
        ...(search && { OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
        ]}),
        ...(categoryId && { categoryId }),
      },
      include: {
        category: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.product.count({
      where: {
        isActive: showInactive ? false : true,
        ...(search && { OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ]}),
        ...(categoryId && { categoryId }),
      },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.notification.count({ where: { userId: session.user.id, readAt: null, status: "SENT" } }),
  ]);

  return (
    <div className="flex flex-col flex-1">
      <Header title="Inventory" unreadCount={unreadCount} />
      <div className="flex-1 p-6 animate-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Products</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{total} items total</p>
          </div>
          <AddProductButton categories={categories} userRole={session.user.role} />
        </div>

        <InventoryTable
          products={products.map((p) => ({
            ...p,
            costPrice: Number(p.costPrice),
            sellingPrice: Number(p.sellingPrice),
            category: p.category,
            branch: p.branch,
          }))}
          total={total}
          page={page}
          limit={limit}
          categories={categories}
          userRole={session.user.role}
          search={search}
        />
      </div>
    </div>
  );
}
