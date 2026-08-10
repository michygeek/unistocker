import { cookies } from "next/headers";
import type { UserRole, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

interface UserCtx {
  role: UserRole;
  branchId?: string | null;
  organizationId?: string | null;
}

// Returns the branch ID to filter queries by, or null for "all branches"
export async function getActiveBranchId(user: UserCtx): Promise<string | null> {
  if (user.role !== "BOSS") return user.branchId ?? null;
  const c = await cookies();
  return c.get("active_branch_id")?.value ?? null;
}

export type RequiredBranchError = "NO_BRANCHES" | "SELECT_BRANCH" | "NOT_ASSIGNED";

// Resolves a concrete branch ID for writes (product/sale creation) — never
// returns null, so records can no longer end up in the ambiguous org-level
// (branchId=null) state. Auto-picks the branch when there's only one.
export async function getRequiredBranchId(
  user: UserCtx
): Promise<{ branchId: string } | { error: RequiredBranchError }> {
  if (user.role !== "BOSS") {
    return user.branchId ? { branchId: user.branchId } : { error: "NOT_ASSIGNED" };
  }

  const cookieBranchId = (await cookies()).get("active_branch_id")?.value;
  if (cookieBranchId) return { branchId: cookieBranchId };

  if (!user.organizationId) return { error: "NO_BRANCHES" };

  const branches = await db.branch.findMany({
    where: { organizationId: user.organizationId, isActive: true },
    select: { id: true },
    take: 2,
  });
  if (branches.length === 0) return { error: "NO_BRANCHES" };
  if (branches.length === 1) return { branchId: branches[0].id };
  return { error: "SELECT_BRANCH" };
}

export const REQUIRED_BRANCH_ERROR_MESSAGES: Record<RequiredBranchError, string> = {
  NO_BRANCHES: "Create a branch before adding inventory.",
  SELECT_BRANCH: "Select a specific branch from the switcher before adding inventory.",
  NOT_ASSIGNED: "You haven't been assigned to a branch yet. Contact your admin.",
};

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
