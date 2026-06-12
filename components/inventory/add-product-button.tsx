"use client";

import { useState } from "react";
import { Plus, X, Loader2, Upload, Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createProduct } from "@/lib/actions/products";
import { useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { BarcodeScanner } from "@/components/inventory/barcode-scanner";
import { PhotoEntryButton } from "@/components/ai/photo-entry-button";

const schema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  description: z.string().optional(),
  costPrice: z.coerce.number().positive(),
  sellingPrice: z.coerce.number().positive(),
  quantity: z.coerce.number().int().min(0),
  lowStockAlert: z.coerce.number().int().min(0).default(10),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
});

export function AddProductButton({ categories, userRole }: { categories: { id: string; name: string }[]; userRole: UserRole }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
  const router = useRouter();

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  if (userRole === "STAFF") return null;

  const onPhotoResult = (result: {
    name?: string; description?: string; category?: string;
    suggestedSellingPrice?: number; suggestedCostPrice?: number;
    barcode?: string | null; confidence?: number;
  }, _imageUrl: string) => {
    const filled = new Set<string>();
    if (result.name) { setValue("name" as never, result.name as never); filled.add("name"); }
    if (result.description) { setValue("description" as never, result.description as never); filled.add("description"); }
    if (result.suggestedSellingPrice) { setValue("sellingPrice" as never, result.suggestedSellingPrice as never); filled.add("sellingPrice"); }
    if (result.suggestedCostPrice) { setValue("costPrice" as never, result.suggestedCostPrice as never); filled.add("costPrice"); }
    if (result.barcode) { setValue("barcode" as never, result.barcode as never); filled.add("barcode"); }
    setAiFilledFields(filled);
    setAiConfidence(result.confidence ?? null);
    setOpen(true);
  };

  const onSubmit = async (data: z.infer<typeof schema>) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== "") fd.append(k, String(v)); });
    const imgInput = document.getElementById("product-image") as HTMLInputElement;
    const imgFile = imgInput?.files?.[0];
    if (imgFile) {
      if (imgFile.size > MAX_IMAGE_BYTES) {
        setImageError("Image exceeds 2 MB limit.");
        return;
      }
      fd.append("image", imgFile);
    }
    const result = await createProduct(fd);
    if ("error" in result) {
      alert(Object.values(result.error as Record<string, string[]>).flat()[0] ?? "Failed");
    } else {
      reset(); setOpen(false); setPreview(null); router.refresh();
    }
  };

  const formFields: Array<{ name: keyof z.infer<typeof schema>; label: string; type: string; colSpan: boolean }> = [
    { name: "name",          label: "Product Name",        type: "text",   colSpan: true  },
    { name: "sku",           label: "SKU",                 type: "text",   colSpan: false },
    { name: "costPrice",     label: "Cost Price (₦)",      type: "number", colSpan: false },
    { name: "sellingPrice",  label: "Selling Price (₦)",   type: "number", colSpan: false },
    { name: "quantity",      label: "Initial Stock",       type: "number", colSpan: false },
    { name: "lowStockAlert", label: "Low Stock Threshold", type: "number", colSpan: false },
  ];

  return (
    <>
      <PhotoEntryButton onResult={onPhotoResult} />
      <button
        onClick={() => setOpen(true)}
        className="uni-btn uni-btn-primary"
      >
        <Plus size={16} /> Add Product
      </button>

      {scannerOpen && (
        <BarcodeScanner
          onScan={(code) => { setValue("barcode", code); setScannerOpen(false); }}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {open && (
        <div className="uni-overlay">
          <div className="uni-overlay-backdrop" onClick={() => setOpen(false)} />
          <div className="uni-modal" style={{ maxWidth: 640 }}>
            {/* Header */}
            <div style={{
              position: "sticky", top: 0, zIndex: 2,
              background: "var(--bg-card)",
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Add New Product</h2>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
              {aiConfidence !== null && aiFilledFields.size > 0 && (
                <div style={{ padding: "8px 14px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--warning)", fontWeight: 600 }}>
                    {Math.round(aiConfidence * 100)}% confidence — please review highlighted fields
                  </span>
                </div>
              )}
              {/* Image upload */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <label htmlFor="product-image" style={{ cursor: "pointer" }}>
                  <div style={{
                    width: 88, height: 88, borderRadius: 16,
                    border: `2px dashed ${imageError ? "var(--danger)" : "var(--border-2)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", transition: "border-color 0.15s",
                    background: "var(--bg-input)",
                  }}>
                    {preview ? (
                      <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <Upload size={20} style={{ color: "var(--text-3)", margin: "0 auto" }} />
                        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>Photo</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="product-image" type="file" style={{ display: "none" }} accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > MAX_IMAGE_BYTES) {
                        setImageError("Image exceeds 2 MB.");
                        e.target.value = ""; setPreview(null); return;
                      }
                      setImageError(""); setPreview(URL.createObjectURL(f));
                    }}
                  />
                </label>
                <p style={{ fontSize: 11, color: imageError ? "var(--danger)" : "var(--text-3)" }}>
                  {imageError || "Max 2 MB · JPG, PNG, WEBP"}
                </p>
              </div>

              {/* Fields grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {formFields.map((f) => (
                  <div key={f.name} style={f.colSpan ? { gridColumn: "1 / -1" } : {}}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                      {f.label}
                    </label>
                    <input
                      {...register(f.name as keyof z.infer<typeof schema>)}
                      type={f.type}
                      step={f.type === "number" ? "0.01" : undefined}
                      className="uni-input"
                    />
                    {errors[f.name] && (
                      <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 3 }}>{String(errors[f.name]?.message)}</p>
                    )}
                  </div>
                ))}

                {/* Barcode */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Barcode</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input {...register("barcode")} type="text" placeholder="Scan or type barcode" className="uni-input" />
                    <button
                      type="button" onClick={() => setScannerOpen(true)}
                      className="uni-btn uni-btn-ghost"
                      style={{ flexShrink: 0, color: "var(--accent)", borderColor: "var(--accent-sub)" }}
                    >
                      <Camera size={15} />
                      <span className="hidden sm:inline">Scan</span>
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Description</label>
                  <textarea
                    {...register("description")}
                    rows={2}
                    className="uni-input"
                    style={{ resize: "none" }}
                  />
                </div>

                {/* Category */}
                {categories.length > 0 && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Category</label>
                    <select {...register("categoryId")} className="uni-input">
                      <option value="">— No category —</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                <button type="button" onClick={() => setOpen(false)} className="uni-btn uni-btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="uni-btn uni-btn-primary" style={{ flex: 1 }}>
                  {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
