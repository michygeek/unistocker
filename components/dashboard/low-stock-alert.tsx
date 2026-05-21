import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  lowStockAlert: number;
}

export function LowStockAlert({ products }: { products: LowStockProduct[] }) {
  if (products.length === 0) return null;

  return (
    <div className="uni-card" style={{ overflow: "hidden", borderColor: "rgba(245,158,11,0.25)" }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid rgba(245,158,11,0.20)",
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(245,158,11,0.06)",
      }}>
        <AlertTriangle size={15} style={{ color: "var(--warning)", flexShrink: 0 }} />
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--warning)", margin: 0 }}>
          Low Stock Alerts
        </h2>
        <span style={{
          marginLeft: "auto", fontSize: 11, fontWeight: 700,
          padding: "2px 8px", borderRadius: 99,
          background: "rgba(245,158,11,0.15)", color: "var(--warning)",
        }}>
          {products.length}
        </span>
      </div>

      <div>
        {products.map((p, i) => (
          <Link
            key={p.id}
            href={`/inventory/${p.id}`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 20px",
              borderBottom: i < products.length - 1 ? "1px solid var(--border)" : "none",
              textDecoration: "none",
              transition: "background 0.15s",
            }}
            className="low-stock-row"
          >
            <style>{`.low-stock-row:hover { background: var(--bg-card-2); }`}</style>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{p.sku}</p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--danger)" }}>{p.quantity}</span>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>/ {p.lowStockAlert} min</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
