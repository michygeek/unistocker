import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) redirect("/auth/login");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>
      <AdminSidebar adminEmail={session.user.email ?? ""} />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col min-w-0">{children}</main>
    </div>
  );
}
