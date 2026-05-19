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

  const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
  const router = useRouter();

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  if (userRole === "STAFF") return null;

  const onSubmit = async (data: z.infer<typeof schema>) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== "") fd.append(k, String(v)); });
    const imgInput = document.getElementById("product-image") as HTMLInputElement;
    const imgFile = imgInput?.files?.[0];
    if (imgFile) {
      if (imgFile.size > MAX_IMAGE_BYTES) {
        setImageError("Image exceeds 2 MB limit. Please choose a smaller file.");
        return;
      }
      fd.append("image", imgFile);
    }

    const result = await createProduct(fd);
    if ("error" in result) {
      alert(Object.values(result.error as Record<string, string[]>).flat()[0] ?? "Failed");
    } else {
      reset();
      setOpen(false);
      setPreview(null);
      router.refresh();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
      >
        <Plus size={18} /> Add Product
      </button>

      {scannerOpen && (
        <BarcodeScanner
          onScan={(code) => {
            setValue("barcode", code);
            setScannerOpen(false);
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-semibold text-gray-900 dark:text-white">Add New Product</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-5">
              <div className="flex flex-col items-center gap-1.5">
                <label htmlFor="product-image" className="cursor-pointer">
                  <div className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition ${imageError ? "border-red-400" : "border-gray-300 dark:border-gray-700 hover:border-[#2EBD78]"}`}>
                    {preview ? (
                      <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Upload size={20} className="text-gray-400 mx-auto" />
                        <p className="text-xs text-gray-400 mt-1">Photo</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="product-image"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > MAX_IMAGE_BYTES) {
                        setImageError("Image exceeds 2 MB. Please choose a smaller file.");
                        e.target.value = "";
                        setPreview(null);
                        return;
                      }
                      setImageError("");
                      setPreview(URL.createObjectURL(f));
                    }}
                  />
                </label>
                {imageError ? (
                  <p className="text-xs text-red-500 text-center">{imageError}</p>
                ) : (
                  <p className="text-xs text-gray-400">Max 2 MB · JPG, PNG, WEBP</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { name: "name", label: "Product Name", type: "text", colSpan: true },
                  { name: "sku", label: "SKU", type: "text", colSpan: false },
                  { name: "costPrice", label: "Cost Price (₦)", type: "number", colSpan: false },
                  { name: "sellingPrice", label: "Selling Price (₦)", type: "number", colSpan: false },
                  { name: "quantity", label: "Initial Stock", type: "number", colSpan: false },
                  { name: "lowStockAlert", label: "Low Stock Threshold", type: "number", colSpan: false },
                ] as Array<{ name: keyof z.infer<typeof schema>; label: string; type: string; colSpan: boolean }>).map((f) => (
                  <div key={f.name} className={f.colSpan ? "sm:col-span-2" : ""}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                    <input
                      {...register(f.name as keyof z.infer<typeof schema>)}
                      type={f.type}
                      step={f.type === "number" ? "0.01" : undefined}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors[f.name] && (
                      <p className="text-red-500 text-xs mt-0.5">{String(errors[f.name]?.message)}</p>
                    )}
                  </div>
                ))}

                {/* Barcode — custom row with camera scan button */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Barcode</label>
                  <div className="flex gap-2">
                    <input
                      {...register("barcode")}
                      type="text"
                      placeholder="Scan or type barcode"
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      title="Scan with camera"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition text-sm font-medium shrink-0"
                    >
                      <Camera size={16} />
                      <span className="hidden sm:inline">Scan</span>
                    </button>
                  </div>
                  {errors.barcode && (
                    <p className="text-red-500 text-xs mt-0.5">{String(errors.barcode.message)}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    {...register("description")}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {categories.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select
                      {...register("categoryId")}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">— No category —</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
