"use client";

import * as React from "react";
import {
  Scale,
  Handshake,
  Crown,
  ClipboardCheck,
  Infinity as InfinityIcon,
  AlertTriangle,
  PenLine,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { GoldStar } from "@/components/aurienta-logo";
import type { RegisterState } from "../register-types";

interface StepPledgeProps {
  state: RegisterState;
  update: (patch: Partial<RegisterState>) => void;
}

const PILLARS = [
  {
    icon: Scale,
    title: "Institutional Integrity",
    body: "I act in the long-term interest of the enterprise, not personal short-term gain.",
  },
  {
    icon: Handshake,
    title: "Productive Fairness",
    body: "Capital must serve productive enterprise — never speculation, margin, or derivatives.",
  },
  {
    icon: Crown,
    title: "Enterprise Dignity",
    body: "I honour the company as an institution that must outlive its founders.",
  },
  {
    icon: ClipboardCheck,
    title: "Operational Accountability",
    body: "I accept the CRE's deterministic enforcement of every state transition.",
  },
  {
    icon: InfinityIcon,
    title: "Constitutional Continuity",
    body: "I register succession paths so governance survives founder death or departure.",
  },
  {
    icon: AlertTriangle,
    title: "Risk Acknowledgment",
    body: "I acknowledge that dividends are not guaranteed; enterprises may fail; loss is possible.",
  },
];

const CHARTER_EXCERPT = `CONSTITUTIONAL PARTICIPATION AGREEMENT (excerpt — Appendix S)

§1. CUSTODY. AURIENTA never holds, touches, or controls partner funds. Funds flow
    directly from the partner's bank account to a licensed law firm's Law Firm Client
    Account. (Non-amendable Rule I 1.1)

§2. ONE IDENTITY. Each natural person maintains exactly one verified identity.
    Duplicate identity hashes are denied at registration. (Rule I 1.6)

§3. NO SPECULATION. Derivatives, margin, short-selling, and tokenization of Equity
    Units are prohibited. (Rule I 1.8)

§4. FUNDAMENTAL PRICING. Secondary trades execute within ±5% (or ±10% in exceptional
    news) of the JOZOUR v3 fundamental price. (Rule I 1.4)

§5. TRANSPARENCY. Every decision token, every ledger event, every Law Firm Client Account movement
    is appended immutably to the Ownership Ledger. (Rule I 1.7)

§6. AI ENFORCEMENT. The Constitutional Runtime Engine validates every state
    transition against Rego policy-as-code. No state may mutate without a signed
    decision token. (Rule I 1.3)

§7. COMPLIANCE. Managers must maintain valid police clearance (Ministry of
    Interior, 6-month validity). Employees must be registered with NOSI within
    30 days of hire. (Add-ons 26, 27)

By signing below, the partner binds themselves to the Constitutional Charter
in its entirety. The Sovereign Trust Score commences at 65 — the threshold of
an Emerging Participant — and rises or falls with milestone delivery, budget
accuracy, governance compliance, dispute resolution, and longevity.

— Version 8.2 — Ready for sovereign implementation —`;

export function StepPledge({ state, update }: StepPledgeProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Six pillars */}
      <div className="grid gap-3 sm:grid-cols-2">
        {PILLARS.map((p) => (
          <div
            key={p.title}
            className="flex items-start gap-3.5 rounded-xl border border-gold/15 bg-gold/[0.03] p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/25">
              <p.icon className="h-4 w-4 text-gold-light" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-serif text-base font-medium text-foreground">
                {p.title}
              </span>
              <span className="font-sans text-xs leading-snug text-muted-foreground">
                {p.body}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charter excerpt */}
      <div className="flex flex-col gap-2.5">
        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Constitutional Participation Agreement (excerpt)
        </Label>
        <div
          className="max-h-56 overflow-y-auto rounded-xl border border-gold/15 bg-[#060608] p-4 font-mono text-[11px] leading-relaxed text-muted-foreground/80"
          role="region"
          aria-label="Constitutional charter excerpt"
          tabIndex={0}
        >
          <pre className="whitespace-pre-wrap break-words">{CHARTER_EXCERPT}</pre>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col gap-3">
        <ConsentRow
          id="readCharter"
          checked={state.readCharter}
          onChange={(v) => update({ readCharter: v })}
          label="I have read the Constitutional Charter (Version 8.2)."
        />
        <ConsentRow
          id="consentAI"
          checked={state.consentAI}
          onChange={(v) => update({ consentAI: v })}
          label="I consent to AI-enforced governance by the Constitutional Runtime Engine."
        />
        <ConsentRow
          id="acknowledgeRisk"
          checked={state.acknowledgeRisk}
          onChange={(v) => update({ acknowledgeRisk: v })}
          label="I acknowledge risk of loss; dividends are not guaranteed; AURIENTA does not guarantee enterprise success."
        />
        <ConsentRow
          id="acceptedTerms"
          checked={state.acceptedTerms}
          onChange={(v) => update({ acceptedTerms: v })}
          label={
            <>
              I have read, understood and accepted the{" "}
              <a
                href="/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gold underline hover:text-gold-light"
              >
                Platform Terms, Constitutional Participation Agreement &amp; Legal Disclaimer
              </a>
              . I understand that mandatory Egyptian law prevails over any internal platform rule.
            </>
          }
        />
      </div>

      {/* Signature */}
      <div className="flex flex-col gap-2.5">
        <Label
          htmlFor="signature"
          className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
        >
          Sign with your full legal name
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <PenLine className="h-4 w-4" aria-hidden="true" />
          </span>
          <Input
            id="signature"
            value={state.signature}
            onChange={(e) => update({ signature: e.target.value })}
            placeholder="Type your full name"
            className="h-11 pl-9"
            autoComplete="off"
          />
        </div>
        {state.signature.trim() && (
          <div className="mt-1 flex items-center justify-between rounded-xl border border-gold/20 bg-gradient-to-r from-gold/[0.06] to-transparent px-4 py-3">
            <span className="font-sans text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Signed as
            </span>
            <span className="flex items-center gap-2">
              <span className="font-serif text-lg italic text-gold-light">
                {state.signature}
              </span>
              <GoldStar className="h-3 w-3" aria-hidden="true" />
            </span>
          </div>
        )}
        <p className="flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground">
          <span
            className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 font-mono text-xs uppercase tracking-[0.14em] text-gold-light"
          >
            Sovereign Trust Score
          </span>
          Commences at 65 · Emerging Participant → on path to Trusted Contributor.
        </p>
      </div>
    </div>
  );
}

function ConsentRow({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-gold/15 bg-background/40 p-3.5 transition-colors hover:border-gold/30"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(!!v)}
        className="mt-0.5"
      />
      <span className="font-sans text-sm leading-relaxed text-muted-foreground">
        {label}
      </span>
    </label>
  );
}
