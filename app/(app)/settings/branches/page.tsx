import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BranchManagement } from "@/components/settings/branch-management";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Branches" };
export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "BOSS") redirect("/settings");

  const orgId = session.user.organizationId ?? undefined;

  const [branches, staff, unreadCount] = await Promise.all([
    db.branch.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { users: true, products: true, sales: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.user.findMany({
      where: { organizationId: orgId, isSuperAdmin: false },
      select: { id: true, name: true, email: true, role: true, branchId: true },
      orderBy: { name: "asc" },
    }),
    db.notification.count({
      where: { userId: session.user.id, readAt: null, status: "SENT" },
    }),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header title="Branches" unreadCount={unreadCount} />
      <div className="animate-in" style={{ flex: 1, padding: "24px" }}>
        <BranchManagement branches={branches} staff={staff} />
      </div>
    </div>
  );
}
