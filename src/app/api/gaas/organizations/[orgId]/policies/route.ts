// AURIENTA GaaS API — /api/gaas/organizations/[orgId]/policies
// ═══════════════════════════════════════════════════════════════════
//  GET  : list policies for an organization
//  POST : register a new policy (hashes ruleText, stores enforcementLogic JSON)
//
// Authorization: caller must be the org's contactEmail OR an AURIENTA Rep.
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import { db } from "@/lib/db";
import { listPolicies, registerPolicy } from "@/lib/aurienta/gaas";

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

// ── GET /api/gaas/organizations/[orgId]/policies ──
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
    const policies = await listPolicies(orgId);
    return NextResponse.json({ policies });
  } catch (e) {
    logger.error("[GET /api/gaas/.../policies] failed:", { err: String(e) });
    return NextResponse.json(
      { error: "Failed to list policies" },
      { status: 500 }
    );
  }
}

// ── POST /api/gaas/organizations/[orgId]/policies ──
// Body: { name, ruleText, enforcementLogic: { threshold, quorum } }
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
    name?: unknown;
    ruleText?: unknown;
    enforcementLogic?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body must be valid JSON" },
      { status: 400 }
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const ruleText = typeof body.ruleText === "string" ? body.ruleText : "";
  const el = body.enforcementLogic;
  const threshold =
    typeof el === "object" && el && typeof (el as Record<string, unknown>).threshold === "number"
      ? (el as { threshold: number }).threshold
      : null;
  const quorum =
    typeof el === "object" && el && typeof (el as Record<string, unknown>).quorum === "number"
      ? (el as { quorum: number }).quorum
      : null;

  if (name.length < 2 || name.length > 120) {
    return NextResponse.json(
      { error: "Policy name must be 2–120 characters" },
      { status: 400 }
    );
  }
  if (ruleText.length < 10 || ruleText.length > 12_000) {
    return NextResponse.json(
      { error: "Rule text must be 10–12000 characters" },
      { status: 400 }
    );
  }
  if (threshold === null || threshold < 0 || threshold > 100) {
    return NextResponse.json(
      { error: "Threshold must be a number 0–100" },
      { status: 400 }
    );
  }
  if (quorum === null || quorum < 1 || !Number.isFinite(quorum)) {
    return NextResponse.json(
      { error: "Quorum must be a positive integer" },
      { status: 400 }
    );
  }

  try {
    const policy = await registerPolicy({
      organizationId: orgId,
      name,
      ruleText,
      enforcementLogic: {
        threshold: Math.floor(threshold),
        quorum: Math.floor(quorum),
      },
    });

    await audit({
      actorId: user.id,
      action: "gaas.policy.register",
      target: `gaas_policy:${policy.id}`,
      result: "allowed",
      metadata: {
        organizationId: orgId,
        policyId: policy.id,
        name: policy.name,
        ruleHash: policy.ruleHash,
        threshold: Math.floor(threshold),
        quorum: Math.floor(quorum),
      },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ policy }, { status: 201 });
  } catch (e) {
    logger.error("[POST /api/gaas/.../policies] failed:", { err: String(e) });
    return NextResponse.json(
      { error: "Failed to register policy" },
      { status: 500 }
    );
  }
}
