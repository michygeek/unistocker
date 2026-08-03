"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, ToggleLeft, Trash2 } from "lucide-react";
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
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
            background: "#0C1528", border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 12, padding: 6, minWidth: 180,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
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
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 8, border: "none",
                    background: "transparent", cursor: "pointer", textAlign: "left",
                    color: b.color, fontSize: 12, fontWeight: 600,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontWeight: 800 }}>{opt.plan}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{opt.status}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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

  const COL = "rgba(255,255,255,0.35)";

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search organizations..."
          style={{
            width: "100%", maxWidth: 320, padding: "9px 14px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)", background: "#0C1528",
            color: "#e2e8f0", fontSize: 13, outline: "none",
          }}
        />
      </div>

      <div style={{ background: "#0C1528", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "1.8fr 0.8fr 0.8fr 0.5fr 0.5fr 0.5fr 0.5fr 1fr 1fr",
          padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11, fontWeight: 700, color: COL, textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          <span>Organization</span>
          <span>Plan</span>
          <span>Status</span>
          <span>Users</span>
          <span>Products</span>
          <span>Sales</span>
          <span>Branches</span>
          <span>Joined</span>
          <span>Actions</span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: COL, fontSize: 14 }}>No organizations found</div>
        ) : filtered.map((org, i) => {
          const plan = (org.subscription?.plan ?? "FREE") as keyof typeof PLAN_BADGE;
          const status = org.subscription?.status ?? "ACTIVE";
          const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.ACTIVE;
          const isEven = i % 2 === 0;

          return (
            <div key={org.id} style={{
              display: "grid", gridTemplateColumns: "1.8fr 0.8fr 0.8fr 0.5fr 0.5fr 0.5fr 0.5fr 1fr 1fr",
              padding: "13px 18px", alignItems: "center",
              background: isEven ? "transparent" : "rgba(255,255,255,0.015)",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{org.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: COL }}>{org.slug}</p>
              </div>
              <div>
                <PlanPicker orgId={org.id} current={plan} />
              </div>
              <div>
                <span style={{ padding: "3px 9px", borderRadius: 99, background: statusStyle.bg, color: statusStyle.color, fontSize: 11, fontWeight: 700 }}>
                  {statusStyle.label}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{org._count.users}</span>
              <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{org._count.products}</span>
              <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{org._count.sales}</span>
              <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{org._count.branches}</span>
              <span style={{ fontSize: 12, color: COL }}>
                {new Date(org.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  title="Toggle all users active/inactive"
                  onClick={() => toggleOrg(org.id, true)}
                  disabled={!!pending || togglingId === org.id}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "5px 10px", borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent", color: "rgba(255,255,255,0.5)",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}
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
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "5px 10px", borderRadius: 8,
                        border: "1px solid rgba(239,68,68,0.5)",
                        background: "rgba(239,68,68,0.15)", color: "#f87171",
                        fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {deletingId === org.id
                        ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                        : null}
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      style={{
                        padding: "5px 8px", borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "transparent", color: "rgba(255,255,255,0.4)",
                        fontSize: 11, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    title="Permanently delete organization and all data"
                    onClick={() => setConfirmDeleteId(org.id)}
                    disabled={!!pending || deletingId === org.id}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "5px 10px", borderRadius: 8,
                      border: "1px solid rgba(239,68,68,0.25)",
                      background: "transparent", color: "rgba(239,68,68,0.7)",
                      fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
