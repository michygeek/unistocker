import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Users — Admin" };
export const dynamic = "force-dynamic";

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  BOSS:    { bg: "rgba(13,148,136,0.15)", color: "#2DD4BF" },
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

  const COL = "rgba(255,255,255,0.35)";

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
          Users
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: COL }}>{users.length} total users</p>
      </div>

      <div style={{ background: "#0C1528", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 2fr 1fr 0.8fr 0.8fr 1fr",
          padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11, fontWeight: 700, color: COL, textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          <span>Name / Email</span>
          <span>Organization</span>
          <span>Role</span>
          <span>Branch</span>
          <span>Status</span>
          <span>Joined</span>
        </div>

        {users.map((user, i) => {
          const roleStyle = ROLE_STYLE[user.role] ?? ROLE_STYLE.STAFF;
          const isEven = i % 2 === 0;

          return (
            <div key={user.id} style={{
              display: "grid", gridTemplateColumns: "2fr 2fr 1fr 0.8fr 0.8fr 1fr",
              padding: "13px 18px", alignItems: "center",
              background: isEven ? "transparent" : "rgba(255,255,255,0.015)",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{user.name ?? "—"}</p>
                <p style={{ margin: 0, fontSize: 11, color: COL }}>{user.email}</p>
              </div>
              <span style={{ fontSize: 13, color: "#e2e8f0" }}>{user.organization?.name ?? "—"}</span>
              <span style={{ padding: "3px 9px", borderRadius: 99, background: roleStyle.bg, color: roleStyle.color, fontSize: 11, fontWeight: 700, width: "fit-content" }}>
                {user.role}
              </span>
              <span style={{ fontSize: 12, color: COL }}>{user.branch?.name ?? "—"}</span>
              <span style={{ padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, width: "fit-content",
                background: user.isActive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                color: user.isActive ? "#34d399" : "#f87171",
              }}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
              <span style={{ fontSize: 12, color: COL }}>
                {new Date(user.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
