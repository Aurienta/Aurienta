import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { DriftPanel, type EnterpriseLite } from "@/components/dashboard/intel/drift-panel";
import { Activity, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Drift Detector · AURIENTA",
  description:
    "Continuous constitutional drift analysis — actual behavior vs. the enterprise charter.",
};

export default async function DriftPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/drift");

  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);

  if (enterpriseIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5">
          <Activity className="h-7 w-7 text-gold" />
        </div>
        <h1 className="font-serif text-2xl font-semibold">No enterprises to analyze</h1>
        <p className="mt-2 max-w-md font-sans text-sm text-muted-foreground">
          Join or found an enterprise to enable constitutional drift analysis.
          The detector compares actual expense patterns, governance cadence, and
          reporting timeliness against the constitutional charter.
        </p>
      </div>
    );
  }

  const enterprises: EnterpriseLite[] = await db.enterprise.findMany({
    where: { id: { in: enterpriseIds } },
    select: {
      id: true,
      name: true,
      tier: true,
      sector: true,
      healthRating: true,
    },
    orderBy: { name: "asc" },
  });

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
        eyebrow="Constitutional Drift Detector"
        icon={Activity}
        title="Is this enterprise still operating as constituted?"
        subtitle="The Drift AI continuously compares actual behavior — expense patterns, governance cadence, reporting timeliness, NOSI compliance, police clearance — against the constitutional charter and tier-specific rules. Findings are severity-rated and persisted as ledger-immutable AiArtifacts."
      />

      {enterprises.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gold/15 bg-foreground/[0.01] py-16 text-center">
          <Inbox className="h-8 w-8 text-gold/60" />
          <p className="font-serif text-base font-semibold">No enterprises found</p>
          <p className="max-w-sm font-sans text-[12px] text-muted-foreground">
            Your memberships reference enterprises that no longer exist.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {enterprises.map((e) => (
            <DriftPanel key={e.id} enterprise={e} />
          ))}
        </div>
      )}

      <p className="text-center font-mono text-[11px] leading-relaxed text-muted-foreground/80">
        Drift scores are computed deterministically from the immutable ledger.
        The AI supplies qualitative findings; the CRE enforces the underlying
        rules regardless of any AI output.
      </p>
    </div>
  );
}
