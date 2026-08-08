import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { SovereigntyHeader } from "@/components/dashboard/sovereignty2/header";
import {
  SuccessionPage,
  type SuccessionPageProps,
} from "@/components/dashboard/sovereignty2/succession-page";
import type { EnterpriseOption } from "@/components/dashboard/sovereignty2/enterprise-selector";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Succession Planner · AURIENTA" };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/succession");

  const memberRows = await db.enterpriseMember.findMany({
    where: { userId: user.id },
    select: { enterpriseId: true },
  });
  const memberEntIds = memberRows.map((m) => m.enterpriseId);

  const ents = memberEntIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: memberEntIds } },
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          stage: true,
          sector: true,
          healthRating: true,
        },
        orderBy: { name: "asc" },
      })
    : [];

  const enterprises: EnterpriseOption[] = ents.map((e) => ({ ...e, healthRating: e.healthRating }));
  const initialEnterpriseId = enterprises[0]?.id ?? null;

  let keyPeople: SuccessionPageProps["keyPeople"] = [];
  if (initialEnterpriseId) {
    const rows = await db.employee.findMany({
      where: { enterpriseId: initialEnterpriseId, keyPerson: true },
      include: { user: { select: { legalName: true, sovereignTrustScore: true } } },
    });
    keyPeople = rows.map((e) => ({
      position: e.position,
      department: e.department,
      incumbentName: e.user.legalName,
      incumbentSts: e.user.sovereignTrustScore,
    }));
  }

  const props: SuccessionPageProps = {
    enterprises,
    initialEnterpriseId,
    keyPeople,
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SovereigntyHeader
        eyebrow="Sovereignty & Operations AI"
        icon={Users}
        title="AI Succession Planner"
        subtitle="Maintains a live succession plan: identifies internal candidates by skill-match + Sovereign Trust Score, suggests development gaps, and flags when a plan is stale. Succession paths are registered cryptographically (Ed25519) — on verified incapacity of a key person, the CRE transfers voting rights within 1 hour."
      />
      <SuccessionPage {...props} />
    </div>
  );
}
