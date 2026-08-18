"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Search, ToggleLeft, Trash2 } from "lucide-react";
import { PLAN_BADGE } from "@/lib/plans";
import { adminSetPlan, adminToggleOrg, adminDeleteOrg } from "@/lib/actions/admin";

interface Org {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
  } | null;
  _count: { users: number; products: number; sales: number; branches: number };
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE:    { bg: "rgba(16,185,129,0.15)", color: "#34d399", label: "Active" },
  TRIAL:     { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", label: "Trial" },
  EXPIRED:   { bg: "rgba(239,68,68,0.15)",  color: "#f87171", label: "Expired" },
  CANCELLED: { bg: "rgba(100,116,139,0.15)",color: "#94a3b8", label: "Cancelled" },
};

function PlanPicker({ orgId, current }: { orgId: string; current: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function set(plan: "FREE" | "BUSINESS" | "ENTERPRISE", status: "ACTIVE" | "TRIAL") {
    setOpen(false);
    startTransition(async () => {
      await adminSetPlan(orgId, plan, status);
      router.refresh();
    });
  }

  const badge = PLAN_BADGE[current as keyof typeof PLAN_BADGE] ?? PLAN_BADGE.FREE;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        disabled={pending}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 99, border: `1px solid ${badge.color}33`,
          background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 800,
          cursor: "pointer",
        }}
      >
        {pending ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : null}
        {current}
        <ChevronDown size={10} />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div className="uni-card" style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
            padding: 6, minWidth: 180, boxShadow: "var(--shadow-lg)",
          }}>
            {([
              { plan: "FREE",       status: "ACTIVE", label: "Free — Downgrade" },
              { plan: "BUSINESS",   status: "ACTIVE", label: "Business — Activate" },
              { plan: "BUSINESS",   status: "TRIAL",  label: "Business — Start Trial" },
              { plan: "ENTERPRISE", status: "ACTIVE", label: "Enterprise — Activate" },
              { plan: "ENTERPRISE", status: "TRIAL",  label: "Enterprise — Start Trial" },
            ] as const).map((opt) => {
              const b = PLAN_BADGE[opt.plan];
              return (
                <button
                  key={`${opt.plan}_${opt.status}`}
                  onClick={() => set(opt.plan, opt.status === "ACTIVE" ? "ACTIVE" : "TRIAL")}
                  className="plan-opt"
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 8, border: "none",
                    background: "transparent", cursor: "pointer", textAlign: "left",
                    color: b.color, fontSize: 12, fontWeight: 600,
                    transition: "background 0.1s",
                  }}
                >
                  <span style={{ fontWeight: 800 }}>{opt.plan}</span>
                  <span style={{ color: "var(--text-3)", fontSize: 11 }}>{opt.status}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .plan-opt:hover { background: var(--bg-input) !important; }
      `}</style>
    </div>
  );
}

export function OrgTable({ orgs }: { orgs: Org[] }) {
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  );

  function toggleOrg(orgId: string, currentlyActive: boolean) {
    setTogglingId(orgId);
    startTransition(async () => {
      await adminToggleOrg(orgId, !currentlyActive);
      setTogglingId(null);
      router.refresh();
    });
  }

  function deleteOrg(orgId: string) {
    setDeletingId(orgId);
    setConfirmDeleteId(null);
    startTransition(async () => {
      await adminDeleteOrg(orgId);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div>
      <div style={{ marginBottom: 16, position: "relative", maxWidth: 320 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search organizations..."
          className="uni-input"
          style={{ paddingLeft: 34 }}
        />
      </div>

      <div className="uni-card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="uni-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Users</th>
                <th>Products</th>
                <th>Sales</th>
                <th>Branches</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "var(--text-3)" }}>No organizations found</td>
                </tr>
              ) : filtered.map((org) => {
                const plan = (org.subscription?.plan ?? "FREE") as keyof typeof PLAN_BADGE;
                const status = org.subscription?.status ?? "ACTIVE";
                const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.ACTIVE;

                return (
                  <tr key={org.id}>
                    <td>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{org.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-3)" }}>{org.slug}</p>
                    </td>
                    <td><PlanPicker orgId={org.id} current={plan} /></td>
                    <td>
                      <span style={{ padding: "3px 9px", borderRadius: 99, background: statusStyle.bg, color: statusStyle.color, fontSize: 11, fontWeight: 700 }}>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{org._count.users}</td>
                    <td style={{ fontWeight: 600 }}>{org._count.products}</td>
                    <td style={{ fontWeight: 600 }}>{org._count.sales}</td>
                    <td style={{ fontWeight: 600 }}>{org._count.branches}</td>
                    <td style={{ fontSize: 12, color: "var(--text-3)" }}>
                      {new Date(org.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                          title="Toggle all users active/inactive"
                          onClick={() => toggleOrg(org.id, true)}
                          disabled={!!pending || togglingId === org.id}
                          className="uni-btn uni-btn-ghost"
                          style={{ padding: "5px 10px", fontSize: 11, gap: 5 }}
                        >
                          {togglingId === org.id
                            ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                            : <ToggleLeft size={14} />}
                          Disable
                        </button>

                        {confirmDeleteId === org.id ? (
                          <>
                            <button
                              onClick={() => deleteOrg(org.id)}
                              disabled={deletingId === org.id}
                              className="uni-btn uni-btn-danger"
                              style={{ padding: "5px 10px", fontSize: 11, gap: 4 }}
                            >
                              {deletingId === org.id
                                ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                                : null}
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="uni-btn uni-btn-ghost"
                              style={{ padding: "5px 8px", fontSize: 11 }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            title="Permanently delete organization and all data"
                            onClick={() => setConfirmDeleteId(org.id)}
                            disabled={!!pending || deletingId === org.id}
                            className="uni-btn uni-btn-danger"
                            style={{ padding: "5px 10px", fontSize: 11, gap: 4, background: "transparent", color: "rgba(239,68,68,0.75)" }}
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
