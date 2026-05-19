import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true, role: true, createdAt: true,
      branch: { select: { name: true } },
      organization: { select: { name: true } },
    },
  });

  return (
    <div className="flex flex-col flex-1">
      <Header title="Settings" />
      <div className="flex-1 p-4 sm:p-6 max-w-2xl w-full animate-in">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Account Settings</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-white text-lg sm:text-xl font-bold">
                  {(user?.name ?? user?.email ?? "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{user?.name ?? "—"}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg font-medium">
                    {user?.role}
                  </span>
                  {user?.organization?.name && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-lg font-medium">
                      {user.organization.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              {[
                { label: "Name", value: user?.name ?? "—" },
                { label: "Email", value: user?.email ?? "—" },
                { label: "Organization", value: user?.organization?.name ?? "—" },
                { label: "Role", value: user?.role ?? "—" },
                { label: "Branch", value: user?.branch?.name ?? "All branches" },
              ].map((f) => (
                <div key={f.label} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">{f.label}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
