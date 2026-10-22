import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { getErpDashboardStats } from "@/lib/aurienta/erp";
import { ErpDashboardClient } from "@/components/dashboard/erp/erp-dashboard-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ERP Hub · AURIENTA",
  description:
    "Constitutional ERP engine — projects, inventory, procurement, assets, manufacturing, and quality control. Every action CRE-enforced.",
};

export default async function ErpHubPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/erp");

  const memberships = user.memberships ?? [];
  const enterpriseIds = memberships.map((m) => m.enterpriseId);
  const isRep = memberships.some((m) => m.role === "aurienta_rep");

  const enterprises = await db.enterprise.findMany({
    where: isRep ? undefined : { id: { in: enterpriseIds } },
    select: { id: true, name: true, slug: true, tier: true, fundraisingGoalEgp: true },
    orderBy: { name: "asc" },
    take: 100,
  });

  // Per-enterprise ERP dashboard stats.
  const statsByEnterprise: Record<
    string,
    Awaited<ReturnType<typeof getErpDashboardStats>>
  > = {};
  for (const e of enterprises) {
    statsByEnterprise[e.id] = await getErpDashboardStats(e.id);
  }

  return (
    <ErpDashboardClient
      enterprises={enterprises.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        tier: e.tier,
        fundraisingGoalEgp: e.fundraisingGoalEgp,
      }))}
      statsByEnterprise={statsByEnterprise}
      isRep={isRep}
    />
  );
}
