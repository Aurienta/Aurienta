import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { listTasks } from "@/lib/aurienta/erp";
import { ErpTasksClient } from "@/components/dashboard/erp/erp-tasks-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ERP Tasks · AURIENTA",
  description: "Hierarchical WBS task tree with status badges, assignees, and hours.",
};

export default async function ErpTasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/erp/tasks");

  const memberships = user.memberships ?? [];
  const enterpriseIds = memberships.map((m) => m.enterpriseId);
  const isRep = memberships.some((m) => m.role === "aurienta_rep");

  const enterprises = await db.enterprise.findMany({
    where: isRep ? undefined : { id: { in: enterpriseIds } },
    select: { id: true, name: true, slug: true, tier: true },
    orderBy: { name: "asc" },
    take: 100,
  });

  // Fetch all projects across visible enterprises.
  const projects = await db.erpProject.findMany({
    where: { enterpriseId: { in: enterprises.map((e) => e.id) } },
    select: { id: true, name: true, code: true, enterpriseId: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Build task trees per project.
  const treesByProject: Record<string, Awaited<ReturnType<typeof listTasks>>> = {};
  for (const p of projects) {
    treesByProject[p.id] = await listTasks(p.id);
  }

  return (
    <ErpTasksClient
      projects={projects.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        enterpriseId: p.enterpriseId,
      }))}
      enterprises={enterprises.map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        tier: e.tier,
      }))}
      treesByProject={treesByProject}
    />
  );
}
