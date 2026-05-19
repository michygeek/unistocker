import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { EditProductForm } from "@/components/inventory/edit-product-form";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id }, select: { name: true } });
  return { title: product ? `Edit — ${product.name}` : "Edit Product" };
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role === "STAFF") redirect("/inventory");

  const { id } = await params;

  const [product, categories, unreadCount] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.notification.count({ where: { userId: session.user.id, readAt: null, status: "SENT" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col flex-1">
      <Header title="Edit Product" unreadCount={unreadCount} />
      <div className="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full animate-in">
        <EditProductForm
          product={{
            id: product.id,
            name: product.name,
            sku: product.sku,
            description: product.description ?? "",
            costPrice: Number(product.costPrice),
            sellingPrice: Number(product.sellingPrice),
            quantity: product.quantity,
            lowStockAlert: product.lowStockAlert,
            barcode: product.barcode ?? "",
            categoryId: product.categoryId ?? "",
            imageUrl: product.imageUrl ?? null,
          }}
          categories={categories}
        />
      </div>
    </div>
  );
}
