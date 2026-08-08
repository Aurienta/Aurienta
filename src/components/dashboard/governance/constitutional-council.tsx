import { cn } from "@/lib/utils";
import { GoldStar } from "@/components/aurienta-logo";
import { ROLE_META, STS_LEVELS } from "@/lib/aurienta/constants";
import { Crown, Users, ShieldCheck, Scale, Building2, HardHat } from "lucide-react";
import type { CouncilMemberForUi } from "./types";

type Props = {
  members: CouncilMemberForUi[];
  enterpriseName: string;
  enterpriseTier: string;
  className?: string;
};

const ROLE_ICON: Record<string, React.ElementType> = {
  founding_operator: Crown,
  manager: ShieldCheck,
  board_member: Users,
  company_owner: Building2,
  workforce_partner: HardHat,
  capital_partner: Scale,
  aurienta_rep: ShieldCheck,
};

export function ConstitutionalCouncil({
  members,
  enterpriseName,
  enterpriseTier,
  className,
}: Props) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-4 rounded-2xl glass-gold p-5",
        className
      )}
      aria-labelledby="council-heading"
    >
      <header>
        <div className="flex items-center gap-2">
          <GoldStar className="h-3 w-3" />
          <span className="font-mono text-xs uppercase tracking-[0.24em] text-gold-light/80">
            Constitutional Council
          </span>
        </div>
        <h2 id="council-heading" className="mt-1.5 font-serif text-lg font-semibold">
          Board of {enterpriseName}
        </h2>
        <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
          Tier {enterpriseTier} · quorum-signing board seats
        </p>
      </header>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      {members.length === 0 ? (
        <p className="py-6 text-center font-sans text-[12px] text-muted-foreground">
          No board seats registered for this enterprise.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {members.map((m) => {
            const meta = ROLE_META[m.role];
            const Icon = ROLE_ICON[m.role] ?? Users;
            const sts = STS_LEVELS.find((l) => m.sovereignTrustScore >= l.min) ?? STS_LEVELS[STS_LEVELS.length - 1];
            const initials = m.legalName
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("");
            return (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-gold/8 bg-foreground/[0.02] p-3 transition-colors hover:border-gold/20"
              >
                <div
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif text-[11px] font-semibold text-black"
                  style={{
                    background: `linear-gradient(135deg, ${m.avatarColor}, #b8860b)`,
                  }}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-sm font-semibold text-foreground">
                    {m.legalName}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[11px]"
                      style={{
                        background: "rgba(212,175,55,0.10)",
                        color: "#f4d676",
                        border: "1px solid rgba(212,175,55,0.25)",
                      }}
                    >
                      <Icon className="h-2.5 w-2.5" />
                      {meta?.label ?? m.role.replace(/_/g, " ")}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[11px]"
                      style={{
                        background: `${sts.color}18`,
                        color: sts.color,
                      }}
                    >
                      STS {m.sovereignTrustScore}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-1 rounded-lg border border-gold/10 bg-foreground/[0.02] p-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Constitutional rule
        </p>
        <p className="mt-1 font-sans text-[11px] leading-relaxed text-muted-foreground/90">
          Expenses &gt;10% of capital require board approval (Art. 118). Amendments and graduation
          require a 75% supermajority with 30–90 day cooling.
        </p>
      </div>
    </aside>
  );
}
