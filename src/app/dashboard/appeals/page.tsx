import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { AppealsClient } from "@/components/dashboard/transparency/appeals-client";
import { Scale } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Appeals & Dispute Resolution · AURIENTA",
  description:
    "Three-stage constitutional appeals — AI ruling, human panel, final binding arbitration — with precedent chaining and 500 EGP filing fee.",
};

export default async function AppealsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/appeals");

  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);

  // Cases the user filed OR cases on enterprises they belong to.
  const cases = await db.appealCase.findMany({
    where: {
      OR: [
        { filedById: user.id },
        ...(enterpriseIds.length > 0 ? [{ enterpriseId: { in: enterpriseIds } }] : []),
      ],
    },
    include: {
      enterprise: { select: { id: true, name: true, tier: true, slug: true } },
      filedBy: {
        select: { id: true, legalName: true, avatarColor: true, sovereignTrustScore: true },
      },
    },
    orderBy: { filedAt: "desc" },
    take: 60,
  });

  const enterprises = await db.enterprise.findMany({
    where: { id: { in: enterpriseIds } },
    select: { id: true, name: true, slug: true, tier: true },
  });

  const stats = {
    total: cases.length,
    filed: cases.filter((c) => c.status === "filed").length,
    humanPanel: cases.filter((c) => c.status === "human_panel").length,
    resolved: cases.filter((c) => c.status === "resolved" || c.status === "final_ruling").length,
    feesCollected: cases.reduce((s, c) => s + c.feeEgp, 0),
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Appeals & Dispute Resolution"
        icon={Scale}
        title="When the CRE rules, you still have a voice"
        subtitle="Every CRE decision is reviewable. File a 500 EGP appeal, get an AI ruling grounded in the constitutional precedent library, escalate to a human panel of partners, and if needed request final binding arbitration. Every ruling chains to prior rulings — building the constitutional common law."
      />

      <AppealsClient
        userId={user.id}
        userLegalName={user.legalName}
        enterprises={enterprises}
        cases={cases.map((c) => ({
          id: c.id,
          filedById: c.filedById,
          filedByName: c.filedBy.legalName,
          filedByAvatar: c.filedBy.avatarColor,
          filedBySts: c.filedBy.sovereignTrustScore,
          enterpriseId: c.enterpriseId,
          enterpriseName: c.enterprise?.name ?? null,
          enterpriseTier: c.enterprise?.tier ?? null,
          caseType: c.caseType,
          description: c.description,
          feeEgp: c.feeEgp,
          stage: c.stage,
          status: c.status,
          aiRuling: c.aiRuling,
          humanRuling: c.humanRuling,
          finalRuling: c.finalRuling,
          precedentNote: c.precedentNote,
          filedAt: c.filedAt.toISOString(),
          resolvedAt: c.resolvedAt?.toISOString() ?? null,
        }))}
        stats={stats}
      />
    </div>
  );
}
