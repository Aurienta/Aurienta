import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/public/enterprise/[slug]/cre-decisions
 *
 * Public, PDPL-compliant CRE decision log. Returns governance decisions
 * recorded on the immutable ledger (eventType = "cre_decision").
 *
 * Actor is ANONYMIZED — actorId is never resolved to a personal name.
 * The decision token is truncated for display but remains verifiable.
 *
 * Legal basis: governance transparency (Article XIV); no personal data
 * is published (actor identities are masked as "Constitutional Partner"
 * or "System").
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1), 200);
  const cursorTs = url.searchParams.get("cursor")
    ? new Date(url.searchParams.get("cursor") as string)
    : null;

  const ent = await db.enterprise.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (!ent) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const where: Record<string, unknown> = {
    enterpriseId: ent.id,
    eventType: "cre_decision",
  };
  if (cursorTs && !Number.isNaN(cursorTs.getTime())) {
    where.timestamp = { lt: cursorTs };
  }

  const events = await db.ledgerEvent.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: limit + 1,
    select: {
      id: true,
      timestamp: true,
      payload: true,
      payloadHash: true,
      creDecisionToken: true,
      prevHash: true,
      sequence: true,
      actorId: true,
    },
  });

  const hasMore = events.length > limit;
  const items = events.slice(0, limit).map((ev) => {
    // Parse the payload for display — content varies by policy.
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(ev.payload) as Record<string, unknown>;
    } catch {
      parsed = { raw: ev.payload };
    }

    const policy =
      typeof parsed.policy === "string"
        ? parsed.policy
        : typeof parsed.action === "string"
        ? `${parsed.action}.rego`
        : "constitutional_policy.rego";

    const decision =
      typeof parsed.decision === "string"
        ? parsed.decision
        : typeof parsed.allowed === "boolean"
        ? parsed.allowed
          ? "allowed"
          : "denied"
        : "recorded";

    const reason =
      typeof parsed.reason === "string"
        ? parsed.reason
        : typeof parsed.detail === "string"
        ? parsed.detail
        : null;

    // PDPL: anonymize actor. Never resolve the actorId to a personal name.
    const actor = ev.actorId
      ? "Constitutional Partner"
      : "System";

    return {
      id: ev.id,
      timestamp: ev.timestamp.toISOString(),
      sequence: ev.sequence,
      policy,
      decision,
      reason,
      actor,
      // Truncate the token for display — full token remains verifiable
      // via the API payload hash + signature.
      decisionToken: ev.creDecisionToken
        ? `${ev.creDecisionToken.slice(0, 16)}…${ev.creDecisionToken.slice(-6)}`
        : null,
      payloadHash: ev.payloadHash,
      prevHash: ev.prevHash,
    };
  });

  const body = {
    enterprise: { slug: ent.slug, name: ent.name },
    decisions: items,
    pagination: {
      count: items.length,
      hasMore,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1].timestamp : null,
      limit,
    },
    constitutionalHash: CONSTITUTIONAL_HASH,
    legalNotice:
      "Personal data is protected under Egyptian PDPL Law 151/2020. Enterprise data is published per constitutional charter Article XIV.",
    disclaimer:
      "AURIENTA is a constitutional constitutional infrastructure, not an official government registry. Data is self-reported by enterprises and verified by the CRE.",
    fetchedAt: new Date().toISOString(),
  };

  const res = NextResponse.json(body);
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Aurienta-Constitutional-Api", "v1");
  res.headers.set("X-Aurienta-PDPL-Compliant", "151/2020");
  return res;
}
