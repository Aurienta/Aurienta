"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  Building2,
  Sparkles,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoldStar, AurientaMark } from "@/components/aurienta-logo";
import { mockAnchorHash, type RegisterState } from "../register-types";

interface StepActivationProps {
  state: RegisterState;
}

export function StepActivation({ state }: StepActivationProps) {
  // Prefer the real Ed25519 anchor returned by /api/auth/register. Only fall
  // back to the client-side mock hash if the wizard was opened directly on
  // the activation step (e.g. via a stale navigation) without a successful
  // registration response in hand.
  const anchorHash = state.identityAnchor ?? mockAnchorHash(state.email || state.mobile || state.legalName || "aurienta");
  const partnerName = state.legalName.trim() || "Constitutional Partner";

  return (
    <div className="flex flex-col items-center gap-7 text-center">
      {/* Animated gold check */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <span
          aria-hidden="true"
          className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.28),transparent_70%)] animate-pulse-gold"
        />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gold-gradient text-black shadow-[0_18px_60px_-18px_rgba(212,175,55,0.85)]">
          <motion.span
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.25, ease: "easeOut" }}
          >
            <CheckCircle2 className="h-10 w-10" aria-hidden="true" strokeWidth={2.2} />
          </motion.span>
        </span>
      </motion.div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-center gap-2">
          <GoldStar className="h-3.5 w-3.5" />
          <span className="font-sans text-xs uppercase tracking-[0.32em] text-gold-light">
            Activation Complete
          </span>
          <GoldStar className="h-3.5 w-3.5" />
        </div>
        <h2 className="font-serif text-3xl font-medium text-foreground sm:text-4xl">
          You are now a{" "}
          <span className="text-gold-gradient">Constitutional Partner</span>
        </h2>
        <p className="max-w-md font-sans text-sm text-muted-foreground">
          Welcome, {partnerName}. Your identity is anchored, your pledge is
          recorded, and the Ownership Ledger now carries your signature.
        </p>
      </div>

      {/* Trust score card */}
      <div className="grid w-full gap-3 sm:grid-cols-3">
        <Stat
          label="Sovereign Trust Score"
          value="65"
          sub="Emerging Participant"
          icon={Sparkles}
        />
        <Stat
          label="Verification Level"
          value={state.verificationLevel ?? "L2"}
          sub={state.verificationLevel === "L3" ? "Founding Tiers A–D" : state.verificationLevel === "L4" ? "Institutional" : "Basic KYC · 10,000 EGP cap"}
          icon={ShieldCheck}
        />
        <Stat
          label="Identity Anchor"
          value="Ed25519"
          sub="Anchored to Stellar"
          icon={KeyRound}
        />
      </div>

      {/* Anchor hash */}
      <div className="flex w-full flex-col gap-2 rounded-xl border border-gold/20 bg-gradient-to-r from-gold/[0.06] to-transparent p-4 text-left">
        <span className="font-sans text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Constitutional Identity Anchor
        </span>
        <code className="break-all font-mono text-xs text-gold-light sm:text-sm">
          {anchorHash}
        </code>
        <span className="font-sans text-[11px] text-muted-foreground">
          Held inside HSM · signed event <span className="font-mono">constitutional_genesis</span> appended to immutable ledger.
        </span>
      </div>

      {/* Path to Trusted Contributor */}
      <div className="flex w-full flex-col gap-2 rounded-xl border border-gold/15 bg-background/40 p-4 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Reputation path
          </span>
          <span className="font-mono text-[11px] text-gold-light">65 → 80+</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 bg-gold-gradient"
            style={{ width: "65%" }}
            aria-hidden="true"
          />
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-[65%] w-px bg-gold/40"
          />
        </div>
        <p className="font-sans text-[11px] text-muted-foreground">
          Emerging Participant → Trusted Contributor. Score rises with milestone
          delivery, budget accuracy, governance compliance, dispute resolution, longevity.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <Button
          asChild
          className="group relative h-11 flex-1 overflow-hidden rounded-lg bg-gold-gradient text-sm font-semibold text-black shadow-[0_14px_40px_-14px_rgba(212,175,55,0.65)] transition-all hover:shadow-[0_18px_60px_-14px_rgba(212,175,55,0.9)]"
        >
          <Link href="/dashboard">
            <span className="relative inline-flex items-center gap-2">
              Enter Unified Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-11 flex-1 rounded-lg border-gold/30 bg-transparent text-sm font-medium text-foreground transition-all hover:border-gold/55 hover:bg-gold/5 hover:text-gold-light"
        >
          <Link href="/dashboard/founder">
            <Building2 className="h-4 w-4 text-gold" aria-hidden="true" />
            Link a Company
          </Link>
        </Button>
      </div>

      <div className="mt-1 flex items-center gap-2">
        <AurientaMark className="h-4 w-4" />
        <p className="font-serif text-sm italic text-muted-foreground">
          “Your capital, your work, your company — no speculation required.”
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-start gap-1 rounded-xl border border-gold/15 bg-background/40 p-3.5 text-left">
      <span className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3 w-3 text-gold/80" aria-hidden="true" />
        {label}
      </span>
      <span className="font-serif text-2xl font-medium text-gold-light">
        {value}
      </span>
      <span className="font-sans text-[11px] text-muted-foreground">{sub}</span>
    </div>
  );
}
