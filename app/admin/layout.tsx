import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) redirect("/auth/login");

  return (
    <div style={{ minHeight: "100vh", background: "#080D18", display: "flex" }}>
      <AdminSidebar adminEmail={session.user.email ?? ""} />
      <main style={{ flex: 1, marginLeft: 240, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}
