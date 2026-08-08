import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import {
  PrecedentPanel,
  type PrecedentProposal,
} from "@/components/dashboard/intel/precedent-panel";
import { Scale } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Precedents · AURIENTA",
  description:
    "Semantic search across every past constitutional decision, vote, dispute, and appeal.",
};

export default async function PrecedentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/precedents");

  // Query every past proposal (executed, rejected, expired). Fall back to
  // including voting_open proposals so the seeded demo library is non-empty.
  const past = await db.proposal.findMany({
    where: {
      status: { in: ["executed", "rejected", "expired"] },
    },
    include: {
      enterprise: { select: { id: true, name: true, tier: true, sector: true } },
      votes: { select: { choice: true, votingPower: true, reason: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  let rows = past;
  if (rows.length === 0) {
    // Demo fallback — include all proposals so the library is non-empty.
    rows = await db.proposal.findMany({
      include: {
        enterprise: { select: { id: true, name: true, tier: true, sector: true } },
        votes: { select: { choice: true, votingPower: true, reason: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  const proposalsForUi: PrecedentProposal[] = rows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    type: p.type,
    status: p.status,
    enterpriseId: p.enterpriseId,
    enterpriseName: p.enterprise.name,
    enterpriseTier: p.enterprise.tier,
    enterpriseSector: p.enterprise.sector,
    votesFor: p.votesFor,
    votesAgainst: p.votesAgainst,
    votesAbstain: p.votesAbstain,
    totalVotingPower: p.totalVotingPower,
    aiRiskScore: p.aiRiskScore,
    aiRecommendation: p.aiRecommendation,
    createdAt: p.createdAt.toISOString(),
    executedAt: p.executedAt ? p.executedAt.toISOString() : null,
  }));

  // Enterprises (for the compare dropdown)
  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);
  const enterprises = enterpriseIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: enterpriseIds } },
        select: { id: true, name: true, tier: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SonnerToaster
        position="top-center"
        toastOptions={{
          style: {
            border: "1px solid rgba(212,175,55,0.25)",
            background: "rgba(16,16,18,0.95)",
            color: "#f3eedd",
          },
        }}
      />

      <PageHeader
        eyebrow="Constitutional Precedent Engine"
        icon={Scale}
        title="Every past decision, searchable."
        subtitle="Semantic search across every past proposal, vote, dispute, and appeal on the AURIENTA ledger. When a new proposal is drafted, the engine surfaces the 3 most similar past decisions — with similarity scores, outcomes, and the key constitutional factor that drove each result."
      />

      <PrecedentPanel proposals={proposalsForUi} enterprises={enterprises} />

      <p className="text-center font-mono text-[11px] leading-relaxed text-muted-foreground/80">
        The precedent library is drawn from the immutable ledger. Every search
        is persisted as an AiArtifact — court-admissible, hash-stamped,
        replayable.
      </p>
    </div>
  );
}
