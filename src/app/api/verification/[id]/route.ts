import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { appendLedgerEvent } from "@/lib/aurienta/cre";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Single Government API Verification record — fetch + review.
// Implements the 48-hour human-review SLA fallback (Blueprint §12.3–§12.7).
// Police clearance (§12.7) carries a 6-month validity window; on transition
// to "verified" we stamp `expiresAt = now + 6 months`.
// ─────────────────────────────────────────────────────────────────────────────

const REVIEWER_ROLES = ["aurienta_rep", "law_firm_rep", "accounting_firm_rep"] as const;

const POLICE_CLEARANCE_VALIDITY_MS = 6 * 30 * 24 * 60 * 60 * 1000; // ~6 months

const reviewSchema = z.object({
  status: z.enum(["verified", "rejected", "under_review"]),
  reviewNote: z.string().min(1).max(2000),
});

// GET /api/verification/[id]
// Auth required. Auto-expires stale verified records (expiresAt < now).
export const GET = withErrorHandler(
  async (
    _req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
  ) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { params } = ctx;
    const { id } = await params;
  if (!id || id.length < 6) {
    return NextResponse.json(
      { error: "Invalid verification id", code: "invalid_id" },
      { status: 400 }
    );
  }

  // Auto-expiry: flip to "expired" if expiresAt has elapsed.
  await db.govApiVerification
    .updateMany({
      where: { id, expiresAt: { lt: new Date() }, status: { not: "expired" } },
      data: { status: "expired" },
    })
    .catch(() => {});

  const verification = await db.govApiVerification.findUnique({
    where: { id },
  });

  if (!verification) {
    return NextResponse.json(
      { error: "Verification record not found", code: "not_found" },
      { status: 404 }
    );
  }

  // Authorization: caller must own the record, be a member of the target
  // Enterprise, or hold a trusted institutional reviewer role.
  const trustedRole = user.memberships.some((m) => REVIEWER_ROLES.includes(m.role as (typeof REVIEWER_ROLES)[number]));
  const isSelf = verification.userId === user.id;
  const isMember = verification.enterpriseId
    ? user.memberships.some((m) => m.enterpriseId === verification.enterpriseId)
    : false;
  if (!isSelf && !isMember && !trustedRole) {
    await audit({
      actorId: user.id,
      action: "verification.read",
      target: `verification:${id}`,
      result: "denied",
      reason: "Not authorized to view this verification record",
    });
    return NextResponse.json(
      { error: "Not authorized to view this verification", code: "not_authorized" },
      { status: 403 }
    );
  }

  const slaDeadline = new Date(
    verification.submittedAt.getTime() + 48 * 60 * 60 * 1000
  );
  const slaBreached =
    verification.status === "pending" && Date.now() > slaDeadline.getTime();

  return NextResponse.json({
    verification: {
      id: verification.id,
      enterpriseId: verification.enterpriseId,
      userId: verification.userId,
      verificationType: verification.verificationType,
      status: verification.status,
      documentUrl: verification.documentUrl,
      documentHash: verification.documentHash,
      submittedAt: verification.submittedAt.toISOString(),
      reviewedAt: verification.reviewedAt?.toISOString() ?? null,
      reviewedById: verification.reviewedById,
      reviewNote: verification.reviewNote,
      expiresAt: verification.expiresAt?.toISOString() ?? null,
      slaDeadline: slaDeadline.toISOString(),
      slaHours: 48,
      slaBreached,
      fallbackMode: "manual_upload",
    },
  });
  },
  "GET /api/verification/[id]"
);

// PATCH /api/verification/[id]
// Body: { status: "verified" | "rejected" | "under_review", reviewNote: string }
// Only aurienta_rep / law_firm_rep / accounting_firm_rep may review.
// - On "verified" for police_clearance, sets expiresAt = now + 6 months.
// - Sets reviewedAt + reviewedById.
// - Appends a ledger event inside the same transaction as the update.
export const PATCH = withErrorHandler(
  async (
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
  ) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Role gate — institutional reviewer roles only.
  const hasReviewerRole = user.memberships.some((m) =>
    REVIEWER_ROLES.includes(m.role as (typeof REVIEWER_ROLES)[number])
  );
  if (!hasReviewerRole) {
    await audit({
      actorId: user.id,
      action: "verification.review",
      target: `verification:${(await ctx.params).id ?? ""}`,
      result: "denied",
      reason: `Forbidden: reviewer roles are ${REVIEWER_ROLES.join(", ")}`,
    });
    return NextResponse.json(
      {
        error:
          "Only AURIENTA representatives, Law Firm representatives, or Accounting Firm representatives may review government verifications.",
        code: "forbidden_reviewer_role",
        requiredRoles: REVIEWER_ROLES,
      },
      { status: 403 }
    );
  }

  const { params } = ctx;
  const { id } = await params;
  if (!id || id.length < 6) {
    return NextResponse.json(
      { error: "Invalid verification id", code: "invalid_id" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid review body",
        code: "invalid_body",
        issues: parsed.error.issues,
      },
      { status: 400 }
    );
  }
  const { status, reviewNote } = parsed.data;

  const existing = await db.govApiVerification.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Verification record not found", code: "not_found" },
      { status: 404 }
    );
  }

  // Once a record has been verified or rejected, it cannot be re-reviewed
  // (a new submission must be filed instead). "under_review" is a transient
  // state used to acknowledge receipt while the 48h SLA window is still open.
  if (
    existing.status === "verified" ||
    existing.status === "rejected" ||
    existing.status === "expired"
  ) {
    return NextResponse.json(
      {
        error: `Verification is already ${existing.status}. File a new submission to re-verify.`,
        code: "already_terminal",
      },
      { status: 400 }
    );
  }

  // Police clearance (§12.7): when verified, set 6-month expiry.
  const isPoliceClearance = existing.verificationType === "police_clearance";
  let newExpiresAt: Date | null = existing.expiresAt;
  if (status === "verified") {
    if (isPoliceClearance) {
      newExpiresAt = new Date(Date.now() + POLICE_CLEARANCE_VALIDITY_MS);
    } else {
      // Non-police verifications do not expire on their own (CR / UBO / NOSI /
      // tax clearance are point-in-time proofs; they only lapse when a new
      // submission supersedes them).
      newExpiresAt = null;
    }
  }

  const reviewedAt = new Date();

  // Update + ledger event inside one transaction (constitutional hash-chain
  // integrity is preserved across the state transition).
  const updated = await db.$transaction(async (tx) => {
    const row = await tx.govApiVerification.update({
      where: { id },
      data: {
        status,
        reviewNote: reviewNote.trim(),
        reviewedAt,
        reviewedById: user.id,
        expiresAt: newExpiresAt,
      },
    });

    await appendLedgerEvent(tx, {
      enterpriseId: existing.enterpriseId ?? undefined,
      eventType: "cre_decision",
      payload: {
        action: "gov_verification_reviewed",
        verificationId: row.id,
        verificationType: row.verificationType,
        previousStatus: existing.status,
        newStatus: row.status,
        reviewNote: row.reviewNote,
        reviewedBy: user.id,
        reviewedAt: reviewedAt.toISOString(),
        expiresAt: row.expiresAt?.toISOString() ?? null,
        policeClearanceValidityMonths: isPoliceClearance ? 6 : null,
        slaHours: 48,
        constitutionalSubject: existing.enterpriseId
          ? { kind: "Enterprise", id: existing.enterpriseId }
          : { kind: "Constitutional Partner", id: existing.userId ?? null },
      },
      actorId: user.id,
    });

    return row;
  });

  // Audit the review action (fire-and-forget — never breaks the request).
  await audit({
    actorId: user.id,
    action: "verification.review",
    target: `verification:${id}`,
    result: "allowed",
    metadata: {
      verificationType: updated.verificationType,
      previousStatus: existing.status,
      newStatus: updated.status,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
      reviewerRole: user.memberships.find((m) =>
        REVIEWER_ROLES.includes(m.role as (typeof REVIEWER_ROLES)[number])
      )?.role,
    },
  });

  // If the verification is for police_clearance and was verified, mirror the
  // expiry onto the User.policeClearanceExpiresAt field so downstream CRE
  // policies (police-clearance-gated role appointments) read canonical state.
  if (
    status === "verified" &&
    isPoliceClearance &&
    updated.userId
  ) {
    await db.user
      .update({
        where: { id: updated.userId },
        data: {
          policeClearanceValid: true,
          policeClearanceExpiresAt: newExpiresAt,
        },
      })
      .catch(() => {});
  } else if (
    status === "rejected" &&
    isPoliceClearance &&
    updated.userId
  ) {
    await db.user
      .update({
        where: { id: updated.userId },
        data: {
          policeClearanceValid: false,
          policeClearanceExpiresAt: null,
        },
      })
      .catch(() => {});
  }

  const slaDeadline = new Date(
    updated.submittedAt.getTime() + 48 * 60 * 60 * 1000
  );

  return NextResponse.json({
    verification: {
      id: updated.id,
      enterpriseId: updated.enterpriseId,
      userId: updated.userId,
      verificationType: updated.verificationType,
      status: updated.status,
      documentUrl: updated.documentUrl,
      documentHash: updated.documentHash,
      submittedAt: updated.submittedAt.toISOString(),
      reviewedAt: updated.reviewedAt?.toISOString() ?? null,
      reviewedById: updated.reviewedById,
      reviewNote: updated.reviewNote,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
      slaDeadline: slaDeadline.toISOString(),
      slaHours: 48,
      policeClearanceValidityMonths: isPoliceClearance ? 6 : null,
      fallbackMode: "manual_upload",
    },
  });
  },
  "PATCH /api/verification/[id]"
);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
