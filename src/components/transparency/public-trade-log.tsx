"use client";

import * as React from "react";
import { Loader2, AlertCircle, TrendingUp, ChevronRight, ShieldCheck, ShieldAlert } from "lucide-react";
import { egp, timeAgo } from "@/lib/aurienta/format";

type Trade = {
  id: string;
  timestamp: string;
  side: string;
  units: number;
  priceEgp: number;
  totalValueEgp: number;
  feesEgp: number;
  phase: string;
  partnerRef: string;
  crePriceBandVerification: {
    result: string;
    referencePriceEgp: number;
    deviationPct: number;
    bandPct: number;
  };
};

type ApiResponse = {
  trades: Trade[];
  pagination: { count: number; hasMore: boolean; nextCursor: string | null; limit: number };
  totalTrades: number;
  uniquePartners: number;
};

export function PublicTradeLog({
  slug,
  enterpriseName,
  referencePriceEgp,
}: {
  slug: string;
  enterpriseName: string;
  referencePriceEgp: number;
}) {
  const [data, setData] = React.useState<ApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sideFilter, setSideFilter] = React.useState<"all" | "buy" | "sell">("all");
  const [verifyFilter, setVerifyFilter] = React.useState<"all" | "verified" | "flagged">("all");

  const fetchInitial = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/enterprise/${slug}/trades?limit=50`, {
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
  }, [slug]);

  const fetchMore = React.useCallback(async () => {
    if (!data?.pagination.nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/public/enterprise/${slug}/trades?limit=50&cursor=${data.pagination.nextCursor}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse = await res.json();
      setData((prev) =>
        prev ? { ...json, trades: [...prev.trades, ...json.trades] } : json
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingMore(false);
    }
  }, [slug, data]);

  React.useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const filtered = React.useMemo(() => {
    if (!data) return [];
    return data.trades.filter((t) => {
      if (sideFilter !== "all" && t.side !== sideFilter) return false;
      const isVerified = t.crePriceBandVerification.result === "verified";
      if (verifyFilter === "verified" && !isVerified) return false;
      if (verifyFilter === "flagged" && isVerified) return false;
      return true;
    });
  }, [data, sideFilter, verifyFilter]);

  return (
    <div className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
      {/* Header + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">Filled trades</h2>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground/80 sm:ml-2">
            {data?.pagination.count ?? 0} shown · {data?.totalTrades ?? 0} total
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-full border border-gold/15 bg-background/40 p-0.5">
            {(["all", "buy", "sell"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setSideFilter(f)}
                className={`rounded-full px-3 py-1 font-sans text-[11px] capitalize transition-colors ${
                  sideFilter === f ? "bg-gold/15 text-gold-light" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="inline-flex items-center rounded-full border border-gold/15 bg-background/40 p-0.5">
            {(["all", "verified", "flagged"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setVerifyFilter(f)}
                className={`rounded-full px-3 py-1 font-sans text-[11px] capitalize transition-colors ${
                  verifyFilter === f ? "bg-gold/15 text-gold-light" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trade list */}
      <div className="mt-4 max-h-[36rem] overflow-y-auto pr-1">
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-thumb {
            background: rgba(212, 175, 55, 0.3);
            border-radius: 3px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
        `}</style>

        {loading && (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-gold/70" />
            <span className="ml-2 font-sans text-xs text-muted-foreground">Loading trades…</span>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-center">
            <AlertCircle className="mx-auto h-4 w-4 text-red-300" />
            <p className="mt-2 font-sans text-xs text-red-200">Failed to load: {error}</p>
            <button
              onClick={fetchInitial}
              className="mt-2 rounded-full border border-red-400/30 px-3 py-1 font-sans text-[11px] text-red-200 hover:bg-red-400/10"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-6 text-center">
            <p className="font-sans text-xs text-muted-foreground">
              No filled trades match the current filter.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <ol className="space-y-2">
            {filtered.map((t) => {
              const isBuy = t.side === "buy";
              const isVerified = t.crePriceBandVerification.result === "verified";
              const sideTone = isBuy
                ? "border-emerald-400/25 bg-emerald-400/[0.04] text-emerald-300"
                : "border-amber-400/25 bg-amber-400/[0.04] text-amber-300";
              const VerifyIcon = isVerified ? ShieldCheck : ShieldAlert;
              const verifyTone = isVerified
                ? "border-emerald-400/25 text-emerald-300"
                : "border-red-400/30 text-red-300";

              return (
                <li
                  key={t.id}
                  className="flex flex-col gap-2 rounded-xl border border-gold/12 bg-foreground/[0.02] p-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  {/* Side badge */}
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] uppercase ${sideTone}`}
                    title={t.side}
                  >
                    {t.side === "buy" ? "B" : "S"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-xs text-foreground">
                        {t.units.toLocaleString()} units
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground/85">@ {egp(t.priceEgp)}</span>
                      <span className="font-mono text-[11px] text-gold-light">
                        = {egp(t.totalValueEgp, { compact: true })}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground/80">
                        · {timeAgo(new Date(t.timestamp))}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground/80">
                      <span className="rounded-full border border-gold/15 bg-background/50 px-2 py-0.5">
                        Partner: <span className="text-gold-light/90">{t.partnerRef}</span>
                      </span>
                      <span className="rounded-full border border-gold/15 bg-background/50 px-2 py-0.5 capitalize">
                        {t.phase.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${verifyTone}`}
                        title={`Deviation ${t.crePriceBandVerification.deviationPct}% (band ±${t.crePriceBandVerification.bandPct}%)`}
                      >
                        <VerifyIcon className="h-2.5 w-2.5" />
                        CRE: {t.crePriceBandVerification.result.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* Right-side stat */}
                  <div className="shrink-0 text-right sm:w-24">
                    <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/85">
                      Fees
                    </div>
                    <div className="font-mono text-xs text-foreground">{egp(t.feesEgp)}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Load more */}
      {data?.pagination.hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={fetchMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-2 font-sans text-xs text-foreground transition-colors hover:bg-gold/5 disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
              </>
            ) : (
              <>
                Load more <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      )}

      {!loading && !error && (data?.trades.length ?? 0) === 0 && (
        <p className="mt-3 text-center font-sans text-[11px] text-muted-foreground/70">
          No filled trades have been recorded for {enterpriseName} yet. The constitutional price
          (CPP) reference is {egp(referencePriceEgp)} per equity unit; trades are bounded by a ±5%
          price band per Rule I 1.5.
        </p>
      )}
    </div>
  );
}
