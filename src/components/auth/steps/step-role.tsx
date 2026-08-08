"use client";

import * as React from "react";
import {
  Wallet,
  Rocket,
  HardHat,
  Building2,
  Scale,
  Calculator,
  GraduationCap,
  Landmark,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type {
  Intent,
  InstitutionKind,
  RegisterState,
  VerificationLevel,
} from "../register-types";

interface StepRoleProps {
  state: RegisterState;
  update: (patch: Partial<RegisterState>) => void;
}

const INTENTS: {
  value: Intent;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: "capital",
    title: "Invest capital",
    desc: "Become a Capital Partner. Deploy funds into enterprises for Equity Units.",
    icon: Wallet,
  },
  {
    value: "founding",
    title: "Found an enterprise",
    desc: "Founding Operator. Draft a new constitutional enterprise (Tiers A–F).",
    icon: Rocket,
  },
  {
    value: "workforce",
    title: "Join a workforce",
    desc: "Workforce Partner. Convert up to 10% of salary into Equity Units at a 15% discount.",
    icon: HardHat,
  },
  {
    value: "institution",
    title: "Represent an institution",
    desc: "Law Firm, Accounting Firm, University, or Company. Multi-entity identity.",
    icon: Building2,
  },
];

const INSTITUTIONS: {
  value: InstitutionKind;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "law", label: "Law Firm", icon: Scale },
  { value: "accounting", label: "Accounting Firm", icon: Calculator },
  { value: "university", label: "University", icon: GraduationCap },
  { value: "company", label: "Company", icon: Landmark },
];

const LEVEL_HINTS: Record<VerificationLevel, string> = {
  L2: "Basic KYC · invest up to 10,000 EGP · unlocks Capital Partner participation.",
  L3: "Enhanced KYC · founding Tiers A–D · no cap on individual Participation.",
  L4: "Institutional · for funds, banks, insurers (OAuth2 + UBO declaration).",
};

export function StepRole({ state, update }: StepRoleProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Intent cards */}
      <div className="flex flex-col gap-2.5">
        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Primary intent
        </Label>
        <RadioGroup
          value={state.intent ?? undefined}
          onValueChange={(v) => update({ intent: v as Intent })}
          className="grid gap-3 sm:grid-cols-2"
        >
          {INTENTS.map((it) => (
            <label
              key={it.value}
              htmlFor={`intent-${it.value}`}
              className={cn(
                "group relative flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all",
                state.intent === it.value
                  ? "border-gold/55 bg-gold/[0.07] shadow-[0_0_24px_-10px_rgba(212,175,55,0.7)]"
                  : "border-gold/15 bg-background/40 hover:border-gold/30"
              )}
            >
              <RadioGroupItem
                id={`intent-${it.value}`}
                value={it.value}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 transition-all",
                  state.intent === it.value
                    ? "bg-gold/15 ring-gold/40"
                    : "bg-gold/[0.06] ring-gold/20 group-hover:bg-gold/10"
                )}
              >
                <it.icon
                  className={cn(
                    "h-5 w-5",
                    state.intent === it.value ? "text-gold-light" : "text-gold/80"
                  )}
                  aria-hidden="true"
                />
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-sans text-sm font-semibold text-foreground">
                  {it.title}
                </span>
                <span className="font-sans text-xs leading-snug text-muted-foreground">
                  {it.desc}
                </span>
              </span>
              {/* Visual radio dot */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border transition-all",
                  state.intent === it.value
                    ? "border-gold bg-gold-gradient"
                    : "border-gold/30 bg-transparent"
                )}
              >
                {state.intent === it.value && (
                  <span className="h-1.5 w-1.5 rounded-full bg-black" />
                )}
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Institution kind (conditional) */}
      {state.intent === "institution" && (
        <div className="flex flex-col gap-2.5">
          <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Which institution do you represent?
          </Label>
          <RadioGroup
            value={state.institutionKind ?? undefined}
            onValueChange={(v) => update({ institutionKind: v as InstitutionKind })}
            className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
          >
            {INSTITUTIONS.map((it) => (
              <label
                key={it.value}
                htmlFor={`inst-${it.value}`}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all",
                  state.institutionKind === it.value
                    ? "border-gold/55 bg-gold/[0.07]"
                    : "border-gold/15 bg-background/40 hover:border-gold/30"
                )}
              >
                <RadioGroupItem
                  id={`inst-${it.value}`}
                  value={it.value}
                  className="sr-only"
                />
                <it.icon
                  className={cn(
                    "h-5 w-5",
                    state.institutionKind === it.value
                      ? "text-gold-light"
                      : "text-gold/80"
                  )}
                  aria-hidden="true"
                />
                <span className="font-sans text-xs font-medium text-foreground">
                  {it.label}
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Verification level */}
      <div className="flex flex-col gap-2.5">
        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Verification level sought
        </Label>
        <Select
          value={state.verificationLevel ?? undefined}
          onValueChange={(v) => update({ verificationLevel: v as VerificationLevel })}
        >
          <SelectTrigger className="h-11 w-full bg-transparent">
            <SelectValue placeholder="Choose a verification level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="L2">L2 — Basic KYC (up to 10,000 EGP)</SelectItem>
            <SelectItem value="L3">L3 — Enhanced KYC (found Tiers A–D)</SelectItem>
            <SelectItem value="L4">L4 — Institutional</SelectItem>
          </SelectContent>
        </Select>
        {state.verificationLevel && (
          <p className="flex items-start gap-1.5 font-sans text-[11px] text-muted-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0 text-gold/70" aria-hidden="true" />
            <span>{LEVEL_HINTS[state.verificationLevel]}</span>
          </p>
        )}
        {state.verificationLevel === "L2" && (
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-gold/15 bg-gold/[0.04] px-3 py-2 font-sans text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-gold/80" aria-hidden="true" />
            Layla-example: 500 EGP savings → 10 Equity Units @ 50 EGP each in “Street Bites”.
          </div>
        )}
      </div>
    </div>
  );
}
