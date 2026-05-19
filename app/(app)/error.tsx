"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6 max-w-xl w-full">
        <h2 className="font-semibold text-red-800 dark:text-red-300 mb-3">Something went wrong</h2>
        <pre className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 p-3 rounded-lg overflow-auto whitespace-pre-wrap break-all mb-4">
          {error.message}
          {error.digest ? `\n\nDigest: ${error.digest}` : ""}
        </pre>
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
