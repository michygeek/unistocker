import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: LucideIcon;
  color: "indigo" | "green" | "yellow" | "red" | "blue" | "purple";
}

const colorMap = {
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-950", icon: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400" },
  green:  { bg: "bg-green-50 dark:bg-green-950",   icon: "bg-green-500",  text: "text-green-600 dark:text-green-400"  },
  yellow: { bg: "bg-yellow-50 dark:bg-yellow-950", icon: "bg-yellow-500", text: "text-yellow-600 dark:text-yellow-400"},
  red:    { bg: "bg-red-50 dark:bg-red-950",       icon: "bg-red-500",    text: "text-red-600 dark:text-red-400"      },
  blue:   { bg: "bg-blue-50 dark:bg-blue-950",     icon: "bg-blue-500",   text: "text-blue-600 dark:text-blue-400"   },
  purple: { bg: "bg-purple-50 dark:bg-purple-950", icon: "bg-purple-500", text: "text-purple-600 dark:text-purple-400"},
};

export function StatsCard({ title, value, change, changeType = "neutral", icon: Icon, color }: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className={`stat-card rounded-2xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden relative`}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${colors.bg} rounded-full opacity-50`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <div className={`w-10 h-10 ${colors.icon} rounded-xl flex items-center justify-center shadow-sm`}>
            <Icon size={20} className="text-white" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        {change && (
          <p className={`text-xs mt-2 flex items-center gap-1 ${
            changeType === "up" ? "text-green-600" : changeType === "down" ? "text-red-500" : "text-gray-400"
          }`}>
            {changeType === "up" ? "↑" : changeType === "down" ? "↓" : "→"} {change}
          </p>
        )}
      </div>
    </div>
  );
}
