"use client";

import { useEffect } from "react";

/**
 * AURIENTA Service Worker registration.
 *
 * TEMPORARILY DISABLED: The service worker was causing the session cookie
 * (aurienta_session) to be dropped during navigation between dashboard tabs.
 * The SW's fetch handler intercepted navigation requests, and in some cases
 * the fetch() inside the SW did not forward the session cookie, causing
 * getCurrentUser() to return null → redirect to /signin.
 *
 * This component now UNREGISTERS any existing service workers on mount,
 * ensuring that stale SWs from prior deployments are purged. Once the
 * cookie-dropping issue is fully resolved (and verified across browsers),
 * SW registration can be re-enabled by uncommenting the register() call.
 *
 * Renders nothing to the DOM.
 */
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Unregister ALL existing service workers to purge any stale SW
      // that might be intercepting navigations and dropping cookies.
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((r) => r.unregister()))
        )
        .then(() => {
          // Clear all caches left by old SWs.
          if ("caches" in window) {
            return caches.keys().then((keys) =>
              Promise.all(keys.map((k) => caches.delete(k)))
            );
          }
        })
        .catch(() => {
          // Silently ignore — SW cleanup is best-effort.
        });

      // SW registration is intentionally DISABLED to prevent the session
      // cookie from being dropped during navigation. Re-enable only after
      // thorough cross-browser testing confirms the SW doesn't interfere
      // with cookies.
      //
      // if (process.env.NODE_ENV === "production") {
      //   navigator.serviceWorker.register("/sw.js").catch(() => {});
      // }
    }
  }, []);

  return null;
}
