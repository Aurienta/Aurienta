import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { SovereigntyHeader } from "@/components/dashboard/sovereignty2/header";
import {
  BoardBriefingsPage,
  type BoardBriefingsPageProps,
  type PastBriefing,
} from "@/components/dashboard/sovereignty2/board-briefings-page";
import type { EnterpriseOption } from "@/components/dashboard/sovereignty2/enterprise-selector";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Board Briefings · AURIENTA" };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/board-briefings");

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

  let pastBriefings: PastBriefing[] = [];
  if (initialEnterpriseId) {
    const rows = await db.aiArtifact.findMany({
      where: { kind: "board_briefing", enterpriseId: initialEnterpriseId },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    pastBriefings = rows.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      confidence: r.confidence,
    }));
  }

  const props: BoardBriefingsPageProps = {
    enterprises,
    initialEnterpriseId,
    pastBriefings,
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SovereigntyHeader
        eyebrow="Sovereignty & Operations AI"
        icon={FileText}
        title="AI Board Meeting Prep"
        subtitle="Before each board meeting, the AI assembles a briefing pack: financial summary (revenue, burn, runway, margin), open proposals, compliance status (NOSI, police clearance, tax), key person risks, action items, and a draft agenda from the enterprise's constitutional cadence."
      />
      <BoardBriefingsPage {...props} />
    </div>
  );
}
