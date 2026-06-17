"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

interface Props {
  from: string;
  to: string;
}

const PRESETS = [
  { label: "Today",      days: 0 },
  { label: "Last 7 days",  days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function DateRangePicker({ from, to }: Props) {
  const router = useRouter();
  const [fromVal, setFromVal] = useState(from);
  const [toVal, setToVal] = useState(to);

  function apply(f = fromVal, t = toVal) {
    if (!f || !t) return;
    router.push(`/reports?from=${f}&to=${t}`);
  }

  function applyPreset(days: number) {
    const now = new Date();
    const start = days === 0 ? now : new Date(now.getTime() - days * 86400000);
    const f = toInputDate(start);
    const t = toInputDate(now);
    setFromVal(f);
    setToVal(t);
    apply(f, t);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
      {/* Presets */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.days)}
            className="uni-btn uni-btn-ghost"
            style={{ padding: "5px 11px", fontSize: 12 }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <span style={{ color: "var(--border-2)", fontSize: 16, userSelect: "none" }}>|</span>

      {/* Custom range */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <CalendarDays size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <input
          type="date"
          value={fromVal}
          max={toVal}
          onChange={(e) => setFromVal(e.target.value)}
          className="uni-input"
          style={{ padding: "5px 10px", fontSize: 12, width: 136 }}
        />
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>→</span>
        <input
          type="date"
          value={toVal}
          min={fromVal}
          onChange={(e) => setToVal(e.target.value)}
          className="uni-input"
          style={{ padding: "5px 10px", fontSize: 12, width: 136 }}
        />
        <button
          onClick={() => apply()}
          className="uni-btn uni-btn-primary"
          style={{ padding: "5px 14px", fontSize: 12 }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
