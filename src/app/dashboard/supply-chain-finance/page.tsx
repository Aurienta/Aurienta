import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  listAdvancesVisibleToUser,
  getSupplyChainStats,
} from "@/lib/aurienta/supply-chain-finance";
import { db } from "@/lib/db";
import { SupplyChainFinanceClient } from "@/components/dashboard/roadmap/supply-chain-finance-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Supply Chain Finance · AURIENTA",
  description:
    "Constitutional milestone-backed working-capital advances. 8% APR usury cap, Zero Custody disbursement through the law firm.",
};

// Server component — fetches advances + enterprises + milestones + per-enterprise
// supply-chain stats visible to the caller, then passes them to the client
// component for rendering.
export default async function SupplyChainFinancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/supply-chain-finance");

  const memberships = user.memberships ?? [];
  const enterpriseIds = memberships.map((m) => m.enterpriseId);
  const isRep = memberships.some((m) => m.role === "aurienta_rep");
  const canFund =
    isRep || memberships.some((m) => m.role === "capital_partner");
  const canRepay =
    isRep ||
    memberships.some((m) =>
      ["founding_operator", "manager", "board_member", "company_owner"].includes(
        m.role
      )
    );

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

  // Milestones for the enterprises the user can see — used by the
  // advance-request form's milestone dropdown.
  const entIdsForMilestones = enterprises.map((e) => e.id);
  const milestones = entIdsForMilestones.length
    ? await db.milestone.findMany({
        where: {
          enterpriseId: { in: entIdsForMilestones },
          status: { in: ["board_review", "approved", "released", "evidence_submitted"] },
        },
        select: {
          id: true,
          enterpriseId: true,
          title: true,
          amountEgp: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  const advances = await listAdvancesVisibleToUser(user.id, enterpriseIds, 100);

  const statsByEnterprise: Record<
    string,
    Awaited<ReturnType<typeof getSupplyChainStats>>
  > = {};
  for (const e of enterprises) {
    statsByEnterprise[e.id] = await getSupplyChainStats(e.id);
  }

  return (
    <SupplyChainFinanceClient
      advances={advances.map((a) => ({
        id: a.id,
        enterpriseId: a.enterpriseId,
        partnerId: a.partnerId,
        milestoneId: a.milestoneId,
        advanceAmountEgp: a.advanceAmountEgp,
        constitutionalRate: a.constitutionalRate,
        termDays: a.termDays,
        status: a.status,
        creDecisionToken: a.creDecisionToken,
        fundedAt: a.fundedAt ? a.fundedAt.toISOString() : null,
        repaidAt: a.repaidAt ? a.repaidAt.toISOString() : null,
        createdAt: a.createdAt.toISOString(),
      }))}
      enterprises={enterprises.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        tier: e.tier,
      }))}
      milestones={milestones.map((m) => ({
        id: m.id,
        enterpriseId: m.enterpriseId,
        title: m.title,
        amountEgp: m.amountEgp,
      }))}
      statsByEnterprise={statsByEnterprise}
      canFund={canFund}
      canRepay={canRepay}
    />
  );
}
