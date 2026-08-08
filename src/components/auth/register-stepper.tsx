"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoldStar } from "@/components/aurienta-logo";
import type { StepMeta } from "./register-types";

interface StepperProps {
  steps: StepMeta[];
  current: number;
  /** Maximum step the user has reached (for clickability). */
  furthest: number;
  onStepClick?: (i: number) => void;
}

/** Vertical stepper rail (desktop, lg+). */
export function VerticalStepper({
  steps,
  current,
  furthest,
  onStepClick,
}: StepperProps) {
  return (
    <nav
      aria-label="Registration progress"
      className="relative flex flex-col gap-0"
    >
      {/* Vertical track */}
      <span
        aria-hidden="true"
        className="absolute left-[14px] top-2 bottom-2 w-px bg-gradient-to-b from-gold/35 via-gold/12 to-transparent"
      />
      <ol className="relative flex flex-col gap-5">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const reachable = i <= furthest;
          return (
            <li key={s.short} className="relative flex items-start gap-4">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onStepClick?.(i)}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${i + 1}: ${s.title}${done ? " (completed)" : active ? " (current)" : ""}`}
                className={cn(
                  "group relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium transition-all",
                  done
                    ? "border-gold/50 bg-gold-gradient text-black shadow-[0_0_18px_-4px_rgba(212,175,55,0.6)]"
                    : active
                      ? "border-gold/70 bg-[#101014] text-gold-light shadow-[0_0_22px_-4px_rgba(212,175,55,0.6)]"
                      : "border-gold/20 bg-[#0c0c0f] text-muted-foreground/85",
                  reachable && "cursor-pointer hover:border-gold/45",
                  !reachable && "cursor-not-allowed opacity-60"
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <span>{i + 1}</span>
                )}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute -inset-1 rounded-full ring-1 ring-gold/40 animate-pulse-gold"
                  />
                )}
              </button>

              <div className="flex flex-col gap-0.5 pt-0.5">
                <span
                  className={cn(
                    "font-sans text-xs uppercase tracking-[0.22em]",
                    active ? "text-gold-light" : done ? "text-foreground/80" : "text-muted-foreground/80"
                  )}
                >
                  Step {i + 1}
                </span>
                <span
                  className={cn(
                    "font-serif text-base leading-tight",
                    active ? "text-foreground" : done ? "text-foreground/85" : "text-muted-foreground/85"
                  )}
                >
                  {s.short}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-7 flex items-center gap-2.5 border-t border-gold/10 pt-5">
        <GoldStar className="h-3 w-3" />
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground/85">
          v8.2 · Sovereign
        </span>
      </div>
    </nav>
  );
}

/** Horizontal progress bar (mobile, below lg). */
export function HorizontalProgress({
  steps,
  current,
}: {
  steps: StepMeta[];
  current: number;
}) {
  const pct = ((current + 1) / steps.length) * 100;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs uppercase tracking-[0.22em] text-gold-light">
          Step {current + 1} of {steps.length}
        </span>
        <span className="font-sans text-xs text-muted-foreground">
          {steps[current]?.short}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 bg-gold-gradient transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
