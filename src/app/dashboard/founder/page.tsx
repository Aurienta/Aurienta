import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { FounderStudioClient } from "@/components/dashboard/founder/founder-studio-client";
import type {
  FounderEnterprise,
  FounderMilestone,
  FounderLedgerEvent,
} from "@/components/dashboard/founder/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Founding Operator Studio · AURIENTA" };

export default async function FounderStudioPage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout.tsx handles the redirect.

  // ── Find every enterprise the user founded OR co-operates as a founding_operator. ──
  // Use a unique map to deduplicate between founderId and memberships.
  const founded = await db.enterprise.findMany({
    where: { founderId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const memberOf = await db.enterpriseMember.findMany({
    where: { userId: user.id, role: "founding_operator" },
    include: { enterprise: true },
  });

  const byId = new Map<string, typeof founded[number]>();
  for (const e of founded) byId.set(e.id, e);
  for (const m of memberOf) byId.set(m.enterprise.id, m.enterprise);

  const enterpriseIds = Array.from(byId.keys());

  // ── Parallel-load related data for each enterprise. ──
  const [milestonesByEnt, investorCounts, ledgerByEnt] = await Promise.all([
    // Milestones
    db.milestone.findMany({
      where: { enterpriseId: { in: enterpriseIds } },
      orderBy: { createdAt: "asc" },
    }).then((rows) => {
      const map = new Map<string, FounderMilestone[]>();
      for (const m of rows) {
        const arr = map.get(m.enterpriseId) ?? [];
        arr.push({
          id: m.id,
          title: m.title,
          description: m.description,
          amountEgp: m.amountEgp,
          status: m.status,
          eveConfidence: m.eveConfidence,
          evidenceNote: m.evidenceNote,
          dueAt: m.dueAt ? m.dueAt.toISOString() : null,
          releasedAt: m.releasedAt ? m.releasedAt.toISOString() : null,
          createdAt: m.createdAt.toISOString(),
        });
        map.set(m.enterpriseId, arr);
      }
      return map;
    }),
    // Capital Partner counts (distinct users with >0 shares per enterprise)
    db.ownershipRecord.groupBy({
      by: ["enterpriseId"],
      where: { enterpriseId: { in: enterpriseIds }, equityUnits: { gt: 0 } },
      _count: { _all: true },
    }).then((rows) => {
      const map = new Map<string, number>();
      for (const r of rows) map.set(r.enterpriseId, r._count._all);
      return map;
    }),
    // Last 5 ledger events per enterprise
    db.ledgerEvent.findMany({
      where: { enterpriseId: { in: enterpriseIds } },
      orderBy: { timestamp: "desc" },
      take: enterpriseIds.length * 5,
    }).then((rows) => {
      const map = new Map<string, FounderLedgerEvent[]>();
      for (const e of rows) {
        const arr = map.get(e.enterpriseId ?? "") ?? [];
        if (arr.length < 5) {
          arr.push({
            id: e.id,
            eventType: e.eventType,
            payload: e.payload,
            timestamp: e.timestamp.toISOString(),
          });
          map.set(e.enterpriseId ?? "", arr);
        }
      }
      return map;
    }),
  ]);

  const enterprises: FounderEnterprise[] = Array.from(byId.values()).map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    tagline: e.tagline,
    description: e.description,
    sector: e.sector,
    tier: e.tier,
    stage: e.stage,
    legalForm: e.legalForm,
    healthRating: e.healthRating,
    healthScore: e.healthScore,
    fundraisingGoalEgp: e.fundraisingGoalEgp,
    raisedEgp: e.raisedEgp,
    minParticipationEgp: e.minParticipationEgp,
    investorCap: e.investorCap,
    equityUnitPriceEgp: e.equityUnitPriceEgp,
    totalEquityUnits: e.totalEquityUnits,
    founderEquityPct: e.founderEquityPct,
    platformFeePct: e.platformFeePct,
    consultingFeePct: e.consultingFeePct,
    consultingOptOut: e.consultingOptOut,
    monthlyRevenueEgp: e.monthlyRevenueEgp,
    monthlyBurnEgp: e.monthlyBurnEgp,
    lawFirmClientAccountBalanceEgp: e.lawFirmClientAccountBalanceEgp,
    grossMarginPct: e.grossMarginPct,
    revenueGrowthPct: e.revenueGrowthPct,
    employeeCount: e.employeeCount,
    nosiCompliantPct: e.nosiCompliantPct,
    status: e.status,
    graduationReadiness: e.graduationReadiness,
    createdAt: e.createdAt.toISOString(),
    milestones: milestonesByEnt.get(e.id) ?? [],
    investorCount: investorCounts.get(e.id) ?? 0,
    ledgerEvents: ledgerByEnt.get(e.id) ?? [],
  }));

  return (
    <FounderStudioClient
      enterprises={enterprises}
      constitutionalHash={CONSTITUTIONAL_HASH}
      founderName={user.legalName}
    />
  );
}
