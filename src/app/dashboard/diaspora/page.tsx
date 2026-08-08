import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { DiasporaClient } from "@/components/dashboard/workforce/diaspora-client";

export const metadata = { title: "Diaspora Bridge · AURIENTA" };

export default async function DiasporaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/diaspora");

  const profile = await db.diasporaProfile.findUnique({
    where: { userId: user.id },
  });

  // Fetch capital formation enterprises for diaspora opportunities
  const opportunities = await db.enterprise.findMany({
    where: { status: "active", tier: { in: ["A", "B", "C"] } },
    take: 6,
    orderBy: { raisedEgp: "desc" },
  });

  return (
    <DiasporaClient
      user={{
        legalName: user.legalName,
        email: user.email,
        sovereignTrustScore: user.sovereignTrustScore,
      }}
      profile={
        profile
          ? {
              countryOfResidence: profile.countryOfResidence,
              remittanceIntentEgp: profile.remittanceIntentEgp,
              fxLockedRate: profile.fxLockedRate,
              fxLockedUntil: profile.fxLockedUntil?.toISOString() ?? null,
              documentsVerified: profile.documentsVerified,
              preferredLanguage: profile.preferredLanguage,
              sourceOfFundsDeclared: profile.sourceOfFundsDeclared,
            }
          : null
      }
      opportunities={opportunities.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        tier: e.tier,
        sector: e.sector,
        equityUnitPriceEgp: e.equityUnitPriceEgp,
        raisedEgp: e.raisedEgp,
        fundraisingGoalEgp: e.fundraisingGoalEgp,
        healthRating: e.healthRating,
      }))}
    />
  );
}
