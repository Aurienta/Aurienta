import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { SovereigntyHeader } from "@/components/dashboard/sovereignty2/header";
import {
  SurvivalDrillPage,
  type SurvivalDrillPageProps,
} from "@/components/dashboard/sovereignty2/survival-drill-page";
import type { EnterpriseOption } from "@/components/dashboard/sovereignty2/enterprise-selector";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sovereign Survival Drill · AURIENTA" };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/survival-drill");

  const memberRows = await db.enterpriseMember.findMany({
    where: { userId: user.id },
    select: { enterpriseId: true },
  });
  const memberEntIds = memberRows.map((m) => m.enterpriseId);

  // Survival drills apply to graduated enterprises only.
  const ents = memberEntIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: memberEntIds }, stage: "graduated" },
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

  let pastDrills: SurvivalDrillPageProps["pastDrills"] = [];
  let activeCertificate: SurvivalDrillPageProps["activeCertificate"] = null;

  if (initialEnterpriseId) {
    const rows = await db.survivalDrill.findMany({
      where: { enterpriseId: initialEnterpriseId },
      orderBy: { drillDate: "desc" },
      take: 12,
    });
    pastDrills = rows.map((r) => ({
      id: r.id,
      result: r.result,
      drillDate: r.drillDate.toISOString(),
      certificateExpiry: r.certificateExpiry?.toISOString() ?? null,
      findings: r.findings,
    }));

    const valid = rows.find(
      (r) => r.result === "passed" && r.certificateExpiry && r.certificateExpiry > new Date()
    );
    if (valid) {
      activeCertificate = {
        expiry: valid.certificateExpiry!.toISOString(),
        drillDate: valid.drillDate.toISOString(),
      };
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SovereigntyHeader
        eyebrow="Sovereignty & Operations AI"
        icon={ShieldCheck}
        title="Sovereign Survival Drill"
        subtitle="A quarterly automated drill testing graduated enterprises' self-hosted CRE against the Oracle Mirror protocol. Simulates a 7-day platform outage: can the enterprise survive on its own — paper-ballot governance, offline ledger reconciliation, emergency board protocol, treasury continuity?"
      />
      <SurvivalDrillPage
        enterprises={enterprises}
        initialEnterpriseId={initialEnterpriseId}
        pastDrills={pastDrills}
        activeCertificate={activeCertificate}
      />
    </div>
  );
}
