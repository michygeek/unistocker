"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, RefreshCw, Loader2, Lightbulb } from "lucide-react";

interface Insight {
  id: string;
  weekOf: string;
  summary: string;
  topProducts: unknown;
  alerts: unknown;
  highlights: unknown;
  createdAt: string;
}

export function InsightsTimeline({ insights: initial }: { insights: Insight[] }) {
  const [insights, setInsights] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(initial[0]?.id ?? null);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/insights/weekly", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      if (res.ok && data.insight) {
        const serialised = { ...data.insight, weekOf: new Date(data.insight.weekOf).toISOString(), createdAt: new Date(data.insight.createdAt).toISOString() };
        setInsights((prev) => [serialised, ...prev.slice(0, 7)]);
        setExpanded(serialised.id);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="uni-card" style={{ display: "flex", flexDirection: "column", height: 600, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Lightbulb size={15} style={{ color: "#f59e0b" }} />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>Weekly Reports</h2>
        </div>
        <button onClick={generate} disabled={generating} className="uni-btn uni-btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}>
          {generating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {generating ? "Generating…" : "Generate This Week"}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {insights.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", paddingTop: 20 }}>
            No weekly reports yet. Click "Generate This Week" to create one.
          </p>
        ) : (
          insights.map((insight) => {
            const highlights = (insight.highlights as Array<{ metric: string; value: string; trend: string }>) ?? [];
            const isOpen = expanded === insight.id;
            return (
              <div key={insight.id} style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : insight.id)}
                  style={{
                    width: "100%", padding: "12px 14px", background: isOpen ? "var(--accent-sub)" : "var(--bg-input)",
                    border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                      Week of {format(new Date(insight.weekOf), "MMM d, yyyy")}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>
                      Generated {format(new Date(insight.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={14} style={{ color: "var(--text-3)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-3)" }} />}
                </button>

                {isOpen && (
                  <div style={{ padding: 14 }}>
                    {highlights.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
                        {highlights.slice(0, 3).map((h) => (
                          <div key={h.metric} style={{ padding: "8px 10px", background: "var(--bg-input)", borderRadius: 8, border: "1px solid var(--border)" }}>
                            <p style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{h.metric}</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>{h.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7, margin: 0 }}>
                      {insight.summary.slice(0, 300)}{insight.summary.length > 300 ? "…" : ""}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
