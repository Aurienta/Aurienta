// AURIENTA — Enterprise Discovery Match API (Roadmap Phase 1)
// ═══════════════════════════════════════════════════════════════
// PATCH /api/discovery/[matchId]   → { action: "dismiss" | "invested" }
//
// Marks a DiscoveryMatch as dismissed or invested.
// Verifies ownership — 404 if not found, 403 if not the owner.
//
// Auth required. Audit-logged on every state change.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import {
  dismissMatch,
  markInvested,
  DiscoveryMatchError,
} from "@/lib/aurienta/enterprise-discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MatchAction = "dismiss" | "invested";

function parseAction(body: unknown): MatchAction | null {
  if (
    typeof body === "object" &&
    body !== null &&
    "action" in body &&
    typeof (body as { action: unknown }).action === "string"
  ) {
    const action = (body as { action: string }).action;
    if (action === "dismiss" || action === "invested") return action;
  }
  return null;
}

// PATCH /api/discovery/[matchId]
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ matchId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { matchId } = await ctx.params;
    if (!matchId) {
      return NextResponse.json(
        { error: "Missing matchId", code: "MISSING_PARAM" },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const action = parseAction(body);
    if (!action) {
      return NextResponse.json(
        {
          error: 'action must be "dismiss" or "invested"',
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    try {
      if (action === "dismiss") {
        await dismissMatch(matchId, user.id);
        await audit({
          actorId: user.id,
          action: "discovery.match.dismiss",
          target: `match:${matchId}`,
          result: "allowed",
          ip,
          userAgent,
        });
      } else {
        await markInvested(matchId, user.id);
        await audit({
          actorId: user.id,
          action: "discovery.match.invested",
          target: `match:${matchId}`,
          result: "allowed",
          ip,
          userAgent,
        });
      }
      return NextResponse.json({ ok: true, action });
    } catch (err) {
      if (err instanceof DiscoveryMatchError) {
        // Map to HTTP status — 404 for missing, 403 for non-owner.
        const status = err.status;
        await audit({
          actorId: user.id,
          action:
            action === "dismiss"
              ? "discovery.match.dismiss"
              : "discovery.match.invested",
          target: `match:${matchId}`,
          result: "denied",
          reason: err.message,
          ip,
          userAgent,
        });
        return NextResponse.json(
          {
            error: err.message,
            code: status === 404 ? "NOT_FOUND" : "FORBIDDEN",
          },
          { status }
        );
      }
      throw err;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[PATCH /api/discovery/[matchId]] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to update match", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
