"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AurientaMark, AurientaWordmark, GoldStar } from "@/components/aurienta-logo";
import {
  INITIAL_REGISTER_STATE,
  STEPS,
  type RegisterState,
} from "./register-types";
import { HorizontalProgress, VerticalStepper } from "./register-stepper";
import { StepIdentity } from "./steps/step-identity";
import { StepKyc } from "./steps/step-kyc";
import { StepRole } from "./steps/step-role";
import { StepPledge } from "./steps/step-pledge";
import { StepActivation } from "./steps/step-activation";

export function RegisterWizard() {
  const router = useRouter();
  const [current, setCurrent] = React.useState(0);
  const [furthest, setFurthest] = React.useState(0);
  const [state, setState] = React.useState<RegisterState>(INITIAL_REGISTER_STATE);
  const [validating, setValidating] = React.useState(false);

  const update = React.useCallback(
    (patch: Partial<RegisterState>) =>
      setState((s) => ({ ...s, ...patch })),
    []
  );

  // Validate the current step. Returns an error message or null.
  const validateStep = React.useCallback(
    (i: number): string | null => {
      switch (i) {
        case 0: {
          if (!state.legalName.trim()) return "Please enter your legal full name.";
          if (!state.mobile.trim() && !state.email.trim())
            return "Provide at least a mobile number or an email.";
          if (state.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email))
            return "Enter a valid email address.";
          if (state.password.length < 8)
            return "Password must be at least 8 characters.";
          if (state.password !== state.confirmPassword)
            return "Passwords do not match.";
          if (!state.eligible)
            return "Confirm you are 18+ and legally eligible.";
          if (!state.otpVerified)
            return "Verify your mobile / email via the OTP code.";
          return null;
        }
        case 1: {
          if (!state.nationality) return "Select your nationality.";
          if (!state.idFileName) return "Upload your National ID or passport.";
          if (!state.livenessDone)
            return "Complete the liveness scan to continue.";
          return null;
        }
        case 2: {
          if (!state.intent) return "Choose your primary intent.";
          if (state.intent === "institution" && !state.institutionKind)
            return "Select which institution you represent.";
          if (!state.verificationLevel)
            return "Choose the verification level you seek.";
          return null;
        }
        case 3: {
          if (!state.readCharter || !state.consentAI || !state.acknowledgeRisk)
            return "Acknowledge all three constitutional consents.";
          if (!state.acceptedTerms)
            return "You must accept the Platform Terms & Legal Disclaimer to continue.";
          if (!state.signature.trim() || state.signature.trim().toLowerCase() !== state.legalName.trim().toLowerCase())
            return "Sign by typing your full legal name exactly as entered in Step 1.";
          return null;
        }
        default:
          return null;
      }
    },
    [state]
  );

  const goNext = async () => {
    if (current >= STEPS.length - 1) return;
    setValidating(true);
    // Brief delay so the spinner reads as intentional.
    const err = await new Promise<string | null>((resolve) =>
      window.setTimeout(() => resolve(validateStep(current)), 250)
    );
    if (err) {
      toast.error("Cannot continue", { description: err });
      setValidating(false);
      return;
    }

    // On the Pledge step, call the real registration API before advancing to
    // the Activation step. Replaces the previous mockAnchorHash() theatre.
    if (current === 3) {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: state.email,
            mobile: state.mobile,
            legalName: state.legalName,
            password: state.password,
            verificationLevel: "L1",
            nationality: state.nationality ?? "egyptian",
            nationalIdLast4: state.nationalIdLast4 || undefined,
            primaryIntent: state.intent === "capital" ? "capital_partner"
              : state.intent === "founding" ? "founding_operator"
              : state.intent === "workforce" ? "workforce_partner"
              : state.intent === "institution" ? "institution"
              : undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 201) {
          // Real Ed25519 Identity Anchor returned by the server.
          const anchor = data?.user?.identityAnchor as string | undefined;
          if (anchor) update({ identityAnchor: anchor });
          const next = current + 1;
          setCurrent(next);
          setFurthest((f) => Math.max(f, next));
          setValidating(false);
          toast.success("Constitutional Partner activated", {
            description: "Sovereign Trust Score: 65 · Identity Anchor sealed.",
          });
          return;
        }
        if (res.status === 409) {
          setValidating(false);
          toast.error("Already registered", {
            description: "That email or mobile is already registered — sign in instead.",
          });
          return;
        }
        if (res.status === 400) {
          setValidating(false);
          toast.error("Cannot continue", {
            description:
              data?.message ??
              data?.error ??
              "Some fields need a second look — please review and resubmit.",
          });
          return;
        }
        setValidating(false);
        toast.error("Registration failed", {
          description:
            data?.message ?? data?.error ?? "The CRE could not be reached. Please try again.",
        });
        return;
      } catch {
        setValidating(false);
        toast.error("Network error", { description: "The CRE could not be reached." });
        return;
      }
    }

    const next = current + 1;
    setCurrent(next);
    setFurthest((f) => Math.max(f, next));
    setValidating(false);
  };

  const goBack = () => {
    if (current === 0) return;
    setCurrent((c) => Math.max(0, c - 1));
  };

  const goTo = (i: number) => {
    if (i < 0 || i > furthest) return;
    setCurrent(i);
  };

  const isLast = current === STEPS.length - 1;
  const meta = STEPS[current];

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
      {/* Compact mobile header */}
      <header className="flex items-center justify-between lg:hidden">
        <Link
          href="/signin"
          className="flex items-center gap-2.5"
          aria-label="AURIENTA home"
        >
          <AurientaMark className="h-8 w-8" withGlow />
          <div className="flex flex-col leading-none">
            <AurientaWordmark className="text-base" />
            <span className="mt-0.5 font-sans text-[7px] uppercase tracking-tagline text-muted-foreground">
              Constitutional Partner Onboarding
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => router.push("/signin")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/15 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
          aria-label="Exit registration"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-[260px_1fr] lg:gap-10">
        {/* Left rail (desktop) */}
        <aside className="hidden lg:flex lg:flex-col lg:gap-7">
          <Link
            href="/signin"
            className="flex items-center gap-2.5"
            aria-label="AURIENTA home"
          >
            <AurientaMark className="h-10 w-10" withGlow />
            <div className="flex flex-col leading-none">
              <AurientaWordmark className="text-lg" />
              <span className="mt-1 font-sans text-[11px] uppercase tracking-tagline text-muted-foreground">
                Constitutional Partner Onboarding
              </span>
            </div>
          </Link>

          <div className="glass-gold rounded-2xl p-5">
            <VerticalStepper
              steps={STEPS}
              current={current}
              furthest={furthest}
              onStepClick={goTo}
            />
          </div>

          {/* Microcopy */}
          <div className="flex flex-col gap-2 border-l-2 border-gold/30 pl-4">
            <span className="font-sans text-xs uppercase tracking-[0.22em] text-gold-light">
              Now
            </span>
            <p className="font-sans text-xs leading-relaxed text-muted-foreground">
              {meta.microcopy}
            </p>
          </div>

          <div className="mt-auto flex items-center gap-2 rounded-xl border border-gold/15 bg-background/40 p-3">
            <GoldStar className="h-3 w-3 shrink-0" />
            <p className="font-sans text-[11px] leading-snug text-muted-foreground">
              Non-amendable Rule I 1.6 — <span className="text-gold-light">One Identity</span>: one person, one verified identity.
            </p>
          </div>
        </aside>

        {/* Right content */}
        <section className="flex flex-col gap-5">
          {/* Mobile progress */}
          <div className="lg:hidden">
            <HorizontalProgress steps={STEPS} current={current} />
          </div>

          {/* Card */}
          <div className="glass-gold gold-glow-sm relative flex-1 overflow-hidden rounded-2xl p-5 sm:p-7 lg:p-8">
            {/* Decorative gold orb */}
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
                className="relative flex flex-col gap-6"
              >
                {/* Header */}
                <header className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs uppercase tracking-[0.32em] text-gold-light">
                      Step {current + 1} / {STEPS.length}
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-gold/30 to-transparent" />
                  </div>
                  <h2 className="font-serif text-2xl font-medium leading-tight text-foreground sm:text-3xl">
                    {meta.title}
                  </h2>
                  <p className="font-sans text-sm text-muted-foreground">
                    {meta.subtitle}
                  </p>
                </header>

                {/* Step content */}
                <div className="min-h-[260px]">
                  {current === 0 && <StepIdentity state={state} update={update} />}
                  {current === 1 && <StepKyc state={state} update={update} />}
                  {current === 2 && <StepRole state={state} update={update} />}
                  {current === 3 && <StepPledge state={state} update={update} />}
                  {current === 4 && <StepActivation state={state} />}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer nav */}
          {!isLast && (
            <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                disabled={current === 0 || validating}
                className="h-11 rounded-lg px-4 text-muted-foreground hover:bg-gold/5 hover:text-gold-light"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>

              <div className="flex items-center gap-3">
                <span className="hidden font-sans text-xs text-muted-foreground sm:inline">
                  {current + 1} of {STEPS.length}
                </span>
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
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Step dots (mobile only) */}
          <div className="flex items-center justify-center gap-2 lg:hidden">
            {STEPS.map((_, i) => (
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

          {/* Bottom helper */}
          {!isLast && (
            <p className="flex items-center justify-center gap-1.5 text-center font-sans text-[11px] text-muted-foreground/85">
              <Check className="h-3 w-3 text-gold/70" aria-hidden="true" />
              Your data is AES-256 encrypted · zero custody · HSM-anchored.
            </p>
          )}
          {isLast && (
            <p className="flex items-center justify-center gap-1.5 text-center font-sans text-[11px] text-muted-foreground/85">
              <ChevronRight className="h-3 w-3 text-gold/70" aria-hidden="true" />
              You may close this page — your activation is permanent on the immutable ledger.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
