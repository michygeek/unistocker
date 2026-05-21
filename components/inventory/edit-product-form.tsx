"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProduct } from "@/lib/actions/products";
import { useRouter } from "next/navigation";
import { Loader2, Upload, ArrowLeft, Camera } from "lucide-react";
import Link from "next/link";
import { BarcodeScanner } from "@/components/inventory/barcode-scanner";

const schema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  description: z.string().optional(),
  costPrice: z.coerce.number().positive(),
  sellingPrice: z.coerce.number().positive(),
  quantity: z.coerce.number().int().min(0),
  lowStockAlert: z.coerce.number().int().min(0),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
});

interface Props {
  product: {
    id: string; name: string; sku: string; description: string;
    costPrice: number; sellingPrice: number; quantity: number;
    lowStockAlert: number; barcode: string; categoryId: string; imageUrl: string | null;
  };
  categories: { id: string; name: string }[];
}

export function EditProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(product.imageUrl);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product.name, sku: product.sku, description: product.description,
      costPrice: product.costPrice, sellingPrice: product.sellingPrice,
      quantity: product.quantity, lowStockAlert: product.lowStockAlert,
      barcode: product.barcode, categoryId: product.categoryId,
    },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setServerError("");
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== "") fd.append(k, String(v)); });
    const imgInput = document.getElementById("edit-product-image") as HTMLInputElement;
    if (imgInput?.files?.[0]) fd.append("image", imgInput.files[0]);
    const result = await updateProduct(product.id, fd);
    if (result && "error" in result) {
      const err = result.error;
      setServerError(typeof err === "string" ? err : Object.values(err as Record<string, string[]>).flat()[0] ?? "Failed to save");
    } else {
      router.push(`/inventory/${product.id}`);
      router.refresh();
    }
  };

  const fields: Array<{ name: keyof z.infer<typeof schema>; label: string; type: string; colSpan: boolean }> = [
    { name: "name",          label: "Product Name",        type: "text",   colSpan: true  },
    { name: "sku",           label: "SKU",                 type: "text",   colSpan: false },
    { name: "costPrice",     label: "Cost Price (₦)",      type: "number", colSpan: false },
    { name: "sellingPrice",  label: "Selling Price (₦)",   type: "number", colSpan: false },
    { name: "quantity",      label: "Stock Quantity",      type: "number", colSpan: false },
    { name: "lowStockAlert", label: "Low Stock Threshold", type: "number", colSpan: false },
  ];

  return (
    <>
      {scannerOpen && (
        <BarcodeScanner
          onScan={(code) => { setValue("barcode", code); setScannerOpen(false); }}
          onClose={() => setScannerOpen(false)}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="uni-card" style={{ overflow: "hidden" }}>
        {/* Sticky header */}
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--bg-card)",
        }}>
          <Link href={`/inventory/${product.id}`} style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "var(--text-2)", textDecoration: "none",
            transition: "color 0.15s",
          }}>
            <ArrowLeft size={14} /> Back
          </Link>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Edit Product</h2>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Image upload */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <label htmlFor="edit-product-image" style={{ cursor: "pointer" }}>
              <div style={{
                width: 88, height: 88, borderRadius: 16,
                border: "2px dashed var(--border-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", background: "var(--bg-input)", transition: "border-color 0.15s",
              }}>
                {preview ? (
                  <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <Upload size={20} style={{ color: "var(--text-3)", margin: "0 auto" }} />
                    <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>Upload</p>
                  </div>
                )}
              </div>
              <input
                id="edit-product-image" type="file" style={{ display: "none" }} accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPreview(URL.createObjectURL(f));
                }}
              />
            </label>
          </div>

          {/* Fields grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {fields.map((f) => (
              <div key={f.name} style={f.colSpan ? { gridColumn: "1 / -1" } : {}}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                  {f.label}
                </label>
                <input
                  {...register(f.name)}
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
              <textarea {...register("description")} rows={2} className="uni-input" style={{ resize: "none" }} />
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

          {serverError && (
            <p style={{ fontSize: 13, color: "var(--danger)", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>
              {serverError}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <Link
              href={`/inventory/${product.id}`}
              className="uni-btn uni-btn-ghost"
              style={{ flex: 1, textDecoration: "none", textAlign: "center" }}
            >
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting} className="uni-btn uni-btn-primary" style={{ flex: 1 }}>
              {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
