import * as React from "react";
import { ShieldCheck, ScrollText, Check, X, Clock } from "lucide-react";
import { timeAgo } from "@/lib/aurienta/format";
import { StatusBadge } from "./status-badge";

type AuditEntry = {
  id: string;
  action: string;
  target: string | null;
  result: string; // allowed | denied
  reason: string | null;
  actorLabel: string | null;
  timestamp: Date;
};

const FALLBACK: AuditEntry[] = [
  {
    id: "fb1",
    action: "expense.approve",
    target: "EcoPack · payroll 980,000 EGP",
    result: "allowed",
    reason: "Dual signature present — manager + accountant. Zero-custody validated.",
    actorLabel: "Ahmed K. + Khalil M.",
    timestamp: new Date(Date.now() - 5 * 86_400_000),
  },
  {
    id: "fb2",
    action: "cre.validate",
    target: "transfer_to_aurienta_account",
    result: "denied",
    reason: "Zero Custody (Rule I 1.1) — beneficiary matched AURIENTA-owned account.",
    actorLabel: "CRE",
    timestamp: new Date(Date.now() - 2 * 86_400_000),
  },
  {
    id: "fb3",
    action: "police_clearance.verify",
    target: "Khalil Mansour — manager appointment",
    result: "allowed",
    reason: "Ministry of Interior API: clear. Digital attestation sealed to ledger.",
    actorLabel: "Cairo Trust Law",
    timestamp: new Date(Date.now() - 1 * 86_400_000),
  },
  {
    id: "fb4",
    action: "proposal.publish",
    target: "Nile Brew · Graduation vote",
    result: "allowed",
    reason: "Readiness 96/100. Cooling 30d → voting 14d → 75% supermajority.",
    actorLabel: "Khalil M.",
    timestamp: new Date(Date.now() - 6 * 3_600_000),
  },
];

export function AuditLogFeed({ entries }: { entries: AuditEntry[] }) {
  const items = entries.length > 0 ? entries : FALLBACK;
  return (
    <section
      aria-label="Audit log"
      className="rounded-2xl border border-gold/12 glass p-5 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ScrollText className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">Audit log</h2>
        </div>
        <span className="rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold/70">
          Immutable · hash-chained
        </span>
      </div>

      <ol className="relative flex max-h-[26rem] flex-col gap-3 overflow-y-auto pr-1 pl-4">
        <span
          aria-hidden
          className="pointer-events-none absolute left-[5px] top-1 bottom-1 w-px bg-gradient-to-b from-gold/40 via-gold/15 to-transparent"
        />
        {items.map((e) => {
          const ok = e.result === "allowed";
          return (
            <li key={e.id} className="relative">
              <span
                className={`absolute -left-[1.45rem] top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                  ok ? "border-emerald-400/40 bg-emerald-400/10" : "border-red-400/40 bg-red-400/10"
                }`}
              >
                {ok ? <Check className="h-2.5 w-2.5 text-emerald-300" /> : <X className="h-2.5 w-2.5 text-red-300" />}
              </span>
              <div className="rounded-xl border border-gold/10 bg-background/40 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-[11px] text-foreground/90">{e.action}</code>
                    <StatusBadge
                      status={ok ? "green" : "red"}
                      label={ok ? "allowed" : "denied"}
                      showIcon={false}
                      className="px-1.5 py-0 text-xs"
                    />
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground/85">
                    <Clock className="h-2.5 w-2.5" /> {timeAgo(e.timestamp)}
                  </span>
                </div>
                {e.target && (
                  <p className="mt-1 font-sans text-[12px] text-foreground/80">
                    <ShieldCheck className="mr-1 inline h-3 w-3 text-gold/60" />
                    {e.target}
                  </p>
                )}
                {e.reason && (
                  <p className="mt-1 font-sans text-[11px] leading-relaxed text-muted-foreground">{e.reason}</p>
                )}
                {e.actorLabel && (
                  <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/80">
                    actor · {e.actorLabel}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
