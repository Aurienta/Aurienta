export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { CopilotContextPanel } from "@/components/dashboard/copilot/context-panel";
import { CopilotChat } from "@/components/dashboard/copilot/chat-interface";
import { Bot } from "lucide-react";

export const metadata = { title: "AI Copilot · AURIENTA" };

export default async function CopilotPage() {
  const user = (await getCurrentUser())!;

  // Load chat history (oldest → newest) — capped at the most recent 60 messages.
  const historyRows = await db.copilotChat.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    take: 60,
  });
  const history = historyRows.map((r) => ({
    id: r.id,
    role: r.role as "user" | "assistant",
    content: r.content,
    createdAt: r.createdAt.toISOString(),
  }));

  // Pull enterprise summaries for the context panel.
  const enterpriseIds = user.memberships.map((m) => m.enterpriseId);
  const enterprises = enterpriseIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: enterpriseIds } },
        select: {
          id: true,
          name: true,
          tier: true,
          stage: true,
          graduationReadiness: true,
        },
      })
    : [];

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Constitutional AI Copilot"
        icon={Bot}
        title="Deterministic answers. Sovereign guardrails."
        subtitle="Powered by Gemma 2 27B · Mixtral 8x22B · Llama 3.2 70B. The Copilot is grounded in the immutable ledger, your shareholdings, and the constitutional rules the CRE enforces — every reply is hash-stamped and reviewable."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <CopilotChat history={history} />
        <CopilotContextPanel user={user} enterprises={enterprises} />
      </div>
    </div>
  );
}
