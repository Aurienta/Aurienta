"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { egp } from "@/lib/aurienta/format";
import { type SyndicateForUi } from "./types";

export type AiMatch = {
  syndicateId: string;
  matchScore: number; // 0-100
  rationale: string;
};

export function AiMatchedSyndicates({
  matches,
  syndicates,
  onViewAll,
}: {
  matches: AiMatch[];
  syndicates: SyndicateForUi[];
  onViewAll?: () => void;
}) {
  if (matches.length === 0) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 240 }}
      className="relative overflow-hidden rounded-2xl border border-gold/22 glass-gold p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gold/15 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          <span className="font-mono text-xs uppercase tracking-[0.28em] text-gold-light/80">
            Constitutional AI
          </span>
        </div>
        <h3 className="mt-1.5 font-serif text-base font-semibold sm:text-lg">
          AI-matched syndicates for you
        </h3>
        <p className="mt-1 font-sans text-[11px] leading-relaxed text-muted-foreground">
          The Constitutional AI evaluated your risk profile, portfolio composition and the
          enterprises you already hold — and surfaced the most compatible syndicates.
        </p>

        <ul className="mt-4 flex flex-col gap-3">
          {matches.map((m, i) => {
            const syn = syndicates.find((s) => s.id === m.syndicateId);
            if (!syn) return null;
            return (
              <li
                key={m.syndicateId}
                className="rounded-xl border border-gold/15 bg-background/40 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        #{i + 1}
                      </span>
                      <p className="truncate font-serif text-sm font-semibold">
                        {syn.name}
                      </p>
                    </div>
                    <p className="font-sans text-xs text-muted-foreground">
                      {syn.enterprise.name} · {egp(syn.enterprise.equityUnitPriceEgp)}/share
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-serif text-lg font-semibold"
                      style={{
                        color:
                          m.matchScore >= 80
                            ? "#34d399"
                            : m.matchScore >= 60
                              ? "#f4d676"
                              : "#a89f86",
                      }}
                    >
                      {m.matchScore}%
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">match</p>
                  </div>
                </div>
                <p className="mt-2 font-sans text-[11px] leading-relaxed text-muted-foreground">
                  {m.rationale}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <GoldStar className="h-2.5 w-2.5 text-gold/70" />
                  <span className="font-mono text-[11px] text-muted-foreground/85">
                    {syn.committedShares.toLocaleString()} / {syn.targetShares.toLocaleString()} committed
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="mt-4 inline-flex items-center gap-1 text-[11px] font-sans text-gold-light transition-colors hover:text-gold"
          >
            View all syndicates <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </motion.aside>
  );
}
