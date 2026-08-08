"use client";

import * as React from "react";
import { Loader2, AlertCircle, ShieldCheck, XCircle, ChevronRight, Search } from "lucide-react";
import { timeAgo } from "@/lib/aurienta/format";

type Decision = {
  id: string;
  timestamp: string;
  sequence: number;
  policy: string;
  decision: string;
  reason: string | null;
  actor: string;
  decisionToken: string | null;
  payloadHash: string;
  prevHash: string | null;
};

type ApiResponse = {
  decisions: Decision[];
  pagination: { count: number; hasMore: boolean; nextCursor: string | null; limit: number };
};

export function PublicCreDecisionLog({
  slug,
  enterpriseName,
}: {
  slug: string;
  enterpriseName: string;
}) {
  const [data, setData] = React.useState<ApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"all" | "allowed" | "denied">("all");
  const [policySearch, setPolicySearch] = React.useState("");

  const fetchInitial = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/enterprise/${slug}/cre-decisions?limit=50`, {
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
        `/api/public/enterprise/${slug}/cre-decisions?limit=50&cursor=${data.pagination.nextCursor}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse = await res.json();
      setData((prev) =>
        prev
          ? { ...json, decisions: [...prev.decisions, ...json.decisions] }
          : json
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
    return data.decisions.filter((d) => {
      if (filter === "allowed" && d.decision !== "allowed") return false;
      if (filter === "denied" && d.decision !== "denied") return false;
      if (policySearch && !d.policy.toLowerCase().includes(policySearch.toLowerCase())) return false;
      return true;
    });
  }, [data, filter, policySearch]);

  return (
    <div className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
      {/* Header + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">CRE decision log</h2>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground/80 sm:ml-2">
            {data?.pagination.count ?? 0} of {data?.pagination.count ?? 0} shown
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter pills */}
          <div className="inline-flex items-center rounded-full border border-gold/15 bg-background/40 p-0.5">
            {(["all", "allowed", "denied"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 font-sans text-[11px] capitalize transition-colors ${
                  filter === f ? "bg-gold/15 text-gold-light" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {/* Policy search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="search"
              value={policySearch}
              onChange={(e) => setPolicySearch(e.target.value)}
              placeholder="Filter by policy…"
              className="h-8 w-40 rounded-full border border-gold/15 bg-background/60 pl-7 pr-3 font-sans text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
              aria-label="Filter by policy name"
            />
          </div>
        </div>
      </div>

      {/* Decision list */}
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
            <span className="ml-2 font-sans text-xs text-muted-foreground">Loading decisions…</span>
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
              No CRE decisions match the current filter.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <ol className="space-y-2">
            {filtered.map((d) => {
              const isAllowed = d.decision === "allowed";
              const Icon = isAllowed ? ShieldCheck : XCircle;
              const tone = isAllowed
                ? "border-emerald-400/25 bg-emerald-400/[0.04] text-emerald-300"
                : "border-red-400/25 bg-red-400/[0.04] text-red-300";

              return (
                <li
                  key={d.id}
                  className="flex flex-col gap-2 rounded-xl border border-gold/12 bg-foreground/[0.02] p-3 sm:flex-row sm:items-start sm:gap-3"
                >
                  <div className="flex items-center gap-3 sm:flex-col sm:items-center">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${tone}`}
                      title={isAllowed ? "Allowed" : "Denied"}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-xs text-gold-light">{d.policy}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase ${tone}`}
                      >
                        {d.decision}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground/80">
                        {timeAgo(new Date(d.timestamp))} · seq #{d.sequence}
                      </span>
                    </div>

                    {d.reason && (
                      <p className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground/85">
                        {d.reason}
                      </p>
                    )}

                    <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground/80">
                      <span className="rounded-full border border-gold/15 bg-background/50 px-2 py-0.5">
                        Actor: <span className="text-gold-light/90">{d.actor}</span>
                      </span>
                      {d.decisionToken && (
                        <span className="rounded-full border border-gold/15 bg-background/50 px-2 py-0.5">
                          Token: <span className="text-gold-light/90">{d.decisionToken}</span>
                        </span>
                      )}
                      <span className="rounded-full border border-gold/15 bg-background/50 px-2 py-0.5">
                        Hash: <span className="text-gold-light/80">{d.payloadHash.slice(0, 12)}…</span>
                      </span>
                    </div>
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

      {!loading && !error && (data?.decisions.length ?? 0) === 0 && (
        <p className="mt-3 text-center font-sans text-[11px] text-muted-foreground/70">
          No CRE decisions have been recorded for {enterpriseName} yet. Decisions are written to the
          immutable ledger every time a constitutional policy is invoked.
        </p>
      )}
    </div>
  );
}
