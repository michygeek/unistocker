"use client";

import { useState } from "react";
import { Plus, X, Loader2, Upload, Camera } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
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
  cartons: z.coerce.number().int().min(0).default(0),
  pieces: z.coerce.number().int().min(0).default(0),
  quantity: z.coerce.number().int().min(0).optional(),
  lowStockAlert: z.coerce.number().int().min(0).default(10),
  piecesPerCarton: z.coerce.number().int().min(1).optional(),
  expirationDate: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function AddProductButton({ categories, userRole }: { categories: { id: string; name: string }[]; userRole: UserRole }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
  const router = useRouter();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { cartons: 0, pieces: 0, lowStockAlert: 10 },
  });

  const piecesPerCarton = watch("piecesPerCarton");
  const hasCartons = piecesPerCarton && piecesPerCarton >= 1;

  if (userRole === "STAFF") return null;

  const onPhotoResult = (result: {
    name?: string; description?: string; category?: string;
    suggestedSellingPrice?: number; suggestedCostPrice?: number;
    barcode?: string | null; confidence?: number;
  }, _imageUrl: string) => {
    const filled = new Set<string>();
    if (result.name) { setValue("name", result.name); filled.add("name"); }
    if (result.description) { setValue("description", result.description); filled.add("description"); }
    if (result.suggestedSellingPrice) { setValue("sellingPrice", result.suggestedSellingPrice); filled.add("sellingPrice"); }
    if (result.suggestedCostPrice) { setValue("costPrice", result.suggestedCostPrice); filled.add("costPrice"); }
    if (result.barcode) { setValue("barcode", result.barcode); filled.add("barcode"); }
    setAiFilledFields(filled);
    setAiConfidence(result.confidence ?? null);
    setOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const fd = new FormData();
    // Compute total pieces from carton+pieces if piecesPerCarton is set
    const ppc = data.piecesPerCarton ?? 0;
    const totalQty = ppc > 0
      ? (data.cartons ?? 0) * ppc + (data.pieces ?? 0)
      : (data.quantity ?? 0);

    const submitData: Record<string, string> = {
      name: data.name,
      sku: data.sku,
      costPrice: String(data.costPrice),
      sellingPrice: String(data.sellingPrice),
      quantity: String(totalQty),
      lowStockAlert: String(data.lowStockAlert),
    };
    if (data.description) submitData.description = data.description;
    if (data.barcode) submitData.barcode = data.barcode;
    if (data.categoryId) submitData.categoryId = data.categoryId;
    if (ppc > 0) submitData.piecesPerCarton = String(ppc);
    if (data.expirationDate) submitData.expirationDate = data.expirationDate;

    Object.entries(submitData).forEach(([k, v]) => fd.append(k, v));

    const imgInput = document.getElementById("product-image") as HTMLInputElement;
    const imgFile = imgInput?.files?.[0];
    if (imgFile) {
      if (imgFile.size > MAX_IMAGE_BYTES) { setImageError("Image exceeds 2 MB limit."); return; }
      fd.append("image", imgFile);
    }
    const result = await createProduct(fd);
    if ("error" in result) {
      alert(Object.values(result.error as Record<string, string[]>).flat()[0] ?? "Failed");
    } else {
      reset(); setOpen(false); setPreview(null); router.refresh();
    }
  };

  return (
    <>
      <PhotoEntryButton onResult={onPhotoResult} />
      <button onClick={() => setOpen(true)} className="uni-btn uni-btn-primary">
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
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Add New Product</h2>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {aiConfidence !== null && aiFilledFields.size > 0 && (
                <div style={{ padding: "8px 14px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--warning)", fontWeight: 600 }}>
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
                    overflow: "hidden", background: "var(--bg-input)",
                  }}>
                    {preview ? (
                      <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <Upload size={20} style={{ color: "var(--text-3)", margin: "0 auto" }} />
                        <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Photo</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="product-image" type="file" style={{ display: "none" }} accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > MAX_IMAGE_BYTES) { setImageError("Image exceeds 2 MB."); e.target.value = ""; setPreview(null); return; }
                      setImageError(""); setPreview(URL.createObjectURL(f));
                    }}
                  />
                </label>
                <p style={{ fontSize: 12, color: imageError ? "var(--danger)" : "var(--text-3)" }}>
                  {imageError || "Max 2 MB · JPG, PNG, WEBP"}
                </p>
              </div>

              {/* Fields grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* Name */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Product Name</label>
                  <input {...register("name")} type="text" className="uni-input" style={{ background: aiFilledFields.has("name") ? "rgba(245,158,11,0.06)" : undefined }} />
                  {errors.name && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 3 }}>{errors.name.message}</p>}
                </div>

                {/* SKU */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>SKU</label>
                  <input {...register("sku")} type="text" className="uni-input" />
                  {errors.sku && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 3 }}>{errors.sku.message}</p>}
                </div>

                {/* Pieces per carton */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Pieces per Carton</label>
                  <input {...register("piecesPerCarton")} type="number" min={1} placeholder="e.g. 12" className="uni-input" />
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>Leave blank if no carton</p>
                </div>

                {/* Cost Price */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Cost Price (₦)</label>
                  <input {...register("costPrice")} type="number" step="0.01" className="uni-input" style={{ background: aiFilledFields.has("costPrice") ? "rgba(245,158,11,0.06)" : undefined }} />
                  {errors.costPrice && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 3 }}>{errors.costPrice.message}</p>}
                </div>

                {/* Selling Price */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Selling Price (₦)</label>
                  <input {...register("sellingPrice")} type="number" step="0.01" className="uni-input" style={{ background: aiFilledFields.has("sellingPrice") ? "rgba(245,158,11,0.06)" : undefined }} />
                  {errors.sellingPrice && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 3 }}>{errors.sellingPrice.message}</p>}
                </div>

                {/* Initial Stock — carton+pieces if piecesPerCarton is set */}
                {hasCartons ? (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Initial Stock — Cartons</label>
                      <input {...register("cartons")} type="number" min={0} className="uni-input" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>+ Loose Pieces</label>
                      <input {...register("pieces")} type="number" min={0} max={piecesPerCarton - 1} className="uni-input" />
                    </div>
                  </>
                ) : (
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Initial Stock (pieces)</label>
                    <input {...register("quantity")} type="number" min={0} className="uni-input" />
                  </div>
                )}

                {/* Low Stock Alert */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Low Stock Threshold</label>
                  <input {...register("lowStockAlert")} type="number" min={0} className="uni-input" />
                </div>

                {/* Expiration Date */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Expiration Date</label>
                  <input {...register("expirationDate")} type="date" className="uni-input" />
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>Optional — alerts at 2 & 1 month</p>
                </div>

                {/* Barcode */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Barcode</label>
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
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Description</label>
                  <textarea {...register("description")} rows={2} className="uni-input" style={{ resize: "none", background: aiFilledFields.has("description") ? "rgba(245,158,11,0.06)" : undefined }} />
                </div>

                {/* Category */}
                {categories.length > 0 && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Category</label>
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
