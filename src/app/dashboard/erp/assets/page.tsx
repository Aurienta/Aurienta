import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { listAssets } from "@/lib/aurienta/erp";
import { ErpAssetsClient } from "@/components/dashboard/erp/erp-assets-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ERP Fixed Assets · AURIENTA",
  description: "Asset register with depreciation and CRE-enforced disposal gates.",
};

export default async function ErpAssetsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/erp/assets");

  const memberships = user.memberships ?? [];
  const enterpriseIds = memberships.map((m) => m.enterpriseId);
  const isRep = memberships.some((m) => m.role === "aurienta_rep");
  const canDispose =
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

  const assets = [];
  for (const e of enterprises) {
    const rows = await listAssets(e.id);
    assets.push(...rows);
  }

  return (
    <ErpAssetsClient
      assets={assets.map((a) => ({
        id: a.id,
        enterpriseId: a.enterpriseId,
        assetCode: a.assetCode,
        name: a.name,
        category: a.category,
        acquisitionDate: a.acquisitionDate,
        acquisitionCostEgp: a.acquisitionCostEgp,
        netBookValueEgp: a.netBookValueEgp,
        accumulatedDepreciationEgp: a.accumulatedDepreciationEgp,
        status: a.status,
        location: a.location,
        assignedTo: a.assignedTo,
      }))}
      enterprises={enterprises.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        tier: e.tier,
      }))}
      canDispose={canDispose}
    />
  );
}
