import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { ErpIntegrationClient } from "@/components/dashboard/erp/erp-integration-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "ERP Integration · AURIENTA" };

export default async function ErpIntegrationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/erp/integration");

  const memberships = user.memberships || [];
  const enterpriseId = memberships[0]?.enterpriseId;

  let integration = null;
  let allIntegrations: any[] = [];

  if (enterpriseId) {
    integration = await db.erpIntegration.findFirst({
      where: { enterpriseId, isPrimary: true },
      orderBy: { createdAt: "desc" },
    });
    allIntegrations = await db.erpIntegration.findMany({
      where: { enterpriseId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });
  }

  return (
    <ErpIntegrationClient
      user={{
        legalName: user.legalName,
        enterpriseId: enterpriseId || null,
        role: memberships[0]?.role || null,
      }}
      currentIntegration={integration ? {
        id: integration.id,
        provider: integration.provider,
        name: integration.name,
        status: integration.status,
        isPrimary: integration.isPrimary,
        syncDirection: integration.syncDirection,
        syncInterval: integration.syncInterval,
        lastSyncAt: integration.lastSyncAt?.toISOString() ?? null,
        lastSyncStatus: integration.lastSyncStatus,
        creEnforcementEnabled: integration.creEnforcementEnabled,
        modules: JSON.parse(integration.modulesJson),
      } : null}
      allIntegrations={allIntegrations.map((i: any) => ({
        id: i.id,
        provider: i.provider,
        name: i.name,
        status: i.status,
        isPrimary: i.isPrimary,
        lastSyncAt: i.lastSyncAt?.toISOString() ?? null,
        recordsSynced: i.recordsSynced,
      }))}
    />
  );
}
