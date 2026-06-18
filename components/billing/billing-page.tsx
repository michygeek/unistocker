"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Sparkles, Crown, Zap, Clock, AlertCircle, Loader2 } from "lucide-react";
import { PLANS, PLAN_BADGE, type PlanType } from "@/lib/plans";
import { startTrial, initializePayment, cancelSubscription } from "@/lib/actions/billing";
import type { OrgSubscription } from "@/lib/subscription";

interface UsageData {
  products: { used: number; max: number };
  staff: { used: number; max: number };
  branches: { used: number; max: number };
}

interface Props {
  subscription: OrgSubscription;
  usage: UsageData;
  successParam?: boolean;
  errorParam?: string;
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max === Infinity ? 0 : Math.min(100, (used / max) * 100);
  const almostFull = max !== Infinity && pct >= 80;
  const full = max !== Infinity && used >= max;
  const barColor = full ? "#ef4444" : almostFull ? "#f59e0b" : "#0D9488";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)", marginBottom: 5 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: full ? "#ef4444" : "var(--text-primary)" }}>
          {used} / {max === Infinity ? "∞" : max}
        </span>
      </div>
      {max !== Infinity && (
        <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 99, transition: "width 0.4s" }} />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ subscription }: { subscription: OrgSubscription }) {
  const { plan, status, trialDaysLeft } = subscription;
  const badge = PLAN_BADGE[plan];

  if (status === "TRIAL") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: 12, fontWeight: 700 }}>
        <Clock size={11} />
        Trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left
      </span>
    );
  }
  if (status === "EXPIRED") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: 12, fontWeight: 700 }}>
        <AlertCircle size={11} />
        Expired
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: badge.bg, color: badge.color, fontSize: 12, fontWeight: 700 }}>
      {badge.label}
    </span>
  );
}

export function BillingPage({ subscription, usage, successParam, errorParam }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    successParam ? { type: "success", message: "Payment successful! Your plan is now active." }
    : errorParam ? { type: "error", message: errorParam === "payment_failed" ? "Payment was not completed." : errorParam === "no_reference" ? "Invalid payment reference." : "Something went wrong." }
    : null
  );

  function act(key: string, fn: () => Promise<void>) {
    setLoadingAction(key);
    setFeedback(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setFeedback({ type: "error", message: (e as Error).message ?? "Something went wrong" });
      } finally {
        setLoadingAction(null);
      }
    });
  }

  async function handleStartTrial(plan: "PRO" | "BUSINESS") {
    act(`trial_${plan}`, async () => {
      const res = await startTrial(plan);
      if ("error" in res) { setFeedback({ type: "error", message: res.error ?? "Something went wrong" }); return; }
      setFeedback({ type: "success", message: `Your 30-day ${plan} trial has started!` });
      router.refresh();
    });
  }

  async function handlePay(plan: "PRO" | "BUSINESS") {
    act(`pay_${plan}`, async () => {
      const res = await initializePayment(plan);
      if ("error" in res) { setFeedback({ type: "error", message: res.error ?? "Something went wrong" }); return; }
      window.location.href = res.url!;
    });
  }

  async function handleCancel() {
    if (!confirm("Cancel your subscription? You will be downgraded to the Free plan immediately.")) return;
    act("cancel", async () => {
      await cancelSubscription();
      setFeedback({ type: "success", message: "Subscription cancelled. You are now on the Free plan." });
      router.refresh();
    });
  }

  const { plan, status } = subscription;
  const isOnPaidOrTrial = plan !== "FREE" || status === "TRIAL";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 4px" }}>

      {/* Banner */}
      {feedback && (
        <div style={{
          marginBottom: 20, padding: "12px 16px", borderRadius: 12,
          background: feedback.type === "success" ? "rgba(13,148,136,0.12)" : "rgba(239,68,68,0.12)",
          border: `1px solid ${feedback.type === "success" ? "rgba(13,148,136,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: feedback.type === "success" ? "#0D9488" : "#f87171",
          display: "flex", alignItems: "center", gap: 8, fontSize: 14,
        }}>
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {feedback.message}
        </div>
      )}

      {/* Current Plan Card */}
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16,
        padding: "20px 24px", marginBottom: 28,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
              Your Plan
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
                {PLANS.find(p => p.id === plan)?.name ?? plan}
              </span>
              <StatusBadge subscription={subscription} />
            </div>
          </div>
          {isOnPaidOrTrial && (
            <button
              onClick={handleCancel}
              disabled={isPending}
              style={{
                padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-muted)", fontSize: 13,
                cursor: "pointer", fontWeight: 500,
              }}
            >
              {loadingAction === "cancel" ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : "Cancel plan"}
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          <UsageBar label="Products" used={usage.products.used} max={usage.products.max} />
          <UsageBar label="Staff accounts" used={usage.staff.used} max={usage.staff.max} />
          <UsageBar label="Branch locations" used={usage.branches.used} max={usage.branches.max} />
        </div>
      </div>

      {/* Plan Cards */}
      <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
        All Plans
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 18 }}>
        {PLANS.map((p) => {
          const isCurrent = p.id === plan && (p.id === "FREE" ? status !== "TRIAL" : true);
          const badge = PLAN_BADGE[p.id];
          const canTrial = p.id !== "FREE" && plan === "FREE" && status !== "TRIAL";
          const isTrialOfThis = status === "TRIAL" && plan === p.id;
          const PlanIcon = p.id === "BUSINESS" ? Crown : p.id === "PRO" ? Sparkles : Zap;

          return (
            <div
              key={p.id}
              style={{
                background: "var(--card)", borderRadius: 16,
                border: isCurrent || isTrialOfThis
                  ? `2px solid ${p.color}`
                  : "1px solid var(--border)",
                padding: "22px 20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {(isCurrent || isTrialOfThis) && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  padding: "3px 10px", borderRadius: 99, background: badge.bg,
                  color: badge.color, fontSize: 11, fontWeight: 700,
                }}>
                  {isTrialOfThis ? "TRIAL ACTIVE" : "CURRENT PLAN"}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${p.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PlanIcon size={18} style={{ color: p.color }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{p.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>{p.tagline}</p>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>{p.priceLabel}</span>
                {p.price > 0 && <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 4 }}>/month</span>}
                {p.features.trialDays > 0 && (
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#0D9488" }}>30-day free trial — no card required</p>
                )}
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 7 }}>
                {p.highlights.map((h) => (
                  <li key={h} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                    <CheckCircle2 size={14} style={{ color: p.color, flexShrink: 0, marginTop: 1 }} />
                    {h}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {p.id === "FREE" ? (
                <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>
                  Always free
                </div>
              ) : canTrial ? (
                <button
                  onClick={() => handleStartTrial(p.id as "PRO" | "BUSINESS")}
                  disabled={isPending}
                  style={{
                    width: "100%", padding: "10px", borderRadius: 10, border: "none",
                    background: p.color, color: "#fff", fontSize: 14, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  }}
                >
                  {loadingAction === `trial_${p.id}` ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  Start 30-day free trial
                </button>
              ) : isTrialOfThis ? (
                <button
                  onClick={() => handlePay(p.id as "PRO" | "BUSINESS")}
                  disabled={isPending}
                  style={{
                    width: "100%", padding: "10px", borderRadius: 10, border: "none",
                    background: p.color, color: "#fff", fontSize: 14, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  }}
                >
                  {loadingAction === `pay_${p.id}` ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  Pay ₦{p.price.toLocaleString()}/month
                </button>
              ) : isCurrent ? (
                <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>
                  Active plan
                </div>
              ) : (
                <button
                  onClick={() => handlePay(p.id as "PRO" | "BUSINESS")}
                  disabled={isPending}
                  style={{
                    width: "100%", padding: "10px", borderRadius: 10,
                    border: `1.5px solid ${p.color}`,
                    background: "transparent", color: p.color, fontSize: 14, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  }}
                >
                  {loadingAction === `pay_${p.id}` ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  Subscribe — ₦{p.price.toLocaleString()}/month
                </button>
              )}
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
