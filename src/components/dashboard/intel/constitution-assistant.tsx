"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  BookOpen,
  ShieldCheck,
  Languages,
  ScrollText,
} from "lucide-react";
import {
  MultilingualToggle,
  LANGUAGES,
  languageMeta,
  type Language,
} from "@/components/dashboard/intel/multilingual-toggle";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { cn } from "@/lib/utils";

/**
 * Constitutional concept catalogue. Each entry maps a key concept to its
 * formal name, a short tagline, the relevant rule/article, and an icon.
 */
const CONCEPTS: {
  key: string;
  title: string;
  arabicTitle: string;
  rule: string;
  blurb: string;
  icon: React.ElementType;
}[] = [
  {
    key: "zero_custody",
    title: "Zero Custody",
    arabicTitle: "حفظ الأموال",
    rule: "Rule I 1.1 · non-amendable",
    blurb:
      "AURIENTA never holds, touches, or controls partner funds. Capital flows directly to licensed law firm client account.",
    icon: ShieldCheck,
  },
  {
    key: "one_identity",
    title: "One Identity",
    arabicTitle: "هوية واحدة",
    rule: "Rule I 1.6 · non-amendable",
    blurb:
      "One person, one verified identity. Ed25519 Identity Anchor prevents duplicates forever.",
    icon: ShieldCheck,
  },
  {
    key: "fundamental_pricing",
    title: "Fundamental Pricing",
    arabicTitle: "التسعير الأساسي",
    rule: "Article III · valuation",
    blurb:
      "Valuation = EPS × sector P/E × growth + 0.3×NAV. Never speculation. ±5% price band.",
    icon: ScrollText,
  },
  {
    key: "no_speculation",
    title: "No Speculation",
    arabicTitle: "لا مضاربة",
    rule: "Rule I 1.8 · non-amendable",
    blurb:
      "No derivatives, margin, short selling, tokenization. Equity Units cannot be leveraged for speculation.",
    icon: ShieldCheck,
  },
  {
    key: "cre",
    title: "Constitutional Runtime Engine",
    arabicTitle: "محرك التنفيذ الدستوري",
    rule: "Article II · CRE",
    blurb:
      "The CRE validates every action against Rego policies. AI advises; the CRE enforces deterministically.",
    icon: Sparkles,
  },
  {
    key: "graduation",
    title: "Graduation",
    arabicTitle: "التخرج",
    rule: "Article V · sovereign exit",
    blurb:
      "Enterprises reaching Stage 3 + readiness ≥90 + 75% supermajority exit with a signed Sovereign Export Package.",
    icon: ScrollText,
  },
  {
    key: "art_118",
    title: "Article 118",
    arabicTitle: "المادة ١١٨",
    rule: "Vol 14.118 · council conduct",
    blurb:
      "Constitutional Council quorum and conduct rules — board meetings, conflict-of-interest disclosure, and remediation paths.",
    icon: ScrollText,
  },
  {
    key: "tiers",
    title: "Tier System A–F",
    arabicTitle: "نظام الفئات أ-ف",
    rule: "Article IV · tiers",
    blurb:
      "Six constitutional tiers govern capital formation caps, founder equity, audit frequency, and ERP needs.",
    icon: ScrollText,
  },
];

export function ConstitutionAssistant() {
  const [language, setLanguage] = React.useState<Language>("en");
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [explanation, setExplanation] = React.useState<string | null>(null);

  const meta = languageMeta(language);
  const activeConcept = CONCEPTS.find((c) => c.key === activeKey) ?? null;

  const loadConcept = React.useCallback(
    async (key: string, lang: Language) => {
      const concept = CONCEPTS.find((c) => c.key === key);
      if (!concept) return;
      setLoading(true);
      setError(null);
      setExplanation(null);
      setActiveKey(key);
      try {
        const res = await fetch("/api/ai/multilingual", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ concept: concept.title, language: lang }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "request failed");
        setExplanation(typeof data?.explanation === "string" ? data.explanation : null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load explanation.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Reload the active concept whenever the language changes.
  React.useEffect(() => {
    if (activeKey) void loadConcept(activeKey, language);
    // Intentionally fire only on `language` change.
  }, [language]);

  return (
    <div className="flex flex-col gap-6">
      {/* Language selector row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
            <Languages className="h-4 w-4 text-gold" />
          </span>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
              Explanation language
            </p>
            <p className="font-serif text-sm font-semibold text-foreground">
              {meta.flag} {meta.label} · <span className="text-gold-light">{meta.nativeLabel}</span>
            </p>
          </div>
        </div>
        <MultilingualToggle value={language} onChange={setLanguage} />
      </div>

      {/* Concept cards grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CONCEPTS.map((c) => {
          const active = c.key === activeKey;
          return (
            <motion.button
              key={c.key}
              whileHover={{ y: -2 }}
              onClick={() => void loadConcept(c.key, language)}
              className={cn(
                "group relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
                active
                  ? "border-gold/45 bg-gold/[0.08] gold-glow-sm"
                  : "border-gold/12 bg-foreground/[0.02] hover:border-gold/30 hover:bg-gold/[0.04]"
              )}
              aria-pressed={active}
            >
              <span
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
                  active
                    ? "border-gold/40 bg-gold/15"
                    : "border-gold/20 bg-gold/5 group-hover:border-gold/30"
                )}
              >
                <c.icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-gold-light" : "text-gold/80"
                  )}
                />
              </span>
              <p className="font-serif text-sm font-semibold leading-tight text-foreground">
                {c.title}
              </p>
              <p className="font-mono text-xs uppercase tracking-wider text-gold/70">
                {c.rule}
              </p>
              <p className="font-sans text-[11.5px] leading-relaxed text-muted-foreground">
                {c.blurb}
              </p>
              {active && (
                <motion.span
                  layoutId="concept-active"
                  className="absolute right-3 top-3 inline-flex h-2 w-2 rounded-full bg-gold shadow-[0_0_8px_2px_rgba(212,175,55,0.6)]"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation panel */}
      <AnimatePresence mode="wait">
        {activeConcept && (
          <motion.section
            key={activeConcept.key + "-" + language}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl border border-gold/22 glass-gold p-5 sm:p-7"
            aria-live="polite"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
                    <BookOpen className="h-3.5 w-3.5 text-gold" />
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-gold-light/85">
                    Constitutional concept
                  </span>
                  <span className="rounded-full border border-gold/20 bg-gold/[0.04] px-2 py-0.5 font-mono text-xs text-gold-light">
                    {meta.flag} {meta.label}
                  </span>
                </div>
                <h2
                  className="mt-3 font-serif text-2xl font-semibold leading-tight text-gold-gradient sm:text-3xl"
                  dir={meta.dir}
                >
                  {language === "ar" && activeConcept.arabicTitle
                    ? activeConcept.arabicTitle
                    : activeConcept.title}
                </h2>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {activeConcept.rule}
                </p>
              </div>
              <div className="hidden shrink-0 flex-col items-end gap-1.5 lg:flex">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                  Constitutional Anchor
                </span>
                <span className="font-mono text-[11px] text-gold/70">
                  {CONSTITUTIONAL_HASH.slice(0, 18)}…
                </span>
              </div>
            </div>

            <div
              className="mt-5 max-w-3xl whitespace-pre-line font-sans text-[14px] leading-relaxed text-foreground/90"
              dir={meta.dir}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-gold" />
                  Translating into {meta.nativeLabel}…
                </span>
              ) : error ? (
                <span className="text-red-300">{error}</span>
              ) : explanation ? (
                explanation
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gold/10 pt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/[0.04] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-gold/70">
                <ShieldCheck className="h-3 w-3" /> Ledger-immutable · AiArtifact
              </span>
              <span className="font-mono text-[11px] text-muted-foreground/80">
                model · glm-4.6 · multilingual_explain
              </span>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Hint when nothing is selected */}
      {!activeConcept && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gold/15 bg-foreground/[0.01] py-14 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.04]">
            <Sparkles className="h-5 w-5 text-gold/80" />
          </span>
          <p className="font-serif text-base font-semibold text-foreground">
            Select a concept to hear it explained in {meta.nativeLabel}
          </p>
          <p className="max-w-md font-sans text-[12px] text-muted-foreground">
            Every explanation is grounded in the constitutional blueprint and
            persisted as a ledger-immutable AiArtifact — court-admissible.
          </p>
        </div>
      )}

      <p className="text-center font-mono text-[11px] leading-relaxed text-muted-foreground/80">
        {LANGUAGES.length} languages supported · RTL aware · explanations sealed
        to the immutable ledger
      </p>
    </div>
  );
}
