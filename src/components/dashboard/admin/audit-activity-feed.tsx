"use client";

import * as React from "react";
import { ScrollText, Check, X, Clock, Radio, RefreshCw } from "lucide-react";
import { timeAgo } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

export type AuditFeedEntry = {
  id: string;
  action: string;
  target: string | null;
  result: string; // allowed | denied
  reason: string | null;
  actorId: string | null;
  actorName: string | null;
  timestamp: string; // ISO
  ip?: string | null;
};

type ApiResponse = {
  entries?: Array<{
    id: string;
    action: string;
    target: string | null;
    result: string;
    reason: string | null;
    actorId: string | null;
    timestamp: string;
    ip: string | null;
    actor?: { legalName: string | null } | null;
  }>;
};

/**
 * Live platform activity feed — last 50 audit entries across ALL actions.
 * Polls /api/admin/audit?pageSize=50 every POLL_MS ms; falls back to the
 * server-rendered initial entries if the network fails.
 *
 * The viewer page is a server component; this client component is embedded
 * inside it to provide the "real-time" pulse.
 */
export function AuditActivityFeed({ initial }: { initial: AuditFeedEntry[] }) {
  const [entries, setEntries] = React.useState<AuditFeedEntry[]>(initial);
  const [live, setLive] = React.useState(true);
  const [lastSync, setLastSync] = React.useState<Date>(new Date());
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (paused) return;
    let cancelled = false;

    async function pull() {
      try {
        const res = await fetch("/api/admin/audit?pageSize=50", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as ApiResponse;
        if (!json.entries) return;
        const next: AuditFeedEntry[] = json.entries.map((e) => ({
          id: e.id,
          action: e.action,
          target: e.target,
          result: e.result,
          reason: e.reason,
          actorId: e.actorId,
          actorName: e.actor?.legalName ?? null,
          timestamp: e.timestamp,
          ip: e.ip,
        }));
        if (!cancelled && next.length > 0) {
          setEntries(next);
          setLive(true);
          setLastSync(new Date());
        }
      } catch {
        if (!cancelled) setLive(false);
      }
    }

    pull();
    const t = setInterval(pull, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [paused]);

  return (
    <section
      aria-label="Live platform activity"
      className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ScrollText className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">Live platform activity</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold/70">
            <Radio className={cn("h-2.5 w-2.5", live ? "text-emerald-300" : "text-rose-300")} />
            {live ? "live" : "stale"}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground/85">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" /> synced {timeAgo(lastSync)}
          </span>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1 rounded-md border border-gold/15 bg-background/40 px-2 py-0.5 text-[11px] uppercase tracking-wider text-gold/80 transition hover:bg-gold/8"
            aria-pressed={paused}
          >
            <RefreshCw className={cn("h-2.5 w-2.5", paused && "opacity-50")} />
            {paused ? "resume" : "pause"}
          </button>
        </div>
      </div>

      <ol className="relative flex max-h-[22rem] flex-col gap-2 overflow-y-auto pr-1 pl-4 aurienta-scrollbar">
        <span
          aria-hidden
          className="pointer-events-none absolute left-[5px] top-1 bottom-1 w-px bg-gradient-to-b from-gold/40 via-gold/15 to-transparent"
        />
        {entries.length === 0 ? (
          <li className="rounded-lg border border-gold/8 bg-background/30 p-3 font-mono text-xs text-muted-foreground">
            no events yet — audit log is empty
          </li>
        ) : (
          entries.map((e) => {
            const ok = e.result === "allowed";
            return (
              <li key={e.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[1.45rem] top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border",
                    ok
                      ? "border-emerald-400/40 bg-emerald-400/10"
                      : "border-rose-400/40 bg-rose-400/10"
                  )}
                >
                  {ok ? (
                    <Check className="h-2.5 w-2.5 text-emerald-300" />
                  ) : (
                    <X className="h-2.5 w-2.5 text-rose-300" />
                  )}
                </span>
                <div className="rounded-xl border border-gold/10 bg-background/40 p-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="font-mono text-[11px] text-foreground/90">{e.action}</code>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-1.5 py-0 font-mono text-[10px] uppercase tracking-wider",
                          ok
                            ? "border-emerald-400/30 bg-emerald-400/8 text-emerald-300"
                            : "border-rose-400/30 bg-rose-400/8 text-rose-300"
                        )}
                      >
                        {e.result}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground/85">
                      <Clock className="h-2.5 w-2.5" /> {timeAgo(new Date(e.timestamp))}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-sans text-[11px] text-muted-foreground">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-gold/70">
                      {e.actorName ?? "system"}
                    </span>
                    {e.target && (
                      <span className="text-foreground/75">· {e.target}</span>
                    )}
                    {e.ip && (
                      <span className="font-mono text-[10px] text-muted-foreground/70">
                        · {e.ip}
                      </span>
                    )}
                  </div>
                  {e.reason && (
                    <p className="mt-0.5 font-sans text-[10px] leading-relaxed text-muted-foreground/80">
                      {e.reason}
                    </p>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ol>
    </section>
  );
}
