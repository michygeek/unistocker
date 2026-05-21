"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { exportReportsCSV } from "@/lib/actions/csv";

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

export function ExportReportsButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { csv, filename } = await exportReportsCSV();
      triggerDownload(csv, filename);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="uni-btn uni-btn-ghost"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
      Export CSV
    </button>
  );
}
