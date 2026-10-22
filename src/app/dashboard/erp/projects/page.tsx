import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { listProjects, getProjectHealth } from "@/lib/aurienta/erp";
import { ErpProjectsClient } from "@/components/dashboard/erp/erp-projects-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ERP Projects · AURIENTA",
  description: "CRE-enforced project board with WBS task trees, budget tracking, and health scoring.",
};

export default async function ErpProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/erp/projects");

  const memberships = user.memberships ?? [];
  const enterpriseIds = memberships.map((m) => m.enterpriseId);
  const isRep = memberships.some((m) => m.role === "aurienta_rep");

  const enterprises = await db.enterprise.findMany({
    where: isRep ? undefined : { id: { in: enterpriseIds } },
    select: { id: true, name: true, slug: true, tier: true },
    orderBy: { name: "asc" },
    take: 100,
  });

  // Fetch projects for all visible enterprises.
  const projects = [];
  for (const e of enterprises) {
    const rows = await listProjects(e.id);
    projects.push(...rows);
  }

  // Fetch health for each project.
  const healthByProject: Record<string, Awaited<ReturnType<typeof getProjectHealth>>> = {};
  for (const p of projects) {
    const h = await getProjectHealth(p.id);
    if (h) healthByProject[p.id] = h;
  }

  return (
    <ErpProjectsClient
      projects={projects.map((p) => ({
        id: p.id,
        enterpriseId: p.enterpriseId,
        name: p.name,
        code: p.code,
        description: p.description,
        type: p.type,
        status: p.status,
        priority: p.priority,
        budgetEgp: p.budgetEgp,
        spentEgp: p.spentEgp,
        progressPct: p.progressPct,
        healthScore: p.healthScore,
        riskLevel: p.riskLevel,
        managerId: p.managerId,
        startDate: p.startDate,
        endDate: p.endDate,
        createdAt: p.createdAt,
      }))}
      enterprises={enterprises.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        tier: e.tier,
      }))}
      healthByProject={healthByProject}
    />
  );
}
