const CACHE_NAME = "unistocker-v2";
const OFFLINE_PAGE = "/offline.html";

const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;
  if (request.url.includes("/api/")) return;
  if (request.url.includes("_next/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || Response.error()))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_PAGE)))
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.notification?.title || "UniStocker", {
      body: data.notification?.body || "",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: "unistocker-notification",
      requireInteraction: true,
      data: data.data || {},
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.link || "/dashboard")
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending") {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  const cache = await caches.open("unistocker-pending");
  const keys = await cache.keys();
  for (const req of keys) {
    const res = await cache.match(req);
    if (!res) continue;
    const body = await res.text();
    try {
      await fetch(req, { method: "POST", body, headers: { "Content-Type": "application/json" } });
      await cache.delete(req);
    } catch {}
  }
}
