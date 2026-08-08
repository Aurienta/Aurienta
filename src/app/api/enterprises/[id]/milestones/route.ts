import { logger } from "@/lib/aurienta/logger";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { milestoneEvidenceSchema, parseBody } from "@/lib/aurienta/validation";

// POST /api/enterprises/[id]/milestones
// Body: { milestoneId, evidenceNote }
// Marks the milestone as evidence_submitted, sets eveConfidence (mock), and appends a ledger event.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { id: enterpriseId } = await params;
    const body = await parseBody(req, milestoneEvidenceSchema);
    if (body instanceof NextResponse) return body;
    const { milestoneId, evidenceNote } = body;

    // parseBody + milestoneEvidenceSchema already enforces milestoneId (string
    // 1–64) and evidenceNote (string 12–5000). The guards below are kept as
    // defence-in-depth for the error-message copy.
    if (!milestoneId || typeof milestoneId !== "string") {
      return NextResponse.json(
        { error: "milestoneId is required.", code: "INVALID_MILESTONE" },
        { status: 400 }
      );
    }
    if (!evidenceNote || typeof evidenceNote !== "string" || evidenceNote.trim().length < 12) {
      return NextResponse.json(
        {
          error: "Evidence note must be at least 12 characters.",
          code: "INVALID_EVIDENCE",
        },
        { status: 400 }
      );
    }

    // Load the milestone and confirm it belongs to this enterprise.
    const milestone = await db.milestone.findUnique({
      where: { id: milestoneId },
      include: { enterprise: true },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    if (milestone.enterpriseId !== enterpriseId) {
      return NextResponse.json(
        { error: "Milestone does not belong to this enterprise.", code: "MISMATCH" },
        { status: 400 }
      );
    }

    // Authorization: the user must be a founding_operator, manager, or board_member of this enterprise.
    const membership = await db.enterpriseMember.findFirst({
      where: {
        enterpriseId,
        userId: user.id,
        role: { in: ["founding_operator", "manager", "board_member"] },
      },
    });
    if (!membership) {
      return NextResponse.json(
        {
          error: "Only the founding operator, manager, or a board member may submit evidence.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // Only allow submission from pending / rejected milestones.
    if (
      milestone.status !== "pending" &&
      milestone.status !== "rejected" &&
      milestone.status !== "board_review"
    ) {
      return NextResponse.json(
        {
          error: `Milestone status is "${milestone.status}" — evidence cannot be submitted at this stage.`,
          code: "INVALID_STATUS",
        },
        { status: 400 }
      );
    }

    // Mock EVE (Evidence Verification Engine) confidence — deterministic but varied.
    const eveConfidence = 0.7 + (Math.floor(Math.random() * 18) / 100); // 0.70–0.87

    const updated = await db.milestone.update({
      where: { id: milestoneId },
      data: {
        status: "evidence_submitted",
        evidenceNote: evidenceNote.trim(),
        eveConfidence,
      },
    });

    // Append ledger event.
    await db.$transaction(async (tx) => {
      await appendLedgerEvent(tx, {
        enterpriseId,
        eventType: "milestone_released",
        payload: {
          action: "evidence_submitted",
          milestoneId,
          title: milestone.title,
          amount: milestone.amountEgp,
          eveConfidence,
          submittedBy: user.id,
          note: evidenceNote.trim().slice(0, 280),
        },
        actorId: user.id,
      });
    });

    return NextResponse.json({
      ok: true,
      milestone: {
        id: updated.id,
        status: updated.status,
        evidenceNote: updated.evidenceNote,
        eveConfidence: updated.eveConfidence,
      },
    });
  } catch (err) {
    logger.error("[POST /api/enterprises/[id]/milestones] error:", { err: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: "Failed to submit milestone evidence.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// GET — list milestones for this enterprise.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: enterpriseId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const milestones = await db.milestone.findMany({
    where: { enterpriseId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ milestones });
}
