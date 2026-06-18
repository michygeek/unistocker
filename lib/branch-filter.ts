import { cookies } from "next/headers";
import type { UserRole, Prisma } from "@prisma/client";

interface UserCtx {
  role: UserRole;
  branchId?: string | null;
}

// Returns the branch ID to filter queries by, or null for "all branches"
export async function getActiveBranchId(user: UserCtx): Promise<string | null> {
  if (user.role !== "BOSS") return user.branchId ?? null;
  const c = await cookies();
  return c.get("active_branch_id")?.value ?? null;
}

// Returns AND conditions for product queries (strict branch isolation)
export function getProductBranchConditions(branchId: string | null): Prisma.ProductWhereInput[] {
  if (!branchId) return [];
  return [{ branchId }];
}

// Returns AND conditions for sale queries (branch-specific only)
export function getSaleBranchConditions(branchId: string | null): Prisma.SaleWhereInput[] {
  if (!branchId) return [];
  return [{ branchId }];
}
