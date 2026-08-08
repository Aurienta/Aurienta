import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { computeGraduationReadiness } from "@/lib/aurienta/cre";
import { SovereigntyHeader } from "@/components/dashboard/sovereignty2/header";
import {
  GraduationCoachPage,
  type CoachPageProps,
} from "@/components/dashboard/sovereignty2/graduation-coach-page";
import type { EnterpriseOption } from "@/components/dashboard/sovereignty2/enterprise-selector";
import { GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Graduation Coach · AURIENTA" };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/graduation-coach");

  // Stage 2 / Stage 3 / graduated enterprises where the user is a member.
  const memberRows = await db.enterpriseMember.findMany({
    where: { userId: user.id },
    select: { enterpriseId: true },
  });
  const memberEntIds = memberRows.map((m) => m.enterpriseId);

  const ents = memberEntIds.length
    ? await db.enterprise.findMany({
        where: {
          id: { in: memberEntIds },
          stage: { in: ["stage_2", "stage_3", "graduated"] },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          stage: true,
          sector: true,
          healthRating: true,
        },
        orderBy: { graduationReadiness: "desc" },
      })
    : [];

  const enterprises: EnterpriseOption[] = ents.map((e) => ({ ...e, healthRating: e.healthRating }));

  const initialEnterpriseId = enterprises[0]?.id ?? null;

  let initialReadiness: { score: number; gates: { label: string; passed: boolean }[] } | null = null;
  let initialPrevious: { content: string; createdAt: string } | null = null;

  if (initialEnterpriseId) {
    initialReadiness = await computeGraduationReadiness(initialEnterpriseId);
    const prev = await db.aiArtifact.findFirst({
      where: { kind: "graduation_coach", enterpriseId: initialEnterpriseId },
      orderBy: { createdAt: "desc" },
    });
    if (prev) {
      initialPrevious = { content: prev.content, createdAt: prev.createdAt.toISOString() };
    }
  }

  const props: CoachPageProps = {
    enterprises,
    initialEnterpriseId,
    initialReadiness,
    initialPrevious,
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SovereigntyHeader
        eyebrow="Sovereignty & Operations AI"
        icon={GraduationCap}
        title="Graduation Readiness Coach"
        subtitle="A quarterly AI-generated roadmap to close the gap between this enterprise's current readiness score and the 90+ threshold required to call the 75% supermajority graduation vote. The coach advises; the CRE enforces."
      />
      <GraduationCoachPage {...props} />
    </div>
  );
}
