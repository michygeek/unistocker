"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Edit, Trash2, Plus, Minus, Eye, Package } from "lucide-react";
import { deleteProduct, adjustStock } from "@/lib/actions/products";
import type { UserRole } from "@prisma/client";
import type { ProductWithCategory } from "@/types";

interface Props {
  products: ProductWithCategory[];
  total: number;
  page: number;
  limit: number;
  categories: { id: string; name: string }[];
  userRole: UserRole;
  search: string;
}

export function InventoryTable({ products, total, page, limit, userRole, search }: Props) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState(search);
  const [loading, setLoading] = useState<string | null>(null);
  const totalPages = Math.ceil(total / limit);
  const canEdit = userRole === "BOSS" || userRole === "MANAGER";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (searchVal) params.set("search", searchVal);
    else params.delete("search");
    params.set("page", "1");
    router.push(`/inventory?${params.toString()}`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This is a soft delete — the product will be deactivated.`)) return;
    setLoading(id);
    await deleteProduct(id);
    setLoading(null);
    router.refresh();
  };

  const handleAdjustStock = async (id: string, type: "STOCK_IN" | "STOCK_OUT") => {
    const qty = prompt(`Enter quantity to ${type === "STOCK_IN" ? "add" : "remove"}:`);
    if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) return;
    setLoading(`${id}-${type}`);
    const result = await adjustStock(id, Number(qty), type);
    setLoading(null);
    if ("error" in result) alert(result.error);
    else router.refresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-3)", pointerEvents: "none",
          }} />
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search products, SKU, barcode…"
            className="uni-input"
            style={{ paddingLeft: 38 }}
          />
        </div>
        <button type="submit" className="uni-btn uni-btn-primary">
          Search
        </button>
      </form>

      {/* Table card */}
      <div className="uni-card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="uni-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Product</th>
                <th className="hidden sm:table-cell">SKU</th>
                <th className="hidden md:table-cell" style={{ textAlign: "right" }}>Cost</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th style={{ textAlign: "right" }}>Qty</th>
                <th className="hidden sm:table-cell">Category</th>
                <th style={{ textAlign: "right", paddingRight: 20 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-3)" }}>
                    <Package size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                    <p>No products found</p>
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <tr key={p.id}>
                  <td style={{ paddingLeft: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, background: "var(--bg-input)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <Package size={14} style={{ color: "var(--text-3)" }} />
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{p.name}</p>
                        <p className="hidden sm:block" style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{p.description}</p>
                        <p className="sm:hidden" style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-3)" }}>{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell" style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-2)" }}>{p.sku}</td>
                  <td className="hidden md:table-cell" style={{ textAlign: "right", color: "var(--text-2)" }}>₦{p.costPrice.toFixed(2)}</td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: "var(--text)" }}>₦{p.sellingPrice.toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>
                    <span style={{
                      fontWeight: 700, fontSize: 13,
                      color: p.quantity <= p.lowStockAlert
                        ? "var(--danger)"
                        : p.quantity <= p.lowStockAlert * 2
                        ? "var(--warning)"
                        : "var(--text)",
                    }}>
                      {p.quantity}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell">
                    {p.category ? (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                        background: "var(--accent-sub)", color: "var(--accent)",
                      }}>
                        {p.category.name}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-3)", fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ paddingRight: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                      <ActionBtn
                        onClick={() => handleAdjustStock(p.id, "STOCK_IN")}
                        disabled={loading === `${p.id}-STOCK_IN`}
                        color="var(--accent)" hoverBg="var(--accent-sub)" title="Add stock"
                      >
                        <Plus size={14} />
                      </ActionBtn>
                      <ActionBtn
                        onClick={() => handleAdjustStock(p.id, "STOCK_OUT")}
                        disabled={loading === `${p.id}-STOCK_OUT`}
                        color="#fb923c" hoverBg="rgba(251,146,60,0.10)" title="Remove stock"
                      >
                        <Minus size={14} />
                      </ActionBtn>
                      <ActionBtn
                        href={`/inventory/${p.id}`}
                        color="var(--info)" hoverBg="rgba(59,130,246,0.10)" title="View details"
                      >
                        <Eye size={14} />
                      </ActionBtn>
                      {canEdit && (
                        <>
                          <ActionBtn
                            href={`/inventory/${p.id}/edit`}
                            color="var(--text-2)" hoverBg="var(--bg-card-2)" title="Edit"
                          >
                            <Edit size={14} />
                          </ActionBtn>
                          <ActionBtn
                            onClick={() => handleDelete(p.id, p.name)}
                            disabled={loading === p.id}
                            color="var(--danger)" hoverBg="rgba(239,68,68,0.10)" title="Delete"
                          >
                            <Trash2 size={14} />
                          </ActionBtn>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: 12, color: "var(--text-3)",
          }}>
            <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {page > 1 && (
                <a href={`/inventory?page=${page - 1}`} style={{
                  padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border)",
                  color: "var(--text-2)", fontSize: 12, textDecoration: "none",
                  background: "var(--bg-input)", transition: "all 0.15s",
                }}>
                  Prev
                </a>
              )}
              {page < totalPages && (
                <a href={`/inventory?page=${page + 1}`} style={{
                  padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border)",
                  color: "var(--text-2)", fontSize: 12, textDecoration: "none",
                  background: "var(--bg-input)", transition: "all 0.15s",
                }}>
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  children, onClick, href, disabled, color, hoverBg, title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  color: string;
  hoverBg: string;
  title?: string;
}) {
  const style: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, borderRadius: 7, border: "none", background: "transparent",
    color, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
    transition: "background 0.15s",
    textDecoration: "none",
  };
  if (href) {
    return (
      <a href={href} style={style} title={title}
        onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} style={style} title={title}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}
