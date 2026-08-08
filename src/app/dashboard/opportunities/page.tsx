import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { SECTORS, CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { computeDynamicMinimum } from "@/lib/aurienta/cre";
import { shortHash } from "@/lib/aurienta/format";
import { GoldStar } from "@/components/aurienta-logo";
import {
  OpportunitiesGrid,
  type Opportunity,
} from "@/components/dashboard/capital/opportunities-grid";
import { Compass, ShieldCheck, Scale, Lock } from "lucide-react";

export const metadata = { title: "Capital Participation · AURIENTA" };

export default async function OpportunitiesPage() {
  const user = (await getCurrentUser())!;

  // All enterprises open to capital — exclude draft and graduated (sovereign).
  const enterprises = await db.enterprise.findMany({
    where: {
      status: { notIn: ["draft", "graduated"] },
    },
    orderBy: [{ status: "asc" }, { raisedEgp: "desc" }],
  });

  // Count existing Constitutional Partners per enterprise (for dynamic minimum).
  const investorCounts = await db.ownershipRecord.groupBy({
    by: ["enterpriseId"],
    where: {
      enterpriseId: { in: enterprises.map((e) => e.id) },
      equityUnits: { gt: 0 },
    },
    _count: { _all: true },
  });
  const countByEnt = new Map(
    investorCounts.map((c) => [c.enterpriseId, c._count._all])
  );

  const opportunities: Opportunity[] = enterprises.map((e) => {
    const remainingGoal = Math.max(e.fundraisingGoalEgp - e.raisedEgp, 0);
    let minShares = 1;
    if (e.investorCap && remainingGoal > 0) {
      const slots = Math.max(e.investorCap - (countByEnt.get(e.id) ?? 0), 1);
      const dynMinEgp = computeDynamicMinimum(
        remainingGoal,
        slots,
        e.tier
      );
      minShares = Math.max(1, Math.ceil(dynMinEgp / e.equityUnitPriceEgp));
    } else if (e.minParticipationEgp > 0) {
      minShares = Math.max(1, Math.ceil(e.minParticipationEgp / e.equityUnitPriceEgp));
    }
    return {
      id: e.id,
      slug: e.slug,
      name: e.name,
      tagline: e.tagline,
      sector: e.sector,
      sectorLabel: SECTORS[e.sector]?.label ?? e.sector,
      tier: e.tier,
      healthRating: e.healthRating,
      healthScore: e.healthScore,
      fundraisingGoalEgp: e.fundraisingGoalEgp,
      raisedEgp: e.raisedEgp,
      equityUnitPriceEgp: e.equityUnitPriceEgp,
      minShares,
      minParticipationEgp: e.minParticipationEgp,
      status: e.status,
      stage: e.stage,
    };
  });

  return (
    <div className="flex flex-col gap-7">
      {/* Heading */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <GoldStar className="h-3.5 w-3.5" />
            <span className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold-light/80">
              Capital Coordination Layer
            </span>
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
            Discover enterprises seeking Capital Participation
          </h1>
          <p className="mt-1.5 max-w-2xl font-sans text-sm text-muted-foreground">
            Constitutionally-formed enterprises seeking real-economy Capital
            Participation. Every reservation routes to a licensed Law Firm Client
            Account — AURIENTA never touches your funds.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-gold/15 bg-gold/[0.03] px-3 py-1.5 font-mono text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]" />
          CRE online · 4 phases
        </div>
      </header>

      {/* Intro band: phases */}
      <section className="rounded-2xl border border-gold/12 glass-gold p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <Compass className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">
            How capital flows through AURIENTA
          </h2>
        </div>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: "01",
              title: "Interest phase",
              body: "Soft pledges signal demand. No funds move.",
            },
            {
              n: "02",
              title: "Active Capital Formation",
              body: "Equity Units reserved at AI fundamental price. Law Firm Client Account open.",
            },
            {
              n: "03",
              title: "Closed Capital Formation",
              body: "Capital Participation Goal met — law firm reconciles reservations within 48h.",
            },
            {
              n: "04",
              title: "Milestone unlock",
              body: "Funds release against verified milestone evidence (EVE).",
            },
          ].map((step) => (
            <li
              key={step.n}
              className="rounded-xl border border-gold/10 bg-background/40 p-3.5"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gold-light">
                  {step.n}
                </span>
                <span className="font-serif text-sm font-medium">
                  {step.title}
                </span>
              </div>
              <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Opportunities grid (client) */}
      <OpportunitiesGrid opportunities={opportunities} />

      {/* Footer note */}
      <footer className="mt-2 flex flex-col items-start gap-2 border-t border-gold/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground/85">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-gold/60" /> Zero Custody
          </span>
          <span className="hidden sm:inline text-gold/15">|</span>
          <span className="inline-flex items-center gap-1">
            <Scale className="h-3 w-3 text-gold/60" /> CRE dynamic minimum
          </span>
          <span className="hidden sm:inline text-gold/15">|</span>
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3 w-3 text-gold/60" /> 48h Law Firm Client Account reconciliation
          </span>
        </div>
        <span className="font-mono text-xs text-muted-foreground/80">
          Constitutional Hash: {shortHash(CONSTITUTIONAL_HASH, 14, 6)}
        </span>
      </footer>
    </div>
  );
}
