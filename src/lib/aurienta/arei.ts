// AURIENTA Real-Economy Index (AREI) — Phase 2
// ═══════════════════════════════════════════════════════════════
// An informational benchmark tracking all active AURIENTA enterprises,
// weighted by Constitutional Health Score. Published daily via API.
//
// AREI IS NOT INVESTMENT ADVICE. It is a real-economy index that
// reflects the aggregate constitutional health + economic activity of
// the enterprises operating on the AURIENTA platform. Past performance
// does not indicate future results.
//
// Computation spec (per Task 5b):
//   1. Pool      = all enterprises with status in [active, fundraising_active]
//   2. weight_i  = healthScore_i / sum(healthScores)            (0..1)
//   3. contrib_i = (monthlyRevenueEgp_i + raisedEgp_i / 12) * weight_i
//   4. base      = 1000 on first run, else prior snapshot's indexValue
//   5. indexValue  = base + sum(contrib_i) / 1000               (scaled)
//   6. changePct   = ((today - yesterday) / yesterday) * 100, or 0
//   7. date        = today's YYYY-MM-DD in Africa/Cairo timezone
//   8. upserts AreiSnapshot (unique date)
//
// All floats are rounded to 4 decimal places to keep the DB tidy.

import { db } from "@/lib/db";
import { logger } from "@/lib/aurienta/logger";
import type { AreiSnapshot, Prisma } from "@prisma/client";

// ── Public types ────────────────────────────────────────────────────────

export type AreiConstituent = {
  enterpriseId: string;
  name: string;
  slug: string;
  healthScore: number;
  healthRating: string | null;
  weight: number; // 0..1
  contribution: number; // EGP-weighted contribution value (pre-scale)
};

export type AreiSnapshotWithMeta = AreiSnapshot;

// ── Timezone helper ────────────────────────────────────────────────────
// Africa/Cairo is UTC+2 with no DST since 2014. We use Intl.DateTimeFormat
// with the IANA tz identifier so the result is correct regardless of host tz.

function cairoDate(d: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA yields "YYYY-MM-DD" — perfect for our unique key.
  return formatter.format(d);
}

// Round to 4 decimal places without float drift.
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// ── Active-enterprise pool ─────────────────────────────────────────────

const ACTIVE_STATUSES = ["active", "fundraising_active"] as const;

type EnterpriseRow = {
  id: string;
  name: string;
  slug: string;
  healthScore: number;
  healthRating: string | null;
  monthlyRevenueEgp: number;
  raisedEgp: number;
};

async function fetchActiveEnterprises(): Promise<EnterpriseRow[]> {
  return db.enterprise.findMany({
    where: { status: { in: [...ACTIVE_STATUSES] } },
    select: {
      id: true,
      name: true,
      slug: true,
      healthScore: true,
      healthRating: true,
      monthlyRevenueEgp: true,
      raisedEgp: true,
    },
    orderBy: { healthScore: "desc" },
  });
}

// ── Core computation ───────────────────────────────────────────────────

/**
 * computeAreiSnapshot — query all active enterprises, compute the daily
 * index value, upsert the AreiSnapshot row for today (Africa/Cairo date),
 * and return the persisted snapshot. Idempotent: if today's snapshot
 * already exists, it is recomputed (in case underlying enterprise data
 * changed mid-day) and re-upserted.
 */
export async function computeAreiSnapshot(): Promise<AreiSnapshot> {
  const today = cairoDate();

  // Most recent prior snapshot (could be yesterday, or older if there's a gap).
  const prior = await db.areiSnapshot.findFirst({
    where: { date: { lt: today } },
    orderBy: { date: "desc" },
  });

  const base = prior ? prior.indexValue : 1000;
  const yesterdayIndexValue = prior?.indexValue ?? null;

  const enterprises = await fetchActiveEnterprises();

  // Total health score (clamp negatives to 0 so a single bad enterprise
  // can't drag the index negative).
  const totalHealth = enterprises.reduce(
    (s, e) => s + Math.max(0, e.healthScore),
    0,
  );

  let constituentSum = 0;
  let topMoverId: string | null = null;
  let bottomMoverId: string | null = null;

  if (enterprises.length > 0) {
    let top = enterprises[0];
    let bottom = enterprises[0];
    for (const e of enterprises) {
      if (e.healthScore > top.healthScore) top = e;
      if (e.healthScore < bottom.healthScore) bottom = e;
      const weight = totalHealth > 0 ? Math.max(0, e.healthScore) / totalHealth : 0;
      const contribution = (e.monthlyRevenueEgp + e.raisedEgp / 12) * weight;
      constituentSum += contribution;
    }
    topMoverId = top.id;
    bottomMoverId = bottom.id;
  }

  const indexValue = round4(base + constituentSum / 1000);
  const changePct =
    yesterdayIndexValue !== null && yesterdayIndexValue !== 0
      ? round4(((indexValue - yesterdayIndexValue) / yesterdayIndexValue) * 100)
      : 0;

  const payload: Prisma.AreiSnapshotCreateInput = {
    date: today,
    indexValue,
    changePct,
    constituentCount: enterprises.length,
    topMoverId,
    bottomMoverId,
  };

  const snapshot = await db.areiSnapshot.upsert({
    where: { date: today },
    create: payload,
    update: {
      indexValue,
      changePct,
      constituentCount: enterprises.length,
      topMoverId,
      bottomMoverId,
      computedAt: new Date(),
    },
  });

  logger.info("arei.snapshot.computed", {
    date: today,
    indexValue,
    changePct,
    constituentCount: enterprises.length,
    priorDate: prior?.date ?? null,
    base,
  });

  return snapshot;
}

/**
 * getLatestSnapshot — returns the most recently computed AreiSnapshot
 * (by date desc), or null if none exists.
 */
export async function getLatestSnapshot(): Promise<AreiSnapshot | null> {
  const row = await db.areiSnapshot.findFirst({
    orderBy: { date: "desc" },
  });
  return row ?? null;
}

/**
 * getSnapshotHistory — last N days of snapshots, ordered oldest-first
 * so the result is directly chartable on an X-axis.
 */
export async function getSnapshotHistory(days: number): Promise<AreiSnapshot[]> {
  const limit = Math.max(1, Math.min(365, Math.floor(days)));
  const rows = await db.areiSnapshot.findMany({
    orderBy: { date: "desc" },
    take: limit,
  });
  // Reverse so oldest is first (better for charting).
  return rows.slice().reverse();
}

/**
 * getConstituents — returns the current index constituents with their
 * live weight and contribution. Recomputed on every call from the
 * latest enterprise data (does NOT persist a snapshot).
 */
export async function getConstituents(): Promise<AreiConstituent[]> {
  const enterprises = await fetchActiveEnterprises();
  const totalHealth = enterprises.reduce(
    (s, e) => s + Math.max(0, e.healthScore),
    0,
  );

  return enterprises.map((e) => {
    const weight = totalHealth > 0 ? Math.max(0, e.healthScore) / totalHealth : 0;
    const contribution = (e.monthlyRevenueEgp + e.raisedEgp / 12) * weight;
    return {
      enterpriseId: e.id,
      name: e.name,
      slug: e.slug,
      healthScore: e.healthScore,
      healthRating: e.healthRating,
      weight: round4(weight),
      contribution: round4(contribution),
    };
  });
}
