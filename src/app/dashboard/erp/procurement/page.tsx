import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { listPurchaseOrders } from "@/lib/aurienta/erp";
import { ErpProcurementClient } from "@/components/dashboard/erp/erp-procurement-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ERP Procurement · AURIENTA",
  description: "Purchase orders with CRE-enforced authority and goods receipt automation.",
};

export default async function ErpProcurementPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/erp/procurement");

  const memberships = user.memberships ?? [];
  const enterpriseIds = memberships.map((m) => m.enterpriseId);
  const isRep = memberships.some((m) => m.role === "aurienta_rep");
  const canApprove =
    isRep ||
    memberships.some((m) =>
      ["manager", "founding_operator", "board_member", "company_owner"].includes(m.role)
    );

  const enterprises = await db.enterprise.findMany({
    where: isRep ? undefined : { id: { in: enterpriseIds } },
    select: { id: true, name: true, slug: true, tier: true, fundraisingGoalEgp: true },
    orderBy: { name: "asc" },
    take: 100,
  });

  const purchaseOrders = [];
  for (const e of enterprises) {
    const rows = await listPurchaseOrders(e.id);
    purchaseOrders.push(...rows);
  }

  return (
    <ErpProcurementClient
      purchaseOrders={purchaseOrders.map((p) => ({
        id: p.id,
        enterpriseId: p.enterpriseId,
        poNumber: p.poNumber,
        vendorName: p.vendorName,
        status: p.status,
        totalEgp: p.totalEgp,
        currency: p.currency,
        expectedDate: p.expectedDate,
        approvedAt: p.approvedAt,
        projectId: p.projectId,
      }))}
      enterprises={enterprises.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        tier: e.tier,
        fundraisingGoalEgp: e.fundraisingGoalEgp,
      }))}
      canApprove={canApprove}
    />
  );
}
