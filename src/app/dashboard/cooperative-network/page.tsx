import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import {
  listTransactions,
  getNetworkStats,
  type TransactionWithEnterprises,
} from "@/lib/aurienta/cooperative-network";
import { CooperativeNetworkClient } from "@/components/dashboard/enterprise/cooperative-network-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Cooperative Network · AURIENTA",
  description:
    "REC-4 — Constitutional B2B exchange between Aurienta enterprises. CRE-validated transactions, irrevocable ledger anchoring, 10% capital cap per trade.",
};

export default async function CooperativeNetworkPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/cooperative-network");

  // Enterprises the user is a member of — used as the buyer/seller selectors.
  const memberEntIds = user.memberships.map((m) => m.enterpriseId);
  const enterprises = memberEntIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: memberEntIds } },
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          sector: true,
          status: true,
        },
        orderBy: { name: "asc" },
      })
    : [];

  // Default to the first member enterprise for the initial stats view.
  const primaryEnterpriseId = enterprises[0]?.id ?? "";

  let transactions: TransactionWithEnterprises[] = [];
  let stats = { totalPartners: 0, totalVolume: 0, activeTransactions: 0 };
  if (primaryEnterpriseId) {
    [transactions, stats] = await Promise.all([
      listTransactions(primaryEnterpriseId),
      getNetworkStats(primaryEnterpriseId),
    ]);
  }

  return (
    <CooperativeNetworkClient
      enterprises={enterprises}
      initialTransactions={transactions}
      initialStats={stats}
      initialEnterpriseId={primaryEnterpriseId}
    />
  );
}
