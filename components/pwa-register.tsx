"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service worker registered:", reg.scope);

          if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().then((perm) => {
              if (perm === "granted") {
                console.log("[PWA] Push notifications granted");
              }
            });
          }
        })
        .catch((err) => console.error("[PWA] SW registration failed:", err));
    }
  }, []);

  return null;
}
