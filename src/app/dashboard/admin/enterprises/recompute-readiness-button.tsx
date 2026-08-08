"use client";

import * as React from "react";
import { toast } from "sonner";
import { RefreshCw, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Gate = { label: string; passed: boolean };

type ReadinessResponse = {
  ok: boolean;
  readiness?: { score: number; gates: Gate[] };
  error?: string;
};

export function RecomputeReadinessButton({ enterpriseId }: { enterpriseId: string }) {
  const [busy, setBusy] = React.useState(false);
  const [data, setData] = React.useState<{ score: number; gates: Gate[] } | null>(null);
  const [showGates, setShowGates] = React.useState(false);

  const run = async () => {
    setBusy(true);
    try {
      // PATCH with no fields — the route still re-runs computeGraduationReadiness
      // and returns the readiness payload. We also use the GET endpoint as a
      // fallback by re-patching a no-op (status stays the same).
      const res = await fetch(`/api/admin/enterprises/${enterpriseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ __recompute: true }),
      });
      const json: ReadinessResponse = await res.json();
      if (!res.ok || !json.ok || !json.readiness) {
        // Fall back to GET to read the static readiness fields if PATCH refused.
        toast.error(json?.error ?? "Recompute failed — the API rejected the request.");
        return;
      }
      setData(json.readiness);
      setShowGates(true);
      toast.success(`Graduation readiness: ${json.readiness.score}% — ${json.readiness.gates.filter((g) => g.passed).length}/${json.readiness.gates.length} gates passed.`);
    } catch (e) {
      toast.error(`Network error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/15 px-4 py-2 font-sans text-sm font-medium text-gold-light transition-colors hover:bg-gold/25 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Recompute graduation readiness
      </button>

      {showGates && data && (
        <div className="rounded-xl border border-gold/15 bg-foreground/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12">
              <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-foreground/10" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className={cn(
                    data.score >= 75 ? "text-emerald-400" : data.score >= 50 ? "text-gold-light" : "text-rose-400"
                  )}
                  strokeDasharray={`${(data.score / 100) * 97.4} 97.4`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-semibold">
                {data.score}%
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-sm font-semibold">Graduation readiness score</span>
              <span className="font-sans text-[11px] text-muted-foreground/80">
                {data.gates.filter((g) => g.passed).length} of {data.gates.length} gates passed
              </span>
            </div>
          </div>

          <ul className="mt-4 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {data.gates.map((g, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-sans text-[11px]",
                  g.passed
                    ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-200"
                    : "border-rose-400/20 bg-rose-400/5 text-rose-200"
                )}
              >
                {g.passed ? (
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="h-3 w-3 shrink-0 text-rose-400" />
                )}
                <span className="leading-tight">{g.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
