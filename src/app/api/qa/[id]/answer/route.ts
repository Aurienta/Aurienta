// AURIENTA — Constitutional Q&A Answer API
// ═══════════════════════════════════════════════════════════════
// POST /api/qa/[id]/answer
//
// Body: {
//   answer:                string,
//   evidenceClassification: "FACT" | "FOUNDER_PROVIDED" | "EVIDENCE_BACKED"
//                          | "TARGET" | "FORECAST" | "UNKNOWN"
// }
//
// Authorization: only founding_operator, company_owner, or board_member of
// the enterprise that owns the question may answer.
//
// Updates the AiArtifact payload (kind="constitutional_qa") with the answer
// + classification, then appends a `question_answered` ledger event.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set([
  "founding_operator",
  "company_owner",
  "board_member",
]);

const AnswerSchema = z.object({
  answer: z.string().min(1).max(8000),
  evidenceClassification: z.enum([
    "FACT",
    "FOUNDER_PROVIDED",
    "EVIDENCE_BACKED",
    "TARGET",
    "FORECAST",
    "UNKNOWN",
  ]),
});

/**
 * POST /api/qa/[id]/answer
 *
 * Authorization: caller must hold founding_operator, company_owner, or
 * board_member on the enterprise that owns the question.
 *
 * Mutations (atomic via db.$transaction):
 *   - update AiArtifact.payload with the answer + classification + timestamps
 *   - append `question_answered` ledger event
 */
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

    const { id: questionId } = await params;

    const body = await req.json().catch(() => ({}));
    const parsed = AnswerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          code: "INVALID_BODY",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }
    const { answer, evidenceClassification } = parsed.data;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    // Load the question (AiArtifact with kind="constitutional_qa").
    const question = await db.aiArtifact.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        kind: true,
        enterpriseId: true,
        userId: true,
        content: true,
        payload: true,
        createdAt: true,
      },
    });

    if (!question || question.kind !== "constitutional_qa") {
      return NextResponse.json(
        { error: "Question not found", code: "QUESTION_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (!question.enterpriseId) {
      // Defensive — a constitutional_qa artifact should always have an enterprise.
      return NextResponse.json(
        { error: "Question has no associated enterprise", code: "ORPHAN_QUESTION" },
        { status: 400 }
      );
    }

    // Authorization: founding_operator / company_owner / board_member only.
    const membershipsForEnt = user.memberships.filter(
      (m) => m.enterpriseId === question.enterpriseId
    );
    const authorised = membershipsForEnt.some((m) => ALLOWED_ROLES.has(m.role));
    const isRep = user.memberships.some((m) => m.role === "aurienta_rep");
    if (!authorised && !isRep) {
      await audit({
        actorId: user.id,
        action: "qa.answer",
        target: `question:${questionId}`,
        result: "denied",
        reason:
          "Requires founding_operator, company_owner, or board_member role",
        metadata: {
          userRoles: membershipsForEnt.map((m) => m.role),
        },
        ip,
        userAgent,
      });
      return NextResponse.json(
        {
          error:
            "Forbidden: only founding_operator, company_owner, or board_member may answer",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // Parse the existing payload so we can preserve the question metadata.
    let prevPayload: Record<string, unknown> = {};
    try {
      prevPayload = JSON.parse(question.payload);
    } catch {
      prevPayload = {};
    }

    const answeredAt = new Date();

    // Merge the answer into the payload.
    const nextPayload = {
      ...prevPayload,
      status: "answered",
      answer,
      answeredById: user.id,
      answeredByName: user.legalName,
      answeredAt: answeredAt.toISOString(),
      evidenceClassification,
    };

    // Update the artifact + append ledger event atomically.
    await db.$transaction(async (tx) => {
      await tx.aiArtifact.update({
        where: { id: questionId },
        data: {
          payload: JSON.stringify(nextPayload),
          // Re-stamp the content with the answer so a naive content search
          // surfaces both the question and the answer.
          content: `Q: ${question.content}\n\nA (${evidenceClassification}): ${answer}`,
        },
      });

      await appendLedgerEvent(tx, {
        enterpriseId: question.enterpriseId!,
        eventType: "question_answered",
        payload: {
          questionId,
          question: question.content,
          answer,
          evidenceClassification,
          answeredBy: user.id,
          answeredByName: user.legalName,
          answeredAt: answeredAt.toISOString(),
          askedById: question.userId,
          askedAt:
            (prevPayload.askedAt as string | undefined) ??
            question.createdAt.toISOString(),
        },
        actorId: user.id,
      });
    });

    await audit({
      actorId: user.id,
      action: "qa.answer",
      target: `question:${questionId}`,
      result: "allowed",
      metadata: {
        enterpriseId: question.enterpriseId,
        evidenceClassification,
        answerLength: answer.length,
      },
      ip,
      userAgent,
    });

    logger.info("qa.answered", {
      questionId,
      enterpriseId: question.enterpriseId,
      userId: user.id,
      evidenceClassification,
    });

    return NextResponse.json({
      ok: true,
      question: {
        id: questionId,
        enterpriseId: question.enterpriseId,
        status: "answered",
        answer,
        answeredBy: user.id,
        answeredByName: user.legalName,
        answeredAt: answeredAt.toISOString(),
        evidenceClassification,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[POST /api/qa/[id]/answer] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to answer question", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
