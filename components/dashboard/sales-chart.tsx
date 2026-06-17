"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

interface SalesData { date: string; revenue: number; profit: number; }

export function SalesChart({ data, rangeLabel }: { data: SalesData[]; rangeLabel?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const revenueColor = isDark ? "#2DD4BF" : "#0D9488";
  const profitColor  = isDark ? "#60a5fa" : "#3b82f6";

  return (
    <div className="uni-card" style={{ padding: "24px", minWidth: 0, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.01em" }}>
            Revenue &amp; Profit
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3 }}>{rangeLabel ?? "Last 30 days"}</p>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Revenue", color: revenueColor },
            { label: "Profit",  color: profitColor  },
          ].map(({ label, color }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-2)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: color, display: "inline-block" }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={revenueColor} stopOpacity={isDark ? 0.22 : 0.15} />
              <stop offset="100%" stopColor={revenueColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={profitColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={profitColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--bg-card-2)",
              border: "1px solid var(--border-2)",
              borderRadius: 10,
              color: "var(--text)",
              fontSize: 12,
              boxShadow: "var(--shadow-lg)",
            }}
            formatter={(v) => [`₦${Number(v).toLocaleString()}`, ""]}
          />
          <Area type="monotone" dataKey="revenue" stroke={revenueColor} strokeWidth={2.5} fill="url(#gRev)"    dot={false} name="Revenue" />
          <Area type="monotone" dataKey="profit"  stroke={profitColor}  strokeWidth={2}   fill="url(#gProfit)" dot={false} name="Profit" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
