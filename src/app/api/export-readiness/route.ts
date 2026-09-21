import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from '@/lib/aurienta/api-handler';
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { parseBody, exportReadinessSchema } from "@/lib/aurienta/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const READINESS_AUTHORITY_ROLES = new Set([
  "founding_operator",
  "manager",
  "board_member",
]);

// GET /api/export-readiness?enterpriseId=...
// Lists export-readiness checks for the caller's enterprises.
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");

  const memberEnterpriseIds = user.memberships.map((m) => m.enterpriseId);
  if (memberEnterpriseIds.length === 0) {
    return NextResponse.json({ checks: [], count: 0 });
  }

  if (enterpriseId && !memberEnterpriseIds.includes(enterpriseId)) {
    return NextResponse.json(
      { error: "Not a member of this enterprise" },
      { status: 403 }
    );
  }

  const where = enterpriseId
    ? { enterpriseId }
    : { enterpriseId: { in: memberEnterpriseIds } };

  const checks = await db.enterpriseUpdate.findMany({
    where,
    include: {
      enterprise: {
        select: { id: true, name: true, slug: true, tier: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ checks, count: checks.length });
}, "GET /api/export-readiness");

// POST /api/export-readiness
// Adds (or updates) an export-readiness check.  Auth + RBAC: founding_operator /
// manager / board_member.  Used as one of the graduation gates for trade-exposed
// sectors (agriculture, manufacturing, food, retail, logistics).
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rlResult = limiters.governance(user.id);
  if (!rlResult.allowed) {
    return rateLimitedResponse(rlResult.resetAt);
  }

  const body = await parseBody(req, exportReadinessSchema);
  if (body instanceof NextResponse) return body as NextResponse;

  // ── RBAC ──
  const memberships = user.memberships.filter(
    (m) => m.enterpriseId === body.enterpriseId
  );
  if (memberships.length === 0) {
    return NextResponse.json(
      { error: "Not a member of this enterprise" },
      { status: 403 }
    );
  }
  const hasAuthority = memberships.some((m) =>
    READINESS_AUTHORITY_ROLES.has(m.role)
  );
  if (!hasAuthority) {
    await audit({
      actorId: user.id,
      action: "export_readiness.create",
      target: `enterprise:${body.enterpriseId}`,
      result: "denied",
      reason: "missing_readiness_authority_role",
      metadata: { roles: memberships.map((m) => m.role) },
    });
    return NextResponse.json(
      {
        error:
          "Only founding_operator, manager, or board_member may register export-readiness checks",
        code: "rbac_denied",
      },
      { status: 403 }
    );
  }

  const enterprise = await db.enterprise.findUnique({
    where: { id: body.enterpriseId },
    select: { id: true, name: true, slug: true, tier: true },
  });
  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found" },
      { status: 404 }
    );
  }

  const verifiedAt = body.createdAt ? new Date(body.createdAt) : null;
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  // Auto-expire: if expiresAt has passed and caller didn't explicitly
  // mark the status, treat as expired.
  let status = body.status ?? "submitted";
  if (expiresAt && expiresAt.getTime() < Date.now() && status === "verified") {
    status = "expired";
  }

  // ── Create an enterprise update for the export readiness check ──
  const check = await db.enterpriseUpdate.create({
    data: {
      enterpriseId: body.enterpriseId,
      authorId: user.id,
      title: `Export Readiness: ${body.market}`,
      body: body.productDescription,
      aiSummary: `Export readiness check for ${body.market} market`,
      isMilestone: false,
    },
  });

  // Ledger event for the export readiness check
  await appendLedgerEvent(db, {
    enterpriseId: body.enterpriseId,
    eventType: "cre_decision",
    payload: {
      action: "export_readiness_recorded",
      checkId: check.id,
      market: body.market,
      status: status,
      recordedBy: user.id,
    },
    actorId: user.id,
  });

  await audit({
    actorId: user.id,
    action: "export_readiness.create",
    target: `enterprise:${body.enterpriseId}`,
    result: "allowed",
    metadata: {
      checkId: check.id,
      category: "export",
      name: body.market,
      status: status,
      enterpriseName: enterprise.name,
    },
  });

  return NextResponse.json({ check }, { status: 201 });
}, "POST /api/export-readiness");
