import * as React from "react";
import { Check } from "lucide-react";
import { STAGE_META } from "@/lib/aurienta/constants";
import { cn } from "@/lib/utils";

const STAGE_ORDER: Array<keyof typeof STAGE_META> = [
  "stage_1",
  "stage_2",
  "stage_3",
  "stage_4",
];

const STAGE_TAGLINE: Record<string, string> = {
  stage_1: "Full CRE enforcement — every action validated before commit.",
  stage_2: "Alerting only — CRE flags anomalies, no longer blocks.",
  stage_3: "Read-only auditor — enterprise operates autonomously.",
  stage_4: "Sovereign Enterprise — no platform role. Self-hosted CRE option.",
};

/** Horizontal 4-stage stepper with the enterprise's current stage highlighted. */
export function MaturityStepper({ currentStage }: { currentStage: string }) {
  const currentIndex = STAGE_ORDER.indexOf(
    (currentStage === "graduated" ? "stage_4" : currentStage) as keyof typeof STAGE_META
  );

  return (
    <section
      aria-label="Maturity stages"
      className="rounded-2xl border border-gold/12 glass p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-lg font-semibold">The four maturity stages</h2>
          <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
            Dependency is transitional. Sovereignty is the destination.
          </p>
        </div>
        <span className="hidden rounded-full border border-gold/20 bg-gold/5 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold/70 sm:inline">
          current · {STAGE_META[currentStage]?.name ?? currentStage}
        </span>
      </div>

      <ol className="relative grid grid-cols-1 gap-4 sm:grid-cols-4 sm:gap-0">
        {/* connecting line on desktop */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-gold/10 via-gold/40 to-gold/60 sm:block"
        />
        {STAGE_ORDER.map((key, idx) => {
          const meta = STAGE_META[key];
          const isCurrent = idx === currentIndex;
          const isPast = idx < currentIndex;
          return (
            <li key={key} className="relative z-10 flex flex-col items-start sm:items-center sm:text-center">
              <span
                className={cn(
                  "relative inline-flex h-10 w-10 items-center justify-center rounded-full border-2 font-serif text-sm font-semibold transition-all",
                  isCurrent
                    ? "border-gold bg-gold-gradient text-black shadow-[0_0_0_4px_rgba(212,175,55,0.18),0_8px_30px_-6px_rgba(212,175,55,0.55)]"
                    : isPast
                    ? "border-gold/60 bg-gold/10 text-gold-light"
                    : "border-gold/15 bg-background text-muted-foreground"
                )}
              >
                {isPast ? <Check className="h-4 w-4" /> : idx + 1}
                {isCurrent && (
                  <span
                    aria-hidden
                    className="absolute -inset-1 -z-10 rounded-full border border-gold/30 animate-pulse"
                  />
                )}
              </span>
              <p
                className={cn(
                  "mt-2.5 font-serif text-sm font-semibold leading-tight sm:max-w-[10rem]",
                  isCurrent ? "text-gold-light" : isPast ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {meta.name}
              </p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
                {meta.duration}
              </p>
              <p className="mt-1 hidden font-sans text-xs leading-relaxed text-muted-foreground/80 sm:block sm:max-w-[11rem]">
                {STAGE_TAGLINE[key]}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
