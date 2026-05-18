import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { format } from "date-fns";
import { Package, Tag, Barcode, ArrowLeft, Plus, Minus, TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id }, select: { name: true } });
  return { title: product?.name ?? "Product" };
}

const TX_ICON: Record<string, React.ReactNode> = {
  STOCK_IN:     <Plus size={13} />,
  STOCK_OUT:    <Minus size={13} />,
  ADJUSTMENT:   <RefreshCw size={13} />,
  RETURN:       <TrendingUp size={13} />,
  SALE:         <TrendingDown size={13} />,
};

const TX_COLOR: Record<string, string> = {
  STOCK_IN:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  STOCK_OUT:  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  ADJUSTMENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  RETURN:     "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  SALE:       "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;

  const { id } = await params;

  const [product, transactions, unreadCount] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        createdBy: { select: { name: true, email: true } },
      },
    }),
    db.inventoryTransaction.findMany({
      where: { productId: id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.notification.count({ where: { userId: session.user.id, readAt: null, status: "SENT" } }),
  ]);

  if (!product) notFound();

  const costPrice = Number(product.costPrice);
  const sellingPrice = Number(product.sellingPrice);
  const margin = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;
  const isLowStock = product.quantity <= product.lowStockAlert;

  const canEdit = session.user.role === "BOSS" || session.user.role === "MANAGER";

  return (
    <div className="flex flex-col flex-1">
      <Header title="Product Details" unreadCount={unreadCount} />
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6 animate-in">

        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <Link href="/inventory" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
            <ArrowLeft size={16} /> Back to Inventory
          </Link>
          {canEdit && (
            <Link
              href={`/inventory/${id}/edit`}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition"
            >
              Edit Product
            </Link>
          )}
        </div>

        {/* Main card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-6 p-6">
            {/* Image */}
            <div className="flex-shrink-0">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-32 h-32 rounded-2xl object-cover border border-gray-100 dark:border-gray-800" />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Package size={40} className="text-gray-300 dark:text-gray-600" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
                  <p className="text-sm text-gray-500 font-mono mt-0.5">SKU: {product.sku}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl ${product.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {product.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{product.description}</p>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {product.category && (
                  <span className="flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg">
                    <Tag size={11} /> {product.category.name}
                  </span>
                )}
                {product.barcode && (
                  <span className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg font-mono">
                    <Barcode size={11} /> {product.barcode}
                  </span>
                )}
                {product.branch && (
                  <span className="text-xs bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-lg">
                    {product.branch.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-gray-800 border-t border-gray-100 dark:border-gray-800">
            <div className="p-5">
              <p className="text-xs text-gray-400 mb-1">Cost Price</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">₦{costPrice.toFixed(2)}</p>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-400 mb-1">Selling Price</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">₦{sellingPrice.toFixed(2)}</p>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-400 mb-1">Margin</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{margin.toFixed(1)}%</p>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-400 mb-1">In Stock</p>
              <p className={`text-lg font-bold ${isLowStock ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                {product.quantity} units
                {isLowStock && <span className="text-xs ml-1 font-normal">(low)</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Details</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {[
              { label: "Low Stock Alert", value: `${product.lowStockAlert} units` },
              { label: "Created By", value: product.createdBy.name ?? product.createdBy.email },
              { label: "Created", value: format(new Date(product.createdAt), "MMM d, yyyy") },
              { label: "Last Updated", value: format(new Date(product.updatedAt), "MMM d, yyyy") },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-gray-400">{label}</dt>
                <dd className="font-medium text-gray-900 dark:text-white mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Stock history */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Stock History</h2>
          </div>
          {transactions.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-400">No transactions recorded yet.</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-6 py-3.5 flex items-center gap-4">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${TX_COLOR[tx.type] ?? "bg-gray-100 text-gray-600"}`}>
                    {TX_ICON[tx.type] ?? <RefreshCw size={13} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tx.type.replace("_", " ")}</p>
                    {tx.notes && <p className="text-xs text-gray-400 truncate">{tx.notes}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${["STOCK_IN", "RETURN"].includes(tx.type) ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {["STOCK_IN", "RETURN"].includes(tx.type) ? "+" : "-"}{tx.quantity}
                    </p>
                    <p className="text-xs text-gray-400">{tx.user.name ?? tx.user.email}</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600">{format(new Date(tx.createdAt), "MMM d, h:mm a")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
