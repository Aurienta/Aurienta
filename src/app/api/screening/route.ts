import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { parseBody, screeningSchema } from "@/lib/aurienta/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCREENING_AUTHORITY_ROLES = new Set([
  "founding_operator",
  "manager",
  "board_member",
]);

// GET /api/screening?enterpriseId=...
// Lists screening events for the caller's enterprises (sanctions / PEP /
// adverse-media).  If `enterpriseId` is provided the caller must be a member.
// @ts-ignore
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");

  const memberEnterpriseIds = user.memberships.map((m) => m.enterpriseId);
  if (memberEnterpriseIds.length === 0) {
    return NextResponse.json({ events: [], count: 0 });
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

  const events = await (db as any).screeningEvent.findMany({
    where,
    include: {
      enterprise: {
        select: { id: true, name: true, slug: true, tier: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ events, count: events.length });
}

// POST /api/screening
// Records a screening event.
//
// PRODUCTION WIRING (comment):
//   In production this endpoint is invoked by the screening provider's
//   webhook (Refinitiv World-Check / ComplyAdvantage / Dow Jones Risk &
//   Compliance / LexisNexis Bridger).  The webhook arrives with a
//   pre-shared HMAC signature that we verify against the request body
//   before persisting.  The screening is performed on EVERY counterparty
//   (and beneficial owner) before an L/C is issued or funds are released.
//   Hits with `resolution: "blocked"` block the downstream fund flow at
//   the CRE layer.
//
// SANDBOX BEHAVIOUR:
//   There is no real provider webhook in the sandbox.  The caller
//   self-reports the screening result for demo purposes — useful for
//   seeing how the screening trail integrates with the trade-finance
//   workflow and the audit log.  This is clearly marked in the audit
//   metadata so reviewers don't mistake self-reported results for
//   real provider verdicts.
// @ts-ignore
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rlResult = limiters.governance(user.id);
  if (!rlResult.allowed) {
    return rateLimitedResponse(rlResult.resetAt);
  }

  const body = await parseBody(req, screeningSchema);
  if (body instanceof NextResponse) return body;

  // ── RBAC (only when enterpriseId is supplied) ──
  // If no enterpriseId is supplied, the screening is treated as a
  // standalone / onboarding check (e.g. screening a prospective
  // counterparty before any enterprise is involved).
  let enterpriseName: string | null = null;
  if (body.enterpriseId) {
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
      SCREENING_AUTHORITY_ROLES.has(m.role)
    );
    if (!hasAuthority) {
      await audit({
        actorId: user.id,
        action: "screening.create",
        target: `enterprise:${body.enterpriseId}`,
        result: "denied",
        reason: "missing_screening_authority_role",
        metadata: { roles: memberships.map((m) => m.role) },
      });
      return NextResponse.json(
        {
          error:
            "Only founding_operator, manager, or board_member may register screening events",
          code: "rbac_denied",
        },
        { status: 403 }
      );
    }

    const ent = await db.enterprise.findUnique({
      where: { id: body.enterpriseId },
      select: { id: true, name: true },
    });
    if (!ent) {
      return NextResponse.json(
        { error: "Enterprise not found" },
        { status: 404 }
      );
    }
    enterpriseName = ent.name;
  }

  // ── Transactionally create the event + ledger event ──
  const event = await db.$transaction(async (tx) => {
    const created = await (tx as any).screeningEvent.create({
      data: {
        userId: user.id,
        enterpriseId: body.enterpriseId ?? null,
        counterpartyName: body.counterpartyName,
        counterpartyCountry: body.counterpartyCountry?.toUpperCase() ?? null,
        screeningType: body.screeningType,
        provider: body.provider,
        listsChecked: body.listsChecked,
        hits: body.hits,
        hitDetails: body.hitDetails ?? null,
        resolution: body.resolution ?? "pending",
        resolvedBy: body.resolution && body.resolution !== "pending" ? user.id : null,
        resolvedAt:
          body.resolution && body.resolution !== "pending" ? new Date() : null,
      },
    });

    // Only append a ledger event when tied to an enterprise.
    if (body.enterpriseId) {
      await appendLedgerEvent(tx, {
        enterpriseId: body.enterpriseId,
        eventType: "cre_decision",
        payload: {
          action: "screening_recorded",
          screeningEventId: created.id,
          counterpartyName: created.counterpartyName,
          counterpartyCountry: created.counterpartyCountry,
          screeningType: created.screeningType,
          provider: created.provider,
          hits: created.hits,
          resolution: created.resolution,
          recordedBy: user.id,
          selfReported: true, // sandbox flag — production sets this to false via webhook
          note:
            created.hits > 0
              ? `Screening recorded with ${created.hits} hit(s); resolution=${created.resolution}. ` +
                "Production: this would block downstream fund flow until cleared by compliance."
              : `Screening recorded — ${created.resolution}; no hits on ${created.listsChecked}.`,
        },
        actorId: user.id,
      });
    }

    return created;
  });

  await audit({
    actorId: user.id,
    action: "screening.create",
    target: body.enterpriseId ? `enterprise:${body.enterpriseId}` : "screening:standalone",
    result: "allowed",
    metadata: {
      eventId: event.id,
      counterpartyName: event.counterpartyName,
      screeningType: event.screeningType,
      provider: event.provider,
      hits: event.hits,
      resolution: event.resolution,
      selfReported: true, // sandbox
      enterpriseName,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}
