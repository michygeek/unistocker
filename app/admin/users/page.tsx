import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Users — Admin" };
export const dynamic = "force-dynamic";

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  BOSS:    { bg: "rgba(12,151,58,0.15)", color: "#64ED80" },
  MANAGER: { bg: "rgba(168,85,247,0.15)", color: "#c084fc" },
  STAFF:   { bg: "rgba(100,116,139,0.15)",color: "#94a3b8" },
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) redirect("/auth/login");

  const users = await db.user.findMany({
    where: { isSuperAdmin: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
      organization: { select: { name: true } },
      branch: { select: { name: true } },
    },
  });

  return (
    <div style={{ flex: 1, padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="lg:ml-0" style={{ margin: "0 0 4px", marginLeft: 48, fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
          Users
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)" }}>{users.length} total users</p>
      </div>

      <div className="uni-card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="uni-table">
            <thead>
              <tr>
                <th>Name / Email</th>
                <th>Organization</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const roleStyle = ROLE_STYLE[user.role] ?? ROLE_STYLE.STAFF;

                return (
                  <tr key={user.id}>
                    <td>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{user.name ?? "—"}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-3)" }}>{user.email}</p>
                    </td>
                    <td style={{ color: "var(--text)" }}>{user.organization?.name ?? "—"}</td>
                    <td>
                      <span style={{ padding: "3px 9px", borderRadius: 99, background: roleStyle.bg, color: roleStyle.color, fontSize: 11, fontWeight: 700 }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-3)" }}>{user.branch?.name ?? "—"}</td>
                    <td>
                      <span style={{
                        padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: user.isActive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                        color: user.isActive ? "#34d399" : "#f87171",
                      }}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-3)" }}>
                      {new Date(user.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
