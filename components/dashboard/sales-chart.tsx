"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";

interface SalesData {
  date: string;
  revenue: number;
  profit: number;
}

interface Props {
  data: SalesData[];
}

export function SalesChart({ data }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Revenue & Profit (Last 7 Days)</h2>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <Tooltip
            contentStyle={{ background: "#1f2937", border: "none", borderRadius: "8px", color: "#f9fafb", fontSize: 12 }}
            formatter={(v) => [`₦${Number(v ?? 0).toFixed(2)}`, ""]}
          />
          <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" name="Revenue" />
          <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#profitGrad)" name="Profit" />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-6 mt-4 justify-end">
        <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-3 h-3 rounded-full bg-indigo-500 block" /> Revenue</span>
        <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-3 h-3 rounded-full bg-emerald-500 block" /> Profit</span>
      </div>
    </div>
  );
}
