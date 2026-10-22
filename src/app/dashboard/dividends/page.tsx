import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  listDividendsForUserEnterprises,
  getDividendStats,
} from "@/lib/aurienta/dividend-distribution";
import { db } from "@/lib/db";
import { DividendsClient } from "@/components/dashboard/roadmap/dividends-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dividends · AURIENTA",
  description:
    "Constitutional dividend distribution from realized enterprise profit. Zero Custody disbursement by the law firm.",
};

// Server component — fetches dividend distributions + enterprises + per-enterprise
// dividend stats visible to the caller, then passes them to the client
// component for rendering.
export default async function DividendsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/dividends");

  const memberships = user.memberships ?? [];
  const enterpriseIds = memberships.map((m) => m.enterpriseId);
  const isRep = memberships.some((m) => m.role === "aurienta_rep");
  const canDeclare =
    isRep ||
    memberships.some((m) =>
      [
        "founding_operator",
        "manager",
        "board_member",
        "company_owner",
      ].includes(m.role)
    );
  const canPay =
    isRep || memberships.some((m) => m.role === "law_firm_rep");

  // Enterprises the user can declare dividends for (operator seats), or
  // all enterprises for AURIENTA Reps.
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

  const distributions = await listDividendsForUserEnterprises(
    isRep ? enterprises.map((e) => e.id) : enterpriseIds,
    100
  );

  const statsByEnterprise: Record<
    string,
    Awaited<ReturnType<typeof getDividendStats>>
  > = {};
  for (const e of enterprises) {
    statsByEnterprise[e.id] = await getDividendStats(e.id);
  }

  return (
    <DividendsClient
      distributions={distributions.map((d) => ({
        id: d.id,
        enterpriseId: d.enterpriseId,
        totalDividendEgp: d.totalDividendEgp,
        perShareDividendEgp: d.perShareDividendEgp,
        partnerCount: d.partnerCount,
        status: d.status,
        creDecisionToken: d.creDecisionToken,
        declaredAt: d.declaredAt.toISOString(),
        paidAt: d.paidAt ? d.paidAt.toISOString() : null,
        recordDate: d.recordDate.toISOString(),
      }))}
      enterprises={enterprises.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        tier: e.tier,
      }))}
      statsByEnterprise={statsByEnterprise}
      canDeclare={canDeclare}
      canPay={canPay}
    />
  );
}
