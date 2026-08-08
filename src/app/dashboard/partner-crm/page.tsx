import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { LiveLedgerTicker } from "@/components/dashboard/live-ticker";
import {
  PartnerCRMClient,
  type Partner,
} from "@/components/dashboard/engagement/partner-crm-client";
import { GoldStar } from "@/components/aurienta-logo";
import { Users, Crown } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Partner CRM · AURIENTA" };

// Roles permitted to view the Partner CRM (per the ENGAGEMENT-FEATURES spec).
const CRM_ROLES = new Set(["founding_operator", "company_owner"]);

/**
 * /dashboard/partner-crm
 *
 * Capital partner CRM for founding operators and company owners. Shows
 * every shareholder with their Brain-AI-computed engagement score, churn
 * risk, and a per-partner recommendation. Summary cards surface total
 * partners, average engagement, and high-risk count. A "Refresh AI
 * insights" button re-runs the Brain AI on demand.
 */
export default async function PartnerCRMPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/partner-crm");

  // ── RBAC ── founding_operator + company_owner only
  const crmMemberships = user.memberships.filter((m) => CRM_ROLES.has(m.role));
  if (crmMemberships.length === 0) {
    redirect("/dashboard");
  }

  const entIds = crmMemberships.map((m) => m.enterpriseId);
  const enterprises =
    entIds.length > 0
      ? await db.enterprise.findMany({
          where: { id: { in: entIds } },
          select: { id: true, name: true, slug: true, tier: true, totalEquityUnits: true },
          orderBy: { name: "asc" },
        })
      : [];

  const initialEnterpriseId = enterprises[0]?.id ?? null;
  let initialPartners: Partner[] = [];
  let initialSummary = { total: 0, avgEngagement: 0, highRisk: 0 };

  if (initialEnterpriseId) {
    const ent = enterprises.find((e) => e.id === initialEnterpriseId)!;
    const totalEquityUnits = ent.totalEquityUnits || 1;

    const shareholders = await db.ownershipRecord.findMany({
      where: { enterpriseId: initialEnterpriseId, equityUnits: { gt: 0 } },
      include: { user: { select: { id: true, legalName: true } } },
    });

    const userIds = shareholders.map((s) => s.userId);
    const [engagementRows, liveVotes, liveSessions, liveCopilot] = userIds.length
      ? await Promise.all([
          db.partnerEngagement.findMany({
            where: { enterpriseId: initialEnterpriseId },
          }),
          db.vote.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds }, proposal: { enterpriseId: initialEnterpriseId } },
            _count: { _all: true },
          }),
          db.session.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds }, revokedAt: null },
            _count: { _all: true },
          }),
          db.copilotChat.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
            _count: { _all: true },
          }),
        ])
      : [[], [], [], []];

    const engByUser = new Map(engagementRows.map((e) => [e.userId, e]));
    const voteByUser = new Map(liveVotes.map((v) => [v.userId, v._count._all]));
    const sessionByUser = new Map(liveSessions.map((s) => [s.userId, s._count._all]));
    const copilotByUser = new Map(liveCopilot.map((c) => [c.userId, c._count._all]));

    initialPartners = shareholders.map((s) => {
      const eng = engByUser.get(s.userId);
      const score = eng?.engagementScore ?? Math.min(
        100,
        25 + (voteByUser.get(s.userId) ?? 0) * 10 + (sessionByUser.get(s.userId) ?? 0) * 5
      );
      const risk = (eng?.churnRisk ?? (score >= 70 ? "low" : score >= 40 ? "medium" : "high")) as
        | "low"
        | "medium"
        | "high";
      return {
        userId: s.userId,
        name: s.user.legalName,
        ownershipPct: Number(((s.equityUnits / totalEquityUnits) * 100).toFixed(2)),
        engagementScore: score,
        churnRisk: risk,
        recommendation:
          eng?.aiInsight ??
          (risk === "high"
            ? "Send a personal re-engagement note and surface the latest enterprise update."
            : risk === "medium"
              ? "Nudge with this quarter's board briefing and a copilot prompt."
              : "Recognise as a Constitutional Pillar — invite to next milestone celebration."),
        votesParticipated: voteByUser.get(s.userId) ?? 0,
        sessionCount: sessionByUser.get(s.userId) ?? 0,
        copilotQueries: copilotByUser.get(s.userId) ?? 0,
        equityUnits: s.equityUnits,
      };
    });

    const avg = initialPartners.length
      ? Math.round(
          initialPartners.reduce((sum, p) => sum + p.engagementScore, 0) /
            initialPartners.length
        )
      : 0;
    initialSummary = {
      total: initialPartners.length,
      avgEngagement: avg,
      highRisk: initialPartners.filter((p) => p.churnRisk === "high").length,
    };
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/8">
            <Users className="h-5 w-5 text-gold" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-gold-light/85">
                Enterprise
              </span>
              <GoldStar className="h-2.5 w-2.5 text-gold/70" />
            </div>
            <h1 className="font-serif text-2xl font-semibold leading-tight sm:text-3xl">
              Capital Partner CRM
            </h1>
          </div>
        </div>
        <p className="max-w-3xl font-sans text-sm leading-relaxed text-muted-foreground">
          The Brain AI analyses every capital partner&apos;s voting participation, session
          recency, copilot usage, and ownership stake to compute an engagement score
          (0–100), churn risk (low/medium/high), and a one-sentence recommendation. Use
          this to spot disengaged partners before they churn.
        </p>
        <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-gold/15 bg-gold/[0.03] px-3 py-1">
          <Crown className="h-3 w-3 text-gold" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-gold-light/85">
            Founding operator + company owner only
          </span>
        </div>
      </header>

      {/* Layout: CRM + live ticker */}
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <PartnerCRMClient
          enterprises={enterprises.map((e) => ({
            id: e.id,
            name: e.name,
            slug: e.slug,
            tier: e.tier,
          }))}
          initialEnterpriseId={initialEnterpriseId}
          initialPartners={initialPartners}
          initialSummary={initialSummary}
        />
        <div className="lg:sticky lg:top-20 lg:self-start">
          <LiveLedgerTicker
            enterpriseId={initialEnterpriseId ?? undefined}
            maxVisible={6}
          />
        </div>
      </div>
    </div>
  );
}
