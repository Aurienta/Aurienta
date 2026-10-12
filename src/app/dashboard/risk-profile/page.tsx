import { redirect } from "next/navigation";
import { createHash } from "crypto";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { RiskProfileClient } from "@/components/dashboard/roadmap/risk-profile-client";
import { platformPublicKeyHex } from "@/lib/aurienta/risk-profile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Risk Profile API · AURIENTA",
  description:
    "Data service for insurance partners. AURIENTA provides data, not insurance. Compliant with FRA Insurance Law 10/1981.",
};

/**
 * Derive a deterministic per-user demo API key for the dashboard console.
 * Real keys (POST /api/risk-profile/keys) are issued for external/curl use.
 */
function deriveDemoApiKey(email: string): string {
  return `aur_risk-demo-${email}`;
}

export default async function RiskProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/risk-profile");

  const isAurientaRep = user.memberships.some((m) => m.role === "aurienta_rep");

  // Enterprises the user is a member of — used to populate the selector.
  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);
  const enterprises = await db.enterprise.findMany({
    where:
      enterpriseIds.length === 0
        ? { status: "active" }
        : { id: { in: enterpriseIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      tier: true,
      sector: true,
      healthRating: true,
      healthScore: true,
      status: true,
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  // Fetch risk-profile query history.
  // - aurienta_rep: see all queries (most recent 50).
  // - Otherwise: only queries made via the dashboard console (whose
  //   apiKeyHash = SHA-256 of the demo key).
  const demoApiKey = deriveDemoApiKey(user.email);
  const demoKeyHash = createHash("sha256").update(demoApiKey).digest("hex");

  const history = await db.riskProfileQuery.findMany({
    where: isAurientaRep ? {} : { apiKeyHash: demoKeyHash },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // RiskProfileQuery stores enterpriseId as a plain String FK (no relation
  // directive) per the foundation's isolation pattern. Join manually.
  const entIds = Array.from(new Set(history.map((h) => h.enterpriseId)));
  const entLookup =
    entIds.length === 0
      ? []
      : await db.enterprise.findMany({
          where: { id: { in: entIds } },
          select: { id: true, name: true, tier: true },
        });
  const entMap = new Map(entLookup.map((e) => [e.id, e]));

  return (
    <RiskProfileClient
      userEmail={user.email}
      isAurientaRep={isAurientaRep}
      demoApiKey={demoApiKey}
      platformPublicKey={platformPublicKeyHex()}
      enterprises={enterprises.map((e) => ({
        id: e.id,
        name: e.name,
        tier: e.tier,
        sector: e.sector,
        healthRating: e.healthRating,
        healthScore: e.healthScore,
        status: e.status,
      }))}
      history={history.map((h) => {
        const ent = entMap.get(h.enterpriseId);
        return {
          id: h.id,
          enterpriseId: h.enterpriseId,
          enterpriseName: ent?.name ?? null,
          enterpriseTier: ent?.tier ?? null,
          requesterOrg: h.requesterOrg,
          healthScore: h.healthScore,
          recommendation: h.recommendation,
          riskFactors: h.riskFactors,
          createdAt: h.createdAt.toISOString(),
        };
      })}
    />
  );
}
