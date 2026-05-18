"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Edit, Trash2, Plus, Minus, Eye, Package } from "lucide-react";
import { deleteProduct, adjustStock } from "@/lib/actions/products";
import type { UserRole } from "@prisma/client";
import type { ProductWithCategory } from "@/types";

interface Props {
  products: ProductWithCategory[];
  total: number;
  page: number;
  limit: number;
  categories: { id: string; name: string }[];
  userRole: UserRole;
  search: string;
}

export function InventoryTable({ products, total, page, limit, userRole, search }: Props) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState(search);
  const [loading, setLoading] = useState<string | null>(null);
  const totalPages = Math.ceil(total / limit);
  const canEdit = userRole === "BOSS" || userRole === "MANAGER";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (searchVal) params.set("search", searchVal);
    else params.delete("search");
    params.set("page", "1");
    router.push(`/inventory?${params.toString()}`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This is a soft delete — the product will be deactivated.`)) return;
    setLoading(id);
    await deleteProduct(id);
    setLoading(null);
    router.refresh();
  };

  const handleAdjustStock = async (id: string, type: "STOCK_IN" | "STOCK_OUT") => {
    const qty = prompt(`Enter quantity to ${type === "STOCK_IN" ? "add" : "remove"}:`);
    if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) return;
    setLoading(`${id}-${type}`);
    const result = await adjustStock(id, Number(qty), type);
    setLoading(null);
    if ("error" in result) alert(result.error);
    else router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search products, SKU, barcode..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
            Search
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                <th className="text-left px-6 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">SKU</th>
                <th className="text-right px-4 py-3 font-medium">Cost</th>
                <th className="text-right px-4 py-3 font-medium">Price</th>
                <th className="text-right px-4 py-3 font-medium">Qty</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-right px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-40" />
                    No products found
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <Package size={16} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-gray-500">{p.sku}</td>
                  <td className="px-4 py-4 text-right text-gray-600 dark:text-gray-400">₦{p.costPrice.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-white">₦{p.sellingPrice.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right">
                    <span className={`font-bold ${p.quantity <= p.lowStockAlert ? "text-red-600 dark:text-red-400" : p.quantity <= p.lowStockAlert * 2 ? "text-amber-600" : "text-gray-900 dark:text-white"}`}>
                      {p.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {p.category ? (
                      <span className="text-xs bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg">
                        {p.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleAdjustStock(p.id, "STOCK_IN")}
                        disabled={loading === `${p.id}-STOCK_IN`}
                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition"
                        title="Add stock"
                      >
                        <Plus size={15} />
                      </button>
                      <button
                        onClick={() => handleAdjustStock(p.id, "STOCK_OUT")}
                        disabled={loading === `${p.id}-STOCK_OUT`}
                        className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition"
                        title="Remove stock"
                      >
                        <Minus size={15} />
                      </button>
                      <a
                        href={`/inventory/${p.id}`}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        title="View details"
                      >
                        <Eye size={15} />
                      </a>
                      {canEdit && (
                        <>
                          <a
                            href={`/inventory/${p.id}/edit`}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            title="Edit"
                          >
                            <Edit size={15} />
                          </a>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            disabled={loading === p.id}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`/inventory?page=${page - 1}`} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Prev
                </a>
              )}
              {page < totalPages && (
                <a href={`/inventory?page=${page + 1}`} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
