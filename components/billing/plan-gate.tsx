"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { PLAN_BADGE, type PlanType } from "@/lib/plans";

interface Props {
  requiredPlan: PlanType;
  feature: string;
  children?: React.ReactNode;
}

export function PlanGate({ requiredPlan, feature, children }: Props) {
  if (children) {
    return <>{children}</>;
  }

  const badge = PLAN_BADGE[requiredPlan];

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: 320, padding: "40px 24px", textAlign: "center",
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 16, marginBottom: 20,
        background: `${badge.bg}`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Lock size={26} style={{ color: badge.color }} />
      </div>
      <span style={{ padding: "4px 14px", borderRadius: 99, background: badge.bg, color: badge.color, fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
        {badge.label} FEATURE
      </span>
      <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
        {feature}
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--text-muted)", maxWidth: 360 }}>
        This feature is available on the {requiredPlan === "PRO" ? "Pro" : "Business"} plan.
        Upgrade to unlock it — start with a 30-day free trial, no card required.
      </p>
      <Link
        href="/billing"
        style={{
          padding: "10px 22px", borderRadius: 10, textDecoration: "none",
          background: badge.color, color: "#fff", fontWeight: 700, fontSize: 14,
        }}
      >
        View Plans
      </Link>
    </div>
  );
}
