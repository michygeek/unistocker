import { formatDistanceToNow } from "date-fns";
import type { ActivityLogItem } from "@/types";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  STOCK_IN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  STOCK_OUT: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  SALE: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  ADJUSTMENT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
};

interface Props {
  logs: ActivityLogItem[];
}

export function RecentActivity({ logs }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
      </div>
      {logs.length === 0 ? (
        <div className="px-6 py-10 text-center text-gray-400 text-sm">No activity yet</div>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {logs.map((log) => (
            <div key={log.id} className="px-6 py-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 mt-0.5 ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                {log.action.replace("_", " ")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{log.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {log.user.name ?? log.user.email} · {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
