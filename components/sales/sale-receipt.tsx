"use client";

import { useState, useCallback } from "react";
import { X, Printer, Share2, Check, Copy } from "lucide-react";
import { format } from "date-fns";

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptData {
  receiptNumber: string;
  createdAt: Date;
  cashierName: string;
  organizationName: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  notes?: string;
}

function buildReceiptText(r: ReceiptData): string {
  const line = "─".repeat(36);
  const center = (s: string) => s.padStart(Math.floor((36 + s.length) / 2)).padEnd(36);
  const row = (l: string, v: string) => l.padEnd(22) + v.padStart(14);

  const itemLines = r.items.map((i) => {
    const top = i.name.length > 22 ? i.name.slice(0, 21) + "…" : i.name;
    const qty = `${i.quantity} x ₦${i.unitPrice.toFixed(2)}`;
    return `${top.padEnd(36)}\n  ${qty.padStart(34)}\n  ${"₦" + i.total.toFixed(2)}`.split("\n")
      .map((l) => `  ${l}`).join("\n");
  });

  return [
    center(r.organizationName),
    center("SALES RECEIPT"),
    line,
    `Receipt: ${r.receiptNumber}`,
    `Date   : ${format(r.createdAt, "dd/MM/yyyy HH:mm")}`,
    `Cashier: ${r.cashierName}`,
    line,
    "  ITEM                         TOTAL",
    line,
    ...r.items.map((i) => {
      const name = i.name.length > 20 ? i.name.slice(0, 19) + "…" : i.name;
      const qty = `x${i.quantity}`;
      const total = `₦${i.total.toFixed(2)}`;
      return `  ${name.padEnd(20)} ${qty.padStart(3)}  ${total.padStart(9)}`;
    }),
    line,
    `  ${row("Subtotal", "₦" + r.subtotal.toFixed(2))}`,
    ...(r.discount > 0 ? [`  ${row("Discount", "-₦" + r.discount.toFixed(2))}`] : []),
    ...(r.taxAmount > 0 ? [`  ${row("Tax", "+₦" + r.taxAmount.toFixed(2))}`] : []),
    line,
    `  ${row("TOTAL", "₦" + r.total.toFixed(2))}`,
    line,
    ...(r.notes ? [`  Note: ${r.notes}`, line] : []),
    center("Thank you for your patronage!"),
  ].join("\n");
}

function buildReceiptHTML(r: ReceiptData): string {
  const dateStr = format(r.createdAt, "MMMM d, yyyy — h:mm a");
  const rows = r.items.map((i) => `
    <tr>
      <td style="padding:5px 0;border-bottom:1px solid #eee">${i.name}</td>
      <td style="padding:5px 0;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:5px 0;border-bottom:1px solid #eee;text-align:right">₦${i.unitPrice.toFixed(2)}</td>
      <td style="padding:5px 0;border-bottom:1px solid #eee;text-align:right">₦${i.total.toFixed(2)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html><head><title>Receipt ${r.receiptNumber}</title>
  <style>
    body { font-family: 'Courier New', monospace; margin: 0; padding: 16px; font-size: 13px; color: #111; }
    .center { text-align: center; }
    .divider { border: none; border-top: 1px dashed #999; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; padding-bottom: 6px; border-bottom: 2px solid #111; }
    th.r { text-align: right; }
    .total-row td { font-weight: bold; font-size: 15px; padding-top: 8px; }
    .sub-row td { color: #555; }
    @media print { body { padding: 0; } }
  </style></head><body>
  <div class="center" style="margin-bottom:12px">
    <div style="font-size:18px;font-weight:bold">${r.organizationName}</div>
    <div style="font-size:11px;color:#666;margin-top:2px">Sales Receipt</div>
  </div>
  <hr class="divider">
  <table style="margin-bottom:10px"><tbody>
    <tr><td style="color:#555">Receipt #</td><td style="text-align:right;font-weight:bold">${r.receiptNumber}</td></tr>
    <tr><td style="color:#555">Date</td><td style="text-align:right">${dateStr}</td></tr>
    <tr><td style="color:#555">Cashier</td><td style="text-align:right">${r.cashierName}</td></tr>
  </tbody></table>
  <hr class="divider">
  <table>
    <thead><tr><th>Item</th><th class="r" style="text-align:center">Qty</th><th class="r">Unit</th><th class="r">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <hr class="divider">
  <table><tbody>
    <tr class="sub-row"><td>Subtotal</td><td style="text-align:right">₦${r.subtotal.toFixed(2)}</td></tr>
    ${r.discount > 0 ? `<tr class="sub-row"><td>Discount</td><td style="text-align:right;color:#e00">-₦${r.discount.toFixed(2)}</td></tr>` : ""}
    ${r.taxAmount > 0 ? `<tr class="sub-row"><td>Tax</td><td style="text-align:right">+₦${r.taxAmount.toFixed(2)}</td></tr>` : ""}
    <tr class="total-row"><td>TOTAL</td><td style="text-align:right">₦${r.total.toFixed(2)}</td></tr>
  </tbody></table>
  ${r.notes ? `<hr class="divider"><p style="color:#555;font-size:12px">Note: ${r.notes}</p>` : ""}
  <hr class="divider">
  <p class="center" style="color:#555;font-size:11px;margin-top:8px">Thank you for your patronage!</p>
  </body></html>`;
}

interface Props {
  receipt: ReceiptData;
  onClose: () => void;
  onNewSale?: () => void;
}

export function SaleReceipt({ receipt, onClose, onNewSale }: Props) {
  const [copied, setCopied] = useState(false);

  const handlePrint = useCallback(() => {
    const win = window.open("", "_blank", "width=480,height=700");
    if (!win) return;
    win.document.write(buildReceiptHTML(receipt));
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  }, [receipt]);

  const handleShare = useCallback(async () => {
    const text = buildReceiptText(receipt);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${receipt.receiptNumber}`,
          text,
        });
        return;
      } catch {
        // user cancelled or not supported — fall through to copy
      }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert(text);
    }
  }, [receipt]);

  const dateStr = format(receipt.createdAt, "d MMM yyyy, h:mm a");

  return (
    <div className="uni-overlay" style={{ alignItems: "flex-start", paddingTop: 24 }}>
      <div className="uni-overlay-backdrop" onClick={onClose} />
      <div className="uni-modal" style={{ maxWidth: 440 }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Sale Receipt</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        {/* Receipt body */}
        <div style={{ padding: "20px 24px", fontFamily: "'Courier New', monospace" }}>
          {/* Org + receipt # */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>{receipt.organizationName}</p>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Sales Receipt</p>
          </div>

          <div style={{ borderTop: "1px dashed var(--border-2)", marginBottom: 12 }} />

          {/* Meta */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
            {[
              { label: "Receipt #", value: receipt.receiptNumber },
              { label: "Date", value: dateStr },
              { label: "Cashier", value: receipt.cashierName },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text-3)" }}>{label}</span>
                <span style={{ color: "var(--text)", fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px dashed var(--border-2)", marginBottom: 12 }} />

          {/* Items */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "4px 12px", marginBottom: 6 }}>
              {["Item", "Qty", "Total"].map((h) => (
                <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, textAlign: h === "Item" ? "left" : "right" }}>{h}</p>
              ))}
            </div>
            {receipt.items.map((item, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "3px 12px", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: 13, color: "var(--text)", margin: 0, fontFamily: "inherit" }}>{item.name}</p>
                <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, textAlign: "right" }}>×{item.quantity}</p>
                <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, margin: 0, textAlign: "right" }}>₦{item.total.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-2)" }}>
              <span>Subtotal</span><span>₦{receipt.subtotal.toFixed(2)}</span>
            </div>
            {receipt.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--danger)" }}>
                <span>Discount</span><span>-₦{receipt.discount.toFixed(2)}</span>
              </div>
            )}
            {receipt.taxAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-2)" }}>
                <span>Tax</span><span>+₦{receipt.taxAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px dashed var(--border-2)", margin: "10px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 800, color: "var(--text)" }}>
            <span>TOTAL</span>
            <span style={{ color: "var(--accent)" }}>₦{receipt.total.toFixed(2)}</span>
          </div>

          {receipt.notes && (
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10, fontStyle: "italic" }}>Note: {receipt.notes}</p>
          )}

          <div style={{ borderTop: "1px dashed var(--border-2)", margin: "14px 0 8px" }} />
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>Thank you for your patronage!</p>
        </div>

        {/* Actions */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
          <button
            onClick={handlePrint}
            className="uni-btn uni-btn-ghost"
            style={{ flex: 1, gap: 6 }}
          >
            <Printer size={15} /> Print
          </button>
          <button
            onClick={handleShare}
            className="uni-btn uni-btn-ghost"
            style={{ flex: 1, gap: 6, color: copied ? "var(--accent)" : undefined }}
          >
            {copied ? <><Check size={15} /> Copied!</> : <><Share2 size={15} /> Share</>}
          </button>
          {onNewSale && (
            <button
              onClick={onNewSale}
              className="uni-btn uni-btn-primary"
              style={{ flex: 1 }}
            >
              New Sale
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
