// AURIENTA — Constitutional Zeitgeist (Phase 3, ROADMAP-10)
//
// Daily platform sentiment — the pulse of the constitutional economy. Aggregates
// the last 24h of governance + operational signals into a single sentiment
// score (-1 bearish .. +1 bullish) with a confidence percentage.
//
// Constitutional compliance:
// - Informational, NOT investment advice. The disclaimer is surfaced on every
//   UI that consumes the score.
// - No speculation (Rule I-1.3): the score is descriptive of past activity,
//   not predictive of future returns.
// - Real economy only (Rule I-1.8): all signals come from real ledger / vote /
//   audit / report rows — never synthetic.

import { db } from "@/lib/db";
import type { ZeitgeistSnapshot } from "@prisma/client";

// ── Window: last 24 hours ──
const WINDOW_MS = 24 * 60 * 60 * 1000;

// ── Helpers ──
function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function todayKey(now = new Date()): string {
  // YYYY-MM-DD in UTC (consistent across deployments).
  return now.toISOString().slice(0, 10);
}

// ── Main: compute a fresh snapshot ──
export async function computeZeitgeistSnapshot(): Promise<ZeitgeistSnapshot> {
  const since = new Date(Date.now() - WINDOW_MS);

  // Pull every signal source in parallel.
  const [
    proposalsCreated,
    proposalsExecuted,
    proposalsRejected,
    votesCast,
    auditEvents,
    aiInsights,
    endorsementsCreated,
    endorsementsResolvedSuccess,
    endorsementsResolvedFailure,
    appealsFiled,
    freezesTriggered,
  ] = await Promise.all([
    // Governance
    db.proposal.count({ where: { createdAt: { gte: since } } }),
    db.proposal.count({
      where: { executedAt: { gte: since }, status: "executed" },
    }),
    db.proposal.count({
      where: { status: "rejected", executedAt: { gte: since } },
    }),
    db.vote.count({ where: { createdAt: { gte: since } } }),

    // Audit + ledger activity (broad proxy for engagement)
    db.auditLog.count({ where: { timestamp: { gte: since } } }),
    db.aiArtifact.count({ where: { createdAt: { gte: since } } }),

    // Constitutional endorsements (reputation staking)
    db.constitutionalEndorsement.count({
      where: { createdAt: { gte: since } },
    }),
    db.constitutionalEndorsement.count({
      where: { resolvedAt: { gte: since }, outcome: "success" },
    }),
    db.constitutionalEndorsement.count({
      where: { resolvedAt: { gte: since }, outcome: "failure" },
    }),

    // Disputes
    db.appealCase.count({ where: { filedAt: { gte: since } } }),

    // Circuit-breaker halts (freezes)
    db.circuitBreakerHalt.count({
      where: { triggeredAt: { gte: since } },
    }),
  ]);

  // ── Tally positive vs negative signals ──
  // Positive: proposals passed/executed, endorsements success, high vote
  // participation (every vote counts as +0.5 — it indicates engagement),
  // AI insights generated (operational momentum).
  //
  // Negative: proposals rejected, appeals filed, freezes triggered,
  // endorsements failed.
  const positiveSignals =
    proposalsExecuted +
    endorsementsResolvedSuccess +
    votesCast * 0.5 +
    aiInsights * 0.25;

  const negativeSignals =
    proposalsRejected +
    appealsFiled +
    freezesTriggered +
    endorsementsResolvedFailure;

  const totalSignals = positiveSignals + negativeSignals;

  // Sentiment: (pos - neg) / total. Range -1..+1. When there are zero signals
  // in the window (a quiet day), default to neutral (0) with low confidence.
  const sentimentScore =
    totalSignals === 0 ? 0 : clamp((positiveSignals - negativeSignals) / totalSignals, -1, 1);

  // Confidence: based on signal density. Each signal contributes 5%, capped at 100%.
  const rawSignalCount =
    proposalsCreated +
    proposalsExecuted +
    proposalsRejected +
    votesCast +
    auditEvents +
    aiInsights +
    endorsementsCreated +
    appealsFiled +
    freezesTriggered;
  const signalCount = Math.max(rawSignalCount, totalSignals > 0 ? 1 : 0);
  const confidencePct = clamp(signalCount * 5, 0, 100);

  // ── Top theme: most common event type in the window ──
  const themeTallies = [
    { label: "Proposals created", count: proposalsCreated },
    { label: "Proposals executed", count: proposalsExecuted },
    { label: "Votes cast", count: votesCast },
    { label: "Audit events", count: auditEvents },
    { label: "AI insights", count: aiInsights },
    { label: "Endorsements", count: endorsementsCreated },
    { label: "Appeals filed", count: appealsFiled },
    { label: "Circuit-breaker halts", count: freezesTriggered },
  ].sort((a, b) => b.count - a.count);

  const topTheme =
    themeTallies[0] && themeTallies[0].count > 0
      ? themeTallies[0].label
      : "Quiet day";

  // ── Summary text ──
  const mood =
    sentimentScore > 0.4
      ? "Bullish"
      : sentimentScore > 0.1
      ? "Cautiously positive"
      : sentimentScore > -0.1
      ? "Neutral"
      : sentimentScore > -0.4
      ? "Cautiously negative"
      : "Bearish";

  const summaryText =
    `Constitutional sentiment is ${mood.toLowerCase()} ` +
    `(${(sentimentScore * 100).toFixed(0)} net score). ` +
    `${signalCount} signals observed in the last 24h — ` +
    `${proposalsExecuted} proposals executed, ${votesCast} votes cast, ` +
    `${endorsementsCreated} endorsements, ${appealsFiled} appeals filed, ` +
    `${freezesTriggered} circuit-breaker halts. ` +
    `Top theme: ${topTheme}. ` +
    `This is informational, NOT investment advice.`;

  // ── Upsert by today's date ──
  const date = todayKey();
  return db.zeitgeistSnapshot.upsert({
    where: { date },
    create: {
      date,
      sentimentScore: Math.round(sentimentScore * 1000) / 1000,
      confidencePct,
      signalCount,
      topTheme,
      summaryText,
      computedAt: new Date(),
    },
    update: {
      sentimentScore: Math.round(sentimentScore * 1000) / 1000,
      confidencePct,
      signalCount,
      topTheme,
      summaryText,
      computedAt: new Date(),
    },
  });
}

// ── Latest snapshot ──
export async function getLatestSnapshot(): Promise<ZeitgeistSnapshot | null> {
  const latest = await db.zeitgeistSnapshot.findFirst({
    orderBy: { date: "desc" },
  });
  return latest;
}

// ── History ──
export async function getHistory(
  days = 30
): Promise<ZeitgeistSnapshot[]> {
  const limit = Math.min(Math.max(days, 1), 365);
  return db.zeitgeistSnapshot.findMany({
    orderBy: { date: "desc" },
    take: limit,
  });
}
