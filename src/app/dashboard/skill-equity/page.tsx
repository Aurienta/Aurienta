export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { SkillEquityClient } from "@/components/dashboard/workforce/skill-equity-client";

export const metadata = { title: "Skill-to-Equity · AURIENTA" };

export default async function SkillEquityPage() {
  const user = (await getCurrentUser())!;

  // Fetch the user's employment records
  const employees = await db.employee.findMany({
    where: { userId: user.id },
    include: { enterprise: true },
    orderBy: { hireDate: "asc" },
  });

  // Compute tenure for each
  const now = new Date();
  const employment = employees.map((e) => {
    const tenureMonths =
      (now.getFullYear() - e.hireDate.getFullYear()) * 12 +
      (now.getMonth() - e.hireDate.getMonth());
    return {
      id: e.id,
      enterpriseId: e.enterpriseId,
      enterpriseName: e.enterprise.name,
      enterpriseTier: e.enterprise.tier,
      position: e.position,
      department: e.department,
      hireDate: e.hireDate.toISOString(),
      tenureMonths,
      eligible: tenureMonths >= 24,
      monthlySalaryEgp: e.monthlySalaryEgp,
      equityConversionPct: e.equityConversionPct,
    };
  });

  // Fetch existing claims
  const claims = await db.skillEquityClaim.findMany({
    where: { userId: user.id },
    include: { enterprise: true },
    orderBy: { submittedAt: "desc" },
  });

  const mappedClaims = claims.map((c) => ({
    id: c.id,
    enterpriseName: c.enterprise.name,
    credentialType: c.credentialType,
    credentialName: c.credentialName,
    issuer: c.issuer,
    status: c.status,
    equityGrantPct: c.equityGrantPct,
    tenureMonths: c.tenureMonths,
    documentName: c.documentName,
    aiAssessment: c.aiAssessment,
    submittedAt: c.submittedAt.toISOString(),
  }));

  return (
    <SkillEquityClient
      user={{ legalName: user.legalName, sovereignTrustScore: user.sovereignTrustScore }}
      employment={employment}
      claims={mappedClaims}
    />
  );
}
