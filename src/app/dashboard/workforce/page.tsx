import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { WorkforceRegistryClient } from "@/components/dashboard/transparency/workforce-registry-client";
import { Users, HardHat } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Workforce Registry · AURIENTA",
  description:
    "Every Workforce Partner, every NOSI number, every compensation band — visible to all Equity-Unit holders in real time.",
};

export default async function WorkforcePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/workforce");

  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);
  if (enterpriseIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <HardHat className="h-10 w-10 text-gold/70" />
        <h1 className="mt-4 font-serif text-2xl font-semibold">No enterprises yet</h1>
        <p className="mt-2 max-w-md font-sans text-sm text-muted-foreground">
          The Workforce Registry lists every employee, NOSI status, and compensation
          band across enterprises you belong to. Join or found one to see it here.
        </p>
      </div>
    );
  }

  const [employees, enterprises] = await Promise.all([
    db.employee.findMany({
      where: { enterpriseId: { in: enterpriseIds } },
      include: {
        enterprise: { select: { id: true, name: true, tier: true, slug: true } },
        user: {
          select: {
            id: true,
            legalName: true,
            avatarColor: true,
            sovereignTrustScore: true,
            tier: true,
            primaryIntent: true,
          },
        },
      },
      orderBy: [{ enterprise: { name: "asc" } }, { hireDate: "desc" }],
    }),
    db.enterprise.findMany({
      where: { id: { in: enterpriseIds } },
      select: {
        id: true,
        name: true,
        tier: true,
        slug: true,
        employeeCount: true,
        nosiCompliantPct: true,
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Workforce Registry"
        icon={Users}
        title="Every Workforce Partner, every Equity Unit earned"
        subtitle="A constitutional enterprise cannot hide who it employs. Every hire, NOSI registration, salary band, and equity-conversion percentage is published to all Equity-Unit holders the moment it is recorded in the ledger."
      />

      <WorkforceRegistryClient
        employees={employees.map((e) => ({
          id: e.id,
          enterpriseId: e.enterpriseId,
          enterpriseName: e.enterprise.name,
          enterpriseTier: e.enterprise.tier,
          enterpriseSlug: e.enterprise.slug,
          userId: e.userId,
          legalName: e.user.legalName,
          avatarColor: e.user.avatarColor,
          sovereignTrustScore: e.user.sovereignTrustScore,
          userTier: e.user.tier,
          position: e.position,
          department: e.department,
          employmentType: e.employmentType,
          compensationBand: e.compensationBand,
          monthlySalaryEgp: e.monthlySalaryEgp,
          nosiStatus: e.nosiStatus,
          nosiNumber: e.nosiNumber,
          nosiRegisteredAt: e.nosiRegisteredAt?.toISOString() ?? null,
          keyPerson: e.keyPerson,
          equityConversionPct: e.equityConversionPct,
          hireDate: e.hireDate.toISOString(),
        }))}
        enterprises={enterprises.map((e) => ({
          id: e.id,
          name: e.name,
          tier: e.tier,
          slug: e.slug,
          employeeCount: e.employeeCount,
          nosiCompliantPct: e.nosiCompliantPct,
        }))}
      />
    </div>
  );
}
