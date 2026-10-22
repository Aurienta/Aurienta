// AURIENTA — ERP Timesheets API
// GET  /api/erp/timesheets  — list timesheets for caller's enterprises.
// POST /api/erp/timesheets  — log a new timesheet entry (draft status).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { parseBody, erpTimesheetCreateSchema } from "@/lib/aurienta/validation";
import { logTime, listTimesheets } from "@/lib/aurienta/erp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId") ?? "";
  const userId = url.searchParams.get("userId") ?? undefined;
  const memberships = user.memberships ?? [];
  const isRep = memberships.some((m) => m.role === "aurienta_rep");

  if (enterpriseId) {
    const isMember = memberships.some((m) => m.enterpriseId === enterpriseId);
    if (!isMember && !isRep) {
      return NextResponse.json(
        { error: "Forbidden", code: "forbidden" },
        { status: 403 }
      );
    }
    const timesheets = await listTimesheets(enterpriseId, userId);
    return NextResponse.json({ timesheets });
  }

  const entIds = isRep ? null : memberships.map((m) => m.enterpriseId);
  if (!entIds || entIds.length === 0) {
    return NextResponse.json({ timesheets: [] });
  }
  const { db } = await import("@/lib/db");
  const timesheets = await db.erpTimesheet.findMany({
    where: { enterpriseId: { in: entIds }, ...(userId ? { userId } : {}) },
    orderBy: { date: "desc" },
    take: 200,
  });
  return NextResponse.json({ timesheets });
}, "GET /api/erp/timesheets");

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }
  const body = await parseBody(req, erpTimesheetCreateSchema);
  if (body instanceof NextResponse) return body;

  const isMember = (user.memberships ?? []).some(
    (m) => m.enterpriseId === body.enterpriseId
  );
  const isRep = (user.memberships ?? []).some((m) => m.role === "aurienta_rep");
  if (!isMember && !isRep) {
    return NextResponse.json(
      { error: "You must be a member of the enterprise to log time.", code: "forbidden" },
      { status: 403 }
    );
  }

  const timesheet = await logTime({
    enterpriseId: body.enterpriseId,
    userId: user.id,
    projectId: body.projectId,
    taskId: body.taskId,
    date: new Date(body.date),
    hours: body.hours,
    description: body.description,
    billable: body.billable,
    hourlyRateEgp: body.hourlyRateEgp,
  });
  return NextResponse.json({ timesheet }, { status: 201 });
}, "POST /api/erp/timesheets");
