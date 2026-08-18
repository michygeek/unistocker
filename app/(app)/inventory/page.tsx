import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { AddProductButton } from "@/components/inventory/add-product-button";
import { ExportInventoryButton } from "@/components/inventory/export-inventory-button";
import { ImportProductsModal } from "@/components/inventory/import-products-modal";
import { getActiveBranchId, getProductBranchConditions } from "@/lib/branch-filter";
import { getOrgSubscription } from "@/lib/subscription";
import { PLAN_FEATURES } from "@/lib/plans";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

interface SearchParams { search?: string; category?: string; status?: string; page?: string; }

export default async function InventoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth();
  if (!session?.user) return null;

  const orgId = session.user.organizationId ?? undefined;
  const subscription = orgId ? await getOrgSubscription(orgId) : null;
  const plan = subscription?.plan ?? "FREE";
  const canExport = PLAN_FEATURES[plan].export;
  const canPhotoImport = PLAN_FEATURES[plan].photoImport;

  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const limit = 20;
  const search = params.search ?? "";
  const categoryId = params.category;
  const showInactive = params.status === "inactive";

  const activeBranchId = await getActiveBranchId(session.user);
  const branchConds = getProductBranchConditions(session.user.organizationId, activeBranchId);

  const productWhere = {
    AND: [
      { isActive: showInactive ? false : true },
      ...branchConds,
      ...(search ? [{ OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { sku: { contains: search, mode: "insensitive" as const } },
        { barcode: { contains: search, mode: "insensitive" as const } },
      ]}] : []),
      ...(categoryId ? [{ categoryId }] : []),
    ],
  };

  const [products, total, categories, unreadCount, branchCount] = await Promise.all([
    db.product.findMany({
      where: productWhere,
      include: {
        category: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.product.count({ where: productWhere }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.notification.count({ where: { userId: session.user.id, readAt: null, status: "SENT" } }),
    orgId ? db.branch.count({ where: { organizationId: orgId, isActive: true } }) : Promise.resolve(0),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header title="Inventory" unreadCount={unreadCount} />
      <div className="animate-in" style={{ flex: 1, padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 }}>Products</h2>
            <p style={{ fontSize: 14, color: "var(--text-2)", marginTop: 2 }}>{total} items total</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canExport && <ExportInventoryButton />}
            {canPhotoImport && <ImportProductsModal userRole={session.user.role} />}
            <AddProductButton categories={categories} userRole={session.user.role} hasBranches={branchCount > 0} />
          </div>
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
