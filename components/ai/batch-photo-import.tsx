"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, CheckCircle, XCircle, Save, SkipForward, Camera } from "lucide-react";

const MAX_PHOTOS = 20;

interface PhotoResult {
  name?: string;
  description?: string;
  category?: string;
  suggestedSellingPrice?: number;
  suggestedCostPrice?: number;
  barcode?: string | null;
  unit?: string;
  confidence?: number;
  notes?: string;
  error?: string;
}

interface BatchRow {
  file: File;
  preview: string;
  status: "pending" | "analysing" | "done" | "error";
  result?: PhotoResult;
  imageUrl?: string;
  name: string;
  category: string;
  sellingPrice: string;
  costPrice: string;
  skipped: boolean;
}

export function BatchPhotoImport({ categories }: { categories: { id: string; name: string }[] }) {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    const newRows: BatchRow[] = Array.from(files)
      .slice(0, MAX_PHOTOS - rows.length)
      .map((f) => ({
        file: f,
        preview: URL.createObjectURL(f),
        status: "pending",
        name: "",
        category: "",
        sellingPrice: "",
        costPrice: "",
        skipped: false,
      }));
    setRows((prev) => [...prev, ...newRows]);
  };

  const processAll = async () => {
    setProcessing(true);
    setProgress(0);
    const pending = rows.filter((r) => r.status === "pending" || r.status === "error");

    for (let i = 0; i < pending.length; i++) {
      const row = pending[i];
      const idx = rows.findIndex((r) => r.preview === row.preview);

      setRows((prev) => prev.map((r, j) => j === idx ? { ...r, status: "analysing" } : r));

      try {
        const fd = new FormData();
        fd.append("image", row.file);
        const res = await fetch("/api/ai/photo-entry", { method: "POST", body: fd });
        const data = await res.json();

        if (!res.ok || data.result?.error) {
          setRows((prev) => prev.map((r, j) => j === idx ? { ...r, status: "error" } : r));
        } else {
          setRows((prev) => prev.map((r, j) =>
            j === idx ? {
              ...r, status: "done", result: data.result, imageUrl: data.imageUrl,
              name: data.result.name ?? "",
              category: data.result.category ?? "",
              sellingPrice: data.result.suggestedSellingPrice ? String(data.result.suggestedSellingPrice) : "",
              costPrice: data.result.suggestedCostPrice ? String(data.result.suggestedCostPrice) : "",
            } : r
          ));
        }
      } catch {
        setRows((prev) => prev.map((r, j) => j === idx ? { ...r, status: "error" } : r));
      }

      setProgress(Math.round(((i + 1) / pending.length) * 100));
      await new Promise((r) => setTimeout(r, 300));
    }

    setProcessing(false);
  };

  const saveAll = async () => {
    setSaving(true);
    const toSave = rows.filter((r) => r.status === "done" && !r.skipped && r.name);

    for (const row of toSave) {
      try {
        const fd = new FormData();
        fd.append("name", row.name);
        fd.append("sku", `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`);
        fd.append("description", row.result?.description ?? "");
        fd.append("costPrice", row.costPrice || "0");
        fd.append("sellingPrice", row.sellingPrice || "0");
        fd.append("quantity", "0");
        fd.append("lowStockAlert", "10");
        if (row.result?.barcode) fd.append("barcode", row.result.barcode);
        if (row.imageUrl) fd.append("imageUrl", row.imageUrl);

        await fetch("/api/products", { method: "POST", body: fd });
      } catch {
        console.error("Failed to save:", row.name);
      }
    }

    setSaving(false);
    window.location.href = "/inventory";
  };

  const doneCount = rows.filter((r) => r.status === "done" && !r.skipped).length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Batch Photo Import</h2>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>Upload up to 20 product photos — AI will extract details for each</p>
      </div>

      {/* Upload zone */}
      {rows.length < MAX_PHOTOS && (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed var(--border-2)", borderRadius: 12, padding: "32px 20px",
            textAlign: "center", cursor: "pointer", background: "var(--bg-input)",
            transition: "all 0.15s",
          }}
          className="upload-zone"
        >
          <style>{`.upload-zone:hover{border-color:var(--accent)!important;background:var(--accent-sub)!important}`}</style>
          <Camera size={28} style={{ color: "var(--accent)", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>Drop product photos here</p>
          <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
            Or click to browse · Max {MAX_PHOTOS} photos · JPG, PNG, WEBP
            {rows.length > 0 && ` · ${MAX_PHOTOS - rows.length} remaining`}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
          />
        </div>
      )}

      {/* Progress */}
      {processing && (
        <div>
          <div style={{ height: 6, background: "var(--bg-input)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--accent)", width: `${progress}%`, transition: "width 0.3s", borderRadius: 99 }} />
          </div>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>Processing {progress}%…</p>
        </div>
      )}

      {/* Actions */}
      {rows.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={processAll}
            disabled={processing || rows.every((r) => r.status === "done" || r.status === "analysing")}
            className="uni-btn uni-btn-primary"
          >
            {processing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {processing ? `Analysing… (${progress}%)` : "Analyse All"}
          </button>
          {doneCount > 0 && (
            <button onClick={saveAll} disabled={saving} className="uni-btn uni-btn-ghost" style={{ color: "#22c55e", borderColor: "rgba(34,197,94,0.3)" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save {doneCount} Products
            </button>
          )}
        </div>
      )}

      {/* Review table */}
      {rows.length > 0 && (
        <div className="uni-card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="uni-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Selling Price (₦)</th>
                  <th>Cost Price (₦)</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th>Skip</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ opacity: row.skipped ? 0.4 : 1 }}>
                    <td>
                      <img src={row.preview} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />
                    </td>
                    <td>
                      <input
                        value={row.name}
                        onChange={(e) => setRows((prev) => prev.map((r, j) => j === i ? { ...r, name: e.target.value } : r))}
                        className="uni-input"
                        style={{ fontSize: 12, padding: "5px 8px" }}
                        placeholder="Product name"
                        disabled={row.status === "analysing" || row.skipped}
                      />
                    </td>
                    <td>
                      <select
                        value={row.category}
                        onChange={(e) => setRows((prev) => prev.map((r, j) => j === i ? { ...r, category: e.target.value } : r))}
                        className="uni-input"
                        style={{ fontSize: 12, padding: "5px 8px" }}
                        disabled={row.status === "analysing" || row.skipped}
                      >
                        <option value="">— Select —</option>
                        {["Food & Beverages", "Electronics", "Clothing", "Household", "Cosmetics & Beauty", "Stationery", "Pharmaceuticals", "Automotive", "Agriculture", "Other"].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.sellingPrice}
                        onChange={(e) => setRows((prev) => prev.map((r, j) => j === i ? { ...r, sellingPrice: e.target.value } : r))}
                        className="uni-input"
                        style={{ fontSize: 12, padding: "5px 8px", width: 100 }}
                        disabled={row.status === "analysing" || row.skipped}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.costPrice}
                        onChange={(e) => setRows((prev) => prev.map((r, j) => j === i ? { ...r, costPrice: e.target.value } : r))}
                        className="uni-input"
                        style={{ fontSize: 12, padding: "5px 8px", width: 100 }}
                        disabled={row.status === "analysing" || row.skipped}
                      />
                    </td>
                    <td>
                      {row.result?.confidence !== undefined && (
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 8,
                          background: (row.result.confidence ?? 0) > 0.7 ? "rgba(34,197,94,0.10)" : (row.result.confidence ?? 0) >= 0.4 ? "rgba(245,158,11,0.10)" : "rgba(239,68,68,0.10)",
                          color: (row.result.confidence ?? 0) > 0.7 ? "#22c55e" : (row.result.confidence ?? 0) >= 0.4 ? "#f59e0b" : "#ef4444",
                        }}>
                          {Math.round((row.result.confidence ?? 0) * 100)}%
                        </span>
                      )}
                    </td>
                    <td>
                      {row.status === "pending" && <span style={{ fontSize: 12, color: "var(--text-3)" }}>Pending</span>}
                      {row.status === "analysing" && <Loader2 size={14} className="animate-spin" style={{ color: "var(--accent)" }} />}
                      {row.status === "done" && <CheckCircle size={16} style={{ color: "#22c55e" }} />}
                      {row.status === "error" && <XCircle size={16} style={{ color: "var(--danger)" }} />}
                    </td>
                    <td>
                      <button
                        onClick={() => setRows((prev) => prev.map((r, j) => j === i ? { ...r, skipped: !r.skipped } : r))}
                        className="uni-btn uni-btn-ghost"
                        style={{ fontSize: 12, padding: "4px 8px" }}
                      >
                        <SkipForward size={12} /> {row.skipped ? "Restore" : "Skip"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {errorCount > 0 && (
        <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.18)" }}>
          <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>
            {errorCount} photo{errorCount !== 1 ? "s" : ""} couldn&apos;t be read. Try clearer images or remove and fill manually.
          </p>
        </div>
      )}
    </div>
  );
}
