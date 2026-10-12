// AURIENTA Offline PWA configuration — manifest definition + service worker
// registration helpers + persistent storage requests.
//
// Browser-only module. Every function guards against SSR via `typeof window`
// checks so it's safe to import from a Server Component (the function bodies
// are inert on the server).
//
// Theme: indigo/purple (#6D28D9) — distinct from the gold-on-black brand
// identity used elsewhere. The indigo accent signals "offline infrastructure"
// in the UI so users can visually distinguish PWA/queue indicators from
// constitutional gold accenting.

// ── PWA Manifest (indigo theme) ───────────────────────────────────────────
//
// This manifest object is exported for programmatic use (e.g. embedding into
// a Settings page or injecting at runtime). A static copy is also written to
// `public/manifest.webmanifest` so browsers can discover it via a `<link
// rel="manifest" href="/manifest.webmanifest">` tag if/when another agent
// wires it into app/layout.tsx. The existing `/manifest.json` (gold theme)
// remains the app's primary manifest for now — both files can coexist.

export const PWA_MANIFEST = {
  name: "AURIENTA — Constitutional Enterprise Infrastructure",
  short_name: "AURIENTA",
  description:
    "Noncustodial constitutional infrastructure of structural trust. Offline-capable: CRE policy validation, queued transaction signing, automatic sync when online.",
  start_url: "/dashboard?source=pwa",
  scope: "/",
  display: "standalone" as const,
  orientation: "portrait-primary" as const,
  background_color: "#F8FAFC",
  theme_color: "#6D28D9",
  categories: ["business", "finance", "productivity"],
  lang: "en",
  dir: "ltr" as const,
  icons: [
    {
      src: "/icon.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any" as const,
    },
    {
      src: "/icon.svg",
      sizes: "192x192 512x512",
      type: "image/svg+xml",
      purpose: "maskable" as const,
    },
  ],
  shortcuts: [
    {
      name: "Dashboard",
      url: "/dashboard",
      icons: [{ src: "/icon.svg", sizes: "any" }],
    },
    {
      name: "Constitutional Holdings",
      url: "/dashboard/portfolio",
      icons: [{ src: "/icon.svg", sizes: "any" }],
    },
    {
      name: "Governance",
      url: "/dashboard/governance",
      icons: [{ src: "/icon.svg", sizes: "any" }],
    },
  ],
} as const;

// ── Service worker registration ────────────────────────────────────────────
//
// NOTE: The existing `src/components/pwa/register-sw.tsx` intentionally
// UNREGISTERS service workers on mount (see its comment) due to a prior
// cookie-dropping bug. The enhanced `/sw.js` (v4) avoids navigation
// interception entirely, which is what caused that bug. The function below
// is exported for future use once the cookie-dropping concern is re-verified
// across browsers. For now, calling it is safe — it only registers if
// `serviceWorker` is available — but the existing RegisterSW component does
// NOT call it (to preserve the prior defensive posture).
//
// Calling `registerServiceWorker()` will not break cookies because the v4
// SW never intercepts navigation requests (see public/sw.js comments).

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  return navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .then((reg) => reg)
    .catch((err: unknown) => {
      // Best-effort — never block UI on SW registration failure.
      console.warn("[AURIENTA PWA] Service worker registration failed:", err);
      return null;
    });
}

// ── Persistent storage ────────────────────────────────────────────────────
//
// navigator.storage.persist() requests that the browser grant the origin
// durable storage — meaning the offline queue (localStorage) won't be evicted
// under storage pressure. This is critical for offline-first: without it, the
// browser may clear localStorage when disk space is low, dropping queued
// transactions. Mobile browsers (especially iOS Safari) often require user
// engagement (e.g. "Add to Home Screen") before granting persistence.

export async function requestPersistentStorage(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    typeof navigator.storage === "undefined" ||
    typeof navigator.storage.persist !== "function"
  ) {
    return false;
  }
  // Short-circuit if already persisted.
  const already = await isPersistentStorageGranted();
  if (already) return true;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function isPersistentStorageGranted(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    typeof navigator.storage === "undefined" ||
    typeof navigator.storage.persisted !== "function"
  ) {
    return false;
  }
  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}

// ── Install prompt (PWA "Add to Home Screen") ──────────────────────────────
//
// The `beforeinstallprompt` event is fired by Chrome/Edge (not Safari) when
// the PWA install criteria are met. We capture it and expose a helper to
// trigger the install dialog on user action (e.g. clicking "Install App").
// Safari uses `navigator.standalone` detection + a manual "Add to Home Screen"
// instruction flow.

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** True when the PWA is currently running in standalone (installed) mode. */
export function isStandalonePWA(): boolean {
  if (typeof window === "undefined") return false;
  // iOS Safari
  if (typeof navigator.standalone === "boolean") return navigator.standalone;
  // Chrome/Edge/Firefox display-mode
  return window.matchMedia?.("(display-mode: standalone)").matches ?? false;
}
