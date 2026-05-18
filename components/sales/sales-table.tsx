"use client";

import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { ChevronDown, ChevronUp, Receipt } from "lucide-react";

interface SaleItem { id: string; quantity: number; unitPrice: number; costPrice: number; total: number; product: { name: string; sku: string }; }
interface Sale { id: string; receiptNumber: string; subtotal: number; discount: number; tax: number; total: number; profit: number; notes: string | null; createdAt: Date; user: { name: string | null; email: string }; branch: { name: string } | null; saleItems: SaleItem[]; }

interface Props { sales: Sale[]; total: number; page: number; limit: number; }

export function SalesTable({ sales, total, page, limit }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                <th className="text-left px-6 py-3 font-medium">Receipt</th>
                <th className="text-left px-4 py-3 font-medium">Cashier</th>
                <th className="text-right px-4 py-3 font-medium">Subtotal</th>
                <th className="text-right px-4 py-3 font-medium">Discount</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-right px-4 py-3 font-medium">Profit</th>
                <th className="text-right px-4 py-3 font-medium">Date</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {sales.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <Receipt size={32} className="mx-auto mb-2 opacity-40" />
                    No sales recorded yet
                  </td>
                </tr>
              )}
              {sales.map((sale) => (
                <>
                  <tr
                    key={sale.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer"
                    onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{sale.receiptNumber}</span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{sale.user.name ?? sale.user.email}</td>
                    <td className="px-4 py-4 text-right text-gray-600 dark:text-gray-400">₦{sale.subtotal.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right text-red-500">{sale.discount > 0 ? `-₦${sale.discount.toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900 dark:text-white">₦{sale.total.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">₦{sale.profit.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right text-xs text-gray-400">
                      <div>{format(new Date(sale.createdAt), "MMM d, yyyy")}</div>
                      <div>{format(new Date(sale.createdAt), "h:mm a")}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-400">
                      {expanded === sale.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>
                  {expanded === sale.id && (
                    <tr key={`${sale.id}-expanded`} className="bg-indigo-50/50 dark:bg-indigo-950/30">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Items sold</p>
                          {sale.saleItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <div>
                                <span className="font-medium text-gray-800 dark:text-gray-200">{item.product.name}</span>
                                <span className="text-gray-400 ml-2 text-xs">{item.product.sku}</span>
                              </div>
                              <div className="flex gap-6 text-gray-600 dark:text-gray-400">
                                <span>{item.quantity}x @ ₦{item.unitPrice.toFixed(2)}</span>
                                <span className="font-semibold text-gray-900 dark:text-white">₦{item.total.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                          {sale.notes && (
                            <p className="text-xs text-gray-400 mt-2 border-t border-indigo-200 dark:border-indigo-800 pt-2">
                              Note: {sale.notes}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm">
            <span className="text-gray-400">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
            <div className="flex gap-2">
              {page > 1 && <a href={`/sales?page=${page - 1}`} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Prev</a>}
              {page < totalPages && <a href={`/sales?page=${page + 1}`} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Next</a>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
