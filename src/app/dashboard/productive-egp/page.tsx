import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import {
  getLatestSnapshot,
  getHistory,
  type SnapshotWithEnterprise,
} from "@/lib/aurienta/productive-egp";
import { ProductiveEgpClient } from "@/components/dashboard/capital/productive-egp-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Productive EGP · AURIENTA",
  description:
    "REC-2 — Dual-currency valuation of Aurienta Equity Units. Real return = enterprise growth − inflation. Don't save EGP. Own EGP.",
};

export default async function ProductiveEgpPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/productive-egp");

  // Enterprises the user is a member of, OR all active enterprises if the
  // user has no memberships (capital partners browsing the registry).
  const memberEntIds = user.memberships.map((m) => m.enterpriseId);
  const where = memberEntIds.length
    ? { id: { in: memberEntIds } }
    : { status: "active" };
  const enterprises = await db.enterprise.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      tier: true,
      sector: true,
      status: true,
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  const primaryEnterpriseId = enterprises[0]?.id ?? "";

  let latestSnapshot: SnapshotWithEnterprise | null = null;
  let history: SnapshotWithEnterprise[] = [];
  if (primaryEnterpriseId) {
    [latestSnapshot, history] = await Promise.all([
      getLatestSnapshot(primaryEnterpriseId),
      getHistory(primaryEnterpriseId, 30),
    ]);
  }

  return (
    <ProductiveEgpClient
      enterprises={enterprises}
      initialSnapshot={latestSnapshot}
      initialHistory={history}
      initialEnterpriseId={primaryEnterpriseId}
    />
  );
}
