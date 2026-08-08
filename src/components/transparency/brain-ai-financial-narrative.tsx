"use client";

import * as React from "react";
import { Sparkles, Loader2, AlertCircle, Brain } from "lucide-react";

type FinancialsSnapshot = {
  name: string;
  tier: string;
  stage: string;
  sector: string;
  monthlyRevenueEgp: number;
  monthlyBurnEgp: number;
  lawFirmClientAccountBalanceEgp: number;
  runwayMonths: number | null;
  grossMarginPct: number;
  revenueGrowthPct: number;
  employeeCount: number;
  nosiCompliantPct: number;
  healthScore: number;
  healthRating: string | null;
  raisedEgp: number;
  fundraisingGoalEgp: number;
  equityUnitPriceEgp: number;
};

/**
 * Brain AI real-time financial narrative — public, no auth required.
 *
 * Calls /api/ai/explain with the enterprise's financial snapshot.
 * The endpoint is open to all authenticated users — for anonymous
 * visitors we fall back to a deterministic local summary so the page
 * is always meaningful (no login wall).
 */
export function BrainAiFinancialNarrative({
  enterpriseId,
  enterpriseName,
  financials,
}: {
  enterpriseId: string;
  enterpriseName: string;
  financials: FinancialsSnapshot;
}) {
  const [narrative, setNarrative] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchNarrative() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ai/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: `${enterpriseName} — Real-time financials (health ${financials.healthRating ?? "—"})`,
            value: JSON.stringify(financials),
            enterpriseId,
          }),
        });
        if (res.status === 401) {
          // Not signed in — show a deterministic local summary so the page
          // is meaningful without a login wall.
          if (!cancelled) {
            setNarrative(buildLocalSummary(financials));
            setLoading(false);
          }
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setNarrative(json.explanation ?? buildLocalSummary(financials));
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setNarrative(buildLocalSummary(financials));
          setLoading(false);
        }
      }
    }
    fetchNarrative();
    return () => {
      cancelled = true;
    };
  }, [enterpriseId, enterpriseName, financials]);

  return (
    <div className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-gold" />
        <h2 className="font-serif text-lg font-semibold">Brain AI real-time narrative</h2>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-gold/15 bg-background/50 px-2.5 py-1 font-mono text-[10px] text-muted-foreground/85">
          <Sparkles className="h-2.5 w-2.5 text-gold/70" /> Advisory · consensus mode
        </span>
      </div>

      <div className="mt-4">
        {loading && (
          <div className="flex items-center gap-2 font-sans text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-gold/70" />
            The Brain AI is synthesizing the enterprise&apos;s real-time position…
          </div>
        )}

        {!loading && narrative && (
          <div className="space-y-3">
            <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-foreground/90">
              {narrative}
            </p>
            {error && (
              <p className="flex items-center gap-1.5 font-mono text-[11px] text-amber-300/80">
                <AlertCircle className="h-3 w-3" /> AI unavailable — showing constitutional summary. ({error})
              </p>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 border-t border-gold/10 pt-3 font-sans text-[11px] leading-relaxed text-muted-foreground/80">
        The Brain AI narrative is advisory — the CRE (Constitutional Runtime Engine) remains the
        single source of truth for constitutional enforcement. Data updated per milestone release.
        Audited annually per constitutional charter.
      </p>
    </div>
  );
}

/** Deterministic, plain-English summary — used as an auth-free fallback. */
function buildLocalSummary(f: FinancialsSnapshot): string {
  const runwayTxt = f.runwayMonths !== null ? `${f.runwayMonths.toFixed(1)} months` : "unbounded";
  const healthTxt = f.healthRating ?? "unrated";
  const marginTxt = f.grossMarginPct.toFixed(1);
  const growthTxt = f.revenueGrowthPct.toFixed(1);
  const goalPct = f.fundraisingGoalEgp > 0 ? ((f.raisedEgp / f.fundraisingGoalEgp) * 100).toFixed(0) : "0";

  return `${f.name} (Tier ${f.tier}, ${f.stage.replace(/_/g, " ")}) currently holds ${f.lawFirmClientAccountBalanceEgp.toLocaleString()} EGP in the Law Firm Client Account against a monthly burn of ${f.monthlyBurnEgp.toLocaleString()} EGP — a runway of ${runwayTxt}. Monthly revenue is ${f.monthlyRevenueEgp.toLocaleString()} EGP at a ${marginTxt}% gross margin, with ${growthTxt}% YoY revenue growth. The constitutional health rating is ${healthTxt} (${f.healthScore}/100). Workforce compliance sits at ${f.nosiCompliantPct.toFixed(0)}% NOSI registration across ${f.employeeCount} employees. Capital Participated to date is ${f.raisedEgp.toLocaleString()} EGP — ${goalPct}% of the Capital Participation Goal. The constitutional Equity Unit price (CPP) is ${f.equityUnitPriceEgp.toLocaleString()} EGP per equity unit. As a public snapshot this is enterprise-level data only — partner-level holdings remain anonymized per Egyptian PDPL Law 151/2020.`;
}
