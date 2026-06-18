import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { StaffManagement } from "@/components/settings/staff-management";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Staff Management" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role === "STAFF") redirect("/settings");

  const orgId = session.user.organizationId;

  const [staff, branches] = await Promise.all([
    db.user.findMany({
      where: { organizationId: orgId ?? "none", isSuperAdmin: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, createdAt: true, branchId: true,
        branch: { select: { name: true } },
      },
    }),
    session.user.role === "BOSS"
      ? db.branch.findMany({
          where: { organizationId: session.user.organizationId ?? undefined, isActive: true },
          select: { id: true, name: true, isActive: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header title="Staff Management" />
      <div className="animate-in" style={{ flex: 1, padding: "24px" }}>
        <StaffManagement
          staff={staff}
          currentUserId={session.user.id}
          currentUserRole={session.user.role}
          branches={branches}
        />
      </div>
    </div>
  );
}
