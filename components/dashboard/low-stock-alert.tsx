import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  lowStockAlert: number;
}

export function LowStockAlert({ products }: { products: LowStockProduct[] }) {
  if (products.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-200 dark:border-amber-900 overflow-hidden">
      <div className="px-6 py-4 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900 flex items-center gap-2">
        <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
        <h2 className="font-semibold text-amber-800 dark:text-amber-300">
          Low Stock Alerts ({products.length})
        </h2>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/inventory/${p.id}`}
            className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group"
          >
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                {p.name}
              </p>
              <p className="text-xs text-gray-400">{p.sku}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-red-600 dark:text-red-400">{p.quantity}</span>
              <p className="text-xs text-gray-400">/ {p.lowStockAlert} min</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
