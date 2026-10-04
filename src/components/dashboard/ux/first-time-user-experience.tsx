"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Rocket,
  Wallet,
  Scale,
  Building2,
  TrendingUp,
  Shield,
  ChevronRight,
  X,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Compass,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════
// First-Time User Experience (FTUE) System
// ═══════════════════════════════════════════════════════════════════
// Designed for users from starters to professionals:
// - Step 1: Welcome (brand intro + what AURIENTA does)
// - Step 2: Your role (personalized experience based on role)
// - Step 3: Quick start (3 key actions to get going)
// - Step 4: Explore (guided tour of key features)
// ═══════════════════════════════════════════════════════════════════

const FTUE_STEPS: readonly {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  description: string;
  highlights?: { icon: LucideIcon; text: string }[];
  roleCards?: { icon: LucideIcon; title: string; desc: string; href: string }[];
  quickSteps?: { num: number; title: string; desc: string; href: string }[];
  modules?: { icon: LucideIcon; title: string; desc: string; href: string }[];
}[] = [
  {
    id: "welcome",
    title: "Welcome to AURIENTA",
    subtitle: "Your capital, your work, your company",
    icon: Sparkles,
    description: "AURIENTA is a constitutional enterprise infrastructure that transforms everyday capital into real-economy corporate ownership through digital rules that cannot be bent, bypassed, or broken.",
    highlights: [
      { icon: Shield, text: "Zero custody — your money goes directly to licensed law firm accounts" },
      { icon: Scale, text: "AI-enforced governance — no human can override the rules" },
      { icon: TrendingUp, text: "Real-economy ownership — not speculation, not crowdfunding" },
    ],
  },
  {
    id: "your-role",
    title: "Your Constitutional Role",
    subtitle: "Personalized for your journey",
    icon: Compass,
    description: "Your dashboard adapts to your role. Here's what you can do:",
    roleCards: [
      { icon: Wallet, title: "Capital Partner", desc: "Browse vetted enterprises, reserve Equity Units, track your portfolio, vote on governance.", href: "/dashboard/portfolio" },
      { icon: Rocket, title: "Founding Operator", desc: "Constitute your enterprise, submit milestones, manage expenses, graduate to sovereignty.", href: "/dashboard/founder" },
      { icon: Building2, title: "Manager / Board", desc: "Approve expenses, call votes, manage operations, ensure compliance.", href: "/dashboard/manager" },
      { icon: GraduationCap, title: "Graduated Enterprise", desc: "Access alumni hall, self-host CRE, maintain sovereign independence.", href: "/dashboard/alumni" },
    ],
  },
  {
    id: "quick-start",
    title: "3 Steps to Get Started",
    subtitle: "Your first 5 minutes",
    icon: Rocket,
    description: "Complete these 3 actions to unlock the full AURIENTA experience:",
    quickSteps: [
      { num: 1, title: "Complete your profile", desc: "Verify your identity (Ed25519 anchor + KYC) to unlock all features.", href: "/dashboard/profile" },
      { num: 2, title: "Browse enterprises", desc: "Discover vetted enterprises raising capital across all tiers (A-F).", href: "/dashboard/opportunities" },
      { num: 3, title: "Explore governance", desc: "See active proposals, vote on constitutional matters, learn the rules.", href: "/dashboard/governance" },
    ],
  },
  {
    id: "explore",
    title: "Explore Your Dashboard",
    subtitle: "Key features at your fingertips",
    icon: Compass,
    description: "Your dashboard has everything you need. Here are the key modules:",
    modules: [
      { icon: Wallet, title: "Portfolio", desc: "Your holdings, P&L, dividend history", href: "/dashboard/portfolio" },
      { icon: Compass, title: "Opportunities", desc: "Vetted enterprises raising capital", href: "/dashboard/opportunities" },
      { icon: Scale, title: "Governance", desc: "Proposals, voting, constitutional council", href: "/dashboard/governance" },
      { icon: Rocket, title: "Founder Studio", desc: "Constitute your sovereign enterprise", href: "/dashboard/founder" },
      { icon: Building2, title: "Enterprise Profile", desc: "Manage your enterprise details + milestones", href: "/dashboard/enterprise-profile" },
      { icon: Shield, title: "Compliance", desc: "Audit log, FRA readiness, regulatory alignment", href: "/dashboard/compliance" },
    ],
  },
] as const;

export function FirstTimeUserExperience({ userRole }: { userRole?: string }) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onboarded = localStorage.getItem("aurienta_ftue_complete");
    if (!onboarded) {
      // Small delay to let dashboard render
      setTimeout(() => setVisible(true), 800);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("aurienta_ftue_complete", "true");
    setVisible(false);
  };

  const handleNext = () => {
    if (step < FTUE_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const currentStep = FTUE_STEPS[step];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass-v2 relative mx-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-gold/20 depth-lg"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-gold/10 hover:text-gold"
              aria-label="Close onboarding"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Progress bar */}
            <div className="h-1 bg-gold/10">
              <motion.div
                className="h-full bg-gold-gradient"
                initial={{ width: "0%" }}
                animate={{ width: `${((step + 1) / FTUE_STEPS.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Content */}
            <div className="max-h-[80vh] overflow-y-auto p-6 sm:p-8">
              {/* Header */}
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold/8 border border-gold/20">
                  {React.createElement(currentStep.icon, { className: "h-7 w-7 text-gold" })}
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-foreground">{currentStep.title}</h2>
                  <p className="font-sans text-sm text-muted-foreground">{currentStep.subtitle}</p>
                </div>
              </div>

              {/* Step 1: Welcome */}
              {step === 0 && (
                <div className="space-y-4">
                  <p className="font-sans text-sm leading-relaxed text-foreground/80">{currentStep.description}</p>
                  <div className="space-y-3">
                    {(currentStep.highlights ?? []).map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        className="flex items-start gap-3 rounded-xl border border-gold/12 bg-background/40 p-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/8 border border-gold/15">
                          <h.icon className="h-4 w-4 text-gold" />
                        </div>
                        <p className="font-sans text-sm text-foreground/90 pt-1">{h.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Your Role */}
              {step === 1 && (
                <div className="space-y-3">
                  <p className="font-sans text-sm leading-relaxed text-foreground/80 mb-4">{currentStep.description}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(currentStep.roleCards ?? []).map((card, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        onClick={() => {
                          router.push(card.href);
                          handleClose();
                        }}
                        className="card-lift group flex flex-col gap-2 rounded-xl border border-gold/12 bg-background/40 p-4 text-left transition-all hover:border-gold/30"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/8 border border-gold/15 transition-transform group-hover:scale-110">
                          <card.icon className="h-5 w-5 text-gold" />
                        </div>
                        <h3 className="font-serif text-base font-semibold text-foreground">{card.title}</h3>
                        <p className="font-sans text-xs text-muted-foreground">{card.desc}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Quick Start */}
              {step === 2 && (
                <div className="space-y-3">
                  <p className="font-sans text-sm leading-relaxed text-foreground/80 mb-4">{currentStep.description}</p>
                  {(currentStep.quickSteps ?? []).map((qs, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                      onClick={() => {
                        router.push(qs.href);
                        handleClose();
                      }}
                      className="card-lift group flex w-full items-center gap-4 rounded-xl border border-gold/12 bg-background/40 p-4 text-left transition-all hover:border-gold/30"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-gradient font-serif text-lg font-bold text-black">
                        {qs.num}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-serif text-base font-semibold text-foreground">{qs.title}</h3>
                        <p className="font-sans text-xs text-muted-foreground">{qs.desc}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground transition-all group-hover:text-gold group-hover:translate-x-1" />
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Step 4: Explore */}
              {step === 3 && (
                <div className="space-y-3">
                  <p className="font-sans text-sm leading-relaxed text-foreground/80 mb-4">{currentStep.description}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(currentStep.modules ?? []).map((mod, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 + i * 0.05 }}
                        onClick={() => {
                          router.push(mod.href);
                          handleClose();
                        }}
                        className="card-lift group flex items-center gap-3 rounded-xl border border-gold/12 bg-background/40 p-3 text-left transition-all hover:border-gold/30"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/8 border border-gold/15">
                          <mod.icon className="h-4 w-4 text-gold" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-sans text-sm font-medium text-foreground">{mod.title}</p>
                          <p className="truncate font-sans text-[11px] text-muted-foreground">{mod.desc}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with navigation */}
            <div className="flex items-center justify-between border-t border-gold/12 p-4">
              <div className="flex gap-1.5">
                {FTUE_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === step ? "w-6 bg-gold" : "w-1.5 bg-gold/30 hover:bg-gold/50"
                    )}
                    aria-label={`Step ${i + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={handlePrev}
                    className="rounded-lg px-3 py-1.5 font-sans text-xs font-medium text-muted-foreground transition-colors hover:text-gold"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="btn-sheen inline-flex items-center gap-1.5 rounded-lg bg-gold-gradient px-4 py-2 font-sans text-xs font-semibold text-black transition-all hover:shadow-[0_8px_30px_-8px_rgba(212,175,55,0.6)]"
                >
                  {step === FTUE_STEPS.length - 1 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Get Started
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
