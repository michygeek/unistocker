"use client";

import { formatDistanceToNow } from "date-fns";
import { Bell, Package, ShoppingCart, AlertTriangle, TrendingDown, DollarSign } from "lucide-react";
import type { NotificationStatus } from "@prisma/client";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  status: NotificationStatus;
  readAt: Date | null;
  createdAt: Date;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  PRODUCT_CREATED: Package,
  PRODUCT_DELETED: Package,
  STOCK_IN: TrendingDown,
  STOCK_OUT: TrendingDown,
  PRICE_CHANGE: DollarSign,
  SALE_RECORDED: ShoppingCart,
  LOW_STOCK: AlertTriangle,
};

const TYPE_COLORS: Record<string, string> = {
  PRODUCT_CREATED: "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400",
  PRODUCT_DELETED: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400",
  STOCK_IN: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400",
  STOCK_OUT: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400",
  PRICE_CHANGE: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
  SALE_RECORDED: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400",
  LOW_STOCK: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",
};

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
        <Bell size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
        <p className="text-gray-400">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          All Notifications ({notifications.length})
        </h2>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {notifications.map((n) => {
          const Icon = TYPE_ICONS[n.type] ?? Bell;
          const color = TYPE_COLORS[n.type] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";

          return (
            <div
              key={n.id}
              className={`flex items-start gap-4 px-6 py-4 transition ${!n.readAt ? "bg-indigo-50/50 dark:bg-indigo-950/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${!n.readAt ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                    {n.title}
                    {!n.readAt && <span className="ml-2 inline-block w-2 h-2 bg-indigo-500 rounded-full align-middle" />}
                  </p>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
