"use client";

import { useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, Loader2, RefreshCw, Zap } from "lucide-react";
import Link from "next/link";

interface PredictionRow {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  currentStock: number;
  dailyVelocity: number;
  daysUntilStockout: number;
  predictedStockoutDate: string;
  urgencyLevel: string;
  suggestedReorderLevel: number | null;
  reorderLevelReason: string | null;
  lowStockAlert: number;
}

type Tab = "all" | "critical" | "warning" | "watch";

const URGENCY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  CRITICAL: { bg: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "rgba(239,68,68,0.25)" },
  WARNING:  { bg: "rgba(245,158,11,0.08)", color: "var(--warning)", border: "rgba(245,158,11,0.25)" },
  WATCH:    { bg: "rgba(59,130,246,0.08)", color: "var(--info)", border: "rgba(59,130,246,0.25)" },
  HEALTHY:  { bg: "var(--accent-sub)", color: "var(--accent)", border: "var(--accent-glow)" },
};

export function StockAlertsView({ predictions: initial }: { predictions: PredictionRow[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const [predictions, setPredictions] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      await fetch("/api/ai/stock-prediction", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const updateReorderLevel = async (productId: string, level: number) => {
    setUpdatingId(productId);
    try {
      await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lowStockAlert: level }),
      });
      window.location.reload();
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = predictions.filter((p) => {
    if (tab === "all") return true;
    return p.urgencyLevel === tab.toUpperCase();
  });

  const counts = {
    all: predictions.length,
    critical: predictions.filter((p) => p.urgencyLevel === "CRITICAL").length,
    warning: predictions.filter((p) => p.urgencyLevel === "WARNING").length,
    watch: predictions.filter((p) => p.urgencyLevel === "WATCH").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Smart Stock Alerts</h2>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>AI-powered stockout predictions and reorder recommendations</p>
        </div>
        <button onClick={refresh} disabled={loading} className="uni-btn uni-btn-primary" style={{ fontSize: 13 }}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {loading ? "Analysing…" : "Refresh Predictions"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--bg-input)", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(["all", "critical", "warning", "watch"] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = {
            all: `All · ${counts.all}`,
            critical: `Critical · ${counts.critical}`,
            warning: `Warning · ${counts.warning}`,
            watch: `Watch · ${counts.watch}`,
          };
          const activeColors: Record<Tab, string> = { all: "var(--text)", critical: "var(--danger)", warning: "var(--warning)", watch: "var(--info)" };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                background: tab === t ? "var(--bg-card)" : "transparent",
                color: tab === t ? activeColors[t] : "var(--text-2)",
                boxShadow: tab === t ? "var(--shadow)" : "none",
                transition: "all 0.15s",
              }}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="uni-card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>No predictions in this category. Click "Refresh Predictions" to run AI analysis.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((p) => {
            const st = URGENCY_STYLE[p.urgencyLevel] ?? URGENCY_STYLE.HEALTHY;
            return (
              <div key={p.id} className="uni-card" style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Link href={`/inventory/${p.productId}`} style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textDecoration: "none" }}>
                        {p.productName}
                      </Link>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 8,
                        background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                      }}>
                        {p.urgencyLevel}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-3)", margin: "0 0 8px" }}>SKU: {p.productSku}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                      <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                        <strong style={{ color: "var(--text)" }}>{p.currentStock}</strong> units in stock
                      </span>
                      <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                        Selling <strong style={{ color: "var(--text)" }}>{p.dailyVelocity.toFixed(1)}</strong> units/day
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: st.color }}>
                        Runs out in {Math.round(p.daysUntilStockout)} days
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, marginBottom: 0 }}>
                      Predicted stockout: {format(new Date(p.predictedStockoutDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    {p.suggestedReorderLevel !== null && p.suggestedReorderLevel !== p.lowStockAlert && (
                      <div style={{
                        padding: "8px 12px", borderRadius: 10, background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.25)", maxWidth: 260,
                      }}>
                        <p style={{ fontSize: 12, color: "var(--warning)", fontWeight: 600, margin: "0 0 4px" }}>
                          AI suggests reorder level should be {p.suggestedReorderLevel}
                        </p>
                        {p.reorderLevelReason && (
                          <p style={{ fontSize: 11, color: "var(--text-2)", margin: "0 0 6px" }}>{p.reorderLevelReason}</p>
                        )}
                        <button
                          onClick={() => updateReorderLevel(p.productId, p.suggestedReorderLevel!)}
                          disabled={updatingId === p.productId}
                          className="uni-btn uni-btn-ghost"
                          style={{ fontSize: 12, padding: "4px 10px", width: "100%" }}
                        >
                          {updatingId === p.productId ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                          Update
                        </button>
                      </div>
                    )}
                    <Link href={`/inventory/${p.productId}`} className="uni-btn uni-btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }}>
                      <AlertTriangle size={12} /> View Product
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
