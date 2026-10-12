/**
 * AURIENTA Service Worker — v4 (Offline CRE / PWA enhancement, Task 7c)
 *
 * Strategy:
 *  - Cache the app shell (HTML, manifest, icon, sign-in page) for offline reading.
 *  - NEVER cache API responses — constitutional data must always be fresh,
 *    and POST requests are routed to the offline queue (see
 *    src/lib/aurienta/offline-cre.ts) instead of the SW cache.
 *  - Stale-while-revalidate for `_next/static/` chunks (hashed filenames →
 *    safe to serve from cache, and updated in the background). This makes
 *    the dashboard actually usable offline.
 *  - Network-first for navigation requests is INTENTIONALLY DISABLED (see
 *    the comment below) — cookie safety preserved.
 *  - Bump CACHE_VERSION on every deploy that changes client JS to force
 *    all browsers to invalidate stale caches and download fresh bundles.
 *
 * Cookie safety (CRITICAL — do NOT regress):
 *  The service worker must NEVER intercept navigation requests
 *  (`event.request.mode === "navigate"`). Prior versions did and the SW's
 *  fetch() dropped the `aurienta_session` cookie in some browsers, causing
 *  `getCurrentUser()` to return null → redirect to /signin. By NOT calling
 *  `event.respondWith()` for navigations, we let the browser handle them
 *  natively (cookies preserved). Offline navigation fallback is handled
 *  by the browser's HTTP cache + the cached app-shell assets below.
 *
 * Offline queue integration:
 *  POST/PUT/PATCH requests to `/api/*` are NOT intercepted by this SW —
 *  they go directly to the network when online, and when offline they
 *  fail (fetch rejects) and the calling client code (offline-mode-client,
 *  offline-status-badge, or any dashboard action component) is expected
 *  to catch the failure and `OfflineQueue.enqueue(...)` the action.
 *  The queue auto-flushes via `syncOfflineQueue()` when connectivity
 *  returns (listen to `window.online` event).
 */

const CACHE_VERSION = "aurienta-v4-offline-cre";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/manifest.webmanifest",
  "/icon.svg",
  "/signin",
];

// Maximum number of entries to keep in the _next/static cache. Old entries
// are evicted LRU-style when this is exceeded (keeps disk usage bounded
// across deploys that change chunk hashes).
const MAX_STATIC_ENTRIES = 200;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME_STATIC())
      .then((cache) =>
        // addAll is atomic — if any single fetch fails, none are cached.
        // We tolerate individual failures via Promise.allSettled semantics.
        Promise.allSettled(
          STATIC_ASSETS.map((url) =>
            cache.add(url).catch(() => {
              // Tolerate 404 / network failures for individual assets —
              // better to cache what we can than fail the whole install.
            })
          )
        )
      )
  );
  // skipWaiting() forces the new SW to activate immediately, replacing the
  // old one. Combined with clients.claim() in activate, this ensures the v4
  // SW takes over all open tabs without requiring a manual reload.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          // Delete ALL old caches (any name that isn't the current v4 cache
          // name). This purges the stale "aurienta-v1"/"v2"/"v3" caches.
          keys.filter((k) => k !== CACHE_NAME_STATIC() && k !== CACHE_NAME_NEXT_STATIC()).map((k) =>
            caches.delete(k)
          )
        )
      )
      // clients.claim() makes the newly-activated SW take control of ALL
      // open tabs immediately (without requiring a reload).
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never intercept API routes — constitutional data must always be fresh
  // and POST requests must always hit the network (never a cache). When
  // offline, POSTs fail and the calling client code enqueues them via
  // `OfflineQueue.enqueue(...)` (see src/lib/aurienta/offline-cre.ts).
  if (url.pathname.startsWith("/api/")) return;

  // CRITICAL: Never intercept navigation requests (page loads).
  // The service worker's fetch(event.request) for navigations can DROP the
  // session cookie in some browsers, causing the dashboard layout's
  // getCurrentUser() to return null → redirect to signin. By NOT calling
  // event.respondWith(), we let the browser handle the navigation natively,
  // which always sends cookies correctly.
  if (event.request.mode === "navigate") return;

  // Cache-first for the small set of static app-shell assets.
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        // Not yet cached — fetch, cache, return.
        return fetch(event.request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches
                .open(CACHE_NAME_STATIC())
                .then((cache) => cache.put(event.request, clone))
                .catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // Stale-while-revalidate for Next.js static chunks (offline support).
  // These are hashed filenames (e.g. /_next/static/chunks/abc123.js) so
  // cached versions are ALWAYS safe to serve — the hash guarantees the
  // content matches. Background fetch updates the cache for next time.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE_NAME_NEXT_STATIC()).then((cache) =>
        cache.match(event.request).then((cached) => {
          const networkFetch = fetch(event.request)
            .then((res) => {
              if (res.ok) {
                cache.put(event.request, res.clone()).catch(() => {
                  // Tolerate quota errors — the response still returns.
                });
                // Evict oldest entries if the cache is over capacity.
                cache.keys().then((keys) => {
                  if (keys.length > MAX_STATIC_ENTRIES) {
                    // Delete the oldest 20% — keys are returned in insertion
                    // order in modern browsers, so the first 20% are oldest.
                    const toEvict = Math.ceil(MAX_STATIC_ENTRIES * 0.2);
                    keys.slice(0, toEvict).forEach((k) =>
                      cache.delete(k).catch(() => {})
                    );
                  }
                });
              }
              return res;
            })
            .catch(() => cached); // offline → fall back to cached version
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // Everything else (fonts, images, etc.) is handled by the browser's HTTP
  // cache — Next.js hashes these filenames so they're safely cacheable
  // without SW interception.
});

// Use named functions so the cache name is computed at runtime (allows future
// version bumping without restarting the SW thread). For now these are
// constants, but the indirection makes the pattern obvious.
function CACHE_NAME_STATIC() {
  return CACHE_VERSION + "-static";
}
function CACHE_NAME_NEXT_STATIC() {
  return CACHE_VERSION + "-next-static";
}
