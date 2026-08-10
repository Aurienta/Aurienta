// AURIENTA — Proof-of-Solvency (Blueprint §5.5)
//
// 3-level health flag system for Law Firm Client Account reconciliation.
// Each assertion compares the balance reported by the law firm against the
// internal ledger balance (enterprise.lawFirmClientAccountBalanceEgp).
//
//   Level 0 (ok):                variance ≤ 0.1%           — no flag
//   Level 1 (pending reconcile): 0.1% < variance ≤ 2%      — internal only
//   Level 2 (warning):           2%   < variance ≤ 10%     — all partners
//   Level 3 (freeze):            variance > 10%            — all + regulator,
//                                                            system freeze
//
//   GET  /api/solvency?enterpriseId=xxx
//        → most recent SolvencyAssertion + current health level.
//
//   POST /api/solvency
//        { enterpriseId, lawFirmBalanceEgp }
//        → file a new assertion. On Level 3 the Constitutional Runtime
//          Engine triggers an emergency freeze of the enterprise.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent, enforceEmergencyFreeze } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { parseBody } from "@/lib/aurienta/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Blueprint §5.5 — variance percentage thresholds.
const VARIANCE_PCT_PENDING = 0.1;
const VARIANCE_PCT_WARNING = 2;
const VARIANCE_PCT_FREEZE = 10;

const assertionSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  lawFirmBalanceEgp: z.number().min(0).max(50_000_000_000),
});

function computeHealthLevel(variancePct: number): number {
  if (variancePct > VARIANCE_PCT_FREEZE) return 3; // system freeze
  if (variancePct > VARIANCE_PCT_WARNING) return 2; // warning — all partners
  if (variancePct > VARIANCE_PCT_PENDING) return 1; // pending reconcile — internal
  return 0; // ok
}

function buildAssertionHash(params: {
  enterpriseId: string;
  lawFirmBalanceEgp: number;
  internalBalanceEgp: number;
  varianceEgp: number;
  variancePct: number;
  healthLevel: number;
  submittedAt: number;
  actorId: string;
}): string {
  // SHA-256 of the canonical signed balance assertion payload.
  const canonical = [
    `enterprise:${params.enterpriseId}`,
    `lawFirm:${params.lawFirmBalanceEgp.toFixed(4)}`,
    `internal:${params.internalBalanceEgp.toFixed(4)}`,
    `variance:${params.varianceEgp.toFixed(4)}`,
    `variancePct:${params.variancePct.toFixed(6)}`,
    `health:${params.healthLevel}`,
    `t:${params.submittedAt}`,
    `actor:${params.actorId}`,
  ].join("|");
  return createHash("sha256").update(canonical).digest("hex");
}

// GET /api/solvency?enterpriseId=xxx — return the most recent SolvencyAssertion
// for the named enterprise along with the current health level. Auth required.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const enterpriseId = req.nextUrl.searchParams.get("enterpriseId");
  if (!enterpriseId) {
    return NextResponse.json(
      {
        error: "enterpriseId query parameter is required",
        code: "invalid_body",
      },
      { status: 400 }
    );
  }

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      lawFirmClientAccountBalanceEgp: true,
    },
  });
  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found", code: "not_found" },
      { status: 404 }
    );
  }

  const latest = await db.solvencyAssertion.findFirst({
    where: { enterpriseId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    enterprise: {
      id: enterprise.id,
      name: enterprise.name,
      slug: enterprise.slug,
      status: enterprise.status,
      internalBalanceEgp: enterprise.lawFirmClientAccountBalanceEgp,
    },
    assertion: latest,
    healthLevel: latest?.healthLevel ?? 0,
  });
}

// POST /api/solvency — submit a signed balance assertion from the law firm.
// The CRE computes the variance against the internal ledger, classifies the
// health level (0–3), and — if the variance exceeds the freeze threshold —
// triggers an emergency freeze of the enterprise. Auth required
// (law_firm_rep or aurienta_rep only).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const body = await parseBody(req, assertionSchema);
  if (body instanceof NextResponse) return body;
  const { enterpriseId, lawFirmBalanceEgp } = body;

  // ── RBAC: only Law Firm Rep or AURIENTA Rep may file a balance assertion ──
  const memberships = user.memberships.filter((m) => m.enterpriseId === enterpriseId);
  const userRoles = memberships.map((m) => m.role);
  const eligible = userRoles.some((r) =>
    ["law_firm_rep", "aurienta_rep"].includes(r)
  );
  if (!eligible) {
    await audit({
      actorId: user.id,
      action: "solvency.assert",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "law_firm_rep_or_aurienta_rep_required",
      metadata: { userRoles },
    });
    return NextResponse.json(
      {
        error:
          "Only the Law Firm Representative or an AURIENTA Representative may file a Proof-of-Solvency assertion.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    select: {
      id: true,
      name: true,
      status: true,
      lawFirmClientAccountBalanceEgp: true,
    },
  });
  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found", code: "not_found" },
      { status: 404 }
    );
  }

  const internalBalanceEgp = enterprise.lawFirmClientAccountBalanceEgp;
  const varianceEgp = lawFirmBalanceEgp - internalBalanceEgp;
  const variancePct =
    (Math.abs(varianceEgp) / Math.max(internalBalanceEgp, 1)) * 100;
  const healthLevel = computeHealthLevel(variancePct);
  const submittedAt = Date.now();
  const assertionHash = buildAssertionHash({
    enterpriseId,
    lawFirmBalanceEgp,
    internalBalanceEgp,
    varianceEgp,
    variancePct,
    healthLevel,
    submittedAt,
    actorId: user.id,
  });

  // ── Persist the assertion (+ emergency freeze on Level 3) in ONE transaction ──
  const { assertion, freezeVerdict, frozen } = await db.$transaction(async (tx) => {
    const created = await tx.solvencyAssertion.create({
      data: {
        enterpriseId,
        lawFirmBalanceEgp,
        internalBalanceEgp,
        varianceEgp,
        variancePct,
        healthLevel,
        assertionHash,
      },
    });

    let verdict: ReturnType<typeof enforceEmergencyFreeze> | null = null;
    let didFreeze = false;

    if (healthLevel === 3) {
      // Constitutional emergency-freeze policy. The CRE returns a verdict +
      // decision token; we mutate the enterprise status inside the same
      // transaction so the freeze is atomic with the assertion.
      verdict = enforceEmergencyFreeze(enterprise);
      if (enterprise.status !== "frozen") {
        await tx.enterprise.update({
          where: { id: enterpriseId },
          data: { status: "frozen", frozenAt: new Date() },
        });
        didFreeze = true;
      }
    }

    await appendLedgerEvent(tx, {
      enterpriseId,
      eventType:
        healthLevel === 3
          ? "solvency_assertion_freeze"
          : healthLevel === 2
            ? "solvency_assertion_warning"
            : "solvency_assertion_recorded",
      payload: {
        action: "proof_of_solvency_assertion",
        assertionId: created.id,
        assertionHash,
        lawFirmBalanceEgp,
        internalBalanceEgp,
        varianceEgp,
        variancePct,
        healthLevel,
        emergencyFreeze: healthLevel === 3,
        freezeVerdict: verdict
          ? {
              policy: verdict.policy,
              decisionToken: verdict.decisionToken,
              reason: verdict.reason ?? null,
            }
          : null,
        enterpriseFrozen: didFreeze,
        priorStatus: enterprise.status,
        actorId: user.id,
      },
      actorId: user.id,
    });

    return { assertion: created, freezeVerdict: verdict, frozen: didFreeze };
  });

  await audit({
    actorId: user.id,
    action: "solvency.assert",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      assertionId: assertion.id,
      healthLevel,
      varianceEgp,
      variancePct,
      emergencyFreeze: frozen,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      assertion,
      healthLevel,
      emergencyFreeze: frozen,
      freezeVerdict: freezeVerdict
        ? {
            policy: freezeVerdict.policy,
            decisionToken: freezeVerdict.decisionToken,
            reason: freezeVerdict.reason ?? null,
          }
        : null,
    },
    { status: 201 }
  );
}
