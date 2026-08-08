"use client";

import * as React from "react";
import { Sparkles, Loader2, AlertCircle, RefreshCw } from "lucide-react";

/**
 * Annual report generator — calls /api/ai/annual-report to generate (or
 * regenerate) the Brain AI annual assessment. Visible only when the user
 * is signed in AND has an enterprise-officer role (the API enforces this;
 * for anonymous visitors the button is hidden by the parent server component
 * checking membership via cookies).
 *
 * For simplicity, the button always renders but shows a sign-in prompt
 * if the API returns 401.
 */
export function AnnualReportGenerator({
  enterpriseId,
  enterpriseName,
  defaultYear,
  regenerate = false,
}: {
  enterpriseId: string;
  enterpriseName: string;
  defaultYear: number;
  regenerate?: boolean;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = React.useState(false);

  const generate = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setNeedsAuth(false);
    try {
      const res = await fetch("/api/ai/annual-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterpriseId, year: defaultYear }),
      });
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      if (res.status === 403) {
        setError("Your role does not permit generating annual reports. Founding operators, company owners, board members, accounting-firm reps, and AURIENTA reps can generate.");
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json?.ok) {
        setSuccess(`Annual report for FY ${defaultYear} generated. Refresh to view the Brain AI assessment.`);
        // Reload after a short delay so the new content shows.
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error("Unexpected response");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [enterpriseId, defaultYear]);

  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <button
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 font-sans text-sm font-semibold text-black shadow-[0_8px_30px_-8px_rgba(212,175,55,0.6)] transition-all hover:shadow-[0_10px_40px_-6px_rgba(212,175,55,0.8)] disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Brain AI synthesizing FY {defaultYear}…
          </>
        ) : regenerate ? (
          <>
            <RefreshCw className="h-4 w-4" /> Regenerate FY {defaultYear} report
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Generate FY {defaultYear} annual report
          </>
        )}
      </button>

      {needsAuth && (
        <p className="font-sans text-xs text-muted-foreground">
          <a href="/signin" className="text-gold-light underline-offset-2 hover:underline">
            Sign in
          </a>{" "}
          as an enterprise officer to generate the annual report.
        </p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 font-sans text-xs text-red-300">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
      {success && (
        <p className="font-sans text-xs text-emerald-300">{success}</p>
      )}
      <p className="max-w-md text-center font-sans text-[11px] leading-relaxed text-muted-foreground/70">
        Generates a comprehensive {defaultYear} assessment for {enterpriseName} using the Brain AI
        (consensus mode). Requires an enterprise-officer role. The report is persisted to the
        immutable ledger + AiArtifact store for court admissibility.
      </p>
    </div>
  );
}
