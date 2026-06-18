import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { OfflineBanner } from "@/components/offline/offline-banner";
import { db } from "@/lib/db";
import { getOrgSubscription } from "@/lib/subscription";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if (session.user.isSuperAdmin) redirect("/admin");

  const cookieStore = await cookies();
  const orgId = session.user.organizationId ?? undefined;

  const [unreadCount, branches, subscription] = await Promise.all([
    db.notification.count({
      where: { userId: session.user.id, readAt: null, status: "SENT" },
    }),
    session.user.role === "BOSS"
      ? db.branch.findMany({
          where: { organizationId: orgId },
          select: { id: true, name: true, isActive: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    orgId ? getOrgSubscription(orgId) : Promise.resolve(null),
  ]);

  // Validate the stored branch cookie — clear it if the branch is no longer active
  const rawBranchId = cookieStore.get("active_branch_id")?.value ?? null;
  const activeBranchId = branches.find((b) => b.id === rawBranchId && b.isActive)?.id ?? null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>
      <Sidebar
        userRole={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email ?? undefined}
        organizationName={session.user.organizationName}
        unreadCount={unreadCount}
        branches={branches}
        activeBranchId={activeBranchId}
        plan={subscription?.plan ?? "FREE"}
      />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col min-w-0">{children}</main>
      <OfflineBanner />
    </div>
  );
}
