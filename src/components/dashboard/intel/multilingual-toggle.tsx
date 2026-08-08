"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type Language = "en" | "ar" | "fr" | "sw";

export const LANGUAGES: {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
  dir: "ltr" | "rtl";
}[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", flag: "🇪🇬", dir: "rtl" },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "sw", label: "Swahili", nativeLabel: "Kiswahili", flag: "🇰🇪", dir: "ltr" },
];

/**
 * MultilingualToggle — a luxury pill-style language selector.
 * Used by the Constitutional Assistant page. Calls onChange with the
 * newly selected language code.
 */
export function MultilingualToggle({
  value,
  onChange,
  className,
}: {
  value: Language;
  onChange: (next: Language) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Explanation language"
      className={cn(
        "inline-flex w-full gap-1 rounded-xl border border-gold/12 bg-foreground/[0.02] p-1 sm:w-auto",
        className
      )}
    >
      {LANGUAGES.map((lang) => {
        const active = lang.code === value;
        return (
          <button
            key={lang.code}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(lang.code)}
            className={cn(
              "relative inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 font-sans text-[12px] font-medium transition-colors sm:flex-none",
              active ? "text-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 rounded-lg bg-gold-gradient shadow-[0_4px_18px_-6px_rgba(212,175,55,0.6)]"
                transition={{ type: "spring", damping: 24, stiffness: 280 }}
              />
            )}
            <span className="relative z-10 text-sm leading-none">{lang.flag}</span>
            <span className="relative z-10 hidden sm:inline">{lang.nativeLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

export function languageMeta(code: Language) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
