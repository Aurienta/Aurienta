import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { SolvencyClient } from "@/components/dashboard/transparency/solvency-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Proof-of-Solvency · AURIENTA",
  description:
    "Law Firm Client Account reconciliation with a 3-level health flag. Variance >10% triggers an emergency CRE freeze.",
};

export default async function SolvencyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/solvency");

  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);

  const [enterprises, assertions] = await Promise.all([
    db.enterprise.findMany({
      where: { id: { in: enterpriseIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        tier: true,
        status: true,
        lawFirmClientAccountBalanceEgp: true,
      },
    }),
    enterpriseIds.length === 0
      ? Promise.resolve([])
      : db.solvencyAssertion.findMany({
          where: { enterpriseId: { in: enterpriseIds } },
          include: {
            enterprise: {
              select: { id: true, name: true, tier: true, slug: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 60,
        }),
  ]);

  // Map each membership to { enterpriseId, role } so the client can decide
  // whether the "Submit Balance Assertion" form should be visible.
  const memberships = user.memberships.map((m) => ({
    enterpriseId: m.enterpriseId,
    role: m.role,
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <SolvencyClient
          enterprises={enterprises.map((e) => ({
            id: e.id,
            name: e.name,
            slug: e.slug,
            tier: e.tier,
            status: e.status,
            internalBalanceEgp: e.lawFirmClientAccountBalanceEgp,
          }))}
          memberships={memberships}
          initialAssertions={assertions.map((a) => ({
            id: a.id,
            enterpriseId: a.enterpriseId,
            enterpriseName: a.enterprise?.name ?? null,
            enterpriseTier: a.enterprise?.tier ?? null,
            lawFirmBalanceEgp: a.lawFirmBalanceEgp,
            internalBalanceEgp: a.internalBalanceEgp,
            varianceEgp: a.varianceEgp,
            variancePct: a.variancePct,
            healthLevel: a.healthLevel,
            assertionHash: a.assertionHash,
            createdAt: a.createdAt.toISOString(),
          }))}
        />
      </main>
      <footer className="mt-auto border-t border-gold/10 py-6 text-center text-xs text-muted-foreground">
        AURIENTA Proof-of-Solvency · Blueprint §5.5 · 3-level health flag
        system · SHA-256 anchored assertions.
      </footer>
    </div>
  );
}
