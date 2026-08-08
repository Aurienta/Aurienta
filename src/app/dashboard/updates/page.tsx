import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { LiveLedgerTicker } from "@/components/dashboard/live-ticker";
import {
  UpdatesFeed,
  type UpdateRow,
} from "@/components/dashboard/engagement/updates-feed";
import { GoldStar } from "@/components/aurienta-logo";
import { Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Updates · AURIENTA" };

// Roles permitted to post updates (mirrors the API's UPDATE_AUTHOR_ROLES).
const UPDATE_AUTHOR_ROLES = new Set([
  "founding_operator",
  "manager",
  "board_member",
  "company_owner",
]);

/**
 * /dashboard/updates
 *
 * Cross-enterprise feed of Brain-AI-summarized updates for capital partners
 * and operators. Each card shows title, author, date, AI summary badge,
 * sentiment indicator (green/amber/red), and a collapsible body.
 */
export default async function UpdatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/updates");

  // The user's enterprises (memberships) — these are the enterprises whose
  // updates they can read and (if authorised) post to.
  const memberEntIds = user.memberships.map((m) => m.enterpriseId);
  const shareholderEntIds = user.ownershipRecords
    .filter((s) => s.equityUnits > 0)
    .map((s) => s.enterprise.id);
  const entIds = Array.from(new Set([...memberEntIds, ...shareholderEntIds]));

  const enterprises =
    entIds.length > 0
      ? await db.enterprise.findMany({
          where: { id: { in: entIds } },
          select: { id: true, name: true, slug: true, tier: true },
          orderBy: { name: "asc" },
        })
      : [];

  // Fetch the latest 30 updates across all of the user's enterprises.
  const updatesRaw =
    entIds.length > 0
      ? await db.enterpriseUpdate.findMany({
          where: { enterpriseId: { in: entIds } },
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            author: {
              select: { legalName: true, avatarColor: true, primaryIntent: true },
            },
            enterprise: {
              select: { id: true, name: true, slug: true },
            },
          },
        })
      : [];

  const updates: UpdateRow[] = updatesRaw.map((u) => ({
    id: u.id,
    enterpriseId: u.enterpriseId,
    enterpriseName: u.enterprise.name,
    enterpriseSlug: u.enterprise.slug,
    title: u.title,
    body: u.body,
    attachmentsCid: u.attachmentsCid,
    aiSummary: u.aiSummary,
    aiAudienceCapital: u.aiAudienceCapital,
    aiSentiment: u.aiSentiment,
    isMilestone: u.isMilestone,
    milestoneType: u.milestoneType,
    createdAt: u.createdAt.toISOString(),
    author: {
      legalName: u.author.legalName,
      avatarColor: u.author.avatarColor,
      primaryIntent: u.author.primaryIntent,
    },
  }));

  // Can the user post updates to ANY of their enterprises?
  const canPost = user.memberships.some((m) =>
    UPDATE_AUTHOR_ROLES.has(m.role)
  );

  const postableEnterprises = enterprises.filter((e) =>
    user.memberships.some(
      (m) => m.enterpriseId === e.id && UPDATE_AUTHOR_ROLES.has(m.role)
    )
  );

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/8">
            <Newspaper className="h-5 w-5 text-gold" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-gold-light/85">
                Workspace
              </span>
              <GoldStar className="h-2.5 w-2.5 text-gold/70" />
            </div>
            <h1 className="font-serif text-2xl font-semibold leading-tight sm:text-3xl">
              Enterprise Updates
            </h1>
          </div>
        </div>
        <p className="max-w-3xl font-sans text-sm leading-relaxed text-muted-foreground">
          A cross-enterprise feed of operator updates — each summarised by the
          Brain AI for capital partners and tagged with sentiment. Founding
          operators, managers, board members, and company owners can post
          updates; capital partners are notified automatically. Capital Formation
          milestones trigger constitutional celebrations.
        </p>
      </header>

      {/* Layout: updates feed + live ticker */}
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <UpdatesFeed
          initialUpdates={updates}
          enterprises={canPost ? postableEnterprises : enterprises}
          canPost={canPost}
        />
        <div className="lg:sticky lg:top-20 lg:self-start">
          <LiveLedgerTicker maxVisible={6} />
        </div>
      </div>
    </div>
  );
}
