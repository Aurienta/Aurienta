"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Activity, ArrowUpRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type TickerEvent = {
  id: string;
  eventType: string;
  enterpriseName: string;
  enterpriseSlug: string | null;
  timestamp: string;
  payloadHash: string;
  sequence: number;
  narration: string;
};

type Props = {
  /** Pass an enterpriseId to scope the ticker to one enterprise. Omit for infrastructure-wide events. */
  enterpriseId?: string;
  /** Polling interval in ms (default 15000). */
  intervalMs?: number;
  /** Max events to render (default 8). */
  maxVisible?: number;
  className?: string;
};

/**
 * LiveLedgerTicker — polls `/api/ledger/ticker` every 15s and renders an
 * animated vertical ticker of recent constitutional ledger events. Each
 * event line is Brain-AI-narrated.
 *
 * Gold theme, glass-gold cards. Respects prefers-reduced-motion.
 */
export function LiveLedgerTicker({
  enterpriseId,
  intervalMs = 15_000,
  maxVisible = 8,
  className,
}: Props) {
  const [events, setEvents] = React.useState<TickerEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const reduceMotion = useReducedMotion();

  const fetchTicker = React.useCallback(async () => {
    try {
      const qs = enterpriseId ? `?enterpriseId=${encodeURIComponent(enterpriseId)}` : "";
      const res = await fetch(`/api/ledger/ticker${qs}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.events)) {
        setEvents(data.events);
        setLastUpdated(new Date());
      }
    } catch {
      // Network errors are non-fatal for a background ticker.
    } finally {
      setLoading(false);
    }
  }, [enterpriseId]);

  React.useEffect(() => {
    fetchTicker();
    const id = setInterval(fetchTicker, intervalMs);
    return () => clearInterval(id);
  }, [fetchTicker, intervalMs]);

  const visible = events.slice(0, maxVisible);

  return (
    <section
      aria-label="Live ledger ticker"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gold/15 glass-gold p-4 sm:p-5",
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative inline-flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
          </span>
          <Activity className="h-4 w-4 text-gold" />
          <h3 className="font-serif text-sm font-semibold tracking-wide">
            Live Ledger Ticker
          </h3>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 sm:inline">
            {enterpriseId ? "enterprise-scoped" : "infrastructure-wide"} · 15s poll
          </span>
        </div>
        <button
          onClick={fetchTicker}
          className="inline-flex items-center gap-1.5 rounded-md border border-gold/15 bg-gold/[0.03] px-2 py-1 font-sans text-[11px] text-muted-foreground transition-colors hover:border-gold/30 hover:text-foreground"
          aria-label="Refresh ticker now"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          <span className="hidden sm:inline">
            {lastUpdated ? `Updated ${formatTimeAgo(lastUpdated)}` : "Refresh"}
          </span>
        </button>
      </div>

      {/* Ticker body */}
      <div
        className="relative max-h-80 overflow-y-auto pr-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Activity className="h-7 w-7 text-gold/30" />
            <p className="font-sans text-xs text-muted-foreground">
              {loading ? "Loading recent ledger events…" : "No ledger events yet."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {visible.map((ev, idx) => (
                <motion.li
                  key={ev.id}
                  layout={!reduceMotion}
                  initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 8 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.25, delay: idx * 0.02 }}
                  className="group relative rounded-xl border border-gold/10 bg-background/40 px-3 py-2.5 transition-colors hover:border-gold/25 hover:bg-gold/[0.03]"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-sans text-xs leading-relaxed text-foreground/90">
                        {ev.narration}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                        <span className="text-gold-light/80">{ev.eventType.replace(/_/g, " ")}</span>
                        <span className="text-gold/20">·</span>
                        {ev.enterpriseSlug ? (
                          <Link
                            href={`/enterprise/${ev.enterpriseSlug}`}
                            className="inline-flex items-center gap-0.5 text-muted-foreground transition-colors hover:text-gold"
                          >
                            {ev.enterpriseName}
                            <ArrowUpRight className="h-2.5 w-2.5" />
                          </Link>
                        ) : (
                          <span>{ev.enterpriseName}</span>
                        )}
                        <span className="text-gold/20">·</span>
                        <span>{formatTimeAgo(new Date(ev.timestamp))}</span>
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gold/8 pt-2 font-mono text-[10px] text-muted-foreground/75">
        <span className="inline-flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-gold/60" />
          SHA3-256 hash-chained · CRE-signed
        </span>
        <span>
          {events.length} of 20 events shown
        </span>
      </div>
    </section>
  );
}

// ── Local time-ago formatter (avoids a server import for the client) ──
function formatTimeAgo(d: Date): string {
  const ms = Date.now() - d.getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
