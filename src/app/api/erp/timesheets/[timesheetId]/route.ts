// AURIENTA — ERP Timesheet Detail API
// PATCH /api/erp/timesheets/[timesheetId] — approve or reject a timesheet entry.
// Calls enforceTimesheetApproval CRE policy (manager+ role, max daily hours).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpTimesheetPatchSchema } from "@/lib/aurienta/validation";
import { approveTimesheet } from "@/lib/aurienta/erp";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ timesheetId: string }> };

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: Params) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const { timesheetId } = await ctx.params;
  const body = await parseBody(req, erpTimesheetPatchSchema);
  if (body instanceof NextResponse) return body;

  const ts = await db.erpTimesheet.findUnique({
    where: { id: timesheetId },
    select: { enterpriseId: true, status: true },
  });
  if (!ts) {
    return NextResponse.json(
      { error: "Timesheet not found", code: "not_found" },
      { status: 404 }
    );
  }

  const membership = (user.memberships ?? []).find(
    (m) => m.enterpriseId === ts.enterpriseId
  );
  const isManager =
    membership &&
    ["manager", "founding_operator", "board_member", "company_owner"].includes(
      membership.role
    );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isManager && !isRep) {
    return NextResponse.json(
      { error: "Only an enterprise manager may approve timesheets.", code: "forbidden" },
      { status: 403 }
    );
  }

  if (body.action === "reject") {
    // Reject — flip to rejected status directly without CRE.
    if (ts.status !== "submitted") {
      return NextResponse.json(
        { error: `Cannot reject timesheet in status '${ts.status}'`, code: "invalid_state" },
        { status: 409 }
      );
    }
    const updated = await db.erpTimesheet.update({
      where: { id: timesheetId },
      data: {
        status: "rejected",
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });
    return NextResponse.json({ timesheet: updated });
  }

  // action === "approve"
  try {
    const approverRole = membership?.role ?? "manager";
    const { timesheet, verdict } = await approveTimesheet(
      timesheetId,
      user.id,
      approverRole
    );
    if (!verdict.allowed) {
      return NextResponse.json(
        {
          error: verdict.reason ?? "Timesheet approval denied by CRE policy.",
          code: "cre_denied",
          verdict,
          timesheet,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ timesheet, verdict });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not approve timesheet.";
    return NextResponse.json(
      { error: msg, code: "invalid_state" },
      { status: 409 }
    );
  }
}, "PATCH /api/erp/timesheets/[timesheetId]");
