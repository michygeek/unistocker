"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Plus, Edit2, CheckCircle, XCircle, Loader2,
  Users, Package, ShoppingCart,
} from "lucide-react";
import { createBranch, updateBranch, toggleBranchActive, assignUserToBranch } from "@/lib/actions/branches";
import type { UserRole } from "@prisma/client";

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: { users: number; products: number; sales: number };
}

interface StaffMember {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  branchId: string | null;
}

interface Props {
  branches: Branch[];
  staff: StaffMember[];
}

const emptyForm = { name: "", address: "", phone: "" };

export function BranchManagement({ branches, staff }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const openCreate = () => {
    setEditBranch(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (b: Branch) => {
    setEditBranch(b);
    setForm({ name: b.name, address: b.address ?? "", phone: b.phone ?? "" });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("form");
    setFormError("");
    const data = {
      name: form.name,
      address: form.address || undefined,
      phone: form.phone || undefined,
    };
    const result = editBranch
      ? await updateBranch(editBranch.id, data)
      : await createBranch(data);
    setLoading(null);
    if ("error" in result) {
      const msgs = Object.values(result.error as Record<string, string[]>).flat();
      setFormError(msgs[0] ?? "Something went wrong");
      return;
    }
    setShowModal(false);
    router.refresh();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    setLoading(id);
    await toggleBranchActive(id, !isActive);
    setLoading(null);
    router.refresh();
  };

  const handleAssign = async (userId: string, branchId: string | null) => {
    setLoading(`assign-${userId}`);
    await assignUserToBranch(userId, branchId);
    setLoading(null);
    router.refresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Branch Locations</h2>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>
            {branches.length} location{branches.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={openCreate} className="uni-btn uni-btn-primary">
          <Plus size={15} /> New Branch
        </button>
      </div>

      {/* Branch cards */}
      {branches.length === 0 ? (
        <div className="uni-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <Building2 size={40} style={{ color: "var(--text-3)", margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)", margin: "0 0 4px" }}>No branches yet</p>
          <p style={{ fontSize: 13, color: "var(--text-3)", margin: "0 0 16px" }}>Add your first location to get started</p>
          <button onClick={openCreate} className="uni-btn uni-btn-primary">
            <Plus size={15} /> Add First Branch
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {branches.map((b) => (
            <div key={b.id} className="uni-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: b.isActive ? "var(--accent-sub)" : "rgba(100,116,139,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Building2 size={16} style={{ color: b.isActive ? "var(--accent)" : "var(--text-3)" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {b.name}
                    </p>
                    {b.address && (
                      <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.address}
                      </p>
                    )}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, flexShrink: 0,
                  background: b.isActive ? "rgba(13,148,136,0.12)" : "rgba(239,68,68,0.10)",
                  color: b.isActive ? "var(--accent)" : "var(--danger)",
                }}>
                  {b.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {b.phone && (
                <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>{b.phone}</p>
              )}

              {/* Stats row */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {([
                  { Icon: Users,        count: b._count.users,    label: "staff" },
                  { Icon: Package,      count: b._count.products, label: "products" },
                  { Icon: ShoppingCart, count: b._count.sales,    label: "sales" },
                ] as const).map(({ Icon, count, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Icon size={12} style={{ color: "var(--text-3)" }} />
                    <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{count}</span>
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <button
                  onClick={() => openEdit(b)}
                  className="uni-btn uni-btn-ghost"
                  style={{ fontSize: 12, padding: "5px 12px" }}
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => handleToggle(b.id, b.isActive)}
                  disabled={loading === b.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8,
                    border: "none", cursor: loading === b.id ? "not-allowed" : "pointer",
                    opacity: loading === b.id ? 0.5 : 1, transition: "all 0.15s",
                    background: b.isActive ? "rgba(239,68,68,0.10)" : "var(--accent-sub)",
                    color: b.isActive ? "var(--danger)" : "var(--accent)",
                  }}
                >
                  {loading === b.id
                    ? <Loader2 size={12} className="animate-spin" />
                    : b.isActive ? <XCircle size={12} /> : <CheckCircle size={12} />}
                  {b.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff assignment */}
      {staff.length > 0 && (
        <div className="uni-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={15} style={{ color: "var(--accent)" }} />
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>Staff Assignment</h3>
              <p style={{ fontSize: 12, color: "var(--text-3)", margin: "2px 0 0" }}>Assign staff members to their branch location</p>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="uni-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>Staff Member</th>
                  <th>Role</th>
                  <th style={{ paddingRight: 20, minWidth: 200 }}>Assigned Branch</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%",
                          background: "linear-gradient(135deg, #0D9488, #042F2E)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>
                            {(s.name ?? s.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                            {s.name ?? "—"}
                          </p>
                          <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                        background: "var(--bg-input)", color: "var(--text-2)",
                      }}>
                        {s.role}
                      </span>
                    </td>
                    <td style={{ paddingRight: 20 }}>
                      <select
                        value={s.branchId ?? ""}
                        disabled={loading === `assign-${s.id}`}
                        onChange={(e) => handleAssign(s.id, e.target.value || null)}
                        className="uni-input"
                        style={{ fontSize: 13, padding: "5px 10px", minWidth: 160, opacity: loading === `assign-${s.id}` ? 0.5 : 1 }}
                      >
                        <option value="">No branch</option>
                        {branches.filter((b) => b.isActive).map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowModal(false)}
          />
          <div className="uni-card" style={{ position: "relative", width: "100%", maxWidth: 440, padding: 24, zIndex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>
              {editBranch ? "Edit Branch" : "New Branch"}
            </h3>

            {formError && (
              <p style={{ fontSize: 13, color: "var(--danger)", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8, marginBottom: 16 }}>
                {formError}
              </p>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                  Branch Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Kado Market"
                  required
                  className="uni-input"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                  Address
                </label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="e.g. 12 Market Road, Kado, Abuja"
                  className="uni-input"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                  Phone
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g. +234 801 234 5678"
                  className="uni-input"
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="uni-btn uni-btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading === "form"} className="uni-btn uni-btn-primary">
                  {loading === "form"
                    ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                    : editBranch ? "Save Changes" : "Create Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
