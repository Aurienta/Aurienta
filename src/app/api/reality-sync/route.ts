// AURIENTA — Reality Synchronisation Engine (Blueprint §11.8)
//
// The Reality Sync Engine periodically reconciles AURIENTA's internal
// state against external sources (government registries, law-firm
// balance assertions, NOSI). The blueprint envisions real government
// API integration; in this implementation those APIs are not yet
// available, so the engine performs a set of internal consistency
// checks that surface the same classes of drift the external sync
// would catch:
//
//   (1) NOSI compliance — employees hired >30 days ago still not registered
//   (2) Ledger integrity — verifyLedgerChain() walks the hash chain
//   (3) Ownership consistency — sum(equityUnits) vs totalEquityUnits × (1 − founder%)
//   (4) Milestone status — evidence_submitted waiting >7 days
//   (5) Expense freeze — any employee >60 days unregistered (NOSI freeze)
//   (6) Health score drift — stored healthScore vs computed vital-signs score
//
// The check result is appended to the immutable ledger (eventType =
// "reality_sync_completed"), so a regulator or auditor can later see
// exactly when each sync ran and what it found.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent, verifyLedgerChain } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set([
  "aurienta_rep",
  "founding_operator",
  "accounting_firm_rep",
]);

const BodySchema = z.object({
  enterpriseId: z.string().min(1).max(64),
});

const DAY_MS = 24 * 60 * 60 * 1000;
const NOSI_REGISTER_WINDOW_DAYS = 30; // employees must be NOSI-registered within 30 days
const NOSI_FREEZE_WINDOW_DAYS = 60; // >60 days unregistered → expense freeze condition
const MILESTONE_STALE_DAYS = 7; // evidence_submitted waiting >7 days = stale
const OWNERSHIP_TOLERANCE_UNITS = 1; // mismatch >1 Equity Unit flagged
const HEALTH_DRIFT_THRESHOLD = 10; // |stored − computed| > 10 points flagged

/**
 * Compute a vital-signs-derived health score (0–100) from the same
 * four signals surfaced on the Constitutional Workspace dashboard:
 * runway, revenue growth, gross margin, NOSI compliance. Each signal
 * contributes up to 25 points, with a healthy threshold (full credit),
 * an alert threshold (half credit), and below-alert (zero credit).
 *
 * This is the canonical "computed vital signs" reference for the
 * health-score drift check. It does NOT replace the stored
 * enterprise.healthScore — it just gives the sync engine a baseline
 * to compare against.
 */
function computeVitalSignsHealthScore(opts: {
  monthlyBurnEgp: number;
  lawFirmClientAccountBalanceEgp: number;
  revenueGrowthPct: number;
  grossMarginPct: number;
  nosiCompliantPct: number;
}): number {
  const runway =
    opts.monthlyBurnEgp > 0
      ? opts.lawFirmClientAccountBalanceEgp / opts.monthlyBurnEgp
      : 0;
  // 25 pts: runway ≥12mo full, 6–12mo half, <6mo zero.
  const runwayPts =
    runway >= 12 ? 25 : runway >= 6 ? 12.5 : 0;

  // 25 pts: revenue growth ≥20% full, 0–20% half (scaled), <0 zero.
  const growthPts =
    opts.revenueGrowthPct >= 20
      ? 25
      : opts.revenueGrowthPct >= 0
        ? (opts.revenueGrowthPct / 20) * 12.5
        : 0;

  // 25 pts: gross margin ≥30% full, 15–30% half (scaled), <15 zero.
  const marginPts =
    opts.grossMarginPct >= 30
      ? 25
      : opts.grossMarginPct >= 15
        ? ((opts.grossMarginPct - 15) / 15) * 12.5
        : 0;

  // 25 pts: NOSI compliance 100% full, 90–100% half (scaled), <90 zero.
  const nosiPts =
    opts.nosiCompliantPct >= 100
      ? 25
      : opts.nosiCompliantPct >= 90
        ? ((opts.nosiCompliantPct - 90) / 10) * 12.5
        : 0;

  return Math.round(runwayPts + growthPts + marginPts + nosiPts);
}

/**
 * POST /api/reality-sync
 * Body: { enterpriseId: string }
 *
 * Authorisation: aurienta_rep, founding_operator, or accounting_firm_rep.
 *
 * Returns: {
 *   ok,
 *   syncResults: { nosi, ledgerIntegrity, ownership, milestones, expenseFreeze, healthScore },
 *   overallStatus: "healthy" | "warning" | "critical"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          code: "INVALID_BODY",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }
    const { enterpriseId } = parsed.data;

    // ── Load the enterprise ──
    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      include: {
        employees: {
          select: {
            id: true,
            nosiStatus: true,
            hireDate: true,
            position: true,
            department: true,
          },
        },
        ownershipRecords: { select: { equityUnits: true, userId: true } },
        milestones: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            amountEgp: true,
          },
        },
      },
    });

    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise not found", code: "ENTERPRISE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // ── Authorisation: must hold an allowed role for THIS enterprise ──
    // (aurienta_rep is platform-wide and may sit on the enterprise as a
    // member; founding_operator and accounting_firm_rep must be members.)
    const membershipsForEnt = user.memberships.filter(
      (m) => m.enterpriseId === enterpriseId
    );
    const authorised = membershipsForEnt.some((m) =>
      ALLOWED_ROLES.has(m.role)
    );
    if (!authorised) {
      await audit({
        actorId: user.id,
        action: "reality_sync",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason:
          "Requires aurienta_rep, founding_operator, or accounting_firm_rep role",
      });
      return NextResponse.json(
        {
          error:
            "Forbidden: reality sync requires the aurienta_rep, founding_operator, or accounting_firm_rep role",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const now = Date.now();

    // ── Check 1: NOSI compliance ──
    // Employees hired >30 days ago whose nosiStatus is not "registered".
    let nosiNonCompliantCount = 0;
    const nosiNonCompliantSample: Array<{
      id: string;
      position: string;
      department: string;
      nosiStatus: string;
      daysSinceHire: number;
    }> = [];
    for (const emp of enterprise.employees) {
      const daysSinceHire = Math.floor(
        (now - emp.hireDate.getTime()) / DAY_MS
      );
      if (daysSinceHire > NOSI_REGISTER_WINDOW_DAYS && emp.nosiStatus !== "registered") {
        nosiNonCompliantCount++;
        if (nosiNonCompliantSample.length < 10) {
          nosiNonCompliantSample.push({
            id: emp.id,
            position: emp.position,
            department: emp.department,
            nosiStatus: emp.nosiStatus,
            daysSinceHire,
          });
        }
      }
    }
    const nosi = {
      nonCompliantCount: nosiNonCompliantCount,
      totalEmployees: enterprise.employees.length,
      registerWindowDays: NOSI_REGISTER_WINDOW_DAYS,
      flag: nosiNonCompliantCount > 0,
      sample: nosiNonCompliantSample,
    };

    // ── Check 2: Ledger integrity ──
    const ledgerIntegrityResult = await verifyLedgerChain(enterprise.id);
    const ledgerIntegrity = {
      intact: ledgerIntegrityResult.intact,
      eventsChecked: ledgerIntegrityResult.eventsChecked,
      brokenAt: ledgerIntegrityResult.brokenAt ?? undefined,
      flag: !ledgerIntegrityResult.intact,
    };

    // ── Check 3: Ownership consistency ──
    // Sum of OwnershipRecord.equityUnits should equal
    // totalEquityUnits × (1 − founderEquityPct/100) — i.e. the public
    // (non-founder) portion of the cap table. The founder portion is
    // reserved and tracked separately under the founder pool.
    const summedUnits = enterprise.ownershipRecords.reduce(
      (s, r) => s + r.equityUnits,
      0
    );
    const expectedPublicUnits = Math.round(
      enterprise.totalEquityUnits * (1 - enterprise.founderEquityPct / 100)
    );
    const mismatchUnits = Math.abs(summedUnits - expectedPublicUnits);
    const ownership = {
      summedEquityUnits: summedUnits,
      expectedPublicEquityUnits: expectedPublicUnits,
      totalEquityUnits: enterprise.totalEquityUnits,
      founderEquityPct: enterprise.founderEquityPct,
      mismatchUnits,
      toleranceUnits: OWNERSHIP_TOLERANCE_UNITS,
      flag: mismatchUnits > OWNERSHIP_TOLERANCE_UNITS,
    };

    // ── Check 4: Milestone status ──
    // Milestones in "evidence_submitted" status waiting >7 days.
    let staleMilestoneCount = 0;
    const staleMilestoneSample: Array<{
      id: string;
      title: string;
      amountEgp: number;
      daysWaiting: number;
    }> = [];
    for (const m of enterprise.milestones) {
      if (m.status === "evidence_submitted") {
        const daysWaiting = Math.floor(
          (now - m.createdAt.getTime()) / DAY_MS
        );
        if (daysWaiting > MILESTONE_STALE_DAYS) {
          staleMilestoneCount++;
          if (staleMilestoneSample.length < 10) {
            staleMilestoneSample.push({
              id: m.id,
              title: m.title,
              amountEgp: m.amountEgp,
              daysWaiting,
            });
          }
        }
      }
    }
    const milestones = {
      staleCount: staleMilestoneCount,
      staleWindowDays: MILESTONE_STALE_DAYS,
      flag: staleMilestoneCount > 0,
      sample: staleMilestoneSample,
    };

    // ── Check 5: Expense freeze ──
    // Any employee >60 days unregistered triggers the NOSI freeze
    // condition (Amendment IX expense-release block).
    let frozenEmployeeCount = 0;
    const frozenEmployeeSample: Array<{
      id: string;
      position: string;
      department: string;
      nosiStatus: string;
      daysSinceHire: number;
    }> = [];
    for (const emp of enterprise.employees) {
      const daysSinceHire = Math.floor(
        (now - emp.hireDate.getTime()) / DAY_MS
      );
      if (
        daysSinceHire > NOSI_FREEZE_WINDOW_DAYS &&
        emp.nosiStatus !== "registered"
      ) {
        frozenEmployeeCount++;
        if (frozenEmployeeSample.length < 10) {
          frozenEmployeeSample.push({
            id: emp.id,
            position: emp.position,
            department: emp.department,
            nosiStatus: emp.nosiStatus,
            daysSinceHire,
          });
        }
      }
    }
    const expenseFreeze = {
      frozenEmployeeCount,
      freezeWindowDays: NOSI_FREEZE_WINDOW_DAYS,
      flag: frozenEmployeeCount > 0,
      sample: frozenEmployeeSample,
    };

    // ── Check 6: Health score drift ──
    // Compare stored enterprise.healthScore to the vital-signs-derived
    // computed score. Drift >10 points is flagged.
    const computedHealthScore = computeVitalSignsHealthScore({
      monthlyBurnEgp: enterprise.monthlyBurnEgp,
      lawFirmClientAccountBalanceEgp:
        enterprise.lawFirmClientAccountBalanceEgp,
      revenueGrowthPct: enterprise.revenueGrowthPct,
      grossMarginPct: enterprise.grossMarginPct,
      nosiCompliantPct: enterprise.nosiCompliantPct,
    });
    const healthDrift = Math.abs(
      enterprise.healthScore - computedHealthScore
    );
    const healthScore = {
      stored: enterprise.healthScore,
      computed: computedHealthScore,
      drift: healthDrift,
      threshold: HEALTH_DRIFT_THRESHOLD,
      flag: healthDrift > HEALTH_DRIFT_THRESHOLD,
      vitalSigns: {
        monthlyBurnEgp: enterprise.monthlyBurnEgp,
        lawFirmClientAccountBalanceEgp:
          enterprise.lawFirmClientAccountBalanceEgp,
        revenueGrowthPct: enterprise.revenueGrowthPct,
        grossMarginPct: enterprise.grossMarginPct,
        nosiCompliantPct: enterprise.nosiCompliantPct,
      },
    };

    const syncResults = {
      nosi,
      ledgerIntegrity,
      ownership,
      milestones,
      expenseFreeze,
      healthScore,
    };

    // ── Overall status: critical if ledger broken or expense freeze; ──
    // warning if any other check flagged; healthy otherwise.
    let overallStatus: "healthy" | "warning" | "critical" = "healthy";
    const anyWarning =
      nosi.flag ||
      ownership.flag ||
      milestones.flag ||
      healthScore.flag;
    const anyCritical =
      !ledgerIntegrity.intact || expenseFreeze.flag;
    if (anyCritical) overallStatus = "critical";
    else if (anyWarning) overallStatus = "warning";

    // ── Append the ledger event (single transaction) ──
    const { ledgerSequence } = await db.$transaction(async (tx) => {
      const ledgerEvent = await appendLedgerEvent(tx, {
        enterpriseId: enterprise.id,
        eventType: "reality_sync_completed",
        payload: {
          overallStatus,
          flags: {
            nosi: nosi.flag,
            ledgerIntegrity: ledgerIntegrity.flag,
            ownership: ownership.flag,
            milestones: milestones.flag,
            expenseFreeze: expenseFreeze.flag,
            healthScore: healthScore.flag,
          },
          summary: {
            nosiNonCompliantCount: nosi.nonCompliantCount,
            ledgerEventsChecked: ledgerIntegrity.eventsChecked,
            ledgerIntact: ledgerIntegrity.intact,
            ownershipMismatchUnits: ownership.mismatchUnits,
            staleMilestoneCount: milestones.staleCount,
            frozenEmployeeCount: expenseFreeze.frozenEmployeeCount,
            healthScoreDrift: healthScore.drift,
          },
          requestedBy: user.id,
        },
        actorId: user.id,
      });
      return { ledgerSequence: ledgerEvent.sequence };
    });

    await audit({
      actorId: user.id,
      action: "reality_sync",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      reason: `overallStatus=${overallStatus}`,
      metadata: {
        ledgerSequence,
        overallStatus,
        flags: {
          nosi: nosi.flag,
          ledgerIntegrity: ledgerIntegrity.flag,
          ownership: ownership.flag,
          milestones: milestones.flag,
          expenseFreeze: expenseFreeze.flag,
          healthScore: healthScore.flag,
        },
      },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    logger.info("reality_sync.completed", {
      enterpriseId,
      ledgerSequence,
      overallStatus,
      nosiFlag: nosi.flag,
      ledgerFlag: ledgerIntegrity.flag,
      ownershipFlag: ownership.flag,
      milestoneFlag: milestones.flag,
      freezeFlag: expenseFreeze.flag,
      healthFlag: healthScore.flag,
    });

    return NextResponse.json({
      ok: true,
      syncResults,
      overallStatus,
      ledgerSequence,
      enterpriseId,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[POST /api/reality-sync] error:", { err: msg });
    return NextResponse.json(
      {
        ok: false,
        error: "Reality sync could not be completed.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
