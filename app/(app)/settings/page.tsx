import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true, role: true, createdAt: true,
      branch: { select: { name: true } },
      organization: { select: { name: true } },
    },
  });

  const roleBg: Record<string, string> = {
    BOSS: "rgba(168,85,247,0.10)", MANAGER: "rgba(59,130,246,0.10)", STAFF: "rgba(100,116,139,0.10)",
  };
  const roleColor: Record<string, string> = {
    BOSS: "#c084fc", MANAGER: "var(--info)", STAFF: "var(--text-2)",
  };
  const role = user?.role ?? "STAFF";

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header title="My Account" />
      <div className="animate-in" style={{ flex: 1, padding: "24px", maxWidth: 640 }}>
        <div className="uni-card" style={{ overflow: "hidden" }}>
          {/* Card header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>My Account</h2>
          </div>

          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Profile banner */}
            <div style={{
              display: "flex", alignItems: "center", gap: 16, padding: 16,
              background: "var(--accent-sub)", borderRadius: 12,
              border: "1px solid var(--accent-glow)",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                background: "linear-gradient(135deg, #0D9488, #042F2E)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 800 }}>
                  {(user?.name ?? user?.email ?? "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.name ?? "—"}
                </p>
                <p style={{ fontSize: 13, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                    background: roleBg[role], color: roleColor[role],
                  }}>
                    {role}
                  </span>
                  {user?.organization?.name && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6,
                      background: "var(--bg-input)", color: "var(--text-2)",
                    }}>
                      {user.organization.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Name",         value: user?.name ?? "—" },
                { label: "Email",        value: user?.email ?? "—" },
                { label: "Organization", value: user?.organization?.name ?? "—" },
                { label: "Role",         value: user?.role ?? "—" },
                { label: "Branch",       value: user?.branch?.name ?? "All branches" },
              ].map((f) => (
                <div key={f.label} style={{
                  padding: "12px 14px",
                  background: "var(--bg-input)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                }}>
                  <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {f.label}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
