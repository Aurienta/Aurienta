"use client";

import { useEffect } from "react";

/**
 * Registers the AURIENTA service worker in production only.
 *
 * The service worker provides offline reading for the static app shell while
 * always fetching constitutional / API data fresh from the network.
 *
 * Renders nothing to the DOM.
 */
export function RegisterSW() {
  useEffect(() => {
    if (
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silently ignore registration errors — PWA is a progressive enhancement.
      });
    }
  }, []);

  return null;
}
