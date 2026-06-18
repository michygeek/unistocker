"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { PlanType } from "@/lib/plans";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) throw new Error("Forbidden");
  return session;
}

export async function adminSetPlan(organizationId: string, plan: PlanType, status: "ACTIVE" | "TRIAL" | "FREE") {
  await requireSuperAdmin();

  if (plan === "FREE" || status === "FREE") {
    await db.subscription.upsert({
      where: { organizationId },
      create: { organizationId, plan: "FREE", status: "ACTIVE" },
      update: { plan: "FREE", status: "CANCELLED", currentPeriodEnd: null, trialEndsAt: null },
    });
  } else {
    const currentPeriodEnd = status === "ACTIVE" ? new Date(Date.now() + 30 * 86400000) : null;
    const trialEndsAt = status === "TRIAL" ? new Date(Date.now() + 30 * 86400000) : null;
    await db.subscription.upsert({
      where: { organizationId },
      create: { organizationId, plan, status, currentPeriodEnd, trialEndsAt },
      update: { plan, status, currentPeriodEnd, trialEndsAt },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/organizations");
  revalidatePath("/admin/subscriptions");
}

export async function adminToggleOrg(organizationId: string, isActive: boolean) {
  await requireSuperAdmin();
  await db.user.updateMany({ where: { organizationId }, data: { isActive } });
  revalidatePath("/admin");
  revalidatePath("/admin/organizations");
}

export async function adminDeleteOrg(organizationId: string) {
  await requireSuperAdmin();

  const orgUsers = await db.user.findMany({ where: { organizationId }, select: { id: true } });
  const userIds = orgUsers.map((u) => u.id);

  // Collect ALL products tied to this org — by organizationId OR by createdById.
  // Product.createdById is non-nullable with no cascade, so any product created by
  // an org user (even with a null organizationId) will block user deletion.
  const allProducts = await db.product.findMany({
    where: {
      OR: [
        { organizationId },
        ...(userIds.length ? [{ createdById: { in: userIds } }] : []),
      ],
    },
    select: { id: true },
  });
  const productIds = allProducts.map((p) => p.id);

  // Same pattern for sales — Sale.userId is non-nullable with no cascade.
  const allSales = await db.sale.findMany({
    where: {
      OR: [
        { organizationId },
        ...(userIds.length ? [{ userId: { in: userIds } }] : []),
      ],
    },
    select: { id: true },
  });
  const saleIds = allSales.map((s) => s.id);

  await db.$transaction(async (tx) => {
    // User-linked tables (no cascade on User relation)
    if (userIds.length) {
      await tx.insightChat.deleteMany({ where: { userId: { in: userIds } } });
      await tx.notification.deleteMany({
        where: { OR: [{ userId: { in: userIds } }, { sentById: { in: userIds } }] },
      });
      await tx.activityLog.deleteMany({ where: { userId: { in: userIds } } });
    }
    // InventoryTransaction references both users and products (no cascade either side)
    if (userIds.length || productIds.length) {
      await tx.inventoryTransaction.deleteMany({
        where: {
          OR: [
            ...(userIds.length ? [{ userId: { in: userIds } }] : []),
            ...(productIds.length ? [{ productId: { in: productIds } }] : []),
          ],
        },
      });
    }
    // Product-linked AI tables
    if (productIds.length) {
      await tx.stockPrediction.deleteMany({ where: { productId: { in: productIds } } });
      await tx.demandForecast.deleteMany({ where: { productId: { in: productIds } } });
    }
    // SaleItem must go before both Sales and Products (no cascade from Product side)
    if (saleIds.length) {
      await tx.saleItem.deleteMany({ where: { saleId: { in: saleIds } } });
    }
    if (productIds.length) {
      // Also catch any sale items referencing these products (e.g. cross-org edge cases)
      await tx.saleItem.deleteMany({ where: { productId: { in: productIds } } });
    }
    // Core org data — use the widened ID sets to catch null-organizationId rows
    if (saleIds.length) {
      await tx.sale.deleteMany({ where: { id: { in: saleIds } } });
    }
    if (productIds.length) {
      await tx.product.deleteMany({ where: { id: { in: productIds } } });
    }
    await tx.subscription.deleteMany({ where: { organizationId } });
    // Null branchId before deleting branches (User→Branch FK, no cascade)
    if (userIds.length) {
      await tx.user.updateMany({ where: { organizationId }, data: { branchId: null } });
    }
    await tx.branch.deleteMany({ where: { organizationId } });
    // Account + Session cascade automatically on User delete
    await tx.user.deleteMany({ where: { organizationId } });
    await tx.organization.delete({ where: { id: organizationId } });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/organizations");
  revalidatePath("/admin/subscriptions");
}
