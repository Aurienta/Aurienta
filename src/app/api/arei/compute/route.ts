// AURIENTA — AREI manual recompute endpoint
// ═══════════════════════════════════════════════════════════════
// POST /api/arei/compute
//
// Manually triggers a fresh AREI snapshot computation for the current
// Africa/Cairo date. Restricted to aurienta_rep — this is an admin
// maintenance action, not a routine read.
//
// Returns the freshly-computed snapshot. The recompute is idempotent
// (upsert on unique date), so it is safe to call multiple times a day.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { audit } from "@/lib/aurienta/audit";
import { computeAreiSnapshot, getConstituents } from "@/lib/aurienta/arei";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DISCLAIMER =
  "AREI is an informational benchmark, NOT investment advice. Past performance does not indicate future results.";

export const POST = withErrorHandler(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  // RBAC — only aurienta_rep may trigger a manual recompute.
  const isRep =
    user.memberships.some((m) => m.role === "aurienta_rep") ||
    user.primaryIntent === "aurienta_rep";
  if (!isRep) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;
    await audit({
      actorId: user.id,
      action: "arei.recompute",
      target: "arei:latest",
      result: "denied",
      reason: "Requires aurienta_rep role",
      ip,
      userAgent,
    }).catch(() => {});
    return NextResponse.json(
      {
        error: "Forbidden: requires aurienta_rep role",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );
  }

  const snapshot = await computeAreiSnapshot();
  const constituents = await getConstituents();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;
  await audit({
    actorId: user.id,
    action: "arei.recompute",
    target: "arei:latest",
    result: "allowed",
    metadata: {
      snapshotDate: snapshot.date,
      indexValue: snapshot.indexValue,
      changePct: snapshot.changePct,
      constituentCount: snapshot.constituentCount,
    },
    ip,
    userAgent,
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    disclaimer: DISCLAIMER,
    snapshot,
    constituents,
  });
});
