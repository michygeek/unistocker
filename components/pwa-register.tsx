"use client";

import { useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

async function registerPushToken(swRegistration: ServiceWorkerRegistration) {
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) return;

    // Only save if different from what we last saved (stored in sessionStorage to avoid repeat POSTs)
    const lastToken = sessionStorage.getItem("fcm_token");
    if (token === lastToken) return;

    const res = await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (res.ok) {
      sessionStorage.setItem("fcm_token", token);
      console.log("[PWA] FCM token registered");
    }
  } catch (err) {
    console.warn("[PWA] FCM token error:", err);
  }
}

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        console.log("[PWA] Service worker registered:", reg.scope);

        if (!("Notification" in window)) return;

        if (Notification.permission === "default") {
          const perm = await Notification.requestPermission();
          if (perm !== "granted") return;
        }

        if (Notification.permission === "granted") {
          await registerPushToken(reg);
        }
      })
      .catch((err) => console.error("[PWA] SW registration failed:", err));
  }, []);

  return null;
}
