"use client";

import { useState } from "react";
import { format } from "date-fns";
import { TrendingUp, Download, Loader2, RefreshCw } from "lucide-react";

interface ForecastRow {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  lowStockAlert: number;
  forecast: {
    id: string;
    next7Days: number;
    next14Days: number;
    next30Days: number;
    reorderQty: number;
    reorderByDate: string;
    confidence: number;
    reasoning: string;
    createdAt: string;
  } | null;
}

type Tab = "urgent" | "soon" | "healthy";

function ConfidenceDot({ value }: { value: number }) {
  const color = value > 0.7 ? "#22c55e" : value >= 0.4 ? "#f59e0b" : "#ef4444";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
      <span style={{ fontSize: 12, color }}>{Math.round(value * 100)}%</span>
    </span>
  );
}

export function ForecastingDashboard({ products }: { products: ForecastRow[] }) {
  const [tab, setTab] = useState<Tab>("urgent");
  const [runningAll, setRunningAll] = useState(false);
  const [batchResult, setBatchResult] = useState<{ processed: number; needReorderCount: number } | null>(null);
  const [rows, setRows] = useState(products);

  const now = Date.now();

  const classify = (row: ForecastRow): Tab => {
    if (!row.forecast) return "healthy";
    const days = (new Date(row.forecast.reorderByDate).getTime() - now) / 86400000;
    if (days <= 3) return "urgent";
    if (days <= 7) return "soon";
    return "healthy";
  };

  const sorted = [...rows].sort((a, b) => {
    const da = a.forecast ? new Date(a.forecast.reorderByDate).getTime() : Infinity;
    const db_ = b.forecast ? new Date(b.forecast.reorderByDate).getTime() : Infinity;
    return da - db_;
  });

  const filtered = sorted.filter((r) => classify(r) === tab);

  const runAll = async () => {
    setRunningAll(true);
    setBatchResult(null);
    try {
      const res = await fetch("/api/ai/forecast/batch", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setBatchResult({ processed: data.processed, needReorderCount: data.needReorderCount });
        // Reload page data by refreshing
        window.location.reload();
      }
    } finally {
      setRunningAll(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Product", "SKU", "Current Stock", "7-Day Demand", "14-Day Demand", "30-Day Demand", "Reorder By", "Recommended Qty", "Confidence"];
    const csvRows = sorted.map((r) => [
      r.name, r.sku, r.quantity,
      r.forecast ? Math.round(r.forecast.next7Days) : "",
      r.forecast ? Math.round(r.forecast.next14Days) : "",
      r.forecast ? Math.round(r.forecast.next30Days) : "",
      r.forecast ? format(new Date(r.forecast.reorderByDate), "yyyy-MM-dd") : "",
      r.forecast ? r.forecast.reorderQty : "",
      r.forecast ? `${Math.round(r.forecast.confidence * 100)}%` : "",
    ].join(","));
    const csv = [headers.join(","), ...csvRows].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `forecast-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const counts = {
    urgent: sorted.filter((r) => classify(r) === "urgent").length,
    soon: sorted.filter((r) => classify(r) === "soon").length,
    healthy: sorted.filter((r) => classify(r) === "healthy").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Demand Forecasting</h2>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>
            AI-predicted sales for the next 7, 14 &amp; 30 days
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportCSV} className="uni-btn uni-btn-ghost" style={{ fontSize: 13 }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={runAll} disabled={runningAll} className="uni-btn uni-btn-primary" style={{ fontSize: 13 }}>
            {runningAll ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {runningAll ? "Running…" : "Run All Forecasts"}
          </button>
        </div>
      </div>

      {batchResult && (
        <div style={{ padding: "10px 16px", background: "var(--accent-sub)", borderRadius: 10, border: "1px solid var(--accent-glow)" }}>
          <p style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>
            Processed <strong>{batchResult.processed}</strong> products —{" "}
            <strong style={{ color: "var(--danger)" }}>{batchResult.needReorderCount}</strong> need reorder this week.
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--bg-input)", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(["urgent", "soon", "healthy"] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = { urgent: `Urgent (≤3 days) · ${counts.urgent}`, soon: `Soon (≤7 days) · ${counts.soon}`, healthy: `Healthy · ${counts.healthy}` };
          const colors: Record<Tab, string> = { urgent: "var(--danger)", soon: "var(--warning)", healthy: "#22c55e" };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                background: tab === t ? "var(--bg-card)" : "transparent",
                color: tab === t ? colors[t] : "var(--text-2)",
                boxShadow: tab === t ? "var(--shadow)" : "none",
                transition: "all 0.15s",
              }}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="uni-card" style={{ overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <p style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
            No products in this category. Run forecasts to populate.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="uni-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>7-Day Demand</th>
                  <th>14-Day Demand</th>
                  <th>30-Day Demand</th>
                  <th>Reorder By</th>
                  <th>Recommended Qty</th>
                  <th>Confidence</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const cls = classify(row);
                  const urgencyColor = cls === "urgent" ? "var(--danger)" : cls === "soon" ? "var(--warning)" : "var(--text)";
                  return (
                    <tr key={row.id}>
                      <td>
                        <div>
                          <p style={{ fontWeight: 600, margin: 0 }}>{row.name}</p>
                          <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0, fontFamily: "monospace" }}>{row.sku}</p>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: row.quantity <= row.lowStockAlert ? "var(--danger)" : "var(--text)" }}>
                          {row.quantity}
                        </span>
                      </td>
                      <td>{row.forecast ? Math.round(row.forecast.next7Days) : <span style={{ color: "var(--text-3)" }}>—</span>}</td>
                      <td>{row.forecast ? Math.round(row.forecast.next14Days) : <span style={{ color: "var(--text-3)" }}>—</span>}</td>
                      <td>{row.forecast ? Math.round(row.forecast.next30Days) : <span style={{ color: "var(--text-3)" }}>—</span>}</td>
                      <td>
                        {row.forecast ? (
                          <span style={{ fontWeight: 700, color: urgencyColor }}>
                            {format(new Date(row.forecast.reorderByDate), "MMM d, yyyy")}
                          </span>
                        ) : <span style={{ color: "var(--text-3)" }}>No forecast</span>}
                      </td>
                      <td>
                        {row.forecast ? (
                          <span style={{ fontWeight: 700, color: "var(--accent)" }}>{row.forecast.reorderQty} units</span>
                        ) : <span style={{ color: "var(--text-3)" }}>—</span>}
                      </td>
                      <td>{row.forecast ? <ConfidenceDot value={row.forecast.confidence} /> : <span style={{ color: "var(--text-3)" }}>—</span>}</td>
                      <td>
                        <a href={`/inventory/${row.id}`} className="uni-btn uni-btn-ghost" style={{ fontSize: 12, padding: "5px 10px" }}>
                          <TrendingUp size={12} /> View
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
