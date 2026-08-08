import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { RiskDisclosureClient } from "@/components/dashboard/transparency/risk-disclosure-client";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Risk Disclosure · AURIENTA",
  description:
    "Constitutional risk disclosure — stress-loss estimates, cooling-off periods, and per-Participation acknowledgements before any law firm client account transfer.",
};

export default async function RiskDisclosurePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/risk-disclosure");

  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);

  // Disclosures the user has acknowledged.
  const disclosures = await db.riskDisclosure.findMany({
    where: { userId: user.id },
    include: { enterprise: { select: { id: true, name: true, slug: true, tier: true, sector: true, healthRating: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Enterprises the user can invest in.
  const investable = await db.enterprise.findMany({
    where: {
      id: { in: enterpriseIds },
      status: { in: ["fundraising_active", "active"] },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      tier: true,
      sector: true,
      healthRating: true,
      equityUnitPriceEgp: true,
      raisedEgp: true,
      fundraisingGoalEgp: true,
      lawFirmClientAccountBalanceEgp: true,
      monthlyBurnEgp: true,
    },
  });

  const stats = {
    total: disclosures.length,
    acknowledged: disclosures.filter((d) => d.acknowledged).length,
    pending: disclosures.filter((d) => !d.acknowledged).length,
    totalStressLoss: disclosures.reduce((s, d) => s + d.stressLossEstimateEgp, 0),
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Risk Disclosure"
        icon={ShieldCheck}
        title="Know the worst case before you commit a piastre"
        subtitle="Every Participation requires a constitutional risk disclosure: a stress-loss estimate against your declared risk profile, a 72-hour cooling-off period, and an explicit acknowledgement. No disclosure → no law firm client account transfer — enforced by the CRE."
      />

      <RiskDisclosureClient
        userId={user.id}
        riskProfile={user.riskProfile ?? "balanced"}
        disclosures={disclosures.map((d) => ({
          id: d.id,
          enterpriseId: d.enterpriseId,
          enterpriseName: d.enterprise.name,
          enterpriseTier: d.enterprise.tier,
          enterpriseSector: d.enterprise.sector,
          enterpriseHealth: d.enterprise.healthRating,
          amountEgp: d.amountEgp,
          riskProfile: d.riskProfile,
          stressLossEstimateEgp: d.stressLossEstimateEgp,
          stressScenario: d.stressScenario,
          coolingEndsAt: d.coolingEndsAt.toISOString(),
          acknowledged: d.acknowledged,
          createdAt: d.createdAt.toISOString(),
        }))}
        investable={investable.map((e) => ({
          id: e.id,
          name: e.name,
          slug: e.slug,
          tier: e.tier,
          sector: e.sector,
          healthRating: e.healthRating,
          equityUnitPriceEgp: e.equityUnitPriceEgp,
          raisedEgp: e.raisedEgp,
          fundraisingGoalEgp: e.fundraisingGoalEgp,
          lawFirmClientAccountBalanceEgp: e.lawFirmClientAccountBalanceEgp,
          monthlyBurnEgp: e.monthlyBurnEgp,
        }))}
        stats={stats}
      />
    </div>
  );
}
