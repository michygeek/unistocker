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
    id: string;
    name: string;
    sku: string;
    description: string;
    costPrice: number;
    sellingPrice: number;
    quantity: number;
    lowStockAlert: number;
    barcode: string;
    categoryId: string;
    imageUrl: string | null;
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
      name: product.name,
      sku: product.sku,
      description: product.description,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      lowStockAlert: product.lowStockAlert,
      barcode: product.barcode,
      categoryId: product.categoryId,
    },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setServerError("");
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== "") fd.append(k, String(v));
    });
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

  const fields = [
    { name: "name" as const, label: "Product Name", type: "text", colSpan: true },
    { name: "sku" as const, label: "SKU", type: "text", colSpan: false },
    { name: "costPrice" as const, label: "Cost Price (₦)", type: "number", colSpan: false },
    { name: "sellingPrice" as const, label: "Selling Price (₦)", type: "number", colSpan: false },
    { name: "quantity" as const, label: "Stock Quantity", type: "number", colSpan: false },
    { name: "lowStockAlert" as const, label: "Low Stock Threshold", type: "number", colSpan: false },
  ];

  return (
    <>
      {scannerOpen && (
        <BarcodeScanner
          onScan={(code) => { setValue("barcode", code); setScannerOpen(false); }}
          onClose={() => setScannerOpen(false)}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <Link href={`/inventory/${product.id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
            <ArrowLeft size={15} /> Back
          </Link>
          <h2 className="font-semibold text-gray-900 dark:text-white">Edit Product</h2>
          <div className="w-16" />
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Image */}
          <div className="flex justify-center">
            <label htmlFor="edit-product-image" className="cursor-pointer">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden hover:border-indigo-400 transition">
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Upload size={20} className="text-gray-400 mx-auto" />
                    <p className="text-xs text-gray-400 mt-1">Upload</p>
                  </div>
                )}
              </div>
              <input
                id="edit-product-image"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPreview(URL.createObjectURL(f));
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.name} className={f.colSpan ? "sm:col-span-2" : ""}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                <input
                  {...register(f.name)}
                  type={f.type}
                  step={f.type === "number" ? "0.01" : undefined}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors[f.name] && <p className="text-red-500 text-xs mt-0.5">{String(errors[f.name]?.message)}</p>}
              </div>
            ))}

            {/* Barcode */}
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
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition text-sm font-medium shrink-0"
                >
                  <Camera size={16} />
                  <span className="hidden sm:inline">Scan</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                {...register("description")}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Category */}
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

          {serverError && <p className="text-red-500 text-sm">{serverError}</p>}

          <div className="flex gap-3 pt-2">
            <Link
              href={`/inventory/${product.id}`}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
