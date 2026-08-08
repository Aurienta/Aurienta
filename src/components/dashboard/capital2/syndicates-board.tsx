"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Inbox, ShieldCheck, Scale, Lock, HandCoins } from "lucide-react";
import { FormSyndicateDialog } from "./form-syndicate-dialog";
import { JoinSyndicateDialog } from "./join-syndicate-dialog";
import { SyndicateCard } from "./syndicate-card";
import { AiMatchedSyndicates, type AiMatch } from "./ai-matched-syndicates";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { cn } from "@/lib/utils";
import {
  type SyndicateForUi,
  type EnterpriseForSyndicate,
} from "./types";

type FilterKey = "all" | "forming" | "active" | "mine";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "forming", label: "Forming" },
  { key: "active", label: "Active" },
  { key: "mine", label: "Mine" },
];

export function SyndicatesBoard({
  syndicates,
  enterprises,
  userRiskProfile,
  aiMatches,
}: {
  syndicates: SyndicateForUi[];
  enterprises: EnterpriseForSyndicate[];
  userRiskProfile: string | null;
  aiMatches: AiMatch[];
}) {
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [joiningId, setJoiningId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const list = syndicates.slice();
    switch (filter) {
      case "all":
        return list;
      case "forming":
        return list.filter((s) => s.status === "forming");
      case "active":
        return list.filter((s) => s.status === "active");
      case "mine":
        return list.filter((s) => s.isMember || s.isLead);
    }
  }, [filter, syndicates]);

  const counts = React.useMemo(
    () => ({
      all: syndicates.length,
      forming: syndicates.filter((s) => s.status === "forming").length,
      active: syndicates.filter((s) => s.status === "active").length,
      mine: syndicates.filter((s) => s.isMember || s.isLead).length,
    }),
    [syndicates]
  );

  const joiningSyndicate = joiningId
    ? syndicates.find((s) => s.id === joiningId) ?? null
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold/60" />
              <span className="font-mono text-xs uppercase tracking-[0.28em] text-gold-light/80">
                Constitutional Syndicates
              </span>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-gold-gradient sm:text-4xl">
              Capital Partner syndicates
            </h1>
            <p className="mt-2 max-w-2xl font-sans text-sm text-muted-foreground">
              Form pro-rata syndicates to collectively exercise pre-emptive rights or co-invest.
              Coordination only — <strong className="text-foreground">no pooled custody</strong>.
              Each member&apos;s funds still flow to the law firm client account with individual references.
            </p>
          </div>
          {enterprises.length > 0 && (
            <FormSyndicateDialog
              enterprises={enterprises}
              userRiskProfile={userRiskProfile}
            />
          )}
        </div>

        {/* Zero custody banner */}
        <div className="flex items-start gap-3 rounded-xl border border-gold/20 bg-gold/[0.04] px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p className="font-sans text-[12px] leading-relaxed text-muted-foreground">
            <span className="text-foreground font-medium">Zero Custody applies to syndicates.</span>{" "}
            Syndicates coordinate — they do not pool custody. Each member&apos;s funds flow
            directly to the law firm client account with individual references, enforced by the CRE.
          </p>
        </div>

        {/* Constitutional hash strip */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gold/10 bg-foreground/[0.02] px-3 py-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.4)]" />
            CRE live
          </span>
          <span className="font-mono text-xs text-muted-foreground/85">
            hash {CONSTITUTIONAL_HASH.slice(0, 18)}…
          </span>
          <span className="ml-auto hidden items-center gap-3 font-mono text-[11px] text-muted-foreground/85 sm:flex">
            <span>{syndicates.length} syndicates</span>
            <span className="text-gold/40">·</span>
            <span>{counts.forming} forming</span>
            <span className="text-gold/40">·</span>
            <span>{counts.active} active</span>
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] xl:gap-8">
        <div className="flex flex-col gap-5">
          {/* Filter tabs */}
          <div
            role="tablist"
            aria-label="Filter syndicates"
            className="flex w-full gap-1 overflow-x-auto rounded-xl border border-gold/10 bg-foreground/[0.02] p-1"
          >
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "relative inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 font-sans text-[12px] font-medium transition-colors sm:text-sm",
                    active ? "text-black" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="syn-filter-pill"
                      className="absolute inset-0 rounded-lg bg-gold-gradient shadow-[0_4px_18px_-6px_rgba(212,175,55,0.6)]"
                      transition={{ type: "spring", damping: 24, stiffness: 280 }}
                    />
                  )}
                  <span className="relative z-10">{f.label}</span>
                  <span
                    className={cn(
                      "relative z-10 ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[11px]",
                      active ? "bg-black/15 text-black" : "bg-foreground/10 text-muted-foreground"
                    )}
                  >
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cards grid */}
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gold/10 bg-foreground/[0.02] py-16 text-center"
                >
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-0 rounded-full bg-gold/10 blur-xl" />
                    <Inbox className="relative h-8 w-8 text-gold/60" />
                  </div>
                  <p className="font-serif text-base font-semibold text-foreground">
                    No syndicates in this view
                  </p>
                  <p className="max-w-sm font-sans text-[12px] text-muted-foreground">
                    {filter === "mine"
                      ? "You haven't joined or formed a syndicate yet."
                      : filter === "forming"
                        ? "No syndicates are currently forming. Be the first to coordinate."
                        : "No active syndicates match this filter."}
                  </p>
                  {enterprises.length > 0 && filter !== "all" && (
                    <FormSyndicateDialog
                      enterprises={enterprises}
                      userRiskProfile={userRiskProfile}
                      triggerClassName="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-3 py-1.5 font-sans text-[11px] text-gold-light hover:bg-gold/5"
                    />
                  )}
                </motion.div>
              ) : (
                filtered.map((s) => (
                  <SyndicateCard
                    key={s.id}
                    syndicate={s}
                    onJoin={(syn) => setJoiningId(syn.id)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <footer className="mt-2 flex flex-wrap items-center gap-3 border-t border-gold/8 pt-4 font-mono text-xs text-muted-foreground/85">
            <span className="inline-flex items-center gap-1">
              <Scale className="h-3 w-3 text-gold/60" /> CRE-enforced
            </span>
            <span className="text-gold/15">·</span>
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3 text-gold/60" /> Hash-anchored
            </span>
            <span className="text-gold/15">·</span>
            <span className="inline-flex items-center gap-1">
              <HandCoins className="h-3 w-3 text-gold/60" /> Individual law firm client account
            </span>
          </footer>
        </div>

        {/* Right rail: AI matched syndicates */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <AiMatchedSyndicates
            matches={aiMatches}
            syndicates={syndicates}
            onViewAll={() => setFilter("all")}
          />
          {aiMatches.length === 0 && (
            <aside className="rounded-2xl border border-gold/12 glass p-5">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-gold/60" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  No AI matches yet
                </span>
              </div>
              <p className="mt-2 font-sans text-[12px] leading-relaxed text-muted-foreground">
                Form or join a syndicate and the Constitutional AI will surface compatible
                opportunities based on your risk profile and existing holdings.
              </p>
            </aside>
          )}
        </div>
      </div>

      <JoinSyndicateDialog
        syndicate={joiningSyndicate}
        open={!!joiningSyndicate}
        onOpenChange={(v) => {
          if (!v) setJoiningId(null);
        }}
      />
    </div>
  );
}
