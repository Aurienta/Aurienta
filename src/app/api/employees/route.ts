import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { employeeSchema, parseBody } from "@/lib/aurienta/validation";
import {
  buildViewerContext,
  sanitizeEmployeeListForViewer,
  type ViewerContext,
} from "@/lib/aurienta/transparency";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";

// GET /api/employees?enterpriseId=xxx
// Returns the sanitized Employee Registry for the authenticated viewer.
// Per §8.6.2 all Constitutional Partners see the Employee Registry (positions,
// departments, hire dates). Salary BANDS are visible only to enterprise
// members; exact salary is gated by canSeeExactSalary. Protected personal
// data (NOSI number, national ID, home address, phone, medical) is never
// exposed.
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const enterpriseId = url.searchParams.get("enterpriseId");
    if (!enterpriseId) {
      return NextResponse.json(
        { error: "enterpriseId query parameter is required" },
        { status: 400 },
      );
    }

    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: { id: true, name: true, slug: true },
    });
    if (!enterprise) {
      return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
    }

    // Fetch the raw employee records. `userId` is needed for the self-check
    // in sanitizeEmployeeForViewer; it is stripped from the response.
    const employees = await db.employee.findMany({
      where: { enterpriseId },
      orderBy: { hireDate: "desc" },
      select: {
        id: true,
        userId: true,
        position: true,
        department: true,
        hireDate: true,
        employmentType: true,
        compensationBand: true,
        monthlySalaryEgp: true,
        nosiStatus: true,
        nosiNumber: true,
        keyPerson: true,
        equityConversionPct: true,
      },
    });

    // Build the viewer context from the user's memberships in this enterprise.
    let viewer: ViewerContext | null = buildViewerContext(
      user.memberships,
      user.id,
      enterpriseId,
    );
    if (!viewer) {
      // External viewer — sees the public Employee Registry only (no salary
      // or band data). Treat them as an external capital_partner.
      viewer = {
        role: "capital_partner",
        userId: user.id,
        enterpriseId: "__external_viewer__",
        isBoardMember: false,
        isManager: false,
      };
    }

    const sanitized = sanitizeEmployeeListForViewer(
      employees.map((e) => ({
        ...e,
        // Employee.status is not currently a DB column; default to "active".
        status: "active",
      })),
      viewer,
    );

    return NextResponse.json({
      enterprise: { id: enterprise.id, name: enterprise.name, slug: enterprise.slug },
      employees: sanitized,
      total: sanitized.length,
    });
  } catch (error) {
    logger.error("Employee registry fetch failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch employee registry" },
      { status: 500 },
    );
  }
}

// POST /api/employees
// Two modes (detected from body shape):
//   Update equity conversion: { employeeId, equityConversionPct }
//   Enroll new employee:      { enterpriseId, userId, position, department, monthlySalaryEgp, compensationBand?, employmentType? }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await parseBody(req, employeeSchema);
  if (body instanceof NextResponse) return body;

  // ── Mode 1: update equity conversion % ──
  if (body.employeeId && body.equityConversionPct !== undefined) {
    const pctVal = Number(body.equityConversionPct);
    if (!Number.isFinite(pctVal) || pctVal < 0 || pctVal > 10) {
      return NextResponse.json(
        { error: "equityConversionPct must be a number between 0 and 10" },
        { status: 400 }
      );
    }

    const employee = await db.employee.findUnique({
      where: { id: body.employeeId },
      include: { enterprise: true, user: true },
    });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Allowed: the employee themselves, OR a manager / board member / founding_operator of the enterprise.
    const isSelf = employee.userId === user.id;
    const memberships = user.memberships.filter((m) => m.enterpriseId === employee.enterpriseId);
    const canManage = memberships.some((m) =>
      ["manager", "board_member", "founding_operator"].includes(m.role)
    );
    if (!isSelf && !canManage) {
      return NextResponse.json(
        { error: "Not authorised to set equity conversion for this employee" },
        { status: 403 }
      );
    }

    const updated = await db.employee.update({
      where: { id: employee.id },
      data: { equityConversionPct: pctVal },
    });

    await db.$transaction(async (tx) => {
      await appendLedgerEvent(tx, {
        enterpriseId: employee.enterpriseId,
        eventType: "cre_decision",
        payload: {
          action: "equity_conversion_updated",
          employeeId: employee.id,
          userId: employee.userId,
          previousPct: employee.equityConversionPct,
          newPct: pctVal,
          monthlySalaryEgp: employee.monthlySalaryEgp,
          selfSet: isSelf,
        },
        actorId: user.id,
      });
    });

    return NextResponse.json({ ok: true, employee: updated });
  }

  // ── Mode 2: enroll a new employee ──
  const {
    enterpriseId,
    userId,
    email,
    position,
    department,
    monthlySalaryEgp,
    compensationBand,
    employmentType,
  } = body;

  if (
    !enterpriseId ||
    (!userId && !email) ||
    !position ||
    !department ||
    monthlySalaryEgp === undefined
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const salary = Number(monthlySalaryEgp);
  if (!Number.isFinite(salary) || salary < 0) {
    return NextResponse.json(
      { error: "monthlySalaryEgp must be a non-negative number" },
      { status: 400 }
    );
  }

  const enterprise = await db.enterprise.findUnique({ where: { id: enterpriseId } });
  if (!enterprise) {
    return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
  }

  // Resolve the target user: either by id, or by email (a soft lookup).
  let targetUser;
  if (userId) {
    targetUser = await db.user.findUnique({ where: { id: userId } });
  } else if (email) {
    targetUser = await db.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
  }
  if (!targetUser) {
    return NextResponse.json(
      { error: "User not found — invite them to AURIENTA first, then re-enrol" },
      { status: 404 }
    );
  }

  // Authorisation: manager / board_member / founding_operator of this enterprise.
  const memberships = user.memberships.filter((m) => m.enterpriseId === enterpriseId);
  const canEnroll = memberships.some((m) =>
    ["manager", "board_member", "founding_operator"].includes(m.role)
  );
  if (!canEnroll) {
    return NextResponse.json(
      { error: "Not authorised to enrol employees in this enterprise" },
      { status: 403 }
    );
  }

  // Prevent duplicate enrolment.
  const existing = await db.employee.findFirst({
    where: { enterpriseId, userId: targetUser.id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "This user is already enrolled as a workforce partner" },
      { status: 409 }
    );
  }

  const band =
    compensationBand && compensationBand.trim().length > 0
      ? compensationBand.trim()
      : `${Math.round(salary).toLocaleString("en-US")}-${Math.round(salary * 1.3).toLocaleString("en-US")} EGP`;

  const employee = await db.employee.create({
    data: {
      enterpriseId,
      userId: targetUser.id,
      position: position.trim(),
      department: department.trim(),
      monthlySalaryEgp: Math.round(salary),
      compensationBand: band,
      employmentType: employmentType ?? "full_time",
      hireDate: new Date(),
      nosiStatus: "pending",
      equityConversionPct: 0,
    },
  });

  // Bump the enterprise employee counter for downstream vital signs.
  await db.enterprise.update({
    where: { id: enterpriseId },
    data: { employeeCount: { increment: 1 } },
  });

  await db.$transaction(async (tx) => {
    await appendLedgerEvent(tx, {
      enterpriseId,
      eventType: "cre_decision",
      payload: {
        action: "employee_enrolled",
        employeeId: employee.id,
        userId: targetUser.id,
        legalName: targetUser.legalName,
        position: employee.position,
        department: employee.department,
        monthlySalaryEgp: employee.monthlySalaryEgp,
        nosiStatus: "pending",
      },
      actorId: user.id,
    });
  });

  return NextResponse.json({ ok: true, employee });
}
