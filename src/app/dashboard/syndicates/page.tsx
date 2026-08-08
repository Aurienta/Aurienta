import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { SyndicatesBoard } from "@/components/dashboard/capital2/syndicates-board";
import { DripCard } from "@/components/dashboard/capital2/drip-card";
import { GoldStar } from "@/components/aurienta-logo";
import { Coins } from "lucide-react";
import {
  askConstitutionalAI,
  buildUserContext,
} from "@/lib/aurienta/ai";
import {
  type SyndicateForUi,
  type EnterpriseForSyndicate,
  type SyndicateEnterpriseForUi,
} from "@/components/dashboard/capital2/types";
import { type AiMatch } from "@/components/dashboard/capital2/ai-matched-syndicates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Syndicates · AURIENTA" };

export default async function SyndicatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/syndicates");

  // ── Fetch active/forming syndicates with members + lead + enterprise ──
  const syndicates = await db.syndicate.findMany({
    where: { status: { in: ["forming", "active"] } },
    include: {
      enterprise: {
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          sector: true,
          equityUnitPriceEgp: true,
          healthRating: true,
          healthScore: true,
          status: true,
        },
      },
      leadPartner: {
        select: {
          id: true,
          legalName: true,
          sovereignTrustScore: true,
          tier: true,
          avatarColor: true,
          primaryIntent: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              legalName: true,
              sovereignTrustScore: true,
              avatarColor: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const syndicatesForUi: SyndicateForUi[] = syndicates.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    riskProfile: s.riskProfile,
    status: s.status,
    targetShares: s.targetShares,
    committedShares: s.committedShares,
    createdAt: s.createdAt.toISOString(),
    enterprise: s.enterprise as SyndicateEnterpriseForUi,
    leadPartner: s.leadPartner,
    members: s.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      equityUnits: m.equityUnits,
      amountEgp: m.amountEgp,
      joinedAt: m.joinedAt.toISOString(),
      legalName: m.user.legalName,
      sovereignTrustScore: m.user.sovereignTrustScore,
      avatarColor: m.user.avatarColor,
    })),
    isMember: s.members.some((m) => m.userId === user.id),
    isLead: s.leadPartnerId === user.id,
  }));

  // ── Enterprises the user may form a syndicate for ──
  const memberEntIds = user.memberships.map((m) => m.enterpriseId);
  const enterprisesForForm = memberEntIds.length
    ? await db.enterprise.findMany({
        where: { id: { in: memberEntIds }, status: { notIn: ["graduated", "draft"] } },
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          sector: true,
          equityUnitPriceEgp: true,
          healthRating: true,
          status: true,
        },
        orderBy: { name: "asc" },
      })
    : [];
  const enterprisesForUi: EnterpriseForSyndicate[] = enterprisesForForm.map((e) => ({
    ...e,
    healthRating: e.healthRating ?? null,
  }));

  // ── AI matching: ask the Constitutional AI to surface compatible syndicates ──
  let aiMatches: AiMatch[] = [];
  if (syndicatesForUi.length > 0) {
    const userCtx = buildUserContext(user);
    const portfolioSummary =
      user.ownershipRecords
        .filter((s) => s.equityUnits > 0)
        .map(
          (s) =>
            `${s.enterprise.name} (Tier ${s.enterprise.tier}, ${s.equityUnits} units @ ${s.enterprise.equityUnitPriceEgp} EGP)`
        )
        .join("; ") || "no current holdings";

    const synSummary = syndicatesForUi
      .map(
        (s) =>
          `- ${s.name} | ent=${s.enterprise.name} T${s.enterprise.tier} | risk=${s.riskProfile} | committed=${s.committedShares}/${s.targetShares} | lead STS=${s.leadPartner.sovereignTrustScore}`
      )
      .join("\n");

    // Clean, developer-authored system instructions — NO user-controlled text.
    // User context + portfolio + syndicate summaries (all containing user-
    // controlled names) flow through `userContext` as UNTRUSTED DATA.
    const systemPrompt =
      `Score each syndicate 0-100 on compatibility with this user's risk profile and portfolio. ` +
      `Return ONLY a JSON array (max 3 entries), sorted by score desc, in this exact shape:\n` +
      `[{"syndicateId":"<id>","matchScore":<0-100>,"rationale":"<one sentence>"}]\n` +
      `Do not include any other text. The JSON must be valid.`;

    const userContext =
      `${userCtx}\n\n` +
      `USER PORTFOLIO: ${portfolioSummary}\n` +
      `USER RISK PROFILE: ${user.riskProfile ?? "balanced"}\n\n` +
      `AVAILABLE SYNDICATES:\n${synSummary}`;

    const userMessage = `Score each syndicate from the untrusted-data context. Return ONLY the JSON array described in the system instructions.`;

    const aiResult = await askConstitutionalAI({
      systemPrompt,
      userMessage,
      userContext,
      kind: "syndicate_match",
      userId: user.id,
      persist: false,
      confidence: 0.82,
    });
    const aiReply = aiResult.content;

    // Parse the AI's JSON array — defensively.
    try {
      const match = aiReply.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) {
          aiMatches = parsed
            .filter(
              (x) =>
                x &&
                typeof x.syndicateId === "string" &&
                typeof x.matchScore === "number" &&
                typeof x.rationale === "string"
            )
            .slice(0, 3)
            .map((x) => ({
              syndicateId: String(x.syndicateId),
              matchScore: Math.max(0, Math.min(100, Math.round(x.matchScore))),
              rationale: String(x.rationale).slice(0, 220),
            }))
            .filter((m) => syndicatesForUi.some((s) => s.id === m.syndicateId));
        }
      }
    } catch {
      // AI didn't return valid JSON — show no AI matches panel.
      aiMatches = [];
    }
  }

  // ── DRIP section: cards for each of the user's holdings (demonstrates the reusable component) ──
  const holdingsForDrip = user.ownershipRecords.filter((s) => s.equityUnits > 0);
  const dripEnrollments = holdingsForDrip.length
    ? await db.dripEnrollment.findMany({
        where: {
          userId: user.id,
          enterpriseId: { in: holdingsForDrip.map((h) => h.enterpriseId) },
        },
      })
    : [];
  const dripByEnterprise = new Map(dripEnrollments.map((e) => [e.enterpriseId, e]));

  return (
    <div className="relative">
      <SonnerToaster
        position="top-center"
        toastOptions={{
          style: {
            border: "1px solid rgba(212,175,55,0.25)",
            background: "rgba(16,16,18,0.95)",
            color: "#f3eedd",
          },
        }}
      />

      <SyndicatesBoard
        syndicates={syndicatesForUi}
        enterprises={enterprisesForUi}
        userRiskProfile={user.riskProfile}
        aiMatches={aiMatches}
      />

      {/* DRIP section — demonstrates the reusable DripCard component across the user's holdings. */}
      {holdingsForDrip.length > 0 && (
        <section
          aria-label="Dividend ReParticipation Plans"
          className="mt-10 flex flex-col gap-5"
        >
          <header className="flex items-end justify-between gap-3 border-t border-gold/10 pt-6">
            <div>
              <div className="flex items-center gap-2">
                <Coins className="h-3.5 w-3.5 text-gold" />
                <span className="font-mono text-xs uppercase tracking-[0.22em] text-gold-light/80">
                  Dividend ReParticipation Plan
                </span>
              </div>
              <h2 className="mt-1.5 font-serif text-xl font-semibold sm:text-2xl">
                Auto-reinvest dividends
              </h2>
              <p className="mt-1 max-w-2xl font-sans text-sm text-muted-foreground">
                Toggle DRIP per holding. Auto-reParticipation deploys capital at the AI fundamental
                price within the ±5% CRE band, through the standard law firm client account path.
              </p>
            </div>
            <div className="hidden items-center gap-1.5 sm:flex">
              <GoldStar className="h-3 w-3 text-gold/70" />
              <span className="font-mono text-xs text-muted-foreground/85">
                {holdingsForDrip.length} holding{holdingsForDrip.length === 1 ? "" : "s"}
              </span>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {holdingsForDrip.map((h) => (
              <DripCard
                key={h.enterpriseId}
                userId={user.id}
                enterpriseId={h.enterpriseId}
                shareholding={{
                  equityUnits: h.equityUnits,
                  avgPriceEgp: h.avgPriceEgp,
                }}
                enterprise={{
                  id: h.enterprise.id,
                  name: h.enterprise.name,
                  slug: h.enterprise.slug,
                  tier: h.enterprise.tier,
                  sector: h.enterprise.sector,
                  equityUnitPriceEgp: h.enterprise.equityUnitPriceEgp,
                }}
                enrollment={
                  (() => {
                    const enr = dripByEnterprise.get(h.enterpriseId);
                    if (!enr) return null;
                    return {
                      id: enr.id,
                      enterpriseId: enr.enterpriseId,
                      reinvestPct: enr.reinvestPct,
                      active: enr.active,
                      enrolledAt: enr.enrolledAt.toISOString(),
                    };
                  })()
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
