import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { listInventory, getInventoryStatus } from "@/lib/aurienta/erp";
import { ErpInventoryClient } from "@/components/dashboard/erp/erp-inventory-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ERP Inventory · AURIENTA",
  description: "Warehouse stock management with low-stock alerts, valuation, and CRE-enforced stock-out.",
};

export default async function ErpInventoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/erp/inventory");

  const memberships = user.memberships ?? [];
  const enterpriseIds = memberships.map((m) => m.enterpriseId);
  const isRep = memberships.some((m) => m.role === "aurienta_rep");

  const enterprises = await db.enterprise.findMany({
    where: isRep ? undefined : { id: { in: enterpriseIds } },
    select: { id: true, name: true, slug: true, tier: true },
    orderBy: { name: "asc" },
    take: 100,
  });

  // Fetch inventory + status for all visible enterprises.
  const items = [];
  for (const e of enterprises) {
    const rows = await listInventory(e.id);
    items.push(...rows);
  }

  const statusByEnterprise: Record<string, Awaited<ReturnType<typeof getInventoryStatus>>> = {};
  for (const e of enterprises) {
    statusByEnterprise[e.id] = await getInventoryStatus(e.id);
  }

  return (
    <ErpInventoryClient
      items={items.map((i) => ({
        id: i.id,
        enterpriseId: i.enterpriseId,
        sku: i.sku,
        name: i.name,
        category: i.category,
        unit: i.unit,
        quantityOnHand: i.quantityOnHand,
        quantityReserved: i.quantityReserved,
        quantityAvailable: i.quantityAvailable,
        reorderPoint: i.reorderPoint,
        costPerUnitEgp: i.costPerUnitEgp,
        sellPriceEgp: i.sellPriceEgp,
        warehouseLocation: i.warehouseLocation,
      }))}
      enterprises={enterprises.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        tier: e.tier,
      }))}
      statusByEnterprise={statusByEnterprise}
    />
  );
}
