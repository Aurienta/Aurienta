import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { listQualityChecks, getQualityStats } from "@/lib/aurienta/erp";
import { ErpQualityClient } from "@/components/dashboard/erp/erp-quality-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ERP Quality Control · AURIENTA",
  description: "Quality checks with CRE-enforced pass-rate gate and per-type stats.",
};

export default async function ErpQualityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/erp/quality");

  const memberships = user.memberships ?? [];
  const enterpriseIds = memberships.map((m) => m.enterpriseId);
  const isRep = memberships.some((m) => m.role === "aurienta_rep");
  const canRecord =
    isRep ||
    memberships.some((m) =>
      ["manager", "founding_operator", "board_member", "company_owner"].includes(m.role)
    );

  const enterprises = await db.enterprise.findMany({
    where: isRep ? undefined : { id: { in: enterpriseIds } },
    select: { id: true, name: true, slug: true, tier: true },
    orderBy: { name: "asc" },
    take: 100,
  });

  const checks = [];
  for (const e of enterprises) {
    const rows = await listQualityChecks(e.id);
    checks.push(...rows);
  }

  const statsByEnterprise: Record<string, Awaited<ReturnType<typeof getQualityStats>>> = {};
  for (const e of enterprises) {
    statsByEnterprise[e.id] = await getQualityStats(e.id);
  }

  return (
    <ErpQualityClient
      checks={checks.map((c) => ({
        id: c.id,
        enterpriseId: c.enterpriseId,
        productionOrderId: c.productionOrderId,
        projectId: c.projectId,
        inventoryId: c.inventoryId,
        checkType: c.checkType,
        description: c.description,
        inspectorId: c.inspectorId,
        status: c.status,
        defectsFound: c.defectsFound,
        passRate: c.passRate,
        notes: c.notes,
        checkedAt: c.checkedAt,
        createdAt: c.createdAt,
      }))}
      enterprises={enterprises.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        tier: e.tier,
      }))}
      statsByEnterprise={statsByEnterprise}
      canRecord={canRecord}
    />
  );
}
