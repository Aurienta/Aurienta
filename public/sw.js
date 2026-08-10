/**
 * AURIENTA Service Worker
 *
 * Strategy:
 *  - Cache the app shell (HTML, manifest, icon) for offline reading.
 *  - NEVER cache API responses — constitutional data must always be fresh.
 *  - Cache-first for the static app shell only.
 *  - Network-first for navigation requests (falls back to cached shell offline).
 */

const CACHE_NAME = "aurienta-v1";
const STATIC_ASSETS = ["/", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache API routes — constitutional data must always be fresh.
  if (url.pathname.startsWith("/api/")) return;

  // Network-first for pages, cache-first for static assets.
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/")));
  } else if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches
        .match(event.request)
        .then((cached) => cached || fetch(event.request))
    );
  }
});
