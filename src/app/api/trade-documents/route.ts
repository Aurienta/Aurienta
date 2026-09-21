import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { parseBody, tradeDocumentSchema } from "@/lib/aurienta/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRADE_AUTHORITY_ROLES = new Set([
  "founding_operator",
  "manager",
  "board_member",
]);

// POST /api/trade-documents
// Uploads a trade-document REFERENCE (metadata + IPFS CID, NOT the file
// itself — AURIENTA never holds trade-document files; they live on IPFS /
// Filecoin and we pin only the CID).  Auth + RBAC: founding_operator /
// manager / board_member of the enterprise.  Wrapped in db.$transaction
// with a hash-chained `trade_document_release` ledger event.
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

  const body = await parseBody(req, tradeDocumentSchema);
  if (body instanceof NextResponse) return body;

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
    TRADE_AUTHORITY_ROLES.has(m.role)
  );
  if (!hasAuthority) {
    await audit({
      actorId: user.id,
      action: "trade_document.create",
      target: `enterprise:${body.enterpriseId}`,
      result: "denied",
      reason: "missing_trade_authority_role",
      metadata: { roles: memberships.map((m) => m.role) },
    });
    return NextResponse.json(
      {
        error:
          "Only founding_operator, manager, or board_member may register trade documents",
        code: "rbac_denied",
      },
      { status: 403 }
    );
  }

  // ── Validate enterprise exists ──
  const enterprise = await db.enterprise.findUnique({
    where: { id: body.enterpriseId },
    select: { id: true, name: true, slug: true },
  });
  if (!enterprise) {
    return NextResponse.json(
      { error: "Enterprise not found" },
      { status: 404 }
    );
  }

  // ── Validate trade instrument (optional) ──
  type LinkedInstrument = {
    id: string;
    enterpriseId: string;
    instrumentNumber: string;
    type: string;
  } | null;
  let tradeInstrument: LinkedInstrument = null;
  if (body.tradeInstrumentId) {
    const found = await (db as any).tradeInstrument.findUnique({
      where: { id: body.tradeInstrumentId },
      select: { id: true, enterpriseId: true, instrumentNumber: true, type: true },
    });
    if (!found) {
      return NextResponse.json(
        { error: "Trade instrument not found" },
        { status: 404 }
      );
    }
    if (found.enterpriseId !== body.enterpriseId) {
      return NextResponse.json(
        { error: "Trade instrument does not belong to this enterprise" },
        { status: 400 }
      );
    }
    tradeInstrument = found;
  }

  const issueDate = body.issueDate ? new Date(body.issueDate) : null;

  // ── Transactionally create the document + ledger event ──
  const document = await db.$transaction(async (tx) => {
    const created = await (tx as any).tradeDocument.create({
      data: {
        enterpriseId: body.enterpriseId,
        tradeInstrumentId: body.tradeInstrumentId ?? null,
        type: body.type,
        documentNumber: body.documentNumber ?? null,
        nafezaAciNumber: body.nafezaAciNumber ?? null,
        issuingAuthority: body.issuingAuthority ?? null,
        ipfsCid: body.ipfsCid ?? null,
        contentHash: body.contentHash ?? null,
        currency: body.currency?.toUpperCase() ?? null,
        amount: body.amount ?? null,
        issueDate,
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: body.enterpriseId,
      eventType: "trade_document_release",
      payload: {
        action: "trade_document_registered",
        documentId: created.id,
        type: created.type,
        documentNumber: created.documentNumber,
        nafezaAciNumber: created.nafezaAciNumber,
        issuingAuthority: created.issuingAuthority,
        ipfsCid: created.ipfsCid,
        contentHash: created.contentHash,
        currency: created.currency,
        amount: created.amount,
        issueDate: created.issueDate?.toISOString() ?? null,
        tradeInstrumentId: created.tradeInstrumentId,
        tradeInstrumentNumber: tradeInstrument?.instrumentNumber ?? null,
        registeredBy: user.id,
        note:
          created.nafezaAciNumber
            ? `Trade document registered with Nafeza/ACI pre-registration ${created.nafezaAciNumber}.`
            : "Trade document reference registered on the immutable ledger.",
      },
      actorId: user.id,
    });

    return created;
  });

  await audit({
    actorId: user.id,
    action: "trade_document.create",
    target: `enterprise:${body.enterpriseId}`,
    result: "allowed",
    metadata: {
      documentId: document.id,
      type: document.type,
      ipfsCid: document.ipfsCid,
      nafezaAciNumber: document.nafezaAciNumber,
      tradeInstrumentId: document.tradeInstrumentId,
    },
  });

  return NextResponse.json({ document }, { status: 201 });
}
