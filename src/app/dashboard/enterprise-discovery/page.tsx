export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { recommendEnterprises } from "@/lib/aurienta/enterprise-discovery";
import { db } from "@/lib/db";
import {
  EnterpriseDiscoveryClient,
  type DiscoveryProfileClient,
  type DiscoveryMatchClient,
  type EnterpriseSummary,
} from "@/components/dashboard/roadmap/enterprise-discovery-client";

export const metadata = { title: "Enterprise Discovery · AURIENTA" };

export default async function EnterpriseDiscoveryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/enterprise-discovery");

  const profile = await db.discoveryProfile.findUnique({
    where: { userId: user.id },
  });

  // recommendEnterprises loads-or-creates the profile if missing and
  // upserts DiscoveryMatch rows for current candidates.
  const matches = await recommendEnterprises(user.id);

  // Batch-fetch enterprise details for display (one round trip).
  const enterpriseIds = matches.map((m) => m.enterpriseId);
  const enterprises = enterpriseIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: enterpriseIds } },
        select: {
          id: true,
          slug: true,
          name: true,
          tier: true,
          sector: true,
          healthRating: true,
          equityUnitPriceEgp: true,
          raisedEgp: true,
          fundraisingGoalEgp: true,
          minInvestmentEgp: true,
          status: true,
          stage: true,
        },
      })
    : [];
  const entMap = new Map<string, EnterpriseSummary>(
    enterprises.map((e) => [
      e.id,
      {
        id: e.id,
        slug: e.slug,
        name: e.name,
        tier: e.tier,
        sector: e.sector,
        healthRating: e.healthRating,
        equityUnitPriceEgp: e.equityUnitPriceEgp,
        raisedEgp: e.raisedEgp,
        fundraisingGoalEgp: e.fundraisingGoalEgp,
        minInvestmentEgp: e.minInvestmentEgp,
        status: e.status,
        stage: e.stage,
      },
    ])
  );

  const profileClient: DiscoveryProfileClient | null = profile
    ? {
        riskAppetite: profile.riskAppetite,
        preferredSectors: profile.preferredSectors,
        preferredTiers: profile.preferredTiers,
        minHealthRating: profile.minHealthRating,
        minInvestmentEgp: profile.minInvestmentEgp,
        maxInvestmentEgp: profile.maxInvestmentEgp,
        targetDiversification: profile.targetDiversification,
        updatedAt: profile.updatedAt.toISOString(),
      }
    : null;

  const matchClient: DiscoveryMatchClient[] = matches.map((m) => ({
    id: m.id,
    enterpriseId: m.enterpriseId,
    matchScore: m.matchScore,
    matchReasons: m.matchReasons,
    dismissed: m.dismissed,
    invested: m.invested,
    enterprise: entMap.get(m.enterpriseId) ?? null,
  }));

  return (
    <EnterpriseDiscoveryClient
      user={{
        legalName: user.legalName,
        sovereignTrustScore: user.sovereignTrustScore,
      }}
      profile={profileClient}
      matches={matchClient}
    />
  );
}
