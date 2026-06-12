"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";

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

interface Props {
  onResult: (result: PhotoResult, imageUrl: string) => void;
}

export function PhotoEntryButton({ onResult }: Props) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setError(null);
    setPreview(URL.createObjectURL(f));
  };

  const analyse = async () => {
    if (!file) return;
    setAnalysing(true);
    setError(null);

    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/ai/photo-entry", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        return;
      }

      if (data.result?.error) {
        setError("Couldn't read this image — try a clearer photo or fill in manually");
        return;
      }

      onResult(data.result, data.imageUrl);
      setOpen(false);
      setPreview(null);
      setFile(null);
    } catch {
      setError("AI temporarily unavailable — please fill in manually");
    } finally {
      setAnalysing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="uni-btn uni-btn-ghost"
        style={{ fontSize: 13, color: "var(--accent)", borderColor: "var(--accent-sub)" }}
      >
        <Camera size={15} /> Scan Product
      </button>

      {open && (
        <div className="uni-overlay">
          <div className="uni-overlay-backdrop" onClick={() => setOpen(false)} />
          <div className="uni-modal" style={{ maxWidth: 460 }}>
            {/* Header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Scan Product</h2>
              <button onClick={() => { setOpen(false); setPreview(null); setFile(null); setError(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {!preview ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    style={{
                      padding: "28px 16px", borderRadius: 12, border: "2px dashed var(--border-2)",
                      background: "var(--bg-input)", cursor: "pointer", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 8, transition: "all 0.15s",
                    }}
                    className="photo-pick-btn"
                  >
                    <Camera size={28} style={{ color: "var(--accent)" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Take Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: "28px 16px", borderRadius: 12, border: "2px dashed var(--border-2)",
                      background: "var(--bg-input)", cursor: "pointer", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 8, transition: "all 0.15s",
                    }}
                    className="photo-pick-btn"
                  >
                    <Upload size={28} style={{ color: "var(--accent)" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Upload Image</span>
                  </button>
                  <style>{`.photo-pick-btn:hover{border-color:var(--accent)!important;background:var(--accent-sub)!important}`}</style>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  <img src={preview} alt="Product preview" style={{ width: "100%", borderRadius: 12, maxHeight: 260, objectFit: "contain", background: "var(--bg-input)" }} />
                  {analysing && (
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: 12,
                      background: "rgba(0,0,0,0.55)", display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 10,
                    }}>
                      <div style={{ width: 48, height: 48, border: "3px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                      <p style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>AI is reading your product…</p>
                      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setPreview(null); setFile(null); setError(null); }}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: 8, padding: 5, cursor: "pointer", display: "flex" }}
                  >
                    <X size={16} style={{ color: "#fff" }} />
                  </button>
                </div>
              )}

              {error && (
                <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.18)" }}>
                  <AlertCircle size={14} style={{ color: "var(--danger)", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{error}</p>
                </div>
              )}

              {preview && !analysing && (
                <button onClick={analyse} className="uni-btn uni-btn-primary" style={{ width: "100%" }}>
                  <CheckCircle size={15} /> Analyse Product
                </button>
              )}

              {preview && analysing && (
                <button disabled className="uni-btn uni-btn-primary" style={{ width: "100%" }}>
                  <Loader2 size={15} className="animate-spin" /> Analysing…
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
