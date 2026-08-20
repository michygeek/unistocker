"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { IOSGuide, type BeforeInstallPromptEvent } from "@/components/pwa/install-button";

const DISMISS_KEY = "uni-install-popup-dismissed-until";
const SNOOZE_DAYS = 14;
const SHOW_DELAY_MS = 2500;

type Platform = "chrome" | "ios" | null;

function isSnoozed(): boolean {
  try {
    const until = localStorage.getItem(DISMISS_KEY);
    return !!until && Date.now() < Number(until);
  } catch {
    return false;
  }
}

function snooze() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000));
  } catch {}
}

export function InstallPromptPopup() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>(null);
  const [visible, setVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (isSnoozed()) return;

    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua) && !/crios/i.test(ua);

    let detectedPlatform: Platform = null;
    let prompt: BeforeInstallPromptEvent | null = null;

    if (isIOS) {
      detectedPlatform = "ios";
    } else {
      const cached = (window as unknown as { __pwaInstallPrompt?: BeforeInstallPromptEvent }).__pwaInstallPrompt;
      if (cached) {
        prompt = cached;
        detectedPlatform = "chrome";
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      (window as unknown as { __pwaInstallPrompt?: BeforeInstallPromptEvent }).__pwaInstallPrompt = evt;
      setDeferredPrompt(evt);
      setPlatform("chrome");
      setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setVisible(false);
    };
    window.addEventListener("appinstalled", installedHandler);

    if (detectedPlatform) {
      setPlatform(detectedPlatform);
      setDeferredPrompt(prompt);
      const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
        window.removeEventListener("appinstalled", installedHandler);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleDismiss = () => {
    snooze();
    setVisible(false);
  };

  const handleInstall = async () => {
    if (platform === "ios") {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    } else {
      snooze();
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (showIOSGuide) {
    return <IOSGuide onClose={() => { setShowIOSGuide(false); handleDismiss(); }} />;
  }

  if (!visible || !platform) return null;
  if (platform === "chrome" && !deferredPrompt) return null;

  return (
    <div
      className="uni-install-popup"
      style={{
        position: "fixed", zIndex: 9998,
        left: 16, right: 16, bottom: 16,
        maxWidth: 380, margin: "0 auto",
      }}
    >
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border-2)",
        borderRadius: 18, boxShadow: "var(--shadow-lg)",
        padding: "16px 16px 16px 18px",
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: "#0C973A", display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          <Image src="/icons/icon-96x96.png" alt="" width={30} height={30} style={{ objectFit: "contain" }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>
            Install UniStocker
          </p>
          <p style={{ fontSize: 12.5, color: "var(--text-2)", margin: "3px 0 12px", lineHeight: 1.5 }}>
            Add it to your home screen for quick access and offline use — no app store needed.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleInstall}
              className="uni-btn uni-btn-primary"
              style={{ padding: "7px 14px", fontSize: 13 }}
            >
              <Download size={13} /> Install
            </button>
            <button
              onClick={handleDismiss}
              className="uni-btn uni-btn-ghost"
              style={{ padding: "7px 14px", fontSize: 13 }}
            >
              Not now
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-3)", display: "flex", flexShrink: 0, padding: 2,
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
