"use client";

import * as React from "react";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";

type Tier = "Platinum" | "Gold" | "Silver" | "Bronze";

type TransparencyData = {
  score: number;
  tier: Tier;
  breakdown: Array<{
    key: string;
    label: string;
    points: number;
    earned: number;
    detail: string;
  }>;
};

/**
 * Fetches the live transparency score from the public API and renders
 * a tiered badge + expandable breakdown. Self-contained — no auth.
 */
export function TransparencyScoreBadge({
  slug,
  variant = "default",
}: {
  slug: string;
  variant?: "default" | "compact";
}) {
  const [data, setData] = React.useState<TransparencyData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchScore() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/public/enterprise/${slug}/transparency`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setData({
            score: json.score,
            tier: json.tier,
            breakdown: json.breakdown,
          });
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    }
    fetchScore();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-background/50 px-2.5 py-1 font-mono text-[10px] text-muted-foreground/70">
        <Loader2 className="h-2.5 w-2.5 animate-spin text-gold/70" /> Transparency…
      </span>
    );
  }

  if (error || !data) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-background/50 px-2.5 py-1 font-mono text-[10px] text-muted-foreground/70"
        title={error ?? "Unavailable"}
      >
        <AlertCircle className="h-2.5 w-2.5" /> Transparency N/A
      </span>
    );
  }

  const tierColor: Record<Tier, string> = {
    Platinum: "border-emerald-400/40 text-emerald-300 bg-emerald-400/5",
    Gold: "border-gold/40 text-gold-light bg-gold/8",
    Silver: "border-slate-300/30 text-slate-200 bg-slate-300/5",
    Bronze: "border-amber-700/40 text-amber-600 bg-amber-700/5",
  };

  if (variant === "compact") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] ${tierColor[data.tier]}`}
        title={`Transparency score: ${data.score}/100 (${data.tier} tier)`}
      >
        <ShieldCheck className="h-2.5 w-2.5" /> Transparency {data.score}/100 · {data.tier}
      </span>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/15 glass p-5">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gold" />
          <h3 className="font-serif text-sm font-semibold">Constitutional transparency score</h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] ${tierColor[data.tier]}`}>
          {data.score}/100 · {data.tier}
        </span>
      </button>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="h-2 overflow-hidden rounded-full border border-gold/15 bg-background/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8a6d1f] via-[#d4af37] to-[#f4d676] transition-all"
            style={{ width: `${data.score}%` }}
            role="progressbar"
            aria-valuenow={data.score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Transparency score"
          />
        </div>
      </div>

      {expanded && (
        <ul className="mt-3 space-y-1.5">
          {data.breakdown.map((b) => (
            <li
              key={b.key}
              className="flex items-start justify-between gap-3 rounded-lg border border-gold/10 bg-foreground/[0.02] p-2.5"
            >
              <div className="min-w-0">
                <div className="font-sans text-xs font-medium text-foreground">{b.label}</div>
                <div className="font-mono text-[10px] text-muted-foreground/80">{b.detail}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-xs text-gold-light">{b.earned}/{b.points}</div>
                <div className="font-mono text-[10px] text-muted-foreground/70">pts</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 font-sans text-[11px] leading-relaxed text-muted-foreground/75">
        PDPL-aware public transparency score — enterprise-level data only, no personal data.
        Click to expand the breakdown.
      </p>
    </div>
  );
}
