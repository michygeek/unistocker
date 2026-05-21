import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { db } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, readAt: null, status: "SENT" },
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>
      <Sidebar
        userRole={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email ?? undefined}
        organizationName={session.user.organizationName}
        unreadCount={unreadCount}
      />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col min-w-0">{children}</main>
    </div>
  );
}
