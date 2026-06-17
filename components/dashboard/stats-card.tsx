import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: LucideIcon;
  color: "indigo" | "green" | "yellow" | "red" | "blue" | "purple";
  badge?: string;
}

const colorMap = {
  indigo: { bg: "rgba(99,102,241,0.12)",  fg: "#818cf8" },
  green:  { bg: "var(--accent-sub)",       fg: "var(--accent)" },
  yellow: { bg: "rgba(245,158,11,0.12)",  fg: "#f59e0b" },
  red:    { bg: "rgba(239,68,68,0.12)",   fg: "#f87171" },
  blue:   { bg: "rgba(59,130,246,0.12)",  fg: "#60a5fa" },
  purple: { bg: "rgba(168,85,247,0.12)",  fg: "#c084fc" },
};

export function StatsCard({ title, value, change, changeType = "neutral", icon: Icon, color, badge }: StatsCardProps) {
  const { bg, fg } = colorMap[color];

  return (
    <div
      className="stat-card uni-card uni-card-hover"
      style={{ padding: "20px", position: "relative", overflow: "hidden" }}
    >
      {/* Accent top line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${fg}, transparent)`,
        borderRadius: "var(--radius) var(--radius) 0 0",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        {/* Icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: bg, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={20} style={{ color: fg }} />
        </div>

        {/* Trend badge */}
        {change && (
          <span style={{
            fontSize: 12, fontWeight: 700,
            padding: "4px 8px", borderRadius: 7,
            background: changeType === "up"
              ? "var(--accent-sub)"
              : changeType === "down"
              ? "rgba(239,68,68,0.10)"
              : "rgba(100,116,139,0.10)",
            color: changeType === "up"
              ? "var(--accent)"
              : changeType === "down"
              ? "var(--danger)"
              : "var(--text-3)",
          }}>
            {changeType === "up" ? "↑" : changeType === "down" ? "↓" : "→"} {change}
          </span>
        )}
      </div>

      {/* Value */}
      <p style={{
        fontSize: "clamp(20px, 2.5vw, 28px)",
        fontWeight: 800,
        color: "var(--text)",
        letterSpacing: "-0.03em",
        lineHeight: 1,
        marginBottom: 6,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {value}
      </p>

      {/* Label */}
      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
        {title}
        {badge && (
          <span style={{
            marginLeft: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.05em", padding: "1px 5px", borderRadius: 4,
            background: "var(--bg-input)", color: "var(--text-3)",
          }}>
            {badge}
          </span>
        )}
      </p>
    </div>
  );
}
