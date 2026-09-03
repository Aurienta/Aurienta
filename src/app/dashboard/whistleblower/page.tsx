import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { WhistleblowerClient } from "@/components/dashboard/transparency/whistleblower-client";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Whistleblower Channel · AURIENTA",
  description:
    "Encrypted, tracking-coded, AI-triaged whistleblower reports with cryptographic bonds and bounty payouts.",
};

export default async function WhistleblowerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/whistleblower");

  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);

  // Reports visible to the user, scoped to the user's enterprises.
  // P0-3 tenant filter: WhistleblowerReport has no filedById column, so we
  // scope by enterpriseId to the enterprises the user belongs to. When the
  // user has no enterprise memberships, return an impossible filter (no rows)
  // rather than an empty `where: {}` which would leak ALL platform reports.
  const reportScope =
    enterpriseIds.length > 0
      ? { enterpriseId: { in: enterpriseIds } }
      : { id: "__none__" };

  const [myReports, visibleReports] = await Promise.all([
    db.whistleblowerReport.findMany({
      where: reportScope,
      include: { enterprise: { select: { id: true, name: true, slug: true, tier: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.whistleblowerReport.findMany({
      where: reportScope,
      include: { enterprise: { select: { id: true, name: true, slug: true, tier: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  // Merge + dedupe.
  const seen = new Set<string>();
  const merged = [...visibleReports, ...myReports].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  const enterprises = await db.enterprise.findMany({
    where: { id: { in: enterpriseIds } },
    select: { id: true, name: true, slug: true, tier: true },
  });

  const stats = {
    total: merged.length,
    validated: merged.filter((r) => r.status === "validated").length,
    investigating: merged.filter((r) => r.status === "investigating").length,
    bountyPaid: merged.reduce((s, r) => s + r.bountyPaidEgp, 0),
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Whistleblower Channel"
        icon={ShieldAlert}
        title="Truth is bondable"
        subtitle="Every partner can file an encrypted, tracking-coded report. The Constitutional AI triages credibility, the CRE locks a 5,000 EGP cryptographic bond, and validated findings trigger automatic bounties paid from the platform's 1% integrity fund."
      />

      <WhistleblowerClient
        userId={user.id}
        enterprises={enterprises}
        reports={merged.map((r) => ({
          id: r.id,
          trackingCode: r.trackingCode,
          enterpriseId: r.enterpriseId,
          enterpriseName: r.enterprise?.name ?? null,
          enterpriseTier: r.enterprise?.tier ?? null,
          category: r.category,
          description: r.description,
          attachmentsCid: r.attachmentsCid,
          credibilityScore: r.credibilityScore,
          aiSummary: r.aiSummary,
          status: r.status,
          bondEgp: r.bondEgp,
          bountyPaidEgp: r.bountyPaidEgp,
          createdAt: r.createdAt.toISOString(),
          resolvedAt: r.resolvedAt?.toISOString() ?? null,
        }))}
        stats={stats}
      />
    </div>
  );
}
