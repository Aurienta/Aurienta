import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { parseBody, tradeInstrumentSchema } from "@/lib/aurienta/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Roles that may issue / amend trade-finance instruments on behalf of an
// enterprise.  Aligned with the constitutional role taxonomy in §1.9.1.
const TRADE_AUTHORITY_ROLES = new Set([
  "founding_operator",
  "manager",
  "board_member",
]);

// GET /api/trade-instruments?enterpriseId=...
// Lists trade instruments for the caller's enterprises.  If `enterpriseId`
// is provided the caller must be a member of that enterprise.  Includes
// bankPartner and documents relations.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");

  const memberEnterpriseIds = user.memberships.map((m) => m.enterpriseId);
  if (memberEnterpriseIds.length === 0) {
    return NextResponse.json({ instruments: [], count: 0 });
  }

  if (enterpriseId) {
    if (!memberEnterpriseIds.includes(enterpriseId)) {
      return NextResponse.json(
        { error: "Not a member of this enterprise" },
        { status: 403 }
      );
    }
  }

  const where = enterpriseId
    ? { enterpriseId }
    : { enterpriseId: { in: memberEnterpriseIds } };

  const instruments = await db.tradeInstrument.findMany({
    where,
    include: {
      bankPartner: true,
      documents: { orderBy: { createdAt: "desc" } },
      enterprise: { select: { id: true, name: true, slug: true, tier: true } },
    },
    orderBy: { issueDate: "desc" },
  });

  return NextResponse.json({
    instruments,
    count: instruments.length,
  });
}

// POST /api/trade-instruments
// Creates a new trade-finance instrument (L/C, guarantee, collection, APG,
// standby L/C).  Auth + RBAC: founding_operator, manager, or board_member.
// Wrapped in db.$transaction with a hash-chained `trade_instrument_issued`
// ledger event.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rlResult = limiters.governance(user.id);
  if (!rlResult.allowed) {
    return rateLimitedResponse(rlResult.resetAt);
  }

  const body = await parseBody(req, tradeInstrumentSchema);
  if (body instanceof NextResponse) return body;

  // ── RBAC: must hold a trade-authority role in this enterprise ──
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
    TRADE_AUTHORITY_ROLES.has(m.role)
  );
  if (!hasAuthority) {
    await audit({
      actorId: user.id,
      action: "trade_instrument.create",
      target: `enterprise:${body.enterpriseId}`,
      result: "denied",
      reason: "missing_trade_authority_role",
      metadata: { roles: memberships.map((m) => m.role) },
    });
    return NextResponse.json(
      {
        error:
          "Only founding_operator, manager, or board_member may issue trade-finance instruments",
        code: "rbac_denied",
      },
      { status: 403 }
    );
  }

  // ── Validate enterprise + bank partner ──
  const enterprise = await db.enterprise.findUnique({
    where: { id: body.enterpriseId },
    select: { id: true, name: true, slug: true, tier: true, status: true },
  });
  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found" },
      { status: 404 }
    );
  }

  const bankPartner = await db.bankPartner.findUnique({
    where: { id: body.bankPartnerId },
  });
  if (!bankPartner || bankPartner.status !== "active") {
    return NextResponse.json(
      { error: "Bank partner not found or not active" },
      { status: 400 }
    );
  }

  // Bank must support the instrument type (L/C vs guarantee family).
  const isGuaranteeFamily =
    body.type === "guarantee" ||
    body.type === "advance_payment_guarantee" ||
    body.type === "standby_lc";
  if (body.type === "lc" && !bankPartner.supportsLc) {
    return NextResponse.json(
      { error: "Bank partner does not issue Letters of Credit" },
      { status: 400 }
    );
  }
  if (isGuaranteeFamily && !bankPartner.supportsGuarantees) {
    return NextResponse.json(
      { error: "Bank partner does not issue guarantees" },
      { status: 400 }
    );
  }

  // Instrument number must be unique (bank-issued reference).
  const existing = await db.tradeInstrument.findUnique({
    where: { instrumentNumber: body.instrumentNumber },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "instrumentNumber already exists", code: "duplicate" },
      { status: 409 }
    );
  }

  const expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;

  // ── Transactionally create the instrument + ledger event ──
  const instrument = await db.$transaction(async (tx) => {
    const created = await tx.tradeInstrument.create({
      data: {
        enterpriseId: body.enterpriseId,
        bankPartnerId: body.bankPartnerId,
        type: body.type,
        instrumentNumber: body.instrumentNumber,
        underlyingRule: body.underlyingRule,
        currency: body.currency.toUpperCase(),
        amount: body.amount,
        counterparty: body.counterparty,
        counterpartyCountry: body.counterpartyCountry?.toUpperCase() ?? null,
        portOfLoading: body.portOfLoading ?? null,
        portOfDischarge: body.portOfDischarge ?? null,
        incoterms: body.incoterms ?? null,
        hsCode: body.hsCode ?? null,
        status: "issued",
        expiryDate,
      },
      include: { bankPartner: true },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: body.enterpriseId,
      eventType: "trade_instrument_issued",
      payload: {
        action: "trade_instrument_issued",
        instrumentId: created.id,
        instrumentNumber: created.instrumentNumber,
        type: created.type,
        underlyingRule: created.underlyingRule,
        currency: created.currency,
        amount: created.amount,
        counterparty: created.counterparty,
        counterpartyCountry: created.counterpartyCountry,
        bankPartnerId: created.bankPartnerId,
        bankPartnerName: created.bankPartner.name,
        portOfLoading: created.portOfLoading,
        portOfDischarge: created.portOfDischarge,
        incoterms: created.incoterms,
        hsCode: created.hsCode,
        expiryDate: created.expiryDate?.toISOString() ?? null,
        issuedBy: user.id,
        note: `Trade-finance instrument issued under ${created.underlyingRule} via ${created.bankPartner.name}.`,
      },
      actorId: user.id,
    });

    return created;
  });

  await audit({
    actorId: user.id,
    action: "trade_instrument.create",
    target: `enterprise:${body.enterpriseId}`,
    result: "allowed",
    metadata: {
      instrumentId: instrument.id,
      instrumentNumber: instrument.instrumentNumber,
      type: instrument.type,
      currency: instrument.currency,
      amount: instrument.amount,
      bankPartnerId: instrument.bankPartnerId,
    },
  });

  return NextResponse.json({ instrument }, { status: 201 });
}
