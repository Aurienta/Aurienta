"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  TrendingUp,
  Wrench,
  Sparkles,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Wheat,
  Factory,
  Palmtree,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { egp } from "@/lib/aurienta/format";

// Icon name → component map. Server components pass a string key so we never
// serialise a function component across the RSC boundary.
const ICON_MAP: Record<string, LucideIcon> = {
  wheat: Wheat,
  factory: Factory,
  palmtree: Palmtree,
  cpu: Cpu,
};

export type IndustryIconName = keyof typeof ICON_MAP;

export type IndustryVital = {
  label: string;
  value: string;
  healthy: boolean;
  desc: string;
};

export type IndustryTool = {
  name: string;
  desc: string;
};

export type IndustryModifier = {
  factor: string;
  impact: string;
  positive?: boolean;
};

export type IndustryEnterprise = {
  id: string;
  slug: string;
  name: string;
  tier: string;
  stage: string;
  healthRating: string | null;
  raisedEgp: number;
  metricLabel: string;
  metricValue: string;
  metricHealthy: boolean;
};

export type IndustryModule = {
  key: string;
  section: string;
  name: string;
  tagline: string;
  iconName: IndustryIconName;
  accent: string;
  vitals: IndustryVital[];
  tools: IndustryTool[];
  modifiers: IndustryModifier[];
  enterprises: IndustryEnterprise[];
};

type Props = {
  module: IndustryModule;
  index: number;
};

export function IndustryModuleCard({ module, index }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const Icon = ICON_MAP[module.iconName] ?? Wheat;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6 transition-colors",
        "hover:border-gold/35"
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl"
        style={{ background: "rgba(212,175,55,0.08)" }}
      />

      {/* Header */}
      <header className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0">
          <span
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
              "border-gold/30 bg-gold/8 gold-glow-sm"
            )}
          >
            <Icon className="h-5 w-5 text-gold" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-light/70">
              {module.section}
            </p>
            <h3 className="mt-1 font-serif text-xl font-semibold leading-tight text-foreground">
              {module.name}
            </h3>
            <p className="mt-1 font-sans text-[12px] leading-relaxed text-muted-foreground">
              {module.tagline}
            </p>
          </div>
        </div>
        <span className="hidden shrink-0 rounded-md border border-gold/20 bg-gold/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold/75 sm:inline-block">
          {module.enterprises.length} live
        </span>
      </header>

      {/* Vital signs */}
      <section className="relative mt-5">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-gold" />
          <h4 className="font-sans text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Module vital signs
          </h4>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {module.vitals.map((v) => (
            <div
              key={v.label}
              className={cn(
                "rounded-lg border p-2.5",
                v.healthy
                  ? "border-emerald-400/25 bg-emerald-400/[0.05]"
                  : "border-amber-400/25 bg-amber-400/[0.05]"
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-sans text-[11px] text-muted-foreground">{v.label}</span>
                <span
                  className={cn(
                    "font-mono text-[12px] font-semibold",
                    v.healthy ? "text-emerald-300" : "text-amber-300"
                  )}
                >
                  {v.value}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-[9px] leading-snug text-muted-foreground/70">
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Specialised tools */}
      <section className="relative mt-5">
        <div className="mb-2 flex items-center gap-2">
          <Wrench className="h-3.5 w-3.5 text-gold" />
          <h4 className="font-sans text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Specialised tools
          </h4>
        </div>
        <ul className="grid gap-1.5">
          {module.tools.map((t) => (
            <li
              key={t.name}
              className="rounded-md border border-gold/8 bg-background/30 px-2.5 py-1.5"
            >
              <span className="font-sans text-[12px] font-medium text-gold-light">
                {t.name}
              </span>
              <span className="ml-2 font-sans text-[11px] text-muted-foreground">
                · {t.desc}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* AI valuation modifiers */}
      <section className="relative mt-5">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          <h4 className="font-sans text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            AI valuation modifiers
          </h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {module.modifiers.map((m) => (
            <span
              key={m.factor}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[10px]",
                m.positive
                  ? "border-emerald-400/25 bg-emerald-400/[0.05] text-emerald-300"
                  : "border-amber-400/25 bg-amber-400/[0.05] text-amber-300"
              )}
            >
              {m.positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {m.factor}
              <span className="text-muted-foreground/70">· {m.impact}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Eligible enterprises toggle */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="relative mt-5 flex w-full items-center justify-between rounded-lg border border-gold/15 bg-background/30 px-3 py-2.5 text-left transition-colors hover:border-gold/30 hover:bg-gold/[0.04]"
        aria-expanded={expanded}
        aria-controls={`module-${module.key}-enterprises`}
      >
        <span className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-gold" />
          <span className="font-sans text-[12px] font-medium text-foreground">
            Eligible enterprises
          </span>
          <span className="rounded-full border border-gold/20 bg-gold/5 px-1.5 py-0.5 font-mono text-[9px] text-gold/75">
            {module.enterprises.length}
          </span>
        </span>
        <span className="flex items-center gap-1 font-sans text-[11px] text-gold/80">
          {expanded ? "Hide" : "View"}
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              expanded && "rotate-90"
            )}
          />
        </span>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25 }}
          id={`module-${module.key}-enterprises`}
          className="relative mt-3 max-h-80 overflow-y-auto pr-1"
        >
          <ul className="flex flex-col gap-2">
            {module.enterprises.length === 0 ? (
              <li className="rounded-md border border-dashed border-gold/15 bg-background/20 px-3 py-4 text-center font-sans text-[12px] text-muted-foreground">
                No active enterprises in this sector yet.
              </li>
            ) : (
              module.enterprises.map((e) => (
                <li
                  key={e.id}
                  className="rounded-md border border-gold/10 bg-background/40 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/badge/${e.slug}`}
                      className="font-serif text-[13px] font-medium text-foreground hover:text-gold"
                    >
                      {e.name}
                    </Link>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-gold/25 bg-gold/8 font-mono text-[10px] font-bold text-gold">
                        {e.tier}
                      </span>
                      {e.healthRating && (
                        <span className="rounded-md border border-gold/20 bg-gold/5 px-1.5 py-0.5 font-mono text-[9px] text-gold/75">
                          {e.healthRating}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 font-mono text-[9px] text-muted-foreground/70">
                    <span>{e.stage.replace("_", " ")} · raised {egp(e.raisedEgp, { compact: true })}</span>
                    <span className="flex items-center gap-1.5">
                      <span className={e.metricHealthy ? "text-emerald-300" : "text-amber-300"}>
                        {e.metricLabel}: {e.metricValue}
                      </span>
                      <CheckCircle2
                        className={cn(
                          "h-3 w-3",
                          e.metricHealthy ? "text-emerald-400" : "text-amber-400"
                        )}
                      />
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </motion.div>
      )}
    </motion.article>
  );
}
