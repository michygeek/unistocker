"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { exportInventoryCSV } from "@/lib/actions/csv";

function triggerDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportInventoryButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { csv, filename } = await exportInventoryCSV();
      triggerDownload(csv, filename);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-60"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
      Export
    </button>
  );
}
