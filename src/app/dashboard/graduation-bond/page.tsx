import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { getBond } from "@/lib/aurienta/graduation-bond";
import { GraduationBondClient } from "@/components/dashboard/graduation/graduation-bond-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Graduation Bond · AURIENTA",
  description:
    "REC-6 — Cryptographic Graduation Bond. SHA-256 hash of full constitutional history. Irrevocable. Publicly verifiable.",
};

export default async function GraduationBondPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/graduation-bond");

  // Enterprises the user is a member of — we look for one with a bond,
  // or one eligible to issue a bond (graduated status, health >= 90).
  const memberEntIds = user.memberships.map((m) => m.enterpriseId);
  const enterprises = memberEntIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: memberEntIds } },
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          sector: true,
          status: true,
          stage: true,
          healthScore: true,
          raisedEgp: true,
          fundraisingGoalEgp: true,
          monthlyRevenueEgp: true,
          monthlyBurnEgp: true,
          employeeCount: true,
          nosiCompliantPct: true,
          policeClearanceValid: true,
          transparencyScore: true,
          stageSince: true,
        },
        orderBy: { name: "asc" },
      })
    : [];

  // Pick the first enterprise that already has a bond, else the first
  // enterprise overall (to show the eligibility/issue UI).
  const enterprisesWithBondCheck = await Promise.all(
    enterprises.map(async (e) => ({
      ...e,
      bond: await getBond(e.id),
    }))
  );

  const initialBond = enterprisesWithBondCheck.find((e) => e.bond)?.bond ?? null;
  const initialEnterpriseId =
    enterprisesWithBondCheck.find((e) => e.bond)?.id ??
    enterprisesWithBondCheck[0]?.id ??
    "";

  return (
    <GraduationBondClient
      enterprises={enterprisesWithBondCheck.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        tier: e.tier,
        sector: e.sector,
        status: e.status,
        stage: e.stage,
        healthScore: e.healthScore,
        raisedEgp: e.raisedEgp,
        fundraisingGoalEgp: e.fundraisingGoalEgp,
        monthlyRevenueEgp: e.monthlyRevenueEgp,
        monthlyBurnEgp: e.monthlyBurnEgp,
        employeeCount: e.employeeCount,
        nosiCompliantPct: e.nosiCompliantPct,
        policeClearanceValid: e.policeClearanceValid,
        transparencyScore: e.transparencyScore,
        stageSince: e.stageSince.toISOString(),
        hasBond: !!e.bond,
      }))}
      initialBond={initialBond}
      initialEnterpriseId={initialEnterpriseId}
    />
  );
}
