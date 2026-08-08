"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Flag,
  HandCoins,
  TrendingUp,
  Award,
  GraduationCap,
  Circle,
  ShieldCheck,
  Download,
  ExternalLink,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { GoldStar } from "@/components/aurienta-logo";
import { egp, timeAgo } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";
import { type CareerEntryForUi, entryMeta } from "./career-ledger-types";

const ICONS: Record<string, React.ElementType> = {
  Flag,
  HandCoins,
  TrendingUp,
  Award,
  GraduationCap,
  Circle,
};

export function CareerLedgerTimeline({
  entries,
  totalValue,
  enterpriseCount,
  vcCount,
}: {
  entries: CareerEntryForUi[];
  totalValue: number;
  enterpriseCount: number;
  vcCount: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-gold/15 glass-gold p-5 sm:p-7"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStat
            icon={Award}
            label="Total entries"
            value={String(entries.length)}
            sub="Portable across enterprises"
          />
          <SummaryStat
            icon={Building2}
            label="Enterprises served"
            value={String(enterpriseCount)}
            sub="Cross-portfolio career"
          />
          <SummaryStat
            icon={HandCoins}
            label="Value generated"
            value={egp(totalValue, { compact: totalValue >= 1_000_000 })}
            sub="Sum of valued entries"
          />
          <SummaryStat
            icon={ShieldCheck}
            label="VCs issued"
            value={String(vcCount)}
            sub="W3C Verifiable Credentials"
          />
        </div>
        <p className="relative mt-5 max-w-3xl font-sans text-[12px] leading-relaxed text-muted-foreground">
          <span className="text-foreground font-medium">Your portable reputation.</span>{" "}
          These entries are W3C Verifiable Credentials. You own them and can present them to
          any external party — employer, regulator, lender, university — without an AURIENTA API call.
        </p>
      </motion.section>

      {/* Timeline */}
      <section aria-label="Career ledger timeline">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold/60" />
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-gold-light/80">
              Career ledger · portable record
            </span>
          </div>
          <span className="font-mono text-xs text-muted-foreground/85">
            {entries.length} entr{entries.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-2xl border border-gold/10 bg-foreground/[0.02] py-16 text-center">
            <p className="font-serif text-base font-semibold text-foreground">
              No career entries yet
            </p>
            <p className="mt-1 font-sans text-[12px] text-muted-foreground">
              Contributions, milestones, promotions, equity grants, and training completions
              will appear here as W3C Verifiable Credentials.
            </p>
          </div>
        ) : (
          <ol className="relative flex flex-col gap-3">
            {entries.map((entry, i) => (
              <CareerEntryCard key={entry.id} entry={entry} index={i} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function CareerEntryCard({
  entry,
  index,
}: {
  entry: CareerEntryForUi;
  index: number;
}) {
  const meta = entryMeta(entry.entryType);
  const Icon = ICONS[meta.icon] ?? Circle;

  function handleExportVc() {
    // Mock — generate an IPFS CID-like ref and toast.
    const cidStub = "Qm" + Math.random().toString(36).slice(2, 12).padEnd(10, "0").toUpperCase();
    toast.success("Verifiable Credential exported", {
      description: `Pinned to IPFS: ${cidStub}… — present it to any external party without an AURIENTA API call.`,
    });
  }

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), type: "spring", damping: 26, stiffness: 220 }}
      className="relative rounded-2xl border border-gold/12 glass p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {/* Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
          style={{
            background: `${meta.color}14`,
            borderColor: `${meta.color}40`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color: meta.color }} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-sans text-xs"
              style={{ background: `${meta.color}1a`, color: meta.color }}
            >
              {meta.label}
            </span>
            <h3 className="font-serif text-sm font-semibold sm:text-base">
              {entry.title}
            </h3>
            {entry.vcCid && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                <ShieldCheck className="h-2.5 w-2.5" /> W3C VC
              </span>
            )}
          </div>

          <p className="mt-1 font-sans text-[12px] leading-relaxed text-muted-foreground">
            {entry.description}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground/85">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-2.5 w-2.5" />
              {entry.enterprise.name}
              <span className="rounded border border-gold/25 bg-gold/8 px-1 py-0.5 text-[11px] text-gold-light">
                T{entry.enterprise.tier}
              </span>
            </span>
            <span>·</span>
            <span>Role: {entry.role}</span>
            <span>·</span>
            <span>Issued {timeAgo(new Date(entry.vcIssuedAt))}</span>
            {entry.valueEgp != null && entry.valueEgp > 0 && (
              <>
                <span>·</span>
                <span className="text-gold-light">
                  Value {egp(entry.valueEgp, { compact: entry.valueEgp >= 1_000_000 })}
                </span>
              </>
            )}
          </div>

          {entry.vcCid && (
            <div className="mt-2 flex items-center gap-1.5 rounded-md border border-gold/10 bg-background/30 px-2 py-1">
              <GoldStar className="h-2.5 w-2.5 text-gold/70" />
              <code className="truncate font-mono text-xs text-muted-foreground">
                ipfs://{entry.vcCid}
              </code>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:flex-col sm:items-end">
          {entry.vcCid ? (
            <button
              type="button"
              onClick={handleExportVc}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border border-gold/25 bg-gold/8 px-2.5 py-1",
                "font-sans text-xs font-medium text-gold-light transition-colors hover:bg-gold/15"
              )}
            >
              <Download className="h-3 w-3" /> Export VC
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground/80">
              <ExternalLink className="h-2.5 w-2.5" /> Pending VC
            </span>
          )}
        </div>
      </div>
    </motion.li>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="relative rounded-xl border border-gold/10 bg-background/40 p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gold/15 bg-gold/5">
          <Icon className="h-3.5 w-3.5 text-gold" />
        </span>
        <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-2 font-serif text-xl font-semibold sm:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 font-mono text-xs text-muted-foreground/85">{sub}</p>}
    </div>
  );
}
