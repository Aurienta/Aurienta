import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { SovereigntyHeader } from "@/components/dashboard/sovereignty2/header";
import { GraduationSimulatorPage } from "@/components/dashboard/sovereignty2/graduation-simulator-page";
import type { EnterpriseOption } from "@/components/dashboard/sovereignty2/enterprise-selector";
import { FlaskConical } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Graduation Simulator · AURIENTA" };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/graduation-simulator");

  const memberRows = await db.enterpriseMember.findMany({
    where: { userId: user.id },
    select: { enterpriseId: true },
  });
  const memberEntIds = memberRows.map((m) => m.enterpriseId);

  // Simulator applies to any active enterprise approaching graduation.
  const ents = memberEntIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: memberEntIds }, stage: { in: ["stage_2", "stage_3", "graduated"] } },
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

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SovereigntyHeader
        eyebrow="Sovereignty & Operations AI"
        icon={FlaskConical}
        title="Graduation Simulator"
        subtitle="Before calling the 75% graduation vote, model what changes post-graduation: platform fees → 0, CRE enforcement → off, AURIENTA board seat resigned, law firm client account released, ledger exported. Includes a 12-month operational independence forecast with three stress scenarios."
      />
      <GraduationSimulatorPage
        enterprises={enterprises}
        initialEnterpriseId={initialEnterpriseId}
      />
    </div>
  );
}
