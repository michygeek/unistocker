"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { WifiOff, RefreshCw, CheckCircle, AlertCircle, Wifi } from "lucide-react";
import { getPendingCount } from "@/lib/offline-queue";
import { syncPendingOps } from "@/lib/offline-sync";

type BannerState = "hidden" | "offline" | "syncing" | "synced" | "error";

export function OfflineBanner() {
  const [state, setState] = useState<BannerState>("hidden");
  const [pendingCount, setPendingCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
      return count;
    } catch {
      return 0;
    }
  }, []);

  const doSync = useCallback(async () => {
    if (state === "syncing") return;
    setState("syncing");
    try {
      const result = await syncPendingOps();
      const remaining = await refreshCount();

      if (result.synced > 0) {
        router.refresh();
      }

      if (remaining > 0) {
        setErrorMsg(`${remaining} operation${remaining !== 1 ? "s" : ""} failed — will retry`);
        setState("error");
        // Auto-retry failed ones after 30s
        syncTimeoutRef.current = setTimeout(doSync, 30_000);
      } else if (result.synced > 0) {
        setState("synced");
        syncTimeoutRef.current = setTimeout(() => setState("hidden"), 3000);
      } else {
        setState("hidden");
      }
    } catch {
      setState("error");
      setErrorMsg("Sync failed — will retry when online");
    }
  }, [state, refreshCount, router]);

  useEffect(() => {
    const updateOnlineStatus = async () => {
      if (!navigator.onLine) {
        await refreshCount();
        setState("offline");
      } else {
        const count = await refreshCount();
        if (count > 0) {
          // Back online with pending ops — sync immediately
          doSync();
        } else {
          setState("hidden");
        }
      }
    };

    const handleOffline = async () => {
      await refreshCount();
      setState("offline");
    };

    const handleOnline = () => {
      doSync();
    };

    const handleQueueUpdate = async () => {
      const count = await refreshCount();
      setPendingCount(count);
      if (!navigator.onLine && count > 0) setState("offline");
    };

    // Check initial state
    updateOnlineStatus();

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    // Custom event fired by new-sale-button and inventory-table when they queue ops
    window.addEventListener("offline-queue-updated", handleQueueUpdate);

    // Also listen for SW messages (Background Sync fallback)
    const handleSWMessage = (e: MessageEvent) => {
      if (e.data?.type === "SYNC_PENDING") doSync();
    };
    navigator.serviceWorker?.addEventListener("message", handleSWMessage);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline-queue-updated", handleQueueUpdate);
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [doSync, refreshCount]);

  if (state === "hidden") return null;

  const configs = {
    offline: {
      bg: "rgba(30,30,30,0.97)",
      border: "rgba(255,255,255,0.08)",
      icon: <WifiOff size={15} style={{ color: "#f87171" }} />,
      text: pendingCount > 0
        ? `Offline — ${pendingCount} pending operation${pendingCount !== 1 ? "s" : ""}`
        : "You're offline — changes will sync when reconnected",
      textColor: "#f3f4f6",
      action: null,
    },
    syncing: {
      bg: "rgba(12,151,58,0.95)",
      border: "rgba(255,255,255,0.15)",
      icon: <RefreshCw size={15} style={{ color: "#fff", animation: "spin 1s linear infinite" }} />,
      text: `Syncing ${pendingCount > 0 ? pendingCount + " operation" + (pendingCount !== 1 ? "s" : "") : ""}…`,
      textColor: "#ffffff",
      action: null,
    },
    synced: {
      bg: "rgba(5,150,105,0.95)",
      border: "rgba(255,255,255,0.15)",
      icon: <CheckCircle size={15} style={{ color: "#fff" }} />,
      text: "All changes synced",
      textColor: "#ffffff",
      action: null,
    },
    error: {
      bg: "rgba(185,28,28,0.95)",
      border: "rgba(255,255,255,0.12)",
      icon: <AlertCircle size={15} style={{ color: "#fca5a5" }} />,
      text: errorMsg || "Sync failed",
      textColor: "#fef2f2",
      action: navigator.onLine ? { label: "Retry", fn: doSync } : null,
    },
  };

  const cfg = configs[state];

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 18px",
          borderRadius: 40,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
          backdropFilter: "blur(12px)",
          maxWidth: "calc(100vw - 32px)",
          animation: "slideUp 0.25s ease",
        }}
      >
        <style>{`@keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
        {cfg.icon}
        <span style={{ fontSize: 13, fontWeight: 600, color: cfg.textColor, whiteSpace: "nowrap" }}>
          {cfg.text}
        </span>
        {cfg.action && (
          <button
            onClick={cfg.action.fn}
            style={{
              marginLeft: 4, padding: "3px 10px", borderRadius: 20,
              background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            {cfg.action.label}
          </button>
        )}
      </div>
    </>
  );
}
