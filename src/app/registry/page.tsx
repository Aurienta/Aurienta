"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Building2,
  Users,
  TrendingUp,
  HeartPulse,
  ShieldCheck,
  Award,
  ChevronRight,
  Loader2,
  X,
  FileCheck,
  Scale,
  ExternalLink,
  Info,
  AlertCircle,
} from "lucide-react";
import { egp, pct, timeAgo } from "@/lib/aurienta/format";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { PublicTrustHeader, PublicTrustFooter } from "@/components/trust/public-shell";

type RegistryEntry = {
  slug: string;
  name: string;
  tagline: string | null;
  sector: string;
  tier: string;
  stage: string;
  legalForm: string;
  healthRating: string | null;
  healthScore: number;
  fundraisingGoalEgp: number;
  raisedEgp: number;
  equityUnitPriceEgp: number;
  totalEquityUnits: number;
  partnerCount: number;
  employeeCount: number;
  nosiCompliantPct: number;
  policeClearanceValid: boolean;
  graduationReadiness: number;
  transparencyScore: number;
  status: string;
  createdAt: string;
  lawFirm: { name: string; license: string } | null;
  accountingFirm: { name: string; esaaLicense: string } | null;
};

type ApiResponse = {
  enterprises: RegistryEntry[];
  pagination: { count: number; hasMore: boolean; nextCursor: string | null; limit: number };
  filters: { q: string; tier: string; sector: string; status: string };
  constitutionalHash: string;
  legalNotice: string;
  disclaimer: string;
  fetchedAt: string;
};

const TIER_OPTIONS = ["", "A", "B", "C", "D", "E", "F"] as const;
const SECTOR_OPTIONS = [
  "",
  "agriculture",
  "manufacturing",
  "tourism",
  "technology",
  "food",
  "retail",
  "logistics",
] as const;
const STATUS_OPTIONS = [
  "",
  "fundraising_active",
  "fundraising_closed",
  "active",
  "frozen",
  "graduation_pending",
  "graduated",
] as const;

function badgeColor(rating: string | null | undefined) {
  if (!rating) return "text-muted-foreground border-muted-foreground/30";
  if (rating.startsWith("AAA") || rating.startsWith("AA")) return "text-emerald-300 border-emerald-400/40";
  if (rating.startsWith("A") || rating.startsWith("BBB")) return "text-gold-light border-gold/40";
  if (rating.startsWith("BB") || rating.startsWith("B")) return "text-amber-300 border-amber-400/40";
  return "text-red-300 border-red-400/40";
}

function statusColor(status: string) {
  if (status === "graduated") return "text-emerald-300 border-emerald-400/40 bg-emerald-400/5";
  if (status === "frozen") return "text-red-300 border-red-400/40 bg-red-400/5";
  if (status === "fundraising_active") return "text-gold-light border-gold/40 bg-gold/8";
  return "text-muted-foreground border-muted-foreground/30 bg-foreground/[0.02]";
}

export default function RegistryPage() {
  const [data, setData] = React.useState<ApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [tier, setTier] = React.useState("");
  const [sector, setSector] = React.useState("");
  const [status, setStatus] = React.useState("");

  // Debounce the search query.
  const debouncedQ = React.useDeferredValue(q);

  const fetchRegistry = React.useCallback(
    async (cursor?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
        if (tier) params.set("tier", tier);
        if (sector) params.set("sector", sector);
        if (status) params.set("status", status);
        params.set("limit", "50");
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/public/registry?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ApiResponse = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, tier, sector, status]
  );

  React.useEffect(() => {
    fetchRegistry();
  }, [debouncedQ, tier, sector, status, fetchRegistry]);

  const hasActiveFilters = !!(q || tier || sector || status);
  const clearFilters = () => {
    setQ("");
    setTier("");
    setSector("");
    setStatus("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicTrustHeader active="registry" />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          {/* Header */}
          <section className="relative overflow-hidden rounded-3xl border border-gold/15 glass-gold p-6 sm:p-10">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2.5">
                <AurientaMark className="h-8 w-8" />
                <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-gold-light/85">
                  Constitutional Registry · PDPL 151/2020 Compliant
                </span>
              </div>
              <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.05] sm:text-5xl">
                Public Constitutional Registry
              </h1>
              <p className="mt-3 max-w-3xl font-sans text-sm leading-relaxed text-muted-foreground">
                Every active AURIENTA enterprise, published by constitutional charter Article XIV.
                Enterprise-level data only — partner counts are aggregates, never personal names.
                Real-time, ledger-anchored, CRE-verified.
              </p>

              {/* Constitutional hash */}
              <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground/85">
                <span className="rounded-full border border-gold/15 bg-background/50 px-3 py-1.5">
                  Constitutional Hash: <span className="text-gold-light">{CONSTITUTIONAL_HASH.slice(0, 14)}…{CONSTITUTIONAL_HASH.slice(-6)}</span>
                </span>
                <span className="rounded-full border border-gold/15 bg-background/50 px-3 py-1.5">
                  Enterprises: <span className="text-gold-light">{data?.pagination.count ?? "—"}</span>
                </span>
              </div>
            </div>
          </section>

          {/* PDPL + disclaimer notices */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.04] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <div>
                  <div className="font-sans text-xs font-semibold uppercase tracking-wide text-emerald-200/90">
                    PDPL Compliance — Egyptian Law 151/2020
                  </div>
                  <p className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground/85">
                    Personal data is protected under Egyptian PDPL Law 151/2020. Enterprise data is
                    published per constitutional charter Article XIV. Partner identities are
                    anonymized as &quot;Partner #NNNN&quot;.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gold/15 bg-gold/[0.03] p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold/80" />
                <div>
                  <div className="font-sans text-xs font-semibold uppercase tracking-wide text-gold-light/85">
                    Constitutional Disclaimer
                  </div>
                  <p className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground/85">
                    AURIENTA is a constitutional constitutional infrastructure, not an official government
                    registry. Data is self-reported by enterprises and verified by the CRE.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Search + filter bar */}
          <section className="mt-8 rounded-2xl border border-gold/15 glass p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search enterprises by name, sector, tagline…"
                  className="h-11 w-full rounded-full border border-gold/15 bg-background/60 pl-10 pr-4 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20"
                  aria-label="Search registry"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect
                  icon={Award}
                  label="Tier"
                  value={tier}
                  onChange={setTier}
                  options={TIER_OPTIONS.map((t) => ({ value: t, label: t || "All tiers" }))}
                />
                <FilterSelect
                  icon={Building2}
                  label="Sector"
                  value={sector}
                  onChange={setSector}
                  options={SECTOR_OPTIONS.map((s) => ({ value: s, label: s ? s.charAt(0).toUpperCase() + s.slice(1) : "All sectors" }))}
                />
                <FilterSelect
                  icon={ShieldCheck}
                  label="Status"
                  value={status}
                  onChange={setStatus}
                  options={STATUS_OPTIONS.map((s) => ({ value: s, label: s ? s.replace(/_/g, " ") : "All statuses" }))}
                />
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex h-11 items-center gap-1.5 rounded-full border border-gold/15 bg-background/60 px-4 font-sans text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" /> Clear
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Results */}
          <section className="mt-6">
            {error && (
              <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-6 text-center">
                <AlertCircle className="mx-auto h-6 w-6 text-red-300" />
                <p className="mt-2 font-sans text-sm text-red-200">Failed to load registry: {error}</p>
                <button
                  onClick={() => fetchRegistry()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-red-400/30 px-4 py-1.5 font-sans text-xs text-red-200 hover:bg-red-400/10"
                >
                  Retry
                </button>
              </div>
            )}

            {loading && (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-gold/15 glass">
                <Loader2 className="h-6 w-6 animate-spin text-gold/70" />
                <span className="ml-3 font-sans text-sm text-muted-foreground">Loading registry…</span>
              </div>
            )}

            {!loading && !error && data && data.enterprises.length === 0 && (
              <div className="rounded-2xl border border-gold/15 glass p-10 text-center">
                <Info className="mx-auto h-6 w-6 text-muted-foreground/60" />
                <p className="mt-2 font-sans text-sm text-muted-foreground">
                  No enterprises match the current filters.
                </p>
              </div>
            )}

            {!loading && !error && data && data.enterprises.length > 0 && (
              <>
                {/* Results header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-sans text-xs text-muted-foreground/80">
                    Showing <span className="font-mono text-gold-light">{data.pagination.count}</span> enterprise{data.pagination.count === 1 ? "" : "s"}
                    {hasActiveFilters && <span> · filtered</span>}
                  </div>
                  <a
                    href={`/api/public/registry${hasActiveFilters ? `?${new URLSearchParams({ q, tier, sector, status }).toString()}` : ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 px-3 py-1.5 font-sans text-xs text-muted-foreground transition-colors hover:text-gold-light"
                  >
                    JSON API <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Enterprise grid */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {data.enterprises.map((e, idx) => (
                      <motion.div
                        key={e.slug}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.15) }}
                      >
                        <RegistryCard entry={e} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination footer */}
                {data.pagination.hasMore && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => data.pagination.nextCursor && fetchRegistry(data.pagination.nextCursor)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-5 py-2.5 font-sans text-sm text-foreground transition-colors hover:bg-gold/5"
                    >
                      Load more <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <PublicTrustFooter />
    </div>
  );
}

function FilterSelect({
  icon: Icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 appearance-none rounded-full border border-gold/15 bg-background/60 pl-9 pr-8 font-sans text-xs text-foreground focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Filter className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/50" />
    </label>
  );
}

function RegistryCard({ entry: e }: { entry: RegistryEntry }) {
  const goalPct = e.fundraisingGoalEgp > 0 ? (e.raisedEgp / e.fundraisingGoalEgp) * 100 : 0;
  return (
    <Link
      href={`/enterprise/${e.slug}`}
      className="group flex h-full flex-col gap-4 rounded-2xl border border-gold/15 glass p-5 transition-all hover:border-gold/30 hover:shadow-[0_8px_30px_-12px_rgba(212,175,55,0.4)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-muted-foreground/85">
            <span className="font-serif text-sm font-bold text-gold-gradient">Tier {e.tier}</span>
            <span>·</span>
            <span>{e.legalForm}</span>
            <span>·</span>
            <span className="capitalize">{e.sector}</span>
          </div>
          <h3 className="mt-1.5 font-serif text-lg font-semibold leading-tight text-foreground group-hover:text-gold-light">
            {e.name}
          </h3>
          {e.tagline && (
            <p className="mt-1 line-clamp-1 font-sans text-xs text-muted-foreground/85">
              {e.tagline}
            </p>
          )}
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${statusColor(e.status)}`}>
          {e.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        <Metric
          icon={Award}
          label="Health"
          value={e.healthRating ?? "—"}
          className={badgeColor(e.healthRating)}
        />
        <Metric
          icon={HeartPulse}
          label="Score"
          value={`${e.healthScore}/100`}
        />
        <Metric
          icon={TrendingUp}
          label="Capital Participated"
          value={egp(e.raisedEgp, { compact: true })}
        />
        <Metric
          icon={Users}
          label="Partners"
          value={`${e.partnerCount}`}
        />
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground/85">
          <span>{pct(goalPct, 0)} of goal</span>
          <span className="text-gold-light/85">{egp(e.raisedEgp, { compact: true })} / {egp(e.fundraisingGoalEgp, { compact: true })}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-gold/15 bg-background/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8a6d1f] via-[#d4af37] to-[#f4d676] transition-all"
            style={{ width: `${Math.min(100, goalPct).toFixed(1)}%` }}
          />
        </div>
      </div>

      {/* Compliance + transparency */}
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-muted-foreground/85">
        {e.policeClearanceValid && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/5 px-2 py-0.5 text-emerald-300">
            <ShieldCheck className="h-2.5 w-2.5" /> Police
          </span>
        )}
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${e.nosiCompliantPct >= 100 ? "border-emerald-400/25 bg-emerald-400/5 text-emerald-300" : "border-amber-400/25 bg-amber-400/5 text-amber-300"}`}>
          NOSI {e.nosiCompliantPct.toFixed(0)}%
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 text-gold-light">
          Transparency {e.transparencyScore}/100
        </span>
      </div>

      {/* Counterparties */}
      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gold/10 pt-3">
        <Counterparty
          icon={Scale}
          label="Law firm"
          name={e.lawFirm?.name ?? "Pending"}
          sub={e.lawFirm ? `Lic ${e.lawFirm.license}` : "—"}
        />
        <Counterparty
          icon={FileCheck}
          label="Accounting"
          name={e.accountingFirm?.name ?? "Pending"}
          sub={e.accountingFirm ? `ESAA ${e.accountingFirm.esaaLicense}` : "—"}
        />
      </div>

      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground/70">
        <span>Listed {timeAgo(new Date(e.createdAt))}</span>
        <span className="inline-flex items-center gap-1 text-gold-light/80 transition-colors group-hover:text-gold">
          View profile <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-gold/12 bg-foreground/[0.02] p-2.5 ${className ?? ""}`}>
      <div className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground/85">
        <Icon className="h-2.5 w-2.5" /> {label}
      </div>
      <div className="mt-1 font-mono text-xs text-foreground">{value}</div>
    </div>
  );
}

function Counterparty({
  icon: Icon,
  label,
  name,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  name: string;
  sub: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground/85">
        <Icon className="h-2.5 w-2.5 text-gold/70" /> {label}
      </div>
      <div className="mt-0.5 truncate font-sans text-xs font-medium text-foreground">{name}</div>
      <div className="truncate font-mono text-[10px] text-muted-foreground/80">{sub}</div>
    </div>
  );
}
