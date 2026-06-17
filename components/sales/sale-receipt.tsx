"use client";

import { useState, useCallback } from "react";
import { X, Printer, Share2, Check, Download } from "lucide-react";
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

// ── Canvas image builder ───────────────────────────────────────────────────

async function buildReceiptImage(r: ReceiptData): Promise<Blob> {
  const dpr = 2;
  const W = 560;
  const pad = 36;

  // Measure content height
  const lineH = 26;
  const totalsCount = 1 + (r.discount > 0 ? 1 : 0) + (r.taxAmount > 0 ? 1 : 0);
  const itemsH = r.items.length * 44;
  const notesH = r.notes ? lineH + 12 : 0;
  const H = pad + 28 + 30 + 24 + 20 + 3 * lineH + 12 + 20 + 24 + itemsH + 16 + totalsCount * lineH + 20 + 44 + notesH + 20 + 24 + 24 + pad;

  const canvas = document.createElement("canvas");
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  // White background with subtle shadow border
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#eeeeee";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  let y = pad;

  function txt(
    str: string,
    x: number,
    yPos: number,
    opts: { size?: number; weight?: string; color?: string; align?: CanvasTextAlign; font?: string } = {}
  ) {
    ctx.font = `${opts.weight ?? "normal"} ${opts.size ?? 13}px ${opts.font ?? "'Courier New', monospace"}`;
    ctx.fillStyle = opts.color ?? "#111111";
    ctx.textAlign = opts.align ?? "left";
    ctx.fillText(str, x, yPos);
    ctx.textAlign = "left";
  }

  function dash(yPos: number) {
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, yPos);
    ctx.lineTo(W - pad, yPos);
    ctx.stroke();
    ctx.restore();
  }

  function solid(yPos: number, w = 1) {
    ctx.save();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#222222";
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(pad, yPos);
    ctx.lineTo(W - pad, yPos);
    ctx.stroke();
    ctx.restore();
  }

  // App brand
  txt("UNISTOCKER", W / 2, y + 14, { size: 11, weight: "bold", color: "#0D9488", align: "center" });
  y += 26;

  // Org name
  txt(r.organizationName, W / 2, y + 20, { size: 19, weight: "bold", color: "#111111", align: "center" });
  y += 30;

  // Receipt label
  txt("SALES RECEIPT", W / 2, y + 13, { size: 11, color: "#999999", align: "center" });
  y += 22;

  dash(y); y += 18;

  // Meta rows
  function metaRow(label: string, value: string) {
    txt(label, pad, y + 14, { size: 13, color: "#999999" });
    txt(value, W - pad, y + 14, { size: 13, weight: "600", color: "#111111", align: "right" });
    y += lineH;
  }
  metaRow("Receipt #", r.receiptNumber);
  metaRow("Date", format(r.createdAt, "dd/MM/yyyy HH:mm"));
  metaRow("Cashier", r.cashierName);
  y += 10;

  dash(y); y += 16;

  // Column headers
  txt("ITEM", pad, y + 12, { size: 10, color: "#bbbbbb" });
  txt("QTY", W / 2 + 10, y + 12, { size: 10, color: "#bbbbbb", align: "center" });
  txt("TOTAL", W - pad, y + 12, { size: 10, color: "#bbbbbb", align: "right" });
  y += 18;

  dash(y); y += 10;

  // Items
  for (const item of r.items) {
    // Truncate name to fit ~55% of content width
    const maxW = (W - pad * 2) * 0.55;
    ctx.font = `normal 13px 'Courier New', monospace`;
    let name = item.name;
    while (ctx.measureText(name).width > maxW && name.length > 3) name = name.slice(0, -1);
    if (name.length < item.name.length) name = name.slice(0, -1) + "…";

    txt(name, pad, y + 14, { size: 13, color: "#111111" });
    txt(`×${item.quantity}`, W / 2 + 10, y + 14, { size: 13, color: "#555555", align: "center" });
    txt(
      `₦${item.total.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      W - pad, y + 14,
      { size: 13, weight: "600", color: "#111111", align: "right" }
    );
    y += 22;
    txt(`₦${item.unitPrice.toFixed(2)} / pc`, pad + 6, y + 10, { size: 10, color: "#cccccc" });
    y += 18;
  }
  y += 8;

  dash(y); y += 12;

  // Subtotals
  function totalRow(label: string, value: string, color = "#555555") {
    txt(label, pad, y + 14, { size: 13, color });
    txt(value, W - pad, y + 14, { size: 13, color, align: "right" });
    y += lineH;
  }
  totalRow("Subtotal", `₦${r.subtotal.toFixed(2)}`);
  if (r.discount > 0) totalRow("Discount", `-₦${r.discount.toFixed(2)}`, "#cc0000");
  if (r.taxAmount > 0) totalRow("Tax", `+₦${r.taxAmount.toFixed(2)}`);
  y += 6;

  solid(y, 2); y += 14;

  // Grand total
  txt("TOTAL", pad, y + 22, { size: 18, weight: "bold", color: "#111111" });
  txt(
    `₦${r.total.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    W - pad, y + 22,
    { size: 18, weight: "bold", color: "#0D9488", align: "right" }
  );
  y += 38;

  if (r.notes) {
    dash(y); y += 12;
    txt(`Note: ${r.notes}`, pad, y + 13, { size: 11, color: "#888888" });
    y += 24;
  }

  dash(y); y += 18;
  txt("Thank you for your patronage!", W / 2, y + 13, { size: 12, color: "#aaaaaa", align: "center" });
  y += 22;
  txt("Powered by Unistocker", W / 2, y + 11, { size: 10, color: "#cccccc", align: "center" });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
  });
}

// ── Plain-text builder (clipboard / share fallback) ────────────────────────

function buildReceiptText(r: ReceiptData): string {
  const line = "─".repeat(36);
  const c = (s: string) => s.padStart(Math.floor((36 + s.length) / 2)).padEnd(36);
  const row = (l: string, v: string) => l.padEnd(22) + v.padStart(14);

  return [
    c("UNISTOCKER"),
    c(r.organizationName),
    c("SALES RECEIPT"),
    line,
    `Receipt: ${r.receiptNumber}`,
    `Date   : ${format(r.createdAt, "dd/MM/yyyy HH:mm")}`,
    `Cashier: ${r.cashierName}`,
    line,
    "  ITEM                         TOTAL",
    line,
    ...r.items.map((i) => {
      const name = i.name.length > 20 ? i.name.slice(0, 19) + "…" : i.name;
      return `  ${name.padEnd(20)} ×${String(i.quantity).padStart(3)}  ₦${i.total.toFixed(2).padStart(9)}`;
    }),
    line,
    `  ${row("Subtotal", "₦" + r.subtotal.toFixed(2))}`,
    ...(r.discount > 0 ? [`  ${row("Discount", "-₦" + r.discount.toFixed(2))}`] : []),
    ...(r.taxAmount > 0 ? [`  ${row("Tax", "+₦" + r.taxAmount.toFixed(2))}`] : []),
    line,
    `  ${row("TOTAL", "₦" + r.total.toFixed(2))}`,
    line,
    ...(r.notes ? [`  Note: ${r.notes}`, line] : []),
    c("Thank you for your patronage!"),
    c("Powered by Unistocker"),
  ].join("\n");
}

// ── HTML builder (print popup) ─────────────────────────────────────────────

function buildReceiptHTML(r: ReceiptData): string {
  const dateStr = format(r.createdAt, "MMMM d, yyyy — h:mm a");
  const rows = r.items
    .map(
      (i) => `
    <tr>
      <td style="padding:5px 0;border-bottom:1px solid #eee">${i.name}<br><span style="font-size:10px;color:#aaa">₦${i.unitPrice.toFixed(2)} / pc</span></td>
      <td style="padding:5px 0;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:5px 0;border-bottom:1px solid #eee;text-align:right">₦${i.total.toFixed(2)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html><html><head><title>Receipt ${r.receiptNumber}</title>
  <style>
    body { font-family: 'Courier New', monospace; margin: 0; padding: 16px; font-size: 13px; color: #111; max-width: 420px; margin: 0 auto; }
    .center { text-align: center; }
    .divider { border: none; border-top: 1px dashed #bbb; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #999; padding-bottom: 6px; border-bottom: 2px solid #111; }
    th.r { text-align: right; }
    .total-row td { font-weight: bold; font-size: 16px; padding-top: 8px; }
    .sub-row td { color: #555; }
    .brand { font-size: 11px; font-weight: 800; color: #0D9488; letter-spacing: 0.1em; }
    @media print { body { padding: 0; } }
  </style></head><body>
  <div class="center" style="margin-bottom:14px">
    <div class="brand">UNISTOCKER</div>
    <div style="font-size:18px;font-weight:bold;margin-top:4px">${r.organizationName}</div>
    <div style="font-size:11px;color:#999;margin-top:2px">Sales Receipt</div>
  </div>
  <hr class="divider">
  <table style="margin-bottom:10px"><tbody>
    <tr><td style="color:#999">Receipt #</td><td style="text-align:right;font-weight:bold">${r.receiptNumber}</td></tr>
    <tr><td style="color:#999">Date</td><td style="text-align:right">${dateStr}</td></tr>
    <tr><td style="color:#999">Cashier</td><td style="text-align:right">${r.cashierName}</td></tr>
  </tbody></table>
  <hr class="divider">
  <table>
    <thead><tr><th>Item</th><th class="r" style="text-align:center">Qty</th><th class="r">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <hr class="divider">
  <table><tbody>
    <tr class="sub-row"><td>Subtotal</td><td style="text-align:right">₦${r.subtotal.toFixed(2)}</td></tr>
    ${r.discount > 0 ? `<tr class="sub-row"><td>Discount</td><td style="text-align:right;color:#c00">-₦${r.discount.toFixed(2)}</td></tr>` : ""}
    ${r.taxAmount > 0 ? `<tr class="sub-row"><td>Tax</td><td style="text-align:right">+₦${r.taxAmount.toFixed(2)}</td></tr>` : ""}
    <tr class="total-row"><td>TOTAL</td><td style="text-align:right;color:#0D9488">₦${r.total.toFixed(2)}</td></tr>
  </tbody></table>
  ${r.notes ? `<hr class="divider"><p style="color:#888;font-size:11px">Note: ${r.notes}</p>` : ""}
  <hr class="divider">
  <p class="center" style="color:#aaa;font-size:11px;margin-top:6px">Thank you for your patronage!</p>
  <p class="center" style="color:#ccc;font-size:10px;margin-top:2px">Powered by Unistocker</p>
  </body></html>`;
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  receipt: ReceiptData;
  onClose: () => void;
  onNewSale?: () => void;
}

export function SaleReceipt({ receipt, onClose, onNewSale }: Props) {
  const [shareState, setShareState] = useState<"idle" | "loading" | "copied" | "downloaded">("idle");

  const handlePrint = useCallback(() => {
    const win = window.open("", "_blank", "width=480,height=700");
    if (!win) return;
    win.document.write(buildReceiptHTML(receipt));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }, [receipt]);

  const handleShare = useCallback(async () => {
    setShareState("loading");
    try {
      const blob = await buildReceiptImage(receipt);
      const file = new File([blob], `receipt-${receipt.receiptNumber}.png`, { type: "image/png" });

      // Try Web Share API with files (works on Android + iOS 15+)
      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `Receipt ${receipt.receiptNumber}`, files: [file] });
        setShareState("idle");
        return;
      }

      // Fallback: download the PNG
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receipt.receiptNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShareState("downloaded");
      setTimeout(() => setShareState("idle"), 2500);
    } catch (err) {
      if ((err as Error).name === "AbortError") { setShareState("idle"); return; }
      // Last resort: copy text
      try {
        await navigator.clipboard.writeText(buildReceiptText(receipt));
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2500);
      } catch {
        setShareState("idle");
      }
    }
  }, [receipt]);

  const dateStr = format(receipt.createdAt, "d MMM yyyy, h:mm a");

  const shareLabel =
    shareState === "loading" ? "Generating…" :
    shareState === "copied" ? "Copied!" :
    shareState === "downloaded" ? "Downloaded!" :
    "Share";

  return (
    <div className="uni-overlay" style={{ alignItems: "flex-start", paddingTop: 24 }}>
      <div className="uni-overlay-backdrop" onClick={onClose} />
      <div className="uni-modal" style={{ maxWidth: 440 }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Sale Receipt</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        {/* Receipt body */}
        <div style={{ padding: "20px 24px", fontFamily: "'Courier New', monospace" }}>
          {/* App + Org */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.12em", margin: 0 }}>UNISTOCKER</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: "4px 0 2px" }}>{receipt.organizationName}</p>
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>Sales Receipt</p>
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
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "2px 12px", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <p style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>{item.name}</p>
                  <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>₦{item.unitPrice.toFixed(2)} / pc</p>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, textAlign: "right", alignSelf: "center" }}>×{item.quantity}</p>
                <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, margin: 0, textAlign: "right", alignSelf: "center" }}>₦{item.total.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Subtotals */}
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
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-3)", margin: 0 }}>Thank you for your patronage!</p>
          <p style={{ textAlign: "center", fontSize: 10, color: "var(--text-3)", opacity: 0.6, margin: "4px 0 0" }}>Powered by Unistocker</p>
        </div>

        {/* Actions */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
          <button onClick={handlePrint} className="uni-btn uni-btn-ghost" style={{ flex: 1, gap: 6 }}>
            <Printer size={15} /> Print
          </button>
          <button
            onClick={handleShare}
            disabled={shareState === "loading"}
            className="uni-btn uni-btn-ghost"
            style={{ flex: 1, gap: 6, color: shareState !== "idle" && shareState !== "loading" ? "var(--accent)" : undefined }}
          >
            {shareState === "downloaded" ? <><Download size={15} /> {shareLabel}</> : <><Share2 size={15} /> {shareLabel}</>}
          </button>
          {onNewSale && (
            <button onClick={onNewSale} className="uni-btn uni-btn-primary" style={{ flex: 1 }}>
              New Sale
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
