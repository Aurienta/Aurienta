"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoldStar } from "@/components/aurienta-logo";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { INITIAL_WIZARD_STATE, type WizardState } from "./types";
import {
  WIZARD_STEPS,
  WizardHorizontalProgress,
  WizardVerticalStepper,
} from "./wizard/wizard-stepper";
import { StepBasics } from "./wizard/step-basics";
import { StepTierStructure } from "./wizard/step-tier";
import { StepFeasibility } from "./wizard/step-feasibility";
import { StepReview } from "./wizard/step-review";

export function NewEnterpriseWizard({
  onLaunched,
  onCancel,
}: {
  onLaunched?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [current, setCurrent] = React.useState(0);
  const [furthest, setFurthest] = React.useState(0);
  const [state, setState] = React.useState<WizardState>(INITIAL_WIZARD_STATE);
  const [validating, setValidating] = React.useState(false);
  const [launching, setLaunching] = React.useState(false);

  const update = React.useCallback(
    (patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch })),
    []
  );

  const validateStep = React.useCallback(
    (i: number): string | null => {
      switch (i) {
        case 0: {
          if (!state.name.trim() || state.name.trim().length < 3)
            return "Enterprise name must be at least 3 characters.";
          if (!state.description.trim() || state.description.trim().length < 12)
            return "Description must be at least 12 characters.";
          if (!state.sector) return "Pick a sector.";
          return null;
        }
        case 1: {
          if (!state.tier) return "Pick a constitutional tier.";
          const goal = Number(state.fundraisingGoalEgp);
          if (!Number.isFinite(goal) || goal < 1000)
            return "Capital Formation goal must be at least 1,000 EGP.";
          const price = Number(state.equityUnitPriceEgp);
          if (!Number.isFinite(price) || price < 1)
            return "Share price must be at least 1 EGP.";
          const caps: Record<string, number | null> = {
            A: 3_000_000, B: 25_000_000, E: 5_000_000,
          };
          const cap = caps[state.tier];
          if (cap !== undefined && cap !== null && goal > cap)
            return `Tier ${state.tier} cap is ${cap.toLocaleString()} EGP.`;
          if (state.investorCapEnabled) {
            const ic = Number(state.investorCap);
            if (!Number.isFinite(ic) || ic < 1)
              return "Capital Partner cap must be a positive integer.";
          }
          return null;
        }
        case 2: {
          if (!state.feasibilityRun || state.feasibilityScore === null)
            return "Run the AI feasibility assessment to continue.";
          if (state.feasibilityScore < 35)
            return "Feasibility score below the 35-point threshold.";
          return null;
        }
        case 3: {
          if (!state.acceptedCharter)
            return "Accept the Constitutional Charter to launch.";
          return null;
        }
        default:
          return null;
      }
    },
    [state]
  );

  const goNext = () => {
    if (current >= WIZARD_STEPS.length - 1) return;
    setValidating(true);
    window.setTimeout(() => {
      const err = validateStep(current);
      if (err) {
        toast.error("Cannot continue", { description: err });
        setValidating(false);
        return;
      }
      const next = current + 1;
      setCurrent(next);
      setFurthest((f) => Math.max(f, next));
      setValidating(false);
    }, 200);
  };

  const goBack = () => {
    if (current === 0) return;
    setCurrent((c) => Math.max(0, c - 1));
  };

  const goTo = (i: number) => {
    if (i < 0 || i > furthest) return;
    setCurrent(i);
  };

  const launch = async () => {
    setLaunching(true);
    try {
      const payload = {
        name: state.name.trim(),
        tagline: state.tagline.trim() || undefined,
        description: state.description.trim(),
        sector: state.sector,
        tier: state.tier,
        fundraisingGoalEgp: Number(state.fundraisingGoalEgp),
        equityUnitPriceEgp: Number(state.equityUnitPriceEgp),
        investorCap:
          state.investorCapEnabled && state.investorCap
            ? Number(state.investorCap)
            : undefined,
      };
      const res = await fetch("/api/enterprises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error ?? "Launch failed");
      }
      toast.success("Enterprise constituted — CRE enforcement active", {
        description: `${data.enterprise.name} · Tier ${data.enterprise.tier} · ${data.enterprise.totalEquityUnits.toLocaleString()} units sealed on the ledger.`,
      });
      // Refresh server data + switch back to Tab A.
      router.refresh();
      onLaunched?.();
      // Reset wizard state for the next time.
      setState(INITIAL_WIZARD_STATE);
      setCurrent(0);
      setFurthest(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Launch failed";
      toast.error("Constitution failed", { description: message });
    } finally {
      setLaunching(false);
    }
  };

  const meta = WIZARD_STEPS[current];
  const isLast = current === WIZARD_STEPS.length - 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
      {/* Left rail (desktop) */}
      <aside className="hidden lg:flex lg:flex-col lg:gap-6">
        <div className="glass-gold rounded-2xl p-5">
          <WizardVerticalStepper current={current} furthest={furthest} onStepClick={goTo} />
        </div>
        <div className="flex flex-col gap-2 border-l-2 border-gold/30 pl-4">
          <span className="font-sans text-xs uppercase tracking-[0.22em] text-gold-light">
            Now
          </span>
          <p className="font-sans text-xs leading-relaxed text-muted-foreground">
            {meta.subtitle}
          </p>
        </div>
        <div className="mt-auto flex items-center gap-2 rounded-xl border border-gold/15 bg-background/40 p-3">
          <GoldStar className="h-3 w-3 shrink-0" />
          <p className="font-sans text-[11px] leading-snug text-muted-foreground">
            Charter hash{" "}
            <span className="font-mono text-gold-light">
              {CONSTITUTIONAL_HASH.slice(0, 14)}…
            </span>
          </p>
        </div>
      </aside>

      {/* Right content */}
      <section className="flex flex-col gap-5">
        <div className="lg:hidden">
          <WizardHorizontalProgress current={current} />
        </div>

        <div className="glass-gold gold-glow-sm relative flex-1 overflow-hidden rounded-2xl p-5 sm:p-7">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
            }}
            animate={{ y: [0, -12, 0], x: [0, -8, 0] }}
            transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
          />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col gap-5"
            >
              <header className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-xs uppercase tracking-[0.32em] text-gold-light">
                    Step {current + 1} / {WIZARD_STEPS.length}
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-gold/30 to-transparent" />
                </div>
                <h2 className="font-serif text-2xl font-medium leading-tight sm:text-3xl">
                  {meta.title}
                </h2>
                <p className="font-sans text-sm text-muted-foreground">{meta.subtitle}</p>
              </header>

              <div className="min-h-[240px]">
                {current === 0 && <StepBasics state={state} update={update} />}
                {current === 1 && <StepTierStructure state={state} update={update} />}
                {current === 2 && <StepFeasibility state={state} update={update} />}
                {current === 3 && <StepReview state={state} update={update} />}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={current === 0 ? onCancel : goBack}
            disabled={launching}
            className="h-11 rounded-lg px-4 text-muted-foreground hover:bg-gold/5 hover:text-gold-light"
          >
            <ArrowLeft className="h-4 w-4" />
            {current === 0 ? "Cancel" : "Back"}
          </Button>

          <div className="flex items-center gap-3">
            <span className="hidden font-sans text-xs text-muted-foreground sm:inline">
              {current + 1} of {WIZARD_STEPS.length}
            </span>
            {isLast ? (
              <Button
                type="button"
                onClick={launch}
                disabled={launching || validating}
                className="group relative h-11 overflow-hidden rounded-lg bg-gold-gradient px-6 text-sm font-semibold text-black shadow-[0_14px_40px_-14px_rgba(212,175,55,0.7)] transition-all hover:shadow-[0_18px_60px_-14px_rgba(212,175,55,0.95)]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative inline-flex items-center gap-2">
                  {launching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Constituting…
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" /> Launch enterprise
                    </>
                  )}
                </span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={goNext}
                disabled={validating}
                className="group relative h-11 overflow-hidden rounded-lg bg-gold-gradient px-6 text-sm font-semibold text-black shadow-[0_14px_40px_-14px_rgba(212,175,55,0.65)] transition-all hover:shadow-[0_18px_60px_-14px_rgba(212,175,55,0.9)]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative inline-flex items-center gap-2">
                  {validating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Step dots (mobile) */}
        <div className="flex items-center justify-center gap-2 lg:hidden">
          {WIZARD_STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to step ${i + 1}`}
              disabled={i > furthest}
              onClick={() => goTo(i)}
              className={
                i === current
                  ? "h-1.5 w-6 rounded-full bg-gold-gradient transition-all"
                  : i < current
                    ? "h-1.5 w-1.5 rounded-full bg-gold/70 transition-all"
                    : "h-1.5 w-1.5 rounded-full bg-muted-foreground/30 transition-all"
              }
            />
          ))}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center font-sans text-[11px] text-muted-foreground/85">
          {isLast ? (
            <>
              <Sparkles className="h-3 w-3 text-gold/70" />
              Launching seals this charter on the immutable ledger — action is irreversible.
            </>
          ) : (
            <>
              <Check className="h-3 w-3 text-gold/70" />
              Zero custody · CRE-enforced · FRA No-Action Letter
            </>
          )}
        </p>
      </section>
    </div>
  );
}
