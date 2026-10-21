import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  listClaimsVisibleToUser,
  getTakafulPoolStats,
} from "@/lib/aurienta/takaful-pool";
import { db } from "@/lib/db";
import { TakafulPoolClient } from "@/components/dashboard/roadmap/takaful-pool-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Takaful Pool · AURIENTA",
  description:
    "Constitutional cooperative risk pool. CRE-verified claims, board-approved, disbursed by the law firm (Zero Custody).",
};

// Server component — fetches claims + enterprises + per-enterprise pool
// stats visible to the calling user, then passes them to the client
// component for rendering.
export default async function TakafulPoolPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/takaful-pool");

  const memberships = user.memberships ?? [];
  const enterpriseIds = memberships.map((m) => m.enterpriseId);
  const isRep = memberships.some((m) => m.role === "aurienta_rep");
  const canApprove =
    isRep ||
    memberships.some((m) => m.role === "board_member") ||
    memberships.some((m) => m.role === "company_owner");
  const canPay =
    isRep || memberships.some((m) => m.role === "law_firm_rep");

  // Pull enterprises the user is a member of, plus all enterprises when
  // the caller is an AURIENTA Rep (so they can file / approve for any).
  const enterprises = await db.enterprise.findMany({
    where: isRep ? undefined : { id: { in: enterpriseIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      tier: true,
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  const claims = await listClaimsVisibleToUser(user.id, enterpriseIds, 100);

  // Per-enterprise pool stats — only for enterprises the user can see.
  const statsByEnterprise: Record<string, Awaited<ReturnType<typeof getTakafulPoolStats>>> = {};
  for (const e of enterprises) {
    statsByEnterprise[e.id] = await getTakafulPoolStats(e.id);
  }

  return (
    <TakafulPoolClient
      claims={claims.map((c) => ({
        id: c.id,
        enterpriseId: c.enterpriseId,
        claimantId: c.claimantId,
        claimType: c.claimType,
        description: c.description,
        evidenceCid: c.evidenceCid,
        amountRequested: c.amountRequested,
        amountApproved: c.amountApproved,
        status: c.status,
        creDecisionToken: c.creDecisionToken,
        createdAt: c.createdAt.toISOString(),
        resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
      }))}
      enterprises={enterprises.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        tier: e.tier,
      }))}
      statsByEnterprise={statsByEnterprise}
      canApprove={canApprove}
      canPay={canPay}
    />
  );
}
