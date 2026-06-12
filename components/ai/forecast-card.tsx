"use client";

import { useState } from "react";
import { format } from "date-fns";
import { TrendingUp, RefreshCw, Loader2, Info } from "lucide-react";

interface Forecast {
  id: string;
  next7Days: number;
  next14Days: number;
  next30Days: number;
  reorderQty: number;
  reorderByDate: string | Date;
  confidence: number;
  reasoning: string;
  createdAt: string | Date;
}

interface Props {
  productId: string;
  initialForecast?: Forecast | null;
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value > 0.7 ? "#22c55e" : value >= 0.4 ? "#f59e0b" : "#ef4444";
  const bg = value > 0.7 ? "rgba(34,197,94,0.10)" : value >= 0.4 ? "rgba(245,158,11,0.10)" : "rgba(239,68,68,0.10)";
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: bg, color }}>
      {pct}% confidence
    </span>
  );
}

export function ForecastCard({ productId, initialForecast }: Props) {
  const [forecast, setForecast] = useState<Forecast | null>(initialForecast ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/forecast/${productId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setForecast(data.forecast);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI temporarily unavailable");
    } finally {
      setLoading(false);
    }
  };

  const reorderDate = forecast ? new Date(forecast.reorderByDate) : null;
  const daysUntilReorder = reorderDate ? Math.ceil((reorderDate.getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="uni-card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={15} style={{ color: "var(--accent)" }} />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>AI Demand Forecast</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {forecast && <ConfidenceBadge value={forecast.confidence} />}
          <button
            onClick={refresh}
            disabled={loading}
            className="uni-btn uni-btn-ghost"
            style={{ padding: "5px 10px", fontSize: 12 }}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {loading ? "Analysing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10, marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{error}</p>
          </div>
        )}

        {!forecast && !loading && !error && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>No forecast yet. Click Refresh to generate an AI forecast.</p>
            <button onClick={refresh} className="uni-btn uni-btn-primary" style={{ fontSize: 13 }}>
              <TrendingUp size={14} /> Generate Forecast
            </button>
          </div>
        )}

        {forecast && (
          <>
            {/* 3 stat boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { label: "7-Day Demand", value: Math.round(forecast.next7Days), unit: "units" },
                { label: "14-Day Demand", value: Math.round(forecast.next14Days), unit: "units" },
                { label: "30-Day Demand", value: Math.round(forecast.next30Days), unit: "units" },
              ].map((stat) => (
                <div key={stat.label} style={{ padding: "12px 14px", background: "var(--bg-input)", borderRadius: 10, border: "1px solid var(--border)", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", margin: 0 }}>{stat.value}</p>
                  <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>{stat.unit}</p>
                </div>
              ))}
            </div>

            {/* Reorder recommendation */}
            <div style={{
              padding: "12px 16px", borderRadius: 10, marginBottom: 14,
              background: daysUntilReorder !== null && daysUntilReorder <= 3
                ? "rgba(239,68,68,0.08)" : daysUntilReorder !== null && daysUntilReorder <= 7
                ? "rgba(245,158,11,0.08)" : "var(--accent-sub)",
              border: `1px solid ${daysUntilReorder !== null && daysUntilReorder <= 3
                ? "rgba(239,68,68,0.18)" : daysUntilReorder !== null && daysUntilReorder <= 7
                ? "rgba(245,158,11,0.18)" : "var(--accent-glow)"}`,
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                Order <span style={{ color: "var(--accent)" }}>{forecast.reorderQty} units</span> by{" "}
                <span style={{ color: "var(--accent)" }}>{reorderDate ? format(reorderDate, "MMM d, yyyy") : "—"}</span>
                {daysUntilReorder !== null && (
                  <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 400, marginLeft: 6 }}>
                    ({daysUntilReorder > 0 ? `in ${daysUntilReorder} days` : "overdue"})
                  </span>
                )}
              </p>
            </div>

            {/* AI reasoning */}
            <div style={{ padding: "10px 14px", background: "var(--bg-input)", borderRadius: 10, border: "1px solid var(--border)", display: "flex", gap: 10 }}>
              <Info size={14} style={{ color: "var(--text-3)", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>{forecast.reasoning}</p>
            </div>

            <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 10, marginBottom: 0 }}>
              Last updated {format(new Date(forecast.createdAt), "MMM d, h:mm a")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
