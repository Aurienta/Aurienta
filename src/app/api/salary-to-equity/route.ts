import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import {
  appendLedgerEvent,
  enforceSalaryToEquity,
  enforceEquityLockUp,
  logCreDecision,
} from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/salary-to-equity
// Workforce Partner converts a slice of their monthly salary into Equity Units
// of their enterprise, at a 15% discount to the fundamental CPP price
// (Blueprint Volume 8 — Workforce Capitalization).
//
// Flow:
//   1. Auth: caller must be the Employee themselves OR a manager / board
//      member / founding_operator of the enterprise (the existing
//      /api/employees equity-conversion endpoint uses the same rule).
//   2. Load Employee + Enterprise to obtain monthlySalaryEgp + equityUnitPriceEgp.
//   3. enforceSalaryToEquity (cre.ts) validates the constitutional rules:
//        - pct ∈ [0, 10]
//        - consent required
//        - non-zero salary + price
//        - anti-duplicate per pay cycle
//      Returns convertedAmountEgp, discountedPriceEgp, equityUnitsToIssue,
//      plus a signed CRE decision token.
//   4. enforceEquityLockUp (cre.ts) is invoked on the resulting
//      OwnershipRecord.restrictedUntil (12 months by default) — this guards
//      downstream transfer attempts, NOT the issuance itself. We still call
//      it here to record the lock-up decision token in the ledger.
//   5. Inside ONE db.$transaction:
//        - Upsert OwnershipRecord (equityUnits + restrictedUntil + avgPriceEgp)
//        - Update Employee.equityConversionPct (so /api/employees reflects it)
//        - logCreDecision for both policies
//        - appendLedgerEvent (hash-chained)
//   6. audit() best-effort.
// ─────────────────────────────────────────────────────────────────────────────

const bodySchema = z.object({
  employeeId: z.string().min(1).max(64),
  equityConversionPct: z.number().min(0).max(10),
});

const DEFAULT_LOCKUP_MONTHS = 12;

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        code: "invalid_body",
        issues: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const { employeeId, equityConversionPct } = parsed.data;

  // ── Load Employee + Enterprise ──
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: {
      enterprise: {
        select: {
          id: true,
          name: true,
          slug: true,
          equityUnitPriceEgp: true,
        },
      },
    },
  });
  if (!employee) {
    return NextResponse.json(
      { error: "Employee not found", code: "employee_not_found" },
      { status: 404 }
    );
  }

  // ── Authorization ──
  // The Workforce Partner themselves OR a manager / board_member /
  // founding_operator of the enterprise may convert.
  const isSelf = employee.userId === user.id;
  const memberships = user.memberships.filter(
    (m) => m.enterpriseId === employee.enterpriseId
  );
  const canManage = memberships.some((m) =>
    ["manager", "board_member", "founding_operator"].includes(m.role)
  );
  if (!isSelf && !canManage) {
    await audit({
      actorId: user.id,
      action: "salary_to_equity.convert",
      target: `employee:${employee.id}`,
      result: "denied",
      reason: "Not authorized to convert salary for this employee",
      metadata: { employeeId },
    });
    return NextResponse.json(
      {
        error:
          "Not authorized to convert salary for this employee — you must be the Workforce Partner themselves or a manager / board member / founding operator of this enterprise.",
        code: "not_authorized",
      },
      { status: 403 }
    );
  }

  // ── Anti-duplicate per pay cycle ──
  // The Employee.equityConversionPct field is the % already deducted this
  // cycle. If non-zero, we treat that as an existing conversion for this
  // cycle. (Pay-cycle reset is the responsibility of payroll — out of scope
  // for this endpoint.)
  const existingConversionThisCycle = (employee.equityConversionPct ?? 0) > 0;

  const equityUnitPriceEgp = Number(employee.enterprise.equityUnitPriceEgp);
  if (!Number.isFinite(equityUnitPriceEgp) || equityUnitPriceEgp <= 0) {
    return NextResponse.json(
      {
        error:
          "Enterprise Equity Unit Price (CPP) is not configured — cannot compute salary-to-equity conversion.",
        code: "cpp_unavailable",
      },
      { status: 409 }
    );
  }

  // ── CRE: enforceSalaryToEquity ──
  const verdict = enforceSalaryToEquity({
    employeeId: employee.id,
    monthlySalaryEgp: Number(employee.monthlySalaryEgp),
    equityConversionPct,
    equityUnitPriceEgp,
    authorizedBy: user.id,
    workforcePartnerConsent: isSelf || canManage,
    existingConversionThisCycle,
    restrictedUntilMonths: DEFAULT_LOCKUP_MONTHS,
  });

  if (!verdict.allowed) {
    // Persist the denial as a CRE decision + audit.
    await db.$transaction(async (tx) => {
      await logCreDecision(tx, {
        enterpriseId: employee.enterpriseId,
        policy: verdict.policy,
        verdict,
        actorId: user.id,
        payload: {
          employeeId: employee.id,
          equityConversionPct,
          equityUnitPriceEgp,
          monthlySalaryEgp: Number(employee.monthlySalaryEgp),
        },
      });
      await appendLedgerEvent(tx, {
        enterpriseId: employee.enterpriseId,
        eventType: "cre_decision",
        payload: {
          action: "salary_to_equity_denied",
          employeeId: employee.id,
          equityConversionPct,
          reason: verdict.reason,
          policy: verdict.policy,
          creDecisionToken: verdict.decisionToken,
        },
        actorId: user.id,
      });
    });

    await audit({
      actorId: user.id,
      action: "salary_to_equity.convert",
      target: `employee:${employee.id}`,
      result: "denied",
      reason: verdict.reason,
      metadata: { employeeId, equityConversionPct, policy: verdict.policy },
    });

    return NextResponse.json(
      {
        ok: false,
        error: verdict.reason ?? "Salary-to-Equity conversion denied by CRE",
        code: "cre_denied",
        policy: verdict.policy,
        creDecisionToken: verdict.decisionToken,
      },
      { status: 422 }
    );
  }

  // ── CRE: enforceEquityLockUp (records the lock-up decision token) ──
  const restrictedUntil = new Date();
  restrictedUntil.setMonth(restrictedUntil.getMonth() + DEFAULT_LOCKUP_MONTHS);

  const lockUpVerdict = enforceEquityLockUp({ restrictedUntil });
  // Note: lockUpVerdict.allowed === true here because restrictedUntil is in
  // the future — we're not testing whether the lock-up has expired, we're
  // recording the decision token that downstream transfer guards will verify.

  // ── Execute atomically ──
  const result = await db.$transaction(async (tx) => {
    // 1. Upsert the OwnershipRecord (employee already owns units? merge).
    const existing = await tx.ownershipRecord.findUnique({
      where: {
        enterpriseId_userId: {
          enterpriseId: employee.enterpriseId,
          userId: employee.userId,
        },
      },
    });

    const newEquityUnits = verdict.equityUnitsToIssue;
    const totalUnits = (existing?.equityUnits ?? 0) + newEquityUnits;
    // Weighted-average price: existing avg + new units at discounted price.
    const existingUnits = existing?.equityUnits ?? 0;
    const existingAvg = existing?.avgPriceEgp ?? 0;
    const newPrice = verdict.discountedPriceEgp;
    const blendedAvg =
      totalUnits > 0
        ? (existingAvg * existingUnits + newPrice * newEquityUnits) / totalUnits
        : newPrice;

    // Lock-up: take the LATER of any existing lock-up and the new one (so a
    // later conversion never shortens an existing lock).
    const existingLock = existing?.restrictedUntil ?? null;
    const effectiveLock =
      !existingLock || restrictedUntil.getTime() > existingLock.getTime()
        ? restrictedUntil
        : existingLock;

    const ownershipRecord = existing
      ? await tx.ownershipRecord.update({
          where: { id: existing.id },
          data: {
            equityUnits: totalUnits,
            avgPriceEgp: blendedAvg,
            restrictedUntil: effectiveLock,
          },
        })
      : await tx.ownershipRecord.create({
          data: {
            enterpriseId: employee.enterpriseId,
            userId: employee.userId,
            equityUnits: totalUnits,
            avgPriceEgp: blendedAvg,
            restrictedUntil: effectiveLock,
          },
        });

    // 2. Mark the Employee record with the conversion % (so /api/employees
    //    reflects the deduction this cycle and the anti-duplicate check
    //    blocks a second conversion).
    await tx.employee.update({
      where: { id: employee.id },
      data: { equityConversionPct: equityConversionPct },
    });

    // 3. Log both CRE decisions.
    await logCreDecision(tx, {
      enterpriseId: employee.enterpriseId,
      policy: verdict.policy,
      verdict,
      actorId: user.id,
      payload: {
        employeeId: employee.id,
        equityConversionPct,
        equityUnitPriceEgp,
        monthlySalaryEgp: Number(employee.monthlySalaryEgp),
        convertedAmountEgp: verdict.convertedAmountEgp,
        discountedPriceEgp: verdict.discountedPriceEgp,
        equityUnitsToIssue: verdict.equityUnitsToIssue,
      },
    });
    await logCreDecision(tx, {
      enterpriseId: employee.enterpriseId,
      policy: lockUpVerdict.policy,
      verdict: lockUpVerdict,
      actorId: user.id,
      payload: {
        ownershipRecordId: ownershipRecord.id,
        restrictedUntil: restrictedUntil.toISOString(),
        months: DEFAULT_LOCKUP_MONTHS,
      },
    });

    // 4. Append the immutable ledger event.
    await appendLedgerEvent(tx, {
      enterpriseId: employee.enterpriseId,
      eventType: "share_issued",
      payload: {
        action: "salary_to_equity_converted",
        employeeId: employee.id,
        userId: employee.userId,
        authorizedBy: user.id,
        equityConversionPct,
        monthlySalaryEgp: Number(employee.monthlySalaryEgp),
        convertedAmountEgp: verdict.convertedAmountEgp,
        equityUnitPriceEgp,
        discountedPriceEgp: verdict.discountedPriceEgp,
        equityUnitsIssued: verdict.equityUnitsToIssue,
        restrictedUntil: restrictedUntil.toISOString(),
        restrictedUntilMonths: DEFAULT_LOCKUP_MONTHS,
        ownershipRecordId: ownershipRecord.id,
        creDecisionToken: verdict.decisionToken,
        lockUpDecisionToken: lockUpVerdict.decisionToken,
        policy: verdict.policy,
        lockUpPolicy: lockUpVerdict.policy,
      },
      actorId: user.id,
    });

    return {
      ownershipRecordId: ownershipRecord.id,
      equityUnitsIssued: verdict.equityUnitsToIssue,
      restrictedUntil: restrictedUntil.toISOString(),
    };
  });

  logger.info("salary_to_equity converted", {
    employeeId: employee.id,
    enterpriseId: employee.enterpriseId,
    unitsIssued: result.equityUnitsIssued,
  });

  await audit({
    actorId: user.id,
    action: "salary_to_equity.convert",
    target: `employee:${employee.id}`,
    result: "allowed",
    metadata: {
      enterpriseId: employee.enterpriseId,
      equityConversionPct,
      convertedAmountEgp: verdict.convertedAmountEgp,
      discountedPriceEgp: verdict.discountedPriceEgp,
      equityUnitsIssued: verdict.equityUnitsToIssue,
      restrictedUntil: result.restrictedUntil,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      result: {
        employeeId: employee.id,
        enterpriseId: employee.enterpriseId,
        convertedAmountEgp: verdict.convertedAmountEgp,
        discountedPriceEgp: verdict.discountedPriceEgp,
        equityUnitsIssued: verdict.equityUnitsToIssue,
        restrictedUntil: result.restrictedUntil,
        creDecisionToken: verdict.decisionToken,
      },
    },
    { status: 201 }
  );
}, "POST /api/salary-to-equity");

// GET /api/salary-to-equity
// Returns the authenticated user's Employee records + the enterprise CPP so
// the converter UI can pre-populate. If the user has no Employee records,
// returns an empty list (the UI will hide the converter).
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");

  const where = enterpriseId
    ? { userId: user.id, enterpriseId }
    : { userId: user.id };

  const employees = await db.employee.findMany({
    where,
    include: {
      enterprise: {
        select: {
          id: true,
          name: true,
          slug: true,
          equityUnitPriceEgp: true,
        },
      },
    },
    orderBy: { hireDate: "desc" },
  });

  return NextResponse.json({
    employees: employees.map((e) => ({
      employeeId: e.id,
      enterpriseId: e.enterpriseId,
      enterpriseName: e.enterprise.name,
      enterpriseSlug: e.enterprise.slug,
      position: e.position,
      department: e.department,
      monthlySalaryEgp: Number(e.monthlySalaryEgp),
      equityUnitPriceEgp: Number(e.enterprise.equityUnitPriceEgp),
      currentEquityConversionPct: Number(e.equityConversionPct ?? 0),
      restrictedUntilMonths: DEFAULT_LOCKUP_MONTHS,
    })),
  });
}, "GET /api/salary-to-equity");

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
