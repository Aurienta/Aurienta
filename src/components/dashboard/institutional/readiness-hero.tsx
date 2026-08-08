import * as React from "react";
import { Check, X, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

type Gate = { label: string; passed: boolean };

type Component = { label: string; weightPct: number; score: number; tone: string };

/** Hero readiness panel — big score, gates checklist, component breakdown. */
export function ReadinessHero({
  score,
  gates,
  components,
  enterpriseName,
  stage,
}: {
  score: number;
  gates: Gate[];
  components: Component[];
  enterpriseName: string;
  stage: string;
}) {
  const passed = gates.filter((g) => g.passed).length;
  const verdict =
    score >= 90 ? "Graduation-eligible" : score >= 75 ? "Approaching readiness" : "Foundational work required";

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <section
      aria-label="Graduation readiness score"
      className="relative overflow-hidden rounded-2xl border border-gold/22 glass-gold p-6 sm:p-8"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/12 blur-3xl" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center">
        {/* Circular score */}
        <div className="flex shrink-0 flex-col items-center lg:items-start">
          <div className="relative inline-flex items-center justify-center">
            <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
              <defs>
                <linearGradient id="scoreGold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f7e9a6" />
                  <stop offset="0.5" stopColor="#d4af37" />
                  <stop offset="1" stopColor="#b8860b" />
                </linearGradient>
              </defs>
              <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="10" />
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="url(#scoreGold)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                style={{ filter: "drop-shadow(0 0 10px rgba(212,175,55,0.45))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                readiness
              </span>
              <span className="font-serif text-5xl font-semibold text-gold-gradient">{score}</span>
              <span className="font-mono text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <p
            className={cn(
              "mt-3 font-serif text-sm font-semibold",
              score >= 90 ? "text-emerald-300" : score >= 75 ? "text-amber-300" : "text-foreground"
            )}
          >
            {verdict}
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
            {passed}/{gates.length} gates passed · {enterpriseName}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          {/* Gates checklist */}
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold">
              <GraduationCap className="h-4 w-4 text-gold" /> Graduation gates
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {gates.map((g) => (
                <li
                  key={g.label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border p-2.5",
                    g.passed
                      ? "border-emerald-400/25 bg-emerald-400/[0.05]"
                      : "border-red-400/25 bg-red-400/[0.05]"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      g.passed ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"
                    )}
                  >
                    {g.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </span>
                  <span className="font-sans text-[12px] leading-tight text-foreground/90">{g.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Component breakdown */}
          <div>
            <h3 className="mb-3 font-serif text-base font-semibold">Component breakdown</h3>
            <ul className="flex flex-col gap-2.5">
              {components.map((c) => (
                <li key={c.label} className="rounded-lg border border-gold/10 bg-background/40 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-sans text-[12px] font-medium text-foreground/90">{c.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      weight {c.weightPct}% · score {c.score}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gold/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(c.score / 100) * 100}%`,
                        background:
                          c.tone === "green"
                            ? "linear-gradient(90deg, #34d399, #10b981)"
                            : c.tone === "amber"
                            ? "linear-gradient(90deg, #fbbf24, #d4af37)"
                            : "linear-gradient(90deg, #f87171, #e0584b)",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <p className="mt-6 font-mono text-[11px] leading-relaxed text-muted-foreground/85">
        Stage {stage.replace("stage_", "")} · score recomputed every 6h against the immutable ledger.
        Graduation requires ≥90 readiness + 75% supermajority vote + 30-day cooling + 14-day voting window.
      </p>
    </section>
  );
}
