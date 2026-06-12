"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Lightbulb, ChevronDown, ChevronUp, RefreshCw, Loader2 } from "lucide-react";

interface WeeklyInsight {
  id: string;
  weekOf: string;
  summary: string;
  topProducts: Array<{ name: string; revenue: number; units: number }>;
  alerts: Array<{ type: string; message: string }>;
  highlights: Array<{ metric: string; value: string; trend: "up" | "down" | "stable" }>;
  createdAt: string;
}

interface Props {
  insight?: WeeklyInsight | null;
}

export function WeeklyInsightCard({ insight: initial }: Props) {
  const [insight, setInsight] = useState<WeeklyInsight | null>(initial ?? null);
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/insights/weekly", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      if (res.ok && data.insight) setInsight(data.insight);
    } finally {
      setGenerating(false);
    }
  };

  const today = new Date();
  const isMonday = today.getDay() === 1;

  if (!insight && !isMonday) return null;

  const weekOf = insight ? new Date(insight.weekOf) : today;
  const topProduct = (insight?.topProducts as Array<{ name: string; revenue: number; units: number }>)?.[0];
  const criticalAlert = (insight?.alerts as Array<{ type: string; message: string }>)?.find((a) => a.type === "CRITICAL" || a.type === "warning");

  return (
    <div className="uni-card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Lightbulb size={15} style={{ color: "#f59e0b" }} />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>
            Your Week in Review — {format(weekOf, "MMM d")}–{format(new Date(weekOf.getTime() + 6 * 86400000), "MMM d, yyyy")}
          </h2>
        </div>
        <button onClick={generate} disabled={generating} className="uni-btn uni-btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}>
          {generating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {generating ? "Generating…" : insight ? "Regenerate" : "Generate"}
        </button>
      </div>

      {!insight ? (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>No weekly report yet. Click Generate to create one.</p>
        </div>
      ) : (
        <div style={{ padding: 20 }}>
          {/* 3 highlight stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {((insight.highlights as Array<{ metric: string; value: string; trend: string }>) ?? []).slice(0, 3).map((h) => (
              <div key={h.metric} style={{ padding: "10px 14px", background: "var(--bg-input)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h.metric}</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: 0 }}>{h.value}</p>
                {h.trend && (
                  <p style={{ fontSize: 11, margin: 0, color: h.trend === "up" ? "#22c55e" : h.trend === "down" ? "var(--danger)" : "var(--text-3)" }}>
                    {h.trend === "up" ? "▲" : h.trend === "down" ? "▼" : "—"}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Headline stats */}
          {topProduct && (
            <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 8 }}>
              Top product: <strong style={{ color: "var(--text)" }}>{topProduct.name}</strong>
              {criticalAlert && <> · <span style={{ color: "var(--danger)", fontWeight: 600 }}>{criticalAlert.message}</span></>}
            </p>
          )}

          {/* Summary preview */}
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 10 }}>
            {expanded ? insight.summary : insight.summary.slice(0, 200) + (insight.summary.length > 200 ? "…" : "")}
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, padding: 0 }}
          >
            {expanded ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> View Full Report</>}
          </button>

          {expanded && (
            <>
              {/* Top products table */}
              <div style={{ marginTop: 16, padding: "12px 0", borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Top Products</p>
                {((insight.topProducts as Array<{ name: string; revenue: number; units: number }>) ?? []).map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{p.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>₦{Number(p.revenue).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Alerts */}
              {((insight.alerts as Array<{ type: string; message: string }>) ?? []).length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Alerts</p>
                  {(insight.alerts as Array<{ type: string; message: string }>).map((a, i) => (
                    <div key={i} style={{ padding: "8px 12px", background: "rgba(245,158,11,0.08)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.20)", marginBottom: 6 }}>
                      <p style={{ fontSize: 12, color: "var(--warning)", margin: 0 }}>{a.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
