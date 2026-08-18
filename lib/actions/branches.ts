"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkBranchLimit } from "@/lib/subscription";

const BranchSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function createBranch(data: z.infer<typeof BranchSchema>) {
  const session = await auth();
  if (!session?.user || session.user.role !== "BOSS") throw new Error("Forbidden");

  const parsed = BranchSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  if (session.user.organizationId) {
    const limit = await checkBranchLimit(session.user.organizationId);
    if (!limit.allowed) {
      return { error: { name: [`Branch limit reached (${limit.current}/${limit.max} on ${limit.plan} plan). Upgrade to add more branches.`] } };
    }
  }

  const branch = await db.branch.create({
    data: { ...parsed.data, organizationId: session.user.organizationId ?? undefined },
  });

  revalidatePath("/settings/branches");
  return { success: true, branch };
}

export async function updateBranch(id: string, data: z.infer<typeof BranchSchema>) {
  const session = await auth();
  if (!session?.user || session.user.role !== "BOSS") throw new Error("Forbidden");

  const parsed = BranchSchema.partial().safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const branch = await db.branch.findFirst({
    where: { id, organizationId: session.user.organizationId ?? "none" },
  });
  if (!branch) return { error: { _branch: ["Branch not found"] } };

  await db.branch.update({ where: { id }, data: parsed.data });
  revalidatePath("/settings/branches");
  return { success: true };
}

export async function toggleBranchActive(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user || session.user.role !== "BOSS") throw new Error("Forbidden");

  const branch = await db.branch.findFirst({
    where: { id, organizationId: session.user.organizationId ?? "none" },
  });
  if (!branch) throw new Error("Branch not found");

  await db.branch.update({ where: { id }, data: { isActive } });
  revalidatePath("/settings/branches");
  return { success: true };
}

export async function assignUserToBranch(userId: string, branchId: string | null) {
  const session = await auth();
  if (!session?.user || session.user.role !== "BOSS") throw new Error("Forbidden");

  const orgId = session.user.organizationId ?? "none";

  const target = await db.user.findFirst({ where: { id: userId, organizationId: orgId } });
  if (!target) throw new Error("User not found");

  if (branchId) {
    const branch = await db.branch.findFirst({ where: { id: branchId, organizationId: orgId } });
    if (!branch) throw new Error("Branch not found");
  }

  await db.user.update({ where: { id: userId }, data: { branchId } });
  revalidatePath("/settings/staff");
  revalidatePath("/settings/branches");
  return { success: true };
}

export async function switchActiveBranch(branchId: string | null) {
  const session = await auth();
  if (!session?.user || session.user.role !== "BOSS") throw new Error("Forbidden");

  const cookieStore = await cookies();
  if (branchId) {
    // Verify branch belongs to this organization
    const branch = await db.branch.findFirst({
      where: { id: branchId, organizationId: session.user.organizationId ?? undefined },
    });
    if (!branch) return;
    cookieStore.set("active_branch_id", branchId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
    });
  } else {
    cookieStore.delete("active_branch_id");
  }
}
