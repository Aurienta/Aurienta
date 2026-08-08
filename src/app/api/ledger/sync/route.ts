import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/ledger/sync
// Oracle Mirror sync checkpoint — appends an `oracle_mirror_sync` LedgerEvent
// to the immutable hash-chained ledger and returns the resulting hash + ISO
// timestamp.  Used by the Oracle Mirror page to record a "generate physical
// copy" action so the page reflects real state instead of hardcoded data.
//
// Body (optional):
//   { enterpriseId?: string, note?: string }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { enterpriseId, note } = body ?? {};

  // If an enterpriseId is supplied, verify the caller is a member so that
  // arbitrary users cannot pollute another enterprise's hash-chain.
  if (typeof enterpriseId === "string" && enterpriseId.length > 0) {
    const isMember =
      user.memberships.some((m) => m.enterpriseId === enterpriseId) ||
      user.ownershipRecords.some((s) => s.enterpriseId === enterpriseId);
    if (!isMember) {
      await audit({
        actorId: user.id,
        action: "oracle_mirror.sync",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: "not_a_member",
      });
      return NextResponse.json(
        { error: "Not a member of this enterprise" },
        { status: 403 }
      );
    }
  }

  const result = await db.$transaction(async (tx) => {
    return appendLedgerEvent(tx, {
      enterpriseId: typeof enterpriseId === "string" && enterpriseId.length > 0 ? enterpriseId : undefined,
      eventType: "oracle_mirror_sync",
      payload: { note: note || "Oracle Mirror sync checkpoint", actor: user.legalName },
      actorId: user.id,
    });
  });

  await audit({
    actorId: user.id,
    action: "oracle_mirror.sync",
    target: enterpriseId || undefined,
    result: "allowed",
  });

  return NextResponse.json({
    ok: true,
    hash: result.payloadHash,
    sequence: result.sequence,
    timestamp: new Date().toISOString(),
  });
}
