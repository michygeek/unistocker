"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProduct } from "@/lib/actions/products";
import { useRouter } from "next/navigation";
import { Loader2, Upload, ArrowLeft, Camera } from "lucide-react";
import Link from "next/link";
import { BarcodeScanner } from "@/components/inventory/barcode-scanner";
import { format } from "date-fns";

const schema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  description: z.string().optional(),
  costPrice: z.coerce.number().positive(),
  sellingPrice: z.coerce.number().positive(),
  cartons: z.coerce.number().int().min(0).default(0),
  pieces: z.coerce.number().int().min(0).default(0),
  quantity: z.coerce.number().int().min(0).optional(),
  lowStockAlert: z.coerce.number().int().min(0),
  piecesPerCarton: z.coerce.number().int().min(1).optional(),
  expirationDate: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  product: {
    id: string; name: string; sku: string; description: string;
    costPrice: number; sellingPrice: number; quantity: number;
    lowStockAlert: number; piecesPerCarton: number | null;
    expirationDate: Date | null;
    barcode: string; categoryId: string; imageUrl: string | null;
  };
  categories: { id: string; name: string }[];
}

export function EditProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(product.imageUrl);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [serverError, setServerError] = useState("");

  const ppc = product.piecesPerCarton ?? 0;
  const initCartons = ppc > 0 ? Math.floor(product.quantity / ppc) : 0;
  const initPieces = ppc > 0 ? product.quantity % ppc : product.quantity;

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: product.name, sku: product.sku, description: product.description,
      costPrice: product.costPrice, sellingPrice: product.sellingPrice,
      cartons: initCartons, pieces: initPieces, quantity: product.quantity,
      lowStockAlert: product.lowStockAlert,
      piecesPerCarton: product.piecesPerCarton ?? undefined,
      expirationDate: product.expirationDate
        ? format(new Date(product.expirationDate), "yyyy-MM-dd")
        : "",
      barcode: product.barcode, categoryId: product.categoryId,
    },
  });

  const piecesPerCarton = watch("piecesPerCarton");
  const hasCartons = piecesPerCarton && piecesPerCarton >= 1;

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    const fd = new FormData();
    const ppcVal = data.piecesPerCarton ?? 0;
    const totalQty = ppcVal > 0
      ? (data.cartons ?? 0) * ppcVal + (data.pieces ?? 0)
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
    if (ppcVal > 0) submitData.piecesPerCarton = String(ppcVal);
    if (data.expirationDate) submitData.expirationDate = data.expirationDate;

    Object.entries(submitData).forEach(([k, v]) => fd.append(k, v));

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
            fontSize: 14, color: "var(--text-2)", textDecoration: "none",
          }}>
            <ArrowLeft size={14} /> Back
          </Link>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Edit Product</h2>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Image upload */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <label htmlFor="edit-product-image" style={{ cursor: "pointer" }}>
              <div style={{
                width: 88, height: 88, borderRadius: 16,
                border: "2px dashed var(--border-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", background: "var(--bg-input)",
              }}>
                {preview ? (
                  <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <Upload size={20} style={{ color: "var(--text-3)", margin: "0 auto" }} />
                    <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Upload</p>
                  </div>
                )}
              </div>
              <input
                id="edit-product-image" type="file" style={{ display: "none" }} accept="image/*"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }}
              />
            </label>
          </div>

          {/* Fields grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Name */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Product Name</label>
              <input {...register("name")} type="text" className="uni-input" />
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
              <input {...register("costPrice")} type="number" step="0.01" className="uni-input" />
              {errors.costPrice && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 3 }}>{errors.costPrice.message}</p>}
            </div>

            {/* Selling Price */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Selling Price (₦)</label>
              <input {...register("sellingPrice")} type="number" step="0.01" className="uni-input" />
              {errors.sellingPrice && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 3 }}>{errors.sellingPrice.message}</p>}
            </div>

            {/* Stock — carton+pieces if piecesPerCarton is set */}
            {hasCartons ? (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Stock — Cartons</label>
                  <input {...register("cartons")} type="number" min={0} className="uni-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>+ Loose Pieces</label>
                  <input {...register("pieces")} type="number" min={0} max={piecesPerCarton - 1} className="uni-input" />
                </div>
              </>
            ) : (
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Stock Quantity (pieces)</label>
                <input {...register("quantity")} type="number" min={0} className="uni-input" />
              </div>
            )}

            {/* Low Stock Alert */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Low Stock Threshold</label>
              <input {...register("lowStockAlert")} type="number" min={0} className="uni-input" />
              {errors.lowStockAlert && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 3 }}>{errors.lowStockAlert.message}</p>}
            </div>

            {/* Expiration Date */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Expiration Date</label>
              <input {...register("expirationDate")} type="date" className="uni-input" />
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>Alerts at 2 & 1 month before</p>
            </div>

            {/* Barcode */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Barcode</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input {...register("barcode")} type="text" placeholder="Scan or type barcode" className="uni-input" />
                <button type="button" onClick={() => setScannerOpen(true)} className="uni-btn uni-btn-ghost" style={{ flexShrink: 0, color: "var(--accent)", borderColor: "var(--accent-sub)" }}>
                  <Camera size={15} />
                  <span className="hidden sm:inline">Scan</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Description</label>
              <textarea {...register("description")} rows={2} className="uni-input" style={{ resize: "none" }} />
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

          {serverError && (
            <p style={{ fontSize: 14, color: "var(--danger)", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>
              {serverError}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <Link href={`/inventory/${product.id}`} className="uni-btn uni-btn-ghost" style={{ flex: 1, textDecoration: "none", textAlign: "center" }}>
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
