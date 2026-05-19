"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, CheckCircle, XCircle, Loader2, ShieldOff } from "lucide-react";
import { createStaffMember, updateStaffStatus } from "@/lib/actions/auth";
import type { UserRole } from "@prisma/client";

interface StaffMember {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  branch: { name: string } | null;
}

const ROLE_COLORS: Record<UserRole, string> = {
  BOSS:    "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  MANAGER: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  STAFF:   "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const INPUT = "w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2EBD78] placeholder-gray-400 dark:placeholder-gray-500";

export function StaffManagement({
  staff,
  currentUserId,
  currentUserRole,
}: {
  staff: StaffMember[];
  currentUserId: string;
  currentUserRole: UserRole;
}) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "STAFF" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("create");
    setError("");
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
    if (member.id === currentUserId) return false;          // can't toggle yourself
    if (currentUserRole === "MANAGER" && member.role === "BOSS") return false; // manager can't touch boss
    return true;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{staff.length} accounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition"
          style={{ background: "#2EBD78" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#22A865")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#2EBD78")}
        >
          <UserPlus size={16} /> Add Staff
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Create New Staff Account</h3>
          {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              { key: "name",     label: "Full Name", type: "text",     placeholder: "e.g. John Doe" },
              { key: "email",    label: "Email",     type: "email",    placeholder: "staff@company.com" },
              { key: "password", label: "Password",  type: "password", placeholder: "Min. 8 characters" },
            ] as const).map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={formData[f.key]}
                  onChange={(e) => setFormData((p) => ({ ...p, [f.key]: e.target.value }))}
                  required
                  className={INPUT}
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                className={INPUT}
              >
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
                {/* Only a BOSS can create another BOSS */}
                {currentUserRole === "BOSS" && <option value="BOSS">Boss</option>}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); }}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading === "create"}
              className="px-4 py-2 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 disabled:opacity-70"
              style={{ background: "#2EBD78" }}
            >
              {loading === "create"
                ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                : "Create Account"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                <th className="text-left px-4 sm:px-6 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                <th className="text-right px-4 sm:px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "linear-gradient(135deg, #2EBD78, #1B3D4F)" }}
                      >
                        <span className="text-white text-xs font-bold">
                          {(member.name ?? member.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-gray-900 dark:text-white block truncate">{member.name ?? "—"}</span>
                        <span className="text-xs text-gray-400 truncate block sm:hidden">{member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-500 dark:text-gray-400 text-sm hidden sm:table-cell">{member.email}</td>
                  <td className="px-4 py-3 sm:py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${ROLE_COLORS[member.role]}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${member.isActive ? "text-green-600" : "text-gray-400"}`}>
                      {member.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                    {canToggle(member) ? (
                      <button
                        onClick={() => handleToggle(member.id, member.isActive)}
                        disabled={loading === member.id}
                        className={`text-xs px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50 ${
                          member.isActive
                            ? "bg-red-50 dark:bg-red-900/30 text-red-600 hover:bg-red-100"
                            : "bg-green-50 dark:bg-green-900/30 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {loading === member.id ? "…" : member.isActive ? "Deactivate" : "Activate"}
                      </button>
                    ) : member.role === "BOSS" && currentUserRole === "MANAGER" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600">
                        <ShieldOff size={12} /> <span className="hidden sm:inline">Protected</span>
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
