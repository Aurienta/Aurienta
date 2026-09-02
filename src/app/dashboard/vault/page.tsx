import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { VaultClient } from "@/components/dashboard/transparency/vault-client";
import { PageTransition } from "@/components/dashboard/page-transition";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Insurance Vault · AURIENTA",
  description:
    "0.5% constitutional levy, 20% cap, 24-month non-recourse loans — the collective reserve that converts exogenous shocks into survivable events.",
};

export default async function VaultPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/vault");

  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);

  const [enterprises, loans] = await Promise.all([
    db.enterprise.findMany({
      where: { id: { in: enterpriseIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        tier: true,
        raisedEgp: true,
      },
    }),
    enterpriseIds.length === 0
      ? Promise.resolve([])
      : db.vaultLoan.findMany({
          where: { enterpriseId: { in: enterpriseIds } },
          include: {
            enterprise: {
              select: { id: true, name: true, tier: true, slug: true },
            },
          },
          orderBy: { requestedAt: "desc" },
          take: 50,
        }),
  ]);

  return (
    <PageTransition className="flex min-h-screen flex-col">
      <main className="flex-1">
        <VaultClient
          enterprises={enterprises.map((e) => ({
            id: e.id,
            name: e.name,
            slug: e.slug,
            tier: e.tier,
            raisedEgp: e.raisedEgp,
          }))}
          initialLoans={loans.map((l) => ({
            id: l.id,
            enterpriseId: l.enterpriseId,
            enterpriseName: l.enterprise?.name ?? null,
            enterpriseTier: l.enterprise?.tier ?? null,
            amountEgp: l.amountEgp,
            reason: l.reason,
            boardVotePct: l.boardVotePct,
            status: l.status,
            repaidEgp: l.repaidEgp,
            requestedAt: l.requestedAt.toISOString(),
            approvedAt: l.approvedAt?.toISOString() ?? null,
            repaymentDueAt: l.repaymentDueAt?.toISOString() ?? null,
          }))}
        />
      </main>
      <footer className="mt-auto border-t border-gold/10 py-6 text-center text-xs text-muted-foreground">
        AURIENTA Anti-Fragility Insurance Vault · Blueprint §5.4 · 0.5% levy ·
        20% cap · 24-month non-recourse.
      </footer>
    </PageTransition>
  );
}
