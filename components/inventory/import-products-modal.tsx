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
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
      >
        <Upload size={15} /> Import
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto z-10 flex flex-col">

            {/* ── Modal header ── */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-5 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center shrink-0">
                  <Upload size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Import Products</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Add products in bulk from a CSV file</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Body ── */}
            <div className="p-5 sm:p-6 space-y-4 flex-1">

              {/* Step 1 — Download template */}
              <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Download the CSV template
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Start with our template to guarantee the correct column format. Two sample rows are included.
                  </p>
                  <button
                    onClick={handleTemplateDownload}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                  >
                    <Download size={13} />
                    product-import-template.csv
                  </button>
                </div>
              </div>

              {/* Step 2 — Column reference (collapsible) */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setGuideOpen(!guideOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      2
                    </span>
                    <span>Column reference</span>
                    <span className="text-xs text-gray-400 font-normal hidden sm:inline">
                      — {FIELD_GUIDE.filter((f) => f.req).length} required · {FIELD_GUIDE.filter((f) => !f.req).length} optional
                    </span>
                  </div>
                  {guideOpen
                    ? <ChevronUp size={15} className="text-gray-400 shrink-0" />
                    : <ChevronDown size={15} className="text-gray-400 shrink-0" />}
                </button>

                {guideOpen && (
                  <div className="border-t border-gray-200 dark:border-gray-800 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-medium">Column</th>
                          <th className="text-left px-4 py-2.5 font-medium">Required</th>
                          <th className="text-left px-4 py-2.5 font-medium">Description</th>
                          <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Example</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {FIELD_GUIDE.map((f) => (
                          <tr key={f.col} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                            <td className="px-4 py-2.5">
                              <code className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                                {f.col}
                              </code>
                            </td>
                            <td className="px-4 py-2.5">
                              {f.req
                                ? <span className="font-semibold text-red-500">Yes</span>
                                : <span className="text-gray-400">No</span>}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{f.desc}</td>
                            <td className="px-4 py-2.5 text-gray-400 font-mono hidden sm:table-cell">{f.ex}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Step 3 — Upload */}
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upload your file
                  </span>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
                    dragging
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                      : file
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  }`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={32} className="text-emerald-500" />
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB · Click to replace
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={32} className="text-gray-300 dark:text-gray-600" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Drop your CSV file here
                      </p>
                      <p className="text-xs text-gray-400">or click to browse — .csv files only, max 5 MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview table (after file selected, before import) */}
              {preview && !result && (
                <div className="space-y-3">
                  {preview.missingRequired.length > 0 && (
                    <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
                      <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                          Missing required columns
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-500 mt-1 flex flex-wrap gap-1">
                          {preview.missingRequired.map((c) => (
                            <code key={c} className="font-mono bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded">
                              {c}
                            </code>
                          ))}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{preview.totalRows} rows</span> detected
                      {preview.rows.length > 0 && ` — preview of first ${preview.rows.length}`}
                    </p>
                    {preview.missingRequired.length === 0 && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle size={13} /> Columns look good
                      </span>
                    )}
                  </div>

                  {preview.rows.length > 0 && (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400">
                            <tr>
                              {preview.headers.map((h, i) => (
                                <th key={i} className="text-left px-3 py-2.5 font-medium whitespace-nowrap">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {preview.rows.map((row, ri) => (
                              <tr key={ri} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                {row.map((cell, ci) => (
                                  <td key={ci} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                    {cell || <span className="text-gray-300 dark:text-gray-600 italic">empty</span>}
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

              {/* Import result */}
              {result && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl">
                    <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                        Import complete
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {result.created} product{result.created !== 1 ? "s" : ""} added to inventory
                        {result.skipped.length > 0 &&
                          ` · ${result.skipped.length} row${result.skipped.length !== 1 ? "s" : ""} skipped`}
                      </p>
                    </div>
                  </div>

                  {result.skipped.length > 0 && (
                    <div className="border border-amber-200 dark:border-amber-900 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900">
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                          Skipped rows — {result.skipped.length} issue{result.skipped.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-44 overflow-y-auto">
                        {result.skipped.map((s, i) => (
                          <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-xs">
                            <span className="text-gray-400 shrink-0 tabular-nums">Row {s.row}</span>
                            <code className="font-mono text-gray-600 dark:text-gray-400 truncate">{s.sku}</code>
                            <span className="text-red-500 shrink-0">{s.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-5 sm:px-6 py-4 flex items-center justify-between gap-3 rounded-b-2xl">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {result ? "Done" : "Cancel"}
              </button>

              {!result && (
                <button
                  onClick={handleImport}
                  disabled={!canImport}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 text-white rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed"
                >
                  {status === "importing" ? (
                    <><Loader2 size={15} className="animate-spin" /> Importing…</>
                  ) : (
                    <>
                      <Upload size={15} />
                      {preview && preview.missingRequired.length === 0 && preview.totalRows > 0
                        ? `Import ${preview.totalRows} product${preview.totalRows !== 1 ? "s" : ""}`
                        : "Import products"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
