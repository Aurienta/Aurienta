// AURIENTA GaaS API — /api/gaas/organizations/[orgId]/decisions
// ═══════════════════════════════════════════════════════════════════
//  GET  : list decisions for an organization
//  POST : evaluate a decision against a policy via the CRE
//
// The CRE enforces the policy's threshold + quorum on the supplied
// approverCount. Verdict is stored hash-chained on the immutable ledger.
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import { db } from "@/lib/db";
import { evaluateDecision, listDecisions } from "@/lib/aurienta/gaas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ orgId: string }> };

async function authorizeOrgAccess(
  orgId: string,
  userEmail: string,
  isAurientaRep: boolean
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const org = await db.gaasOrganization.findUnique({
    where: { id: orgId },
    select: { id: true, contactEmail: true, active: true },
  });
  if (!org || !org.active) {
    return { ok: false, status: 404, error: "Organization not found" };
  }
  if (org.contactEmail.toLowerCase() !== userEmail.toLowerCase() && !isAurientaRep) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true };
}

// ── GET /api/gaas/organizations/[orgId]/decisions ──
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const { orgId } = await params;
  const isAurientaRep = user.memberships.some((m) => m.role === "aurienta_rep");
  const auth = await authorizeOrgAccess(orgId, user.email, isAurientaRep);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const decisions = await listDecisions(orgId);
    return NextResponse.json({ decisions });
  } catch (e) {
    logger.error("[GET /api/gaas/.../decisions] failed:", { err: String(e) });
    return NextResponse.json(
      { error: "Failed to list decisions" },
      { status: 500 }
    );
  }
}

// ── POST /api/gaas/organizations/[orgId]/decisions ──
// Body: { policyId, decisionText, actorEmail, approverCount }
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const { orgId } = await params;
  const isAurientaRep = user.memberships.some((m) => m.role === "aurienta_rep");
  const auth = await authorizeOrgAccess(orgId, user.email, isAurientaRep);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: {
    policyId?: unknown;
    decisionText?: unknown;
    actorEmail?: unknown;
    approverCount?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body must be valid JSON" },
      { status: 400 }
    );
  }

  const policyId = typeof body.policyId === "string" ? body.policyId.trim() : "";
  const decisionText = typeof body.decisionText === "string" ? body.decisionText : "";
  const actorEmail =
    typeof body.actorEmail === "string" ? body.actorEmail.trim().toLowerCase() : "";
  const approverCountRaw = body.approverCount;
  const approverCount =
    typeof approverCountRaw === "number" && Number.isFinite(approverCountRaw)
      ? Math.max(0, Math.floor(approverCountRaw))
      : typeof approverCountRaw === "string" && /^\d+$/.test(approverCountRaw)
        ? parseInt(approverCountRaw, 10)
        : null;

  if (!policyId) {
    return NextResponse.json({ error: "policyId required" }, { status: 400 });
  }
  if (decisionText.length < 4 || decisionText.length > 12_000) {
    return NextResponse.json(
      { error: "Decision text must be 4–12000 characters" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(actorEmail)) {
    return NextResponse.json(
      { error: "Invalid actor email" },
      { status: 400 }
    );
  }
  if (approverCount === null || approverCount < 0) {
    return NextResponse.json(
      { error: "approverCount must be a non-negative integer" },
      { status: 400 }
    );
  }

  try {
    const result = await evaluateDecision({
      organizationId: orgId,
      policyId,
      decisionText,
      actorEmail,
      approverCount,
    });

    await audit({
      actorId: user.id,
      action: "gaas.decision.evaluate",
      target: `gaas_decision:${result.decision.id}`,
      result: result.verdict === "allowed" ? "allowed" : "denied",
      reason: result.reason,
      metadata: {
        organizationId: orgId,
        policyId,
        decisionId: result.decision.id,
        verdict: result.verdict,
        approverCount,
        decisionHash: result.decision.decisionHash,
        decisionToken: result.decisionToken ?? null,
      },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json(
      {
        decision: result.decision,
        verdict: result.verdict,
        reason: result.reason ?? null,
        decisionToken: result.decisionToken ?? null,
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("not found") || msg.includes("inactive")) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    logger.error("[POST /api/gaas/.../decisions] failed:", { err: String(e) });
    return NextResponse.json(
      { error: "Failed to evaluate decision" },
      { status: 500 }
    );
  }
}
