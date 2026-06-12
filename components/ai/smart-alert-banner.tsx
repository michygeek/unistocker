"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface Props {
  criticalCount: number;
}

export function SmartAlertBanner({ criticalCount }: Props) {
  if (criticalCount === 0) return null;
  return (
    <Link
      href="/dashboard/ai/stock-alerts"
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 18px", borderRadius: 10, textDecoration: "none",
        background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)",
        transition: "all 0.15s",
      }}
    >
      <AlertTriangle size={16} style={{ color: "var(--danger)", flexShrink: 0 }} />
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)", margin: 0 }}>
        {criticalCount} product{criticalCount !== 1 ? "s" : ""} will run out within 48 hours — View Now
      </p>
    </Link>
  );
}
