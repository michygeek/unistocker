"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

type Platform = "chrome" | "ios" | null;
type Variant = "sidebar" | "header";

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function IOSGuide({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      />
      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 480,
        background: "var(--bg-card)", borderRadius: "20px 20px 0 0",
        padding: "24px 24px 40px", boxShadow: "0 -8px 40px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Install UniStocker</h3>
          <button
            onClick={onClose}
            style={{ background: "var(--bg-input)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "var(--text-3)", display: "flex" }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { step: 1, icon: <Share size={20} style={{ color: "var(--accent)" }} />, text: <span>Tap the <strong>Share</strong> button <span style={{ color: "var(--accent)" }}>⎙</span> at the bottom of Safari</span> },
            { step: 2, icon: <span style={{ fontSize: 20 }}>⊞</span>,              text: <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span> },
            { step: 3, icon: <span style={{ fontSize: 20, color: "var(--accent)" }}>✓</span>, text: <span>Tap <strong>Add</strong> in the top-right corner</span> },
          ].map(({ step, icon, text }) => (
            <div key={step} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: "var(--bg-input)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontWeight: 700,
              }}>
                {icon}
              </div>
              <div style={{ paddingTop: 6, fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>
                <span style={{ color: "var(--text-3)", fontSize: 12, display: "block", marginBottom: 2 }}>Step {step}</span>
                {text}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: "12px 16px", background: "var(--accent-sub)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <Share size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>
            The Share button (box with an arrow up) is in the Safari toolbar at the bottom of your screen.
          </p>
        </div>
      </div>
    </div>
  );
}

export function PWAInstallButton({ variant = "sidebar" }: { variant?: Variant }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua) && !/crios/i.test(ua);

    if (isIOS) {
      setPlatform("ios");
      return;
    }

    // Check if the event was already captured globally before hydration
    const cached = (window as unknown as { __pwaInstallPrompt?: BeforeInstallPromptEvent }).__pwaInstallPrompt;
    if (cached) {
      setDeferredPrompt(cached);
      setPlatform("chrome");
      return;
    }

    // Still listen in case it fires after hydration (slower devices)
    const handler = (e: Event) => {
      e.preventDefault();
      (window as unknown as { __pwaInstallPrompt?: BeforeInstallPromptEvent }).__pwaInstallPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("chrome");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (platform === "ios") { setShowIOSGuide(true); return; }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (installed) return null;
  if (platform === null) return null;
  if (platform === "chrome" && !deferredPrompt) return null;

  // ── Header variant (mobile top bar) ──────────────────────────────────────
  if (variant === "header") {
    return (
      <>
        <button
          onClick={handleInstall}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 11px", borderRadius: 9,
            border: "1px solid rgba(13,148,136,0.4)",
            background: "rgba(13,148,136,0.10)",
            color: "#0D9488", fontSize: 12, fontWeight: 700,
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          <Download size={13} />
          Install
        </button>
        {showIOSGuide && <IOSGuide onClose={() => setShowIOSGuide(false)} />}
      </>
    );
  }

  // ── Sidebar variant ───────────────────────────────────────────────────────
  return (
    <>
      <button
        onClick={handleInstall}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "9px 12px", borderRadius: 10,
          border: "1px solid rgba(13,148,136,0.35)",
          cursor: "pointer", background: "rgba(13,148,136,0.10)",
          color: "#2DD4BF", fontSize: 14, fontWeight: 600,
          transition: "all 0.15s", marginBottom: 6,
        }}
        onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(13,148,136,0.2)"; }}
        onMouseLeave={(e) => { (e.currentTarget).style.background = "rgba(13,148,136,0.10)"; }}
      >
        <Download size={15} />
        Install App
      </button>
      {showIOSGuide && <IOSGuide onClose={() => setShowIOSGuide(false)} />}
    </>
  );
}
