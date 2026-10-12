import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { listTopGenomes } from "@/lib/aurienta/enterprise-genome";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { GenomeClient } from "@/components/dashboard/roadmap/genome-client";
import { Dna } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Predictive Enterprise Genome · AURIENTA",
  description:
    "ML-powered graduation prediction based on constitutional compliance data. Predictions are NOT guarantees.",
};

export default async function GenomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/genome");

  // Fetch top 12 genomes (hydrated with enterprise names + tier/stage/health).
  const genomes = await listTopGenomes(12);

  // Pre-serialize for the client component.
  const serialized = genomes.map((g) => ({
    id: g.id,
    enterpriseId: g.enterpriseId,
    enterpriseName: g.enterpriseName,
    enterpriseSlug: g.enterpriseSlug,
    tier: g.tier,
    stage: g.stage,
    healthRating: g.healthRating,
    graduationProbability: g.graduationProbability,
    riskScore: g.riskScore,
    modelVersion: g.modelVersion,
    trainedOnCount: g.trainedOnCount,
    predictedAt: g.predictedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Predictive Enterprise Genome"
        icon={Dna}
        title="The constitutional DNA of every enterprise"
        subtitle="ML-powered graduation prediction based on constitutional compliance data. Each enterprise is scored across 50+ attributes — health, fundraising, governance, transparency, runway — producing a statistical graduation probability and risk score."
      />

      <GenomeClient genomes={serialized} />
    </div>
  );
}
