"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, CheckCircle, XCircle, Loader2, ShieldOff } from "lucide-react";
import { createStaffMember, updateStaffStatus } from "@/lib/actions/auth";
import { assignUserToBranch } from "@/lib/actions/branches";
import type { UserRole } from "@prisma/client";

interface StaffMember {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  branchId: string | null;
  branch: { name: string } | null;
}

interface BranchOption {
  id: string;
  name: string;
  isActive: boolean;
}

const ROLE_STYLE: Record<UserRole, { bg: string; color: string }> = {
  BOSS:    { bg: "rgba(168,85,247,0.10)",  color: "#c084fc" },
  MANAGER: { bg: "rgba(59,130,246,0.10)",  color: "var(--info)" },
  STAFF:   { bg: "rgba(100,116,139,0.10)", color: "var(--text-2)" },
};

export function StaffManagement({
  staff, currentUserId, currentUserRole, branches = [],
}: {
  staff: StaffMember[];
  currentUserId: string;
  currentUserRole: UserRole;
  branches?: BranchOption[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "STAFF" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleBranchAssign = async (userId: string, branchId: string | null) => {
    setLoading(`branch-${userId}`);
    await assignUserToBranch(userId, branchId);
    setLoading(null);
    router.refresh();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("create"); setError("");
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    const result = await createStaffMember(fd);
    setLoading(null);
    if ("error" in result) {
      setError(Object.values(result.error as Record<string, string[]>).flat()[0] ?? "Failed");
    } else {
      setShowForm(false);
      setFormData({ name: "", email: "", password: "", role: "STAFF" });
      router.refresh();
    }
  };

  const handleToggle = async (userId: string, isActive: boolean) => {
    setLoading(userId);
    await updateStaffStatus(userId, !isActive);
    setLoading(null);
    router.refresh();
  };

  const canToggle = (member: StaffMember) => {
    if (member.id === currentUserId) return false;
    if (currentUserRole === "MANAGER" && member.role === "BOSS") return false;
    return true;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Team Members</h2>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{staff.length} accounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="uni-btn uni-btn-primary"
        >
          <UserPlus size={15} /> Add Staff
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="uni-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
            Create New Staff Account
          </h3>
          {error && (
            <p style={{ fontSize: 13, color: "var(--danger)", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8, marginBottom: 16 }}>
              {error}
            </p>
          )}
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {([
                { key: "name",     label: "Full Name", type: "text",     placeholder: "e.g. John Doe" },
                { key: "email",    label: "Email",     type: "email",    placeholder: "staff@company.com" },
                { key: "password", label: "Password",  type: "password", placeholder: "Min. 8 characters" },
              ] as const).map((f) => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={formData[f.key]}
                    onChange={(e) => setFormData((p) => ({ ...p, [f.key]: e.target.value }))}
                    required
                    className="uni-input"
                  />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                  className="uni-input"
                >
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                  {currentUserRole === "BOSS" && <option value="BOSS">Boss</option>}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); }}
                className="uni-btn uni-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading === "create"}
                className="uni-btn uni-btn-primary"
              >
                {loading === "create"
                  ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                  : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff table */}
      <div className="uni-card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="uni-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Name</th>
                <th className="hidden sm:table-cell">Email</th>
                <th>Role</th>
                {branches.length > 0 && <th className="hidden md:table-cell">Branch</th>}
                <th className="hidden sm:table-cell">Status</th>
                <th style={{ textAlign: "right", paddingRight: 20 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => {
                const rs = ROLE_STYLE[member.role];
                return (
                  <tr key={member.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                          background: "linear-gradient(135deg, #0C973A, #0F172A)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 700 }}>
                            {(member.name ?? member.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {member.name ?? "—"}
                          </p>
                          <p className="sm:hidden" style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell" style={{ color: "var(--text-2)", fontSize: 13 }}>{member.email}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                        background: rs.bg, color: rs.color, letterSpacing: "0.03em",
                      }}>
                        {member.role}
                      </span>
                    </td>
                    {branches.length > 0 && (
                      <td className="hidden md:table-cell">
                        <select
                          value={member.branchId ?? ""}
                          disabled={loading === `branch-${member.id}`}
                          onChange={(e) => handleBranchAssign(member.id, e.target.value || null)}
                          className="uni-input"
                          style={{ fontSize: 12, padding: "4px 8px", minWidth: 140, opacity: loading === `branch-${member.id}` ? 0.5 : 1 }}
                        >
                          <option value="">No branch</option>
                          {branches.filter((b) => b.isActive).map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="hidden sm:table-cell">
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: member.isActive ? "var(--accent)" : "var(--text-3)" }}>
                        {member.isActive ? <CheckCircle size={13} /> : <XCircle size={13} />}
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", paddingRight: 20 }}>
                      {canToggle(member) ? (
                        <button
                          onClick={() => handleToggle(member.id, member.isActive)}
                          disabled={loading === member.id}
                          style={{
                            fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8,
                            border: "none", cursor: loading === member.id ? "not-allowed" : "pointer",
                            opacity: loading === member.id ? 0.5 : 1, transition: "all 0.15s",
                            background: member.isActive ? "rgba(239,68,68,0.10)" : "var(--accent-sub)",
                            color: member.isActive ? "var(--danger)" : "var(--accent)",
                          }}
                        >
                          {loading === member.id ? "…" : member.isActive ? "Deactivate" : "Activate"}
                        </button>
                      ) : member.role === "BOSS" && currentUserRole === "MANAGER" ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-3)" }}>
                          <ShieldOff size={12} />
                          <span className="hidden sm:inline">Protected</span>
                        </span>
                      ) : null}
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
