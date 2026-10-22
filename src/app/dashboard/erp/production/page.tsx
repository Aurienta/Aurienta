import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { listProductionOrders, getBom } from "@/lib/aurienta/erp";
import { ErpProductionClient } from "@/components/dashboard/erp/erp-production-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ERP Manufacturing · AURIENTA",
  description: "Production orders with CRE-enforced release (BOM + materials check).",
};

export default async function ErpProductionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/erp/production");

  const memberships = user.memberships ?? [];
  const enterpriseIds = memberships.map((m) => m.enterpriseId);
  const isRep = memberships.some((m) => m.role === "aurienta_rep");
  const canManage =
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

  const orders = [];
  for (const e of enterprises) {
    const rows = await listProductionOrders(e.id);
    orders.push(...rows);
  }

  // Pre-fetch BOM for each released order.
  const bomByOrder: Record<string, Awaited<ReturnType<typeof getBom>>> = {};
  for (const o of orders) {
    bomByOrder[o.id] = await getBom(o.id);
  }

  return (
    <ErpProductionClient
      orders={orders.map((o) => ({
        id: o.id,
        enterpriseId: o.enterpriseId,
        orderNumber: o.orderNumber,
        productName: o.productName,
        quantity: o.quantity,
        unit: o.unit,
        status: o.status,
        priority: o.priority,
        completedQty: o.completedQty,
        startDate: o.startDate,
        endDate: o.endDate,
      }))}
      enterprises={enterprises.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        tier: e.tier,
      }))}
      bomByOrder={bomByOrder}
      canManage={canManage}
    />
  );
}
