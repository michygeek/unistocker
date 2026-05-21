"use client";

import { useState, useRef } from "react";
import {
  Upload, Download, X, FileText,
  AlertCircle, CheckCircle, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { importProducts } from "@/lib/actions/csv";
import { useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATE_COLS = [
  "name", "sku", "selling_price", "cost_price", "quantity",
  "description", "low_stock_alert", "barcode", "category",
];
const SAMPLE_ROWS = [
  ["Groundnut Oil 2L", "OIL-2L-001", "1500", "1200", "50", "Pure groundnut cooking oil", "10", "1234567890", "Oils & Condiments"],
  ["Tomato Paste 70g", "TPASTE-70G", "350", "280", "100", "", "20", "", "Condiments"],
];
const FIELD_GUIDE = [
  { col: "name",            req: true,  desc: "Product name",                             ex: "Groundnut Oil 2L"     },
  { col: "sku",             req: true,  desc: "Unique product code",                      ex: "OIL-2L-001"           },
  { col: "selling_price",   req: true,  desc: "Price customers pay (₦)",                  ex: "1500"                 },
  { col: "cost_price",      req: true,  desc: "Your purchase / production cost (₦)",      ex: "1200"                 },
  { col: "quantity",        req: true,  desc: "Starting stock count",                     ex: "50"                   },
  { col: "description",     req: false, desc: "Short product description",                ex: "Pure cooking oil"     },
  { col: "low_stock_alert", req: false, desc: "Minimum stock threshold (default: 10)",    ex: "10"                   },
  { col: "barcode",         req: false, desc: "Barcode or QR code value",                 ex: "1234567890"           },
  { col: "category",        req: false, desc: "Category name — created automatically if new", ex: "Oils & Condiments" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function triggerDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseCSVPreview(text: string): { headers: string[]; rows: string[][] } {
  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let field = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (inQ && line[i + 1] === '"') { field += '"'; i++; }
        else inQ = !inQ;
      } else if (line[i] === ',' && !inQ) { fields.push(field.trim()); field = ""; }
      else field += line[i];
    }
    fields.push(field.trim());
    return fields;
  };
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  return { headers: parseRow(lines[0]), rows: lines.slice(1, 6).map(parseRow) };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportResult {
  created: number;
  skipped: { row: number; sku: string; reason: string }[];
}

interface ParsedPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
  missingRequired: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImportProductsModal({ userRole }: { userRole: UserRole }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen]           = useState(false);
  const [dragging, setDragging]   = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [file, setFile]           = useState<File | null>(null);
  const [preview, setPreview]     = useState<ParsedPreview | null>(null);
  const [status, setStatus]       = useState<"idle" | "importing" | "done">("idle");
  const [result, setResult]       = useState<ImportResult | null>(null);

  if (userRole === "STAFF") return null;

  // ── Handlers ──

  const handleTemplateDownload = () => {
    const escape = (s: string) => (s.includes(",") ? `"${s}"` : s);
    const csv = "﻿" + [TEMPLATE_COLS, ...SAMPLE_ROWS]
      .map((r) => r.map(escape).join(","))
      .join("\r\n");
    triggerDownload(csv, "product-import-template.csv");
  };

  const handleFileSelect = async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload a .csv file.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert("File exceeds the 5 MB limit.");
      return;
    }
    setFile(f);
    setResult(null);
    setStatus("idle");

    const text = await f.text();
    const { headers, rows } = parseCSVPreview(text);
    const lh = headers.map((h) => h.toLowerCase().replace(/\s+/g, "_"));
    const required = ["name", "sku", "selling_price", "cost_price", "quantity"];
    const missing = required.filter((c) => !lh.includes(c));
    const totalRows = text.split(/\r?\n/).filter((l) => l.trim()).length - 1;
    setPreview({ headers, rows, totalRows: Math.max(0, totalRows), missingRequired: missing });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setStatus("importing");
    const fd = new FormData();
    fd.append("file", file);
    const res = await importProducts(fd);
    if ("error" in res) {
      alert(res.error);
      setStatus("idle");
    } else {
      setResult(res);
      setStatus("done");
      router.refresh();
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setPreview(null);
    setStatus("idle");
    setResult(null);
    setGuideOpen(false);
  };

  const canImport =
    file && preview && preview.missingRequired.length === 0 && status === "idle";

  // ── Render ──

  return (
    <>
      <button onClick={() => setOpen(true)} className="uni-btn uni-btn-ghost">
        <Upload size={15} /> Import
      </button>

      {open && (
        <div className="uni-overlay" style={{ alignItems: "flex-start", paddingTop: 16 }}>
          <div className="uni-overlay-backdrop" onClick={handleClose} />
          <div className="uni-modal" style={{ maxWidth: 640, display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div style={{
              position: "sticky", top: 0, zIndex: 2,
              background: "var(--bg-card)",
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-sub)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Upload size={16} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Import Products</h2>
                  <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>Add products in bulk from a CSV file</p>
                </div>
              </div>
              <button onClick={handleClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>

              {/* Step 1 */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 14, background: "var(--accent-sub)", borderRadius: 12, border: "1px solid var(--accent-glow)" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>1</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>Download the CSV template</p>
                  <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>Start with our template to guarantee the correct column format.</p>
                  <button
                    onClick={handleTemplateDownload}
                    style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    <Download size={13} /> product-import-template.csv
                  </button>
                </div>
              </div>

              {/* Step 2 — Collapsible column guide */}
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                <button
                  onClick={() => setGuideOpen(!guideOpen)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--warning)", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>2</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Column reference</span>
                    <span className="hidden sm:inline" style={{ fontSize: 11, color: "var(--text-3)" }}>
                      — {FIELD_GUIDE.filter((f) => f.req).length} required · {FIELD_GUIDE.filter((f) => !f.req).length} optional
                    </span>
                  </div>
                  {guideOpen ? <ChevronUp size={14} style={{ color: "var(--text-3)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-3)" }} />}
                </button>
                {guideOpen && (
                  <div style={{ borderTop: "1px solid var(--border)", overflowX: "auto" }}>
                    <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--bg-card-2)" }}>
                          {["Column", "Required", "Description", "Example"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: "8px 14px", fontWeight: 600, color: "var(--text-2)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {FIELD_GUIDE.map((f, i) => (
                          <tr key={f.col} style={{ borderBottom: i < FIELD_GUIDE.length - 1 ? "1px solid var(--border)" : "none" }}>
                            <td style={{ padding: "8px 14px" }}>
                              <code style={{ fontFamily: "monospace", fontSize: 11, padding: "2px 6px", borderRadius: 5, background: "var(--accent-sub)", color: "var(--accent)" }}>{f.col}</code>
                            </td>
                            <td style={{ padding: "8px 14px", fontWeight: f.req ? 700 : 400, color: f.req ? "var(--danger)" : "var(--text-3)" }}>
                              {f.req ? "Yes" : "No"}
                            </td>
                            <td style={{ padding: "8px 14px", color: "var(--text-2)" }}>{f.desc}</td>
                            <td style={{ padding: "8px 14px", color: "var(--text-3)", fontFamily: "monospace" }}>{f.ex}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Step 3 — Upload */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#34d399", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>3</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Upload your file</span>
                </div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    cursor: "pointer", borderRadius: 12, padding: 32, textAlign: "center",
                    border: `2px dashed ${dragging ? "var(--accent)" : file ? "#34d399" : "var(--border-2)"}`,
                    background: dragging ? "var(--accent-sub)" : file ? "rgba(52,211,153,0.06)" : "var(--bg-input)",
                    transition: "all 0.15s",
                  }}
                >
                  <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
                  {file ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <FileText size={32} style={{ color: "#34d399" }} />
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{file.name}</p>
                      <p style={{ fontSize: 11, color: "var(--text-3)" }}>{(file.size / 1024).toFixed(1)} KB · Click to replace</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <Upload size={32} style={{ color: "var(--text-3)" }} />
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Drop your CSV file here</p>
                      <p style={{ fontSize: 11, color: "var(--text-3)" }}>or click to browse — .csv files only, max 5 MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              {preview && !result && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {preview.missingRequired.length > 0 && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", borderRadius: 10 }}>
                      <AlertCircle size={15} style={{ color: "var(--danger)", flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)", margin: 0 }}>Missing required columns</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                          {preview.missingRequired.map((c) => (
                            <code key={c} style={{ fontFamily: "monospace", fontSize: 11, padding: "2px 6px", borderRadius: 5, background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}>{c}</code>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                      <span style={{ fontWeight: 700, color: "var(--text)" }}>{preview.totalRows} rows</span> detected
                      {preview.rows.length > 0 && ` — preview of first ${preview.rows.length}`}
                    </p>
                    {preview.missingRequired.length === 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
                        <CheckCircle size={13} /> Columns OK
                      </span>
                    )}
                  </div>
                  {preview.rows.length > 0 && (
                    <div className="uni-card" style={{ overflow: "hidden" }}>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "var(--bg-card-2)" }}>
                              {preview.headers.map((h, i) => (
                                <th key={i} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "var(--text-2)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {preview.rows.map((row, ri) => (
                              <tr key={ri} style={{ borderBottom: ri < preview.rows.length - 1 ? "1px solid var(--border)" : "none" }}>
                                {row.map((cell, ci) => (
                                  <td key={ci} style={{ padding: "7px 12px", color: cell ? "var(--text)" : "var(--text-3)", fontStyle: cell ? "normal" : "italic", whiteSpace: "nowrap" }}>
                                    {cell || "empty"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Result */}
              {result && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, background: "var(--accent-sub)", border: "1px solid var(--accent-glow)", borderRadius: 12 }}>
                    <CheckCircle size={18} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>Import complete</p>
                      <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>
                        {result.created} product{result.created !== 1 ? "s" : ""} added
                        {result.skipped.length > 0 && ` · ${result.skipped.length} row${result.skipped.length !== 1 ? "s" : ""} skipped`}
                      </p>
                    </div>
                  </div>
                  {result.skipped.length > 0 && (
                    <div className="uni-card" style={{ overflow: "hidden" }}>
                      <div style={{ padding: "10px 16px", background: "rgba(245,158,11,0.08)", borderBottom: "1px solid var(--border)" }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--warning)", margin: 0 }}>
                          Skipped — {result.skipped.length} issue{result.skipped.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div style={{ maxHeight: 176, overflowY: "auto" }}>
                        {result.skipped.map((s, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", fontSize: 12, borderBottom: i < result.skipped.length - 1 ? "1px solid var(--border)" : "none" }}>
                            <span style={{ color: "var(--text-3)", flexShrink: 0 }}>Row {s.row}</span>
                            <code style={{ fontFamily: "monospace", color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis" }}>{s.sku}</code>
                            <span style={{ color: "var(--danger)", flexShrink: 0 }}>{s.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              position: "sticky", bottom: 0, zIndex: 2,
              background: "var(--bg-card)",
              borderTop: "1px solid var(--border)",
              padding: "14px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
              borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
            }}>
              <button onClick={handleClose} className="uni-btn uni-btn-ghost">
                {result ? "Done" : "Cancel"}
              </button>
              {!result && (
                <button onClick={handleImport} disabled={!canImport} className="uni-btn uni-btn-primary">
                  {status === "importing"
                    ? <><Loader2 size={14} className="animate-spin" /> Importing…</>
                    : <>
                        <Upload size={14} />
                        {preview && preview.missingRequired.length === 0 && preview.totalRows > 0
                          ? `Import ${preview.totalRows} product${preview.totalRows !== 1 ? "s" : ""}`
                          : "Import products"}
                      </>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
