"use client";

import * as React from "react";
import { Languages } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { type Locale } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const OPTIONS: { code: Locale; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "ar", label: "العربية", short: "ع" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-gold/20 bg-background/40 p-0.5 backdrop-blur",
        className
      )}
      role="group"
      aria-label="Language switcher"
    >
      <Languages
        className="ms-1 h-3.5 w-3.5 text-muted-foreground"
        aria-hidden
      />
      {OPTIONS.map((opt) => {
        const active = locale === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLocale(opt.code)}
            aria-pressed={active}
            aria-label={opt.label}
            title={opt.label}
            className={cn(
              "rounded-full px-2.5 py-1 font-sans text-xs font-medium tracking-wide transition-all",
              active
                ? "bg-gold-gradient text-black shadow-[0_4px_14px_-4px_rgba(212,175,55,0.6)]"
                : "text-muted-foreground hover:text-gold-light"
            )}
          >
            {opt.short}
          </button>
        );
      })}
    </div>
  );
}
