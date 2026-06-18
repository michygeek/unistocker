const CACHE_STATIC = "unistocker-static-v4";
const CACHE_PAGES  = "unistocker-pages-v4";
const CACHE_API    = "unistocker-api-v4";
const OFFLINE_PAGE = "/offline.html";

const PRECACHE = [
  OFFLINE_PAGE,
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// ── Install: precache essentials ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) =>
      cache.addAll(PRECACHE).catch(() => {})
    )
  );
  self.skipWaiting();
});

// ── Activate: drop old caches ─────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const KEEP = [CACHE_STATIC, CACHE_PAGES, CACHE_API];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirstWithTimeout(request, cacheName, timeoutMs = 4000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    clearTimeout(timeoutId);
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "offline", cached: false }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  // Kick off a network fetch regardless
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => null);

  // Return cached immediately if we have it; otherwise wait for network
  if (cached) return cached;

  const network = await networkFetch;
  if (network) return network;

  // Nothing — serve offline page for navigation
  return caches.match(OFFLINE_PAGE) || new Response("Offline", { status: 503 });
}

// ── Fetch: routing by request type ───────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Skip non-GET (POST/PUT/DELETE — app handles offline queueing)
  if (request.method !== "GET") return;

  // /_next/static/ — immutable hashed assets, cache-first forever
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // Icons, manifest, images — cache-first
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json" ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // Auth routes — NEVER cache. CSRF tokens must always be fresh.
  if (url.pathname.startsWith("/api/auth/")) return;

  // Other API GETs — network-first (4s timeout), fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstWithTimeout(request, CACHE_API, 4000));
    return;
  }

  // Page navigations — stale-while-revalidate (fast load + background update)
  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(request, CACHE_PAGES));
    return;
  }

  // Everything else (fonts, _next/image, etc.) — network-first
  event.respondWith(networkFirstWithTimeout(request, CACHE_STATIC, 5000));
});

// ── Push notifications ────────────────────────────────────────────────────
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

// ── Background Sync ───────────────────────────────────────────────────────
// Triggered by the browser when connectivity returns (even if app is closed)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending") {
    event.waitUntil(
      // Tell all open clients to trigger the sync (they have access to IndexedDB + auth)
      self.clients.matchAll({ includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          clientList.forEach((client) => client.postMessage({ type: "SYNC_PENDING" }));
        }
      })
    );
  }
});
