// AURIENTA — Constitutional Q&A API
// ═══════════════════════════════════════════════════════════════
// POST /api/qa                — Ask a question on an enterprise
// GET  /api/qa?enterpriseId=x — List questions (with answers) for an enterprise
//
// Questions + answers are persisted as AiArtifact rows with
// kind = "constitutional_qa":
//   payload = {
//     enterpriseId,
//     question,
//     askedById,
//     askedAt,
//     status:        "open" | "answered",
//     answer?:       string,
//     answeredById?: string,
//     answeredAt?:   ISO timestamp,
//     evidenceClassification?: "FACT" | "FOUNDER_PROVIDED" | "EVIDENCE_BACKED"
//                              | "TARGET" | "FORECAST" | "UNKNOWN"
//   }
//
// POST /api/qa/[id]/answer   — Answer a question (founding_operator /
//                              company_owner / board_member only)
//
// Auth required on every route. Audit-logged. Ledger events:
//   - "question_asked"
//   - "question_answered"

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AskSchema = z.object({
  enterpriseId: z.string().min(1).max(64),
  question: z.string().min(3).max(4000),
});

const MAX_QUESTIONS_PER_ENTERPRISE = 500; // soft cap to prevent flooding

/**
 * POST /api/qa — Ask a question.
 *
 * Authorization: caller must be a member of the enterprise (any role).
 * Ledger: appends a `question_asked` event.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = AskSchema.safeParse(body);
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
    const { enterpriseId, question } = parsed.data;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: {
        id: true,
        name: true,
        slug: true,
        sector: true,
        tier: true,
        status: true,
      },
    });
    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise not found", code: "ENTERPRISE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Authorization: caller must be a member of the enterprise.
    const isMember = user.memberships.some(
      (m) => m.enterpriseId === enterpriseId
    );
    const isRep = user.memberships.some((m) => m.role === "aurienta_rep");
    if (!isMember && !isRep) {
      await audit({
        actorId: user.id,
        action: "qa.ask",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: "Not a member of the enterprise",
        ip,
        userAgent,
      });
      return NextResponse.json(
        {
          error: "Forbidden: must be a member of the enterprise",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // Soft cap on open questions per enterprise (prevents flooding).
    const openCount = await db.aiArtifact.count({
      where: {
        kind: "constitutional_qa",
        enterpriseId,
      },
    });
    if (openCount >= MAX_QUESTIONS_PER_ENTERPRISE) {
      return NextResponse.json(
        {
          error: `Question cap reached (${MAX_QUESTIONS_PER_ENTERPRISE}) for this enterprise`,
          code: "QUESTION_CAP_REACHED",
        },
        { status: 429 }
      );
    }

    const askedAt = new Date();

    // Persist the question as an AiArtifact + ledger event atomically.
    const artifact = await db.$transaction(async (tx) => {
      const created = await tx.aiArtifact.create({
        data: {
          kind: "constitutional_qa",
          enterpriseId,
          userId: user.id,
          entityId: null,
          content: question,
          payload: JSON.stringify({
            enterpriseId,
            question,
            askedById: user.id,
            askedByName: user.legalName,
            askedAt: askedAt.toISOString(),
            status: "open",
            evidenceClassification: null,
            answer: null,
            answeredById: null,
            answeredAt: null,
          }),
          confidence: 1.0,
          modelVersion: "constitutional-qa-v1",
        },
      });

      await appendLedgerEvent(tx, {
        enterpriseId,
        eventType: "question_asked",
        payload: {
          questionId: created.id,
          question,
          askedBy: user.id,
          askedByName: user.legalName,
          askedAt: askedAt.toISOString(),
          enterprise: {
            id: enterprise.id,
            name: enterprise.name,
            slug: enterprise.slug,
            sector: enterprise.sector,
            tier: enterprise.tier,
          },
        },
        actorId: user.id,
      });

      return created;
    });

    await audit({
      actorId: user.id,
      action: "qa.ask",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      metadata: {
        questionId: artifact.id,
        questionLength: question.length,
      },
      ip,
      userAgent,
    });

    logger.info("qa.asked", {
      questionId: artifact.id,
      enterpriseId,
      userId: user.id,
    });

    return NextResponse.json(
      {
        ok: true,
        question: {
          id: artifact.id,
          enterpriseId,
          question,
          askedBy: user.id,
          askedByName: user.legalName,
          askedAt: askedAt.toISOString(),
          status: "open",
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[POST /api/qa] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to ask question", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/qa?enterpriseId=xxx — List questions (with answers) for an enterprise.
 *
 * Authorization: caller must be a member of the enterprise.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const enterpriseId = url.searchParams.get("enterpriseId");
    if (!enterpriseId) {
      return NextResponse.json(
        { error: "Provide ?enterpriseId=xxx", code: "MISSING_QUERY_PARAM" },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: { id: true, name: true, slug: true },
    });
    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise not found", code: "ENTERPRISE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Authorization: caller must be a member.
    const isMember = user.memberships.some(
      (m) => m.enterpriseId === enterpriseId
    );
    const isRep = user.memberships.some((m) => m.role === "aurienta_rep");
    if (!isMember && !isRep) {
      await audit({
        actorId: user.id,
        action: "qa.list",
        target: `enterprise:${enterpriseId}`,
        result: "denied",
        reason: "Not a member of the enterprise",
        ip,
        userAgent,
      });
      return NextResponse.json(
        {
          error: "Forbidden: must be a member of the enterprise",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const artifacts = await db.aiArtifact.findMany({
      where: {
        kind: "constitutional_qa",
        enterpriseId,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, legalName: true } },
      },
    });

    const questions = artifacts.map((a) => {
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(a.payload);
      } catch {
        payload = {};
      }
      return {
        id: a.id,
        enterpriseId,
        question: a.content,
        askedById: (payload.askedById as string) ?? a.userId,
        askedByName:
          (payload.askedByName as string) ?? a.user?.legalName ?? "Unknown",
        askedAt:
          (payload.askedAt as string) ?? a.createdAt.toISOString(),
        status: (payload.status as string) ?? "open",
        answer: (payload.answer as string | null) ?? null,
        answeredById: (payload.answeredById as string | null) ?? null,
        answeredByName: (payload.answeredByName as string | null) ?? null,
        answeredAt: (payload.answeredAt as string | null) ?? null,
        evidenceClassification:
          (payload.evidenceClassification as string | null) ?? null,
      };
    });

    await audit({
      actorId: user.id,
      action: "qa.list",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      metadata: { returned: questions.length },
      ip,
      userAgent,
    });

    return NextResponse.json({
      ok: true,
      enterprise: {
        id: enterprise.id,
        name: enterprise.name,
        slug: enterprise.slug,
      },
      count: questions.length,
      questions,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[GET /api/qa] error:", { err: msg });
    return NextResponse.json(
      { error: "Failed to list questions", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
