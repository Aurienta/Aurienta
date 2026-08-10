"use client";

import * as React from "react";
import { type Locale, translations, getDir } from "./translations";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
  isRTL: boolean;
};

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "aurienta-locale";

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const langs = navigator.languages ?? [navigator.language];
  for (const lang of langs) {
    if (!lang) continue;
    const lower = lang.toLowerCase();
    if (lower.startsWith("ar")) return "ar";
  }
  return "en";
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ar") return stored;
  } catch {
    // localStorage may be unavailable (private mode, sandbox) — fall through
  }
  return detectBrowserLocale();
}

function applyDocumentLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  const dir = getDir(locale);
  const html = document.documentElement;
  html.lang = locale;
  html.dir = dir;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Start with "en" on the server to keep markup stable; hydrate the real
  // choice on the client to avoid hydration mismatches.
  const [locale, setLocaleState] = React.useState<Locale>("en");

  // After mount, read the persisted/detected locale and apply it.
  React.useEffect(() => {
    const stored = readStoredLocale();
    setLocaleState(stored);
    applyDocumentLocale(stored);
  }, []);

  // Keep <html lang/dir> in sync whenever the locale changes after hydration.
  React.useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      // Ignore persistence failures (e.g. private mode / quota)
    }
  }, []);

  const t = React.useCallback(
    (key: string) => {
      const table = translations[locale];
      return table?.[key] ?? key;
    },
    [locale]
  );

  const dir = getDir(locale);
  const value = React.useMemo<LanguageContextValue>(
    () => ({ locale, setLocale, t, dir, isRTL: dir === "rtl" }),
    [locale, setLocale, t, dir]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

// Convenience hook alias (familiar name for i18n libraries)
export const useTranslation = useLanguage;
