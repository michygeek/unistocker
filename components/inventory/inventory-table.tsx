"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Edit, Trash2, Plus, Minus, Eye, Package, AlertTriangle, CalendarClock } from "lucide-react";
import { deleteProduct, adjustStock } from "@/lib/actions/products";
import { addOp } from "@/lib/offline-queue";
import type { UserRole } from "@prisma/client";
import type { ProductWithCategory } from "@/types";
import { differenceInDays, format } from "date-fns";

interface Props {
  products: ProductWithCategory[];
  total: number;
  page: number;
  limit: number;
  categories: { id: string; name: string }[];
  userRole: UserRole;
  search: string;
}

function formatQty(quantity: number, piecesPerCarton: number | null) {
  if (!piecesPerCarton || piecesPerCarton < 1) return `${quantity}`;
  const cartons = Math.floor(quantity / piecesPerCarton);
  const pieces = quantity % piecesPerCarton;
  if (cartons === 0) return `${pieces} pcs`;
  if (pieces === 0) return `${cartons} ctn`;
  return `${cartons} ctn + ${pieces} pcs`;
}

function ExpiryBadge({ date }: { date: Date | null }) {
  if (!date) return null;
  const days = differenceInDays(new Date(date), new Date());
  if (days > 60) return null;
  const isUrgent = days <= 30;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
      background: isUrgent ? "rgba(239,68,68,0.10)" : "rgba(245,158,11,0.10)",
      color: isUrgent ? "var(--danger)" : "var(--warning)",
      marginTop: 3, whiteSpace: "nowrap",
    }}>
      <AlertTriangle size={10} />
      {days <= 0 ? "Expired" : `Exp ${format(new Date(date), "MMM d")}`}
    </span>
  );
}

interface StockAdjustModalProps {
  product: ProductWithCategory;
  type: "STOCK_IN" | "STOCK_OUT";
  onClose: () => void;
  onDone: () => void;
}

function StockAdjustModal({ product, type, onClose, onDone }: StockAdjustModalProps) {
  const ppc = product.piecesPerCarton;
  const [cartons, setCartons] = useState(0);
  const [pieces, setPieces] = useState(0);
  const [simpleQty, setSimpleQty] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const label = type === "STOCK_IN" ? "Add Stock" : "Remove Stock";
  const totalPieces = ppc ? cartons * ppc + pieces : simpleQty;

  const handleSubmit = async () => {
    if (totalPieces <= 0) { setError("Enter a quantity greater than 0"); return; }
    setLoading(true); setError("");

    // ── Offline path ──────────────────────────────────────────────────────
    if (!navigator.onLine) {
      await addOp({ type, payload: { productId: product.id, quantity: totalPieces, type } });
      window.dispatchEvent(new CustomEvent("offline-queue-updated"));
      setLoading(false);
      onDone(); onClose();
      return;
    }

    // ── Online path ───────────────────────────────────────────────────────
    const result = await adjustStock(product.id, totalPieces, type);
    setLoading(false);
    if ("error" in result) { setError(typeof result.error === "string" ? result.error : "Failed"); }
    else { onDone(); onClose(); }
  };

  return (
    <div className="uni-overlay">
      <div className="uni-overlay-backdrop" onClick={onClose} />
      <div className="uni-modal" style={{ maxWidth: 380 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>{label}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 20 }}>×</button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 14, color: "var(--text-2)", margin: 0 }}>
            <strong style={{ color: "var(--text)" }}>{product.name}</strong>
            {" "}— current stock: <strong>{formatQty(product.quantity, product.piecesPerCarton)}</strong>
          </p>

          {ppc ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Cartons</label>
                <input
                  type="number" min={0} value={cartons}
                  onChange={(e) => setCartons(Math.max(0, Number(e.target.value)))}
                  className="uni-input"
                />
                <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>{ppc} pcs each</p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Loose Pieces</label>
                <input
                  type="number" min={0} value={pieces}
                  onChange={(e) => setPieces(Math.max(0, Number(e.target.value)))}
                  className="uni-input"
                />
              </div>
              {totalPieces > 0 && (
                <p style={{ gridColumn: "1 / -1", fontSize: 13, fontWeight: 600, color: "var(--accent)", margin: 0 }}>
                  Total: {totalPieces} pieces
                </p>
              )}
            </div>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Quantity (pieces)</label>
              <input
                type="number" min={1} value={simpleQty || ""}
                onChange={(e) => setSimpleQty(Math.max(0, Number(e.target.value)))}
                className="uni-input"
                placeholder="Enter quantity"
              />
            </div>
          )}

          {error && <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} className="uni-btn uni-btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button
              onClick={handleSubmit} disabled={loading || totalPieces <= 0}
              className="uni-btn uni-btn-primary" style={{ flex: 1 }}
            >
              {loading ? "Saving…" : label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InventoryTable({ products, total, page, limit, userRole, search }: Props) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState(search);
  const [loading, setLoading] = useState<string | null>(null);
  const [adjustModal, setAdjustModal] = useState<{ product: ProductWithCategory; type: "STOCK_IN" | "STOCK_OUT" } | null>(null);
  const totalPages = Math.ceil(total / limit);
  const canEdit = userRole === "BOSS" || userRole === "MANAGER";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (searchVal) params.set("search", searchVal); else params.delete("search");
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {adjustModal && (
        <StockAdjustModal
          product={adjustModal.product}
          type={adjustModal.type}
          onClose={() => setAdjustModal(null)}
          onDone={() => router.refresh()}
        />
      )}

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search products, SKU, barcode…"
            className="uni-input"
            style={{ paddingLeft: 38 }}
          />
        </div>
        <button type="submit" className="uni-btn uni-btn-primary">Search</button>
      </form>

      {/* Empty state (mobile only — desktop table shows its own empty row) */}
      {products.length === 0 && (
        <div className="uni-card sm:hidden" style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-3)" }}>
          <Package size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
          <p>No products found</p>
        </div>
      )}

      {/* Mobile: card list */}
      {products.length > 0 && (
        <div className="sm:hidden" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {products.map((p) => (
            <div key={p.id} className="uni-card uni-product-card" style={{ padding: 14 }}>
              <div style={{ display: "flex", gap: 12 }}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Package size={18} style={{ color: "var(--text-3)" }} />
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                        {p.expirationDate && differenceInDays(new Date(p.expirationDate), new Date()) <= 60 && (
                          <CalendarClock size={13} style={{ flexShrink: 0, color: differenceInDays(new Date(p.expirationDate), new Date()) <= 30 ? "var(--danger)" : "var(--warning)" }} />
                        )}
                      </div>
                      <p style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-3)", marginTop: 1 }}>{p.sku}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>₦{p.sellingPrice.toFixed(2)}</p>
                      <p style={{
                        fontWeight: 700, fontSize: 13, marginTop: 2,
                        color: p.quantity <= p.lowStockAlert ? "var(--danger)" : p.quantity <= p.lowStockAlert * 2 ? "var(--warning)" : "var(--text-2)",
                      }}>
                        {formatQty(p.quantity, p.piecesPerCarton)}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    {p.category && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 6, background: "var(--accent-sub)", color: "var(--accent)" }}>
                        {p.category.name}
                      </span>
                    )}
                    <ExpiryBadge date={p.expirationDate} />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                <ActionBtn
                  onClick={() => setAdjustModal({ product: p, type: "STOCK_IN" })}
                  disabled={loading === `${p.id}-STOCK_IN`}
                  color="var(--accent)" hoverBg="var(--accent-sub)" title="Add stock" size={34}
                >
                  <Plus size={16} />
                </ActionBtn>
                <ActionBtn
                  onClick={() => setAdjustModal({ product: p, type: "STOCK_OUT" })}
                  disabled={loading === `${p.id}-STOCK_OUT`}
                  color="#fb923c" hoverBg="rgba(251,146,60,0.10)" title="Remove stock" size={34}
                >
                  <Minus size={16} />
                </ActionBtn>
                <ActionBtn href={`/inventory/${p.id}`} color="var(--info)" hoverBg="rgba(59,130,246,0.10)" title="View details" size={34}>
                  <Eye size={16} />
                </ActionBtn>
                {canEdit && (
                  <>
                    <ActionBtn href={`/inventory/${p.id}/edit`} color="var(--text-2)" hoverBg="var(--bg-card-2)" title="Edit" size={34}>
                      <Edit size={16} />
                    </ActionBtn>
                    <ActionBtn
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={loading === p.id}
                      color="var(--danger)" hoverBg="rgba(239,68,68,0.10)" title="Delete" size={34}
                    >
                      <Trash2 size={16} />
                    </ActionBtn>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop: table card */}
      <div className="hidden sm:block uni-card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="uni-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Product</th>
                <th className="hidden sm:table-cell">SKU</th>
                <th className="hidden md:table-cell" style={{ textAlign: "right" }}>Cost</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th style={{ textAlign: "right" }}>Stock</th>
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
              {products.map((p) => {
                const expiryDays = p.expirationDate ? differenceInDays(new Date(p.expirationDate), new Date()) : null;
                const showExpiryIcon = expiryDays !== null && expiryDays <= 60;
                return (
                  <tr key={p.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Package size={14} style={{ color: "var(--text-3)" }} />
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{p.name}</p>
                            {showExpiryIcon && (
                              <span title={`Expires ${format(new Date(p.expirationDate!), "MMM d, yyyy")}`} style={{ display: "inline-flex", flexShrink: 0 }}>
                                <CalendarClock size={13} style={{ color: expiryDays! <= 30 ? "var(--danger)" : "var(--warning)" }} />
                              </span>
                            )}
                          </div>
                          <p className="hidden sm:block" style={{ fontSize: 12, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{p.description}</p>
                          <p className="sm:hidden" style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-3)" }}>{p.sku}</p>
                          <ExpiryBadge date={p.expirationDate} />
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell" style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-2)" }}>{p.sku}</td>
                    <td className="hidden md:table-cell" style={{ textAlign: "right", color: "var(--text-2)", fontSize: 14 }}>₦{p.costPrice.toFixed(2)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--text)", fontSize: 14 }}>₦{p.sellingPrice.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>
                      <span style={{
                        fontWeight: 700, fontSize: 14,
                        color: p.quantity <= p.lowStockAlert ? "var(--danger)" : p.quantity <= p.lowStockAlert * 2 ? "var(--warning)" : "var(--text)",
                      }}>
                        {formatQty(p.quantity, p.piecesPerCarton)}
                      </span>
                      {p.piecesPerCarton && (
                        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{p.quantity} pcs total</p>
                      )}
                    </td>
                    <td className="hidden sm:table-cell">
                      {p.category ? (
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "var(--accent-sub)", color: "var(--accent)" }}>
                          {p.category.name}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-3)", fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td style={{ paddingRight: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                        <ActionBtn
                          onClick={() => setAdjustModal({ product: p, type: "STOCK_IN" })}
                          disabled={loading === `${p.id}-STOCK_IN`}
                          color="var(--accent)" hoverBg="var(--accent-sub)" title="Add stock"
                        >
                          <Plus size={14} />
                        </ActionBtn>
                        <ActionBtn
                          onClick={() => setAdjustModal({ product: p, type: "STOCK_OUT" })}
                          disabled={loading === `${p.id}-STOCK_OUT`}
                          color="#fb923c" hoverBg="rgba(251,146,60,0.10)" title="Remove stock"
                        >
                          <Minus size={14} />
                        </ActionBtn>
                        <ActionBtn href={`/inventory/${p.id}`} color="var(--info)" hoverBg="rgba(59,130,246,0.10)" title="View details">
                          <Eye size={14} />
                        </ActionBtn>
                        {canEdit && (
                          <>
                            <ActionBtn href={`/inventory/${p.id}/edit`} color="var(--text-2)" hoverBg="var(--bg-card-2)" title="Edit">
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
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "var(--text-3)" }}>
            <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {page > 1 && (
                <a href={`/inventory?page=${page - 1}`} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border)", color: "var(--text-2)", fontSize: 13, textDecoration: "none", background: "var(--bg-input)" }}>
                  Prev
                </a>
              )}
              {page < totalPages && (
                <a href={`/inventory?page=${page + 1}`} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border)", color: "var(--text-2)", fontSize: 13, textDecoration: "none", background: "var(--bg-input)" }}>
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
  children, onClick, href, disabled, color, hoverBg, title, size = 28,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  color: string;
  hoverBg: string;
  title?: string;
  size?: number;
}) {
  const style: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: size, height: size, borderRadius: 7, border: "none", background: "transparent",
    color, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
    transition: "background 0.15s", textDecoration: "none",
  };
  if (href) {
    return (
      <a href={href} style={style} title={title}
        onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >{children}</a>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} style={style} title={title}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >{children}</button>
  );
}
