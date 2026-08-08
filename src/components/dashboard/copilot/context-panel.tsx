import * as React from "react";
import Link from "next/link";
import { Bot, ShieldAlert, Sparkles, Building2, Hash } from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { stsLevel } from "@/lib/aurienta/constants";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { shortHash } from "@/lib/aurienta/format";

type EnterpriseLite = {
  id: string;
  name: string;
  tier: string;
  stage: string;
  graduationReadiness: number;
};

/**
 * Server-rendered context panel — shows the AI models in use, the user's
 * current enterprise context, and the constitutional guardrail note.
 * Rendered alongside the client chat interface.
 */
export function CopilotContextPanel({
  user,
  enterprises,
}: {
  user: {
    legalName: string;
    sovereignTrustScore: number;
    tier: string;
    verificationLevel: string;
    memberships: { role: string }[];
  };
  enterprises: EnterpriseLite[];
}) {
  const sts = stsLevel(user.sovereignTrustScore);
  const roles = [...new Set(user.memberships.map((m) => m.role))];

  return (
    <aside
      aria-label="Copilot context"
      className="flex flex-col gap-4 rounded-2xl border border-gold/12 glass p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/5">
          <Bot className="h-4 w-4 text-gold" />
        </span>
        <div>
          <p className="font-serif text-sm font-semibold">Copilot context</p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/85">
            grounded · deterministic
          </p>
        </div>
      </div>

      {/* User */}
      <div className="rounded-xl border border-gold/10 bg-background/40 p-3.5">
        <div className="flex items-center gap-2">
          <GoldStar className="h-3 w-3" />
          <p className="font-serif text-sm font-semibold">{user.legalName}</p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px]"
            style={{ background: `${sts.color}22`, color: sts.color }}
          >
            STS {user.sovereignTrustScore} · {sts.name}
          </span>
          <span className="rounded-full border border-gold/15 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            {user.verificationLevel}
          </span>
        </div>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground/85">
          roles · {roles.length > 0 ? roles.join(", ") : "none"}
        </p>
      </div>

      {/* Active enterprise context */}
      <div className="rounded-xl border border-gold/10 bg-background/40 p-3.5">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-gold" />
          <p className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
            Enterprise context
          </p>
        </div>
        {enterprises.length === 0 ? (
          <p className="mt-2 font-sans text-[11px] text-muted-foreground/80">
            No enterprises yet. Found or join one to give the copilot live context.
          </p>
        ) : (
          <ul className="mt-2.5 flex flex-col gap-2">
            {enterprises.slice(0, 4).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2">
                <Link
                  href="/dashboard/portfolio"
                  className="truncate font-serif text-[13px] font-medium text-foreground/90 hover:text-gold-light"
                >
                  {e.name}
                </Link>
                <span className="shrink-0 rounded border border-gold/15 bg-gold/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-gold/70">
                  T{e.tier} · R{e.graduationReadiness}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Models */}
      <div className="rounded-xl border border-gold/10 bg-background/40 p-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          <p className="font-sans text-[11px] uppercase tracking-wider text-muted-foreground">
            AI stack in use
          </p>
        </div>
        <ul className="mt-2.5 flex flex-col gap-1.5 font-mono text-xs text-foreground/85">
          <li className="flex items-center justify-between">
            <span>Gemma 2 27B</span>
            <span className="text-muted-foreground/85">governance Q&amp;A</span>
          </li>
          <li className="flex items-center justify-between">
            <span>Mixtral 8x22B</span>
            <span className="text-muted-foreground/85">insights · summaries</span>
          </li>
          <li className="flex items-center justify-between">
            <span>Llama 3.2 70B</span>
            <span className="text-muted-foreground/85">risk scoring</span>
          </li>
          <li className="flex items-center justify-between">
            <span>Gemma 2 7B</span>
            <span className="text-muted-foreground/85">oversight · bias/drift</span>
          </li>
        </ul>
      </div>

      {/* Guardrail */}
      <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.05] p-3.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-300" />
          <p className="font-sans text-[11px] font-semibold text-amber-200">
            AI as Enforcer, Not Decider
          </p>
        </div>
        <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-muted-foreground">
          High-risk decisions — large expense approvals, share transfers, graduation votes — always
          require human confirmation. The Copilot drafts, explains, and validates; it never executes.
        </p>
      </div>

      {/* Anchor */}
      <div className="flex items-center justify-between rounded-lg border border-gold/10 bg-gold/[0.03] px-3 py-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/85">
          <Hash className="h-2.5 w-2.5" /> anchor
        </span>
        <code className="font-mono text-xs text-gold/70">{shortHash(CONSTITUTIONAL_HASH, 12, 4)}</code>
      </div>
    </aside>
  );
}
