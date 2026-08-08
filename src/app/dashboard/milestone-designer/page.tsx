import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { SovereigntyHeader } from "@/components/dashboard/sovereignty2/header";
import {
  MilestoneDesignerPage,
  type MilestoneDesignerPageProps,
  type ExistingMilestone,
} from "@/components/dashboard/sovereignty2/milestone-designer-page";
import type { EnterpriseOption } from "@/components/dashboard/sovereignty2/enterprise-selector";
import { SECTORS } from "@/lib/aurienta/constants";
import { Wrench } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Milestone Designer · AURIENTA" };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/milestone-designer");

  // Founders, managers, board members, or company owners may design milestones.
  const memberRows = await db.enterpriseMember.findMany({
    where: {
      userId: user.id,
      role: { in: ["founding_operator", "manager", "company_owner", "board_member"] },
    },
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
  const initialSector = enterprises[0]?.sector
    ? SECTORS[enterprises[0].sector]?.label ?? enterprises[0].sector
    : "agriculture";

  let milestones: ExistingMilestone[] = [];
  if (initialEnterpriseId) {
    const rows = await db.milestone.findMany({
      where: { enterpriseId: initialEnterpriseId },
      orderBy: { createdAt: "asc" },
    });
    milestones = rows.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      amountEgp: m.amountEgp,
      status: m.status,
      dueAt: m.dueAt?.toISOString() ?? null,
      releasedAt: m.releasedAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  const props: MilestoneDesignerPageProps = {
    enterprises,
    initialEnterpriseId,
    initialSector,
    milestones,
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SovereigntyHeader
        eyebrow="Sovereignty & Operations AI"
        icon={Wrench}
        title="AI Milestone Designer"
        subtitle="When a founder creates a milestone, the AI suggests evidence requirements, a realistic amount grounded in the enterprise's financials, dependency ordering, and sector-specific gates (agriculture → weather-indexed, manufacturing → OEE-gated, tourism → occupancy-gated, technology → dNPS-gated)."
      />
      <MilestoneDesignerPage {...props} />
    </div>
  );
}
