import { formatDistanceToNow } from "date-fns";
import type { ActivityLogItem } from "@/types";

const ACTION_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  CREATE:     { bg: "var(--accent-sub)",   color: "var(--accent)", label: "Create"    },
  UPDATE:     { bg: "rgba(59,130,246,0.10)",  color: "#60a5fa",       label: "Update"    },
  DELETE:     { bg: "rgba(239,68,68,0.10)",   color: "#f87171",       label: "Delete"    },
  STOCK_IN:   { bg: "var(--accent-sub)",   color: "var(--accent)", label: "Stock In"  },
  STOCK_OUT:  { bg: "rgba(251,146,60,0.10)",  color: "#fb923c",       label: "Stock Out" },
  SALE:       { bg: "rgba(168,85,247,0.10)",  color: "#c084fc",       label: "Sale"      },
  ADJUSTMENT: { bg: "rgba(245,158,11,0.10)",  color: "#fbbf24",       label: "Adjust"    },
};

export function RecentActivity({ logs }: { logs: ActivityLogItem[] }) {
  return (
    <div className="uni-card" style={{ overflow: "hidden" }}>
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.01em" }}>
          Recent Activity
        </h2>
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>
          {logs.length} events
        </span>
      </div>

      {logs.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
          No activity yet
        </div>
      ) : (
        <div>
          {logs.map((log, i) => {
            const style = ACTION_STYLE[log.action] ?? { bg: "rgba(100,116,139,0.10)", color: "var(--text-3)", label: log.action };
            return (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 20px",
                  borderBottom: i < logs.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background 0.15s",
                }}
                className="activity-row"
              >
                <style>{`.activity-row:hover{background:var(--bg-card-2)}`}</style>
                {/* Action dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: 99,
                  background: style.color, flexShrink: 0, marginTop: 5,
                  boxShadow: `0 0 6px ${style.color}80`,
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                      background: style.bg, color: style.color, letterSpacing: "0.04em",
                      textTransform: "uppercase", flexShrink: 0,
                    }}>
                      {style.label}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 13, color: "var(--text)", margin: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {log.description}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-3)", margin: "3px 0 0" }}>
                    {log.user.name ?? log.user.email} · {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
