"use client";

import { formatDistanceToNow } from "date-fns";
import { Bell, Package, ShoppingCart, AlertTriangle, TrendingDown, DollarSign } from "lucide-react";
import type { NotificationStatus } from "@prisma/client";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  status: NotificationStatus;
  readAt: Date | null;
  createdAt: Date;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  PRODUCT_CREATED: Package,
  PRODUCT_DELETED: Package,
  STOCK_IN:        TrendingDown,
  STOCK_OUT:       TrendingDown,
  PRICE_CHANGE:    DollarSign,
  SALE_RECORDED:   ShoppingCart,
  LOW_STOCK:       AlertTriangle,
};

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  PRODUCT_CREATED: { bg: "var(--accent-sub)",   color: "var(--accent)" },
  PRODUCT_DELETED: { bg: "rgba(239,68,68,0.10)",   color: "var(--danger)" },
  STOCK_IN:        { bg: "var(--accent-sub)",   color: "var(--accent)" },
  STOCK_OUT:       { bg: "rgba(251,146,60,0.10)",  color: "#fb923c"  },
  PRICE_CHANGE:    { bg: "rgba(59,130,246,0.10)",  color: "var(--info)" },
  SALE_RECORDED:   { bg: "rgba(168,85,247,0.10)",  color: "#c084fc"  },
  LOW_STOCK:       { bg: "rgba(245,158,11,0.10)",  color: "var(--warning)" },
};

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return (
      <div className="uni-card" style={{ padding: "48px 24px", textAlign: "center" }}>
        <Bell size={40} style={{ margin: "0 auto 12px", color: "var(--text-3)", opacity: 0.5 }} />
        <p style={{ color: "var(--text-3)", fontSize: 14 }}>No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="uni-card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>
          All Notifications
        </h2>
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>{notifications.length} total</span>
      </div>

      <div>
        {notifications.map((n, i) => {
          const Icon = TYPE_ICONS[n.type] ?? Bell;
          const ts = TYPE_STYLE[n.type] ?? { bg: "var(--bg-input)", color: "var(--text-2)" };
          const isUnread = !n.readAt;

          return (
            <div
              key={n.id}
              style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "14px 20px",
                background: isUnread ? "var(--accent-sub)" : "transparent",
                borderBottom: i < notifications.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.15s",
              }}
            >
              {/* Icon */}
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: ts.bg, color: ts.color,
              }}>
                <Icon size={17} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: isUnread ? 700 : 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                    {n.title}
                    {isUnread && (
                      <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                    )}
                  </p>
                  <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 3 }}>{n.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
