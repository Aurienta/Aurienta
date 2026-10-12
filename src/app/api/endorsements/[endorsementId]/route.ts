// /api/endorsements/[endorsementId] — PATCH resolve an endorsement.
//
// PATCH body: { outcome: "success" | "failure" }
//
// Only the founder / manager / company_owner / board_member of the
// enterprise the endorsement targets may resolve it. Reputation delta
// (+/- stakeSts) is applied to the endorser's sovereignTrustScore inside
// the same transaction as the endorsement update + ledger event.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { resolveEndorsement } from "@/lib/aurienta/constitutional-endorsement";

// ── Roles allowed to resolve an endorsement ──
// "Manager/founder only" — the founder, manager, company_owner, or
// board_member of the targeted enterprise. AURIENTA reps also have
// constitutional authority to resolve (auditor role).
const RESOLVE_ROLES = new Set([
  "founding_operator",
  "manager",
  "company_owner",
  "board_member",
  "aurienta_rep",
]);

const resolveSchema = z.object({
  outcome: z.enum(["success", "failure"]),
});

// ── PATCH /api/endorsements/[endorsementId] ──
export const PATCH = withErrorHandler(
  async (
    req: NextRequest,
    ctx: { params: Promise<{ endorsementId: string }> }
  ) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { params } = ctx;
    const { endorsementId } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "invalid_body", message: "Body must be valid JSON" },
        { status: 400 }
      );
    }
    const parsed = resolveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "invalid_body",
          message: parsed.error.issues[0]?.message ?? "Validation failed",
        },
        { status: 400 }
      );
    }

    // ── Load the endorsement (with its enterprise) to check role ──
    const endorsement = await db.constitutionalEndorsement.findUnique({
      where: { id: endorsementId },
      select: {
        id: true,
        endorserId: true,
        enterpriseId: true,
        active: true,
        outcome: true,
      },
    });
    if (!endorsement) {
      return NextResponse.json(
        { error: "Endorsement not found" },
        { status: 404 }
      );
    }

    // Reviewer must hold one of the manager/founder roles on THIS enterprise.
    const membership = user.memberships.find(
      (m) =>
        m.enterpriseId === endorsement.enterpriseId &&
        RESOLVE_ROLES.has(m.role)
    );
    if (!membership) {
      return NextResponse.json(
        {
          error:
            "Only the founder, manager, company owner, or board member of this enterprise may resolve endorsements.",
          code: "not_authorized_resolver",
        },
        { status: 403 }
      );
    }

    // A user cannot resolve their own endorsement (no self-judging).
    if (endorsement.endorserId === user.id) {
      return NextResponse.json(
        {
          error: "You cannot resolve your own endorsement.",
          code: "self_resolve_forbidden",
        },
        { status: 403 }
      );
    }

    if (!endorsement.active) {
      return NextResponse.json(
        {
          error: `Endorsement already resolved as ${endorsement.outcome}.`,
          code: "already_resolved",
        },
        { status: 400 }
      );
    }

    await resolveEndorsement(endorsementId, parsed.data.outcome, user.id);

    return NextResponse.json(
      {
        ok: true,
        endorsementId,
        outcome: parsed.data.outcome,
      },
      { status: 200 }
    );
  },
  "PATCH /api/endorsements/[endorsementId]"
);
