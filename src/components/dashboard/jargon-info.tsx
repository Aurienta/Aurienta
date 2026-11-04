"use client";

/**
 * JargonInfo — COO-FIX-3: Plain-language tooltip for constitutional jargon.
 *
 * AURIENTA uses specialized terms (CRE, STS, Tier, Sovereign Trust Score, etc.)
 * that may confuse new users. This component renders a term with a tooltip
 * that explains it in plain language on hover/focus.
 *
 * Usage:
 *   <JargonInfo term="CRE">CRE</JargonInfo>
 *   <JargonInfo term="STS">STS 92</JargonInfo>
 *
 * Or use the <Jargon> shorthand which wraps children as the visible label.
 */

import * as React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const GLOSSARY: Record<string, { name: string; plain: string; example?: string }> = {
  CRE: {
    name: "Constitutional Runtime Engine",
    plain: "The AI system that enforces AURIENTA's rules. It cannot be overridden by any human — including platform admins.",
    example: "When you vote on a proposal, the CRE verifies your signature, checks your voting power, and records the outcome on the constitutional ledger.",
  },
  STS: {
    name: "Sovereign Trust Score",
    plain: "A 0–100 score reflecting your standing on the platform. Higher scores unlock more privileges (e.g., higher investment limits, priority allocations).",
    example: "STS 90+ = Constitutional Pillar (top tier). STS 65 = Emerging Participant (default for new users).",
  },
  "Sovereign Trust Score": {
    name: "Sovereign Trust Score",
    plain: "A 0–100 score reflecting your standing on the platform. Built from your verification level, on-chain history, and constitutional compliance.",
    example: "Score increases by: completing KYC, voting on proposals, graduating enterprises, holding equity long-term.",
  },
  Tier: {
    name: "Constitutional Tier",
    plain: "Your trust level on the platform. Tiers determine what you can do (invest, found, manage) and your fee structure.",
    example: "Tiers: A (Micro) → B (Seed) → C (Growth) → D (Established) → E (Sovereign) → F (Graduated JSC).",
  },
  "Equity Units": {
    name: "Equity Units",
    plain: "Your ownership stake in an enterprise, recorded on the constitutional ledger. Each unit = one share of the enterprise.",
    example: "If you hold 1,000 Equity Units in EcoPack, you own a proportional share of its profits and voting power.",
  },
  Graduation: {
    name: "Enterprise Graduation",
    plain: "When an enterprise matures enough to operate independently on the public market (stock exchange). This is AURIENTA's exit path — no acquisition needed.",
    example: "SmartFarm Egypt graduated from Tier D to a sovereign Joint Stock Company — it now trades publicly.",
  },
  "Zero Custody": {
    name: "Zero Custody",
    plain: "AURIENTA never holds your money. All funds flow directly to licensed law firm escrow accounts. AURIENTA only enforces the rules.",
    example: "When you invest 10,000 EGP, the money goes to the enterprise's law firm account — not to AURIENTA.",
  },
  "Constitutional": {
    name: "Constitutional",
    plain: "Governed by a set of digital rules (a 'constitution') that cannot be bent, bypassed, or broken — even by the platform's founders.",
    example: "The constitution defines how voting works, how funds are released, and how enterprises graduate.",
  },
  "Founding Operator": {
    name: "Founding Operator",
    plain: "The person who founded an enterprise. They have full operational control (milestones, expenses, employees) until the enterprise graduates.",
    example: "Ahmed is the Founding Operator of EcoPack — he manages day-to-day operations.",
  },
  "Capital Partner": {
    name: "Capital Partner",
    plain: "An investor who provides capital to enterprises in exchange for Equity Units. They vote on governance and receive dividends.",
    example: "Sarah is a Capital Partner in 3 enterprises — she invested EGP and holds equity.",
  },
  "Hash-anchored": {
    name: "Hash-anchored",
    plain: "Recorded on the constitutional ledger using a cryptographic hash (SHA3-256). This makes the record tamper-proof and verifiable.",
    example: "Your 9,024 Equity Units are hash-anchored — anyone can verify you hold them, but no one can alter the record.",
  },
  "Ed25519 anchor": {
    name: "Ed25519 Anchor",
    plain: "Your cryptographic identity on the platform. It's a public key that proves you are who you say you are, without revealing personal data.",
    example: "Your Ed25519 anchor is like a digital fingerprint — unique to you, impossible to forge.",
  },
  "MFA": {
    name: "Multi-Factor Authentication",
    plain: "A second verification step (beyond password) required for sensitive actions like moving money or signing documents. AURIENTA uses passkeys (phishing-resistant).",
    example: "After entering your password, you tap your phone's fingerprint sensor to confirm it's really you.",
  },
};

export function JargonInfo({
  term,
  children,
}: {
  term: keyof typeof GLOSSARY | string;
  children?: React.ReactNode;
}) {
  const entry = GLOSSARY[term];
  if (!entry) {
    // Unknown term — just render the children/term without a tooltip
    return <>{children ?? term}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex cursor-help items-center gap-0.5 border-b border-dotted border-current/40 align-baseline"
            tabIndex={0}
            role="button"
            aria-label={`${entry.name} — ${entry.plain}`}
          >
            {children ?? term}
            <Info className="h-3 w-3 opacity-50" aria-hidden />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs border-gold/15 bg-popover p-3 text-xs">
          <p className="font-sans font-semibold text-foreground">{entry.name}</p>
          <p className="mt-1 font-sans text-muted-foreground">{entry.plain}</p>
          {entry.example && (
            <p className="mt-1.5 border-t border-gold/10 pt-1.5 font-sans italic text-muted-foreground/80">
              {entry.example}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Convenience wrapper: <Jargon term="CRE">CRE</Jargon>
 * Same as <JargonInfo term="CRE">CRE</JargonInfo>
 */
export const Jargon = JargonInfo;
