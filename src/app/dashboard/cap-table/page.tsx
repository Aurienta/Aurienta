import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import {
  getCapTable,
  listCapTableEnterprisesForUser,
  CAP_TABLE_VIEWER_ROLES,
} from "@/lib/aurienta/cap-table";
import { AccessRestricted } from "@/components/dashboard/access-restricted";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { CapTableClient } from "@/components/dashboard/cap-table/cap-table-client";
import { PieChart } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Constitutional Cap Table · AURIENTA",
  description:
    "Hash-anchored cap table with dilution modeling, anti-dilution protection, vesting cliffs, drag-along rights, and liquidation waterfall analysis. OCF v1.0.0 export.",
};

/**
 * Constitutional Cap Table dashboard page.
 *
 * Server component — performs:
 *   1. Auth check (redirect → /signin if not authenticated).
 *   2. Role gate — only capital_partner / founding_operator / board_member /
 *      company_owner / aurienta_rep may view. Otherwise renders AccessRestricted.
 *   3. Lists the user's cap-table-viewer enterprises (server-side query).
 *   4. Pre-fetches the initial cap table snapshot for the first enterprise
 *      (or the one specified via ?enterpriseId=xxx) so the page renders with
 *      data on first paint — no client-side loading flash.
 *   5. Delegates interactivity (dilution + waterfall sliders, OCF export
 *      download) to the client component.
 */
export default async function CapTablePage({
  searchParams,
}: {
  searchParams: Promise<{ enterpriseId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/cap-table");

  // ── Role gate ──
  // AURIENTA Reps (platform admins) bypass the per-enterprise role check.
  const isPlatformAdmin =
    user.primaryIntent === "aurienta_rep" ||
    (user.memberships ?? []).some((m: { role: string }) => m.role === "aurienta_rep");

  const enterprises = isPlatformAdmin
    ? await db.enterprise.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          stage: true,
        },
        orderBy: { name: "asc" },
        take: 200,
      }).then((rows) => rows.map((e) => ({ ...e, role: "aurienta_rep" as const })))
    : await listCapTableEnterprisesForUser(user.id);

  if (!isPlatformAdmin && enterprises.length === 0) {
    return <AccessRestricted requiredRole="Capital Partner / Founding Operator / Board Member / Company Owner" />;
  }

  // ── Pick the active enterprise (?enterpriseId=xxx → first membership) ──
  const params = await searchParams;
  const requestedId = params.enterpriseId;
  const activeEnterprise =
    (requestedId && enterprises.find((e) => e.id === requestedId)) || enterprises[0];
  if (!activeEnterprise) {
    return <AccessRestricted requiredRole="Capital Partner / Founding Operator / Board Member / Company Owner" />;
  }

  // ── Pre-fetch the cap table snapshot for SSR ──
  let initialCapTable;
  try {
    initialCapTable = await getCapTable(activeEnterprise.id);
  } catch (err) {
    console.error("[cap-table page] getCapTable failed:", err);
    initialCapTable = null;
  }

  // Verify the calling user is actually permitted to view THIS enterprise's cap table
  // (belt-and-suspenders: the API route enforces this too via canViewCapTable).
  if (!isPlatformAdmin) {
    const membership = (user.memberships ?? []).find(
      (m: { enterpriseId: string; role: string }) =>
        m.enterpriseId === activeEnterprise.id &&
        (CAP_TABLE_VIEWER_ROLES as readonly string[]).includes(m.role)
    );
    if (!membership) {
      return <AccessRestricted requiredRole="Capital Partner / Founding Operator / Board Member / Company Owner" />;
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Constitutional Cap Table"
        icon={PieChart}
        title="Ownership, hash-anchored"
        subtitle="Every stake, vesting milestone, and liquidation preference is CRE-signed and anchored to the immutable ledger. Model dilution rounds, run waterfalls, and export to Open Cap Table Format."
      />

      <CapTableClient
        enterprises={enterprises.map((e) => ({
          id: e.id,
          name: e.name,
          slug: e.slug,
          tier: e.tier,
          stage: e.stage,
          role: e.role,
        }))}
        initialEnterpriseId={activeEnterprise.id}
        initialCapTable={initialCapTable}
        isPlatformAdmin={isPlatformAdmin}
      />
    </div>
  );
}
