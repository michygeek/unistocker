"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronUp, Receipt } from "lucide-react";
import { SaleReceipt, type ReceiptData } from "@/components/sales/sale-receipt";

interface SaleItem { id: string; quantity: number; unitPrice: number; costPrice: number; total: number; product: { name: string; sku: string }; }
interface Sale { id: string; receiptNumber: string; subtotal: number; discount: number; tax: number; total: number; profit: number; notes: string | null; createdAt: Date; user: { name: string | null; email: string }; branch: { name: string } | null; saleItems: SaleItem[]; }

interface Props { sales: Sale[]; total: number; page: number; limit: number; organizationName: string; }

export function SalesTable({ sales, total, page, limit, organizationName }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [viewReceipt, setViewReceipt] = useState<ReceiptData | null>(null);
  const totalPages = Math.ceil(total / limit);

  function buildReceipt(sale: Sale): ReceiptData {
    const taxAmount = sale.subtotal * (sale.tax / 100);
    return {
      receiptNumber: sale.receiptNumber,
      createdAt: new Date(sale.createdAt),
      cashierName: sale.user.name ?? sale.user.email,
      organizationName,
      items: sale.saleItems.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total,
      })),
      subtotal: sale.subtotal,
      discount: sale.discount,
      taxAmount,
      total: sale.total,
      notes: sale.notes ?? undefined,
    };
  }

  return (
    <>
      {viewReceipt && (
        <SaleReceipt receipt={viewReceipt} onClose={() => setViewReceipt(null)} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="uni-card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="uni-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>Receipt</th>
                  <th className="hidden sm:table-cell">Cashier</th>
                  <th className="hidden md:table-cell" style={{ textAlign: "right" }}>Subtotal</th>
                  <th className="hidden md:table-cell" style={{ textAlign: "right" }}>Discount</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th className="hidden sm:table-cell" style={{ textAlign: "right" }}>Profit</th>
                  <th style={{ textAlign: "right" }}>Date</th>
                  <th style={{ width: 40, paddingRight: 16 }} />
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-3)" }}>
                      <Receipt size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                      <p>No sales recorded yet</p>
                    </td>
                  </tr>
                )}
                {sales.map((sale) => (
                  <>
                    <tr
                      key={sale.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                    >
                      <td style={{ paddingLeft: 20 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
                          {sale.receiptNumber}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell" style={{ color: "var(--text-2)", fontSize: 13 }}>
                        {sale.user.name ?? sale.user.email}
                      </td>
                      <td className="hidden md:table-cell" style={{ textAlign: "right", color: "var(--text-2)" }}>
                        ₦{sale.subtotal.toFixed(2)}
                      </td>
                      <td className="hidden md:table-cell" style={{ textAlign: "right", color: "var(--danger)" }}>
                        {sale.discount > 0 ? `-₦${sale.discount.toFixed(2)}` : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text)" }}>
                        ₦{sale.total.toFixed(2)}
                      </td>
                      <td className="hidden sm:table-cell" style={{ textAlign: "right", fontWeight: 600, color: "var(--accent)" }}>
                        ₦{sale.profit.toFixed(2)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: "var(--text-2)" }}>{format(new Date(sale.createdAt), "MMM d")}</div>
                        <div className="hidden sm:block" style={{ fontSize: 11, color: "var(--text-3)" }}>{format(new Date(sale.createdAt), "h:mm a")}</div>
                      </td>
                      <td style={{ textAlign: "center", paddingRight: 16 }}>
                        {expanded === sale.id
                          ? <ChevronUp size={15} style={{ color: "var(--text-3)" }} />
                          : <ChevronDown size={15} style={{ color: "var(--text-3)" }} />}
                      </td>
                    </tr>

                    {expanded === sale.id && (
                      <tr key={`${sale.id}-expanded`}>
                        <td colSpan={8} style={{ background: "var(--bg-card-2)", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 12 }}>
                            Items sold
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {sale.saleItems.map((item) => (
                              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <div style={{ minWidth: 0 }}>
                                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{item.product.name}</span>
                                  <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 8 }}>{item.product.sku}</span>
                                </div>
                                <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--text-2)", flexShrink: 0 }}>
                                  <span>{item.quantity}× @ ₦{item.unitPrice.toFixed(2)}</span>
                                  <span style={{ fontWeight: 700, color: "var(--text)" }}>₦{item.total.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {sale.notes && (
                            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                              Note: {sale.notes}
                            </p>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 12 }}>
                            {sale.discount > 0 && (
                              <span style={{ color: "var(--danger)" }}>Discount: -₦{sale.discount.toFixed(2)}</span>
                            )}
                            {sale.tax > 0 && (
                              <span style={{ color: "var(--text-2)" }}>Tax: ₦{sale.tax.toFixed(2)}</span>
                            )}
                            <span style={{ color: "var(--text-2)", marginLeft: "auto" }}>
                              {formatDistanceToNow(new Date(sale.createdAt), { addSuffix: true })}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setViewReceipt(buildReceipt(sale)); }}
                              className="uni-btn uni-btn-ghost"
                              style={{ padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}
                            >
                              <Receipt size={13} /> View Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
                  <a href={`/sales?page=${page - 1}`} style={{
                    padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border)",
                    color: "var(--text-2)", fontSize: 12, textDecoration: "none", background: "var(--bg-input)",
                  }}>Prev</a>
                )}
                {page < totalPages && (
                  <a href={`/sales?page=${page + 1}`} style={{
                    padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border)",
                    color: "var(--text-2)", fontSize: 12, textDecoration: "none", background: "var(--bg-input)",
                  }}>Next</a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
