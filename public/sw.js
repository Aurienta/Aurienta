/**
 * AURIENTA Service Worker
 *
 * Strategy:
 *  - Cache the app shell (HTML, manifest, icon) for offline reading.
 *  - NEVER cache API responses — constitutional data must always be fresh.
 *  - Network-first for navigation requests (falls back to cached shell offline).
 *  - Bump CACHE_VERSION on every deploy that changes client JS to force
 *    all browsers to invalidate stale caches and download fresh bundles.
 *
 * NOTE: The Next.js build already hashes JS/CSS chunks (_next/static/chunks/),
 * so those are safely cacheable by the browser's HTTP cache. This SW only
 * caches the app shell (navigation HTML) — NOT the JS bundles. The SW's
 * own file (/sw.js) is served with no-cache headers, so browsers always
 * fetch the latest SW version, which triggers activation + cache cleanup.
 */

const CACHE_NAME = "aurienta-v3-no-nav-intercept";
const STATIC_ASSETS = ["/", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // skipWaiting() forces the new SW to activate immediately, replacing the
  // old one. This is critical: without it, users would keep running the old
  // SW (with its old cache name) until ALL tabs are closed — which means
  // they'd never get the CSRF fix until they manually closed every tab.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          // Delete ALL old caches (any name that isn't the current CACHE_NAME).
          // This purges the stale "aurienta-v1" cache that held the old app
          // shell built before the CSRF fix.
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      // clients.claim() makes the newly-activated SW take control of ALL
      // open tabs immediately (without requiring a reload). Combined with
      // skipWaiting(), this ensures the fix propagates as fast as possible.
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never intercept API routes — constitutional data must always be fresh
  // and POST requests must always hit the network (never a cache).
  if (url.pathname.startsWith("/api/")) return;

  // CRITICAL: Never intercept navigation requests (page loads).
  // The service worker's fetch(event.request) for navigations can DROP the
  // session cookie in some browsers, causing the dashboard layout's
  // getCurrentUser() to return null → redirect to signin. By NOT calling
  // event.respondWith(), we let the browser handle the navigation natively,
  // which always sends cookies correctly. The SW only caches the app shell
  // for offline use — it does NOT need to intercept navigations.
  if (event.request.mode === "navigate") return;

  // Cache-first for the small set of static app-shell assets.
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches
        .match(event.request)
        .then((cached) => cached || fetch(event.request))
    );
  }

  // Everything else (JS chunks, CSS, fonts, images) is handled by the
  // browser's HTTP cache — Next.js hashes these filenames so they're
  // safely cacheable without SW interception.
});
