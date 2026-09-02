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
// Government API Verification — Manual Upload Fallback (Blueprint §12.3–§12.7)
//
// The blueprint specifies automated integrations with:
//   §12.3 GAFI (General Authority for Free Zones & Investment) — Commercial
//        Registry (CR) + Ultimate Beneficial Owner (UBO) filings.
//   §12.5 Tax Authority — Tax clearance certificate issuance.
//   §12.6 NOSI (National Organization for Small & Medium Enterprises) —
//        Enterprise registration confirmation.
//   §12.7 Police clearance certificate (per-individual, 6-month validity).
//
// Because the upstream government APIs are not yet available in this sandbox,
// we implement the constitutional fallback: manual upload + 48-hour human
// review SLA. The same `GovApiVerification` row records both the automated
// result (when APIs are live) and the manual-review outcome.
// ─────────────────────────────────────────────────────────────────────────────

const VERIFICATION_TYPES = [
  "gafi_cr",
  "gafi_ubo",
  "nosi_registration",
  "tax_clearance",
  "police_clearance",
] as const;

const submitSchema = z.object({
  enterpriseId: z.string().min(1).max(64).optional(),
  userId: z.string().min(1).max(64).optional(),
  verificationType: z.enum(VERIFICATION_TYPES),
  documentUrl: z.string().min(1).max(1024),
  documentHash: z
    .string()
    .min(8)
    .max(128)
    .regex(/^[a-fA-F0-9]+$/, "documentHash must be a hex string (SHA-256)"),
  note: z.string().max(1000).optional(),
});

// POST /api/verification
// Body: { enterpriseId?, userId?, verificationType, documentUrl, documentHash, note? }
// Auth required. Creates a GovApiVerification with status="pending" and appends
// a hash-chained ledger event. The 48-hour SLA window is recorded so reviewers
// (and the CRE) can monitor SLA breaches.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        code: "invalid_body",
        issues: parsed.error.issues,
      },
      { status: 400 }
    );
  }
  const { enterpriseId, userId, verificationType, documentUrl, documentHash, note } =
    parsed.data;

  // Either an Enterprise or a User context is required — a verification record
  // must anchor to at least one constitutional subject.
  if (!enterpriseId && !userId) {
    return NextResponse.json(
      {
        error:
          "A verification must target either an Enterprise (enterpriseId) or a Constitutional Partner (userId).",
        code: "missing_subject",
      },
      { status: 400 }
    );
  }

  // Validate enterprise existence (when supplied).
  if (enterpriseId) {
    const enterprise = await db.enterprise.findUnique({
      where: { id: enterpriseId },
      select: { id: true, name: true, slug: true, tier: true },
    });
    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise not found.", code: "enterprise_not_found" },
        { status: 404 }
      );
    }
  }

  // Validate user existence (when supplied).
  if (userId) {
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, legalName: true, primaryIntent: true },
    });
    if (!targetUser) {
      return NextResponse.json(
        { error: "Constitutional Partner not found.", code: "user_not_found" },
        { status: 404 }
      );
    }
  }

  // Authorization: the submitting user must be a member of the target
  // Enterprise (if enterpriseId is supplied) OR be submitting on their own
  // behalf (userId === user.id) OR hold a trusted institutional role
  // (law_firm_rep / accounting_firm_rep / aurienta_rep) acting on behalf of
  // the Law Firm Client Account.
  const isSelf = userId === user.id;
  const isMember = enterpriseId
    ? user.memberships.some((m) => m.enterpriseId === enterpriseId)
    : false;
  const trustedRole = user.memberships.some(
    (m) =>
      m.role === "law_firm_rep" ||
      m.role === "accounting_firm_rep" ||
      m.role === "aurienta_rep"
  );
  if (!isSelf && !isMember && !trustedRole) {
    await audit({
      actorId: user.id,
      action: "verification.submit",
      target: enterpriseId ? `enterprise:${enterpriseId}` : `user:${userId ?? ""}`,
      result: "denied",
      reason: "Not authorized to submit verification for this subject",
      metadata: { verificationType },
    });
    return NextResponse.json(
      {
        error:
          "You may only submit verifications for your own Constitutional Partner record, an Enterprise you belong to, or as a Law Firm / Accounting Firm / AURIENTA representative.",
        code: "not_authorized",
      },
      { status: 403 }
    );
  }

  // 48-hour SLA window for human review (Blueprint §12.x fallback).
  const SLA_MS = 48 * 60 * 60 * 1000;
  const slaDeadline = new Date(Date.now() + SLA_MS);

  const verification = await db.govApiVerification.create({
    data: {
      enterpriseId: enterpriseId ?? null,
      userId: userId ?? null,
      verificationType,
      status: "pending",
      documentUrl,
      documentHash,
    },
  });

  await db.$transaction(async (tx) => {
    await appendLedgerEvent(tx, {
      enterpriseId: enterpriseId ?? undefined,
      eventType: "cre_decision",
      payload: {
        action: "gov_verification_submitted",
        verificationId: verification.id,
        verificationType,
        status: "pending",
        documentUrl,
        documentHash,
        submittedBy: user.id,
        submittedAt: verification.submittedAt.toISOString(),
        slaDeadline: slaDeadline.toISOString(),
        slaHours: 48,
        note:
          note?.trim() ??
          "Government API manual-upload fallback (Blueprint §12.3–§12.7). Awaiting human review within the 48-hour constitutional SLA.",
        constitutionalSubject: enterpriseId
          ? { kind: "Enterprise", id: enterpriseId }
          : { kind: "Constitutional Partner", id: userId },
      },
      actorId: user.id,
    });
  });

  await audit({
    actorId: user.id,
    action: "verification.submit",
    target: `verification:${verification.id}`,
    result: "allowed",
    metadata: {
      verificationType,
      enterpriseId: enterpriseId ?? null,
      userId: userId ?? null,
      slaDeadline: slaDeadline.toISOString(),
    },
  });

  return NextResponse.json(
    {
      verification: {
        id: verification.id,
        enterpriseId: verification.enterpriseId,
        userId: verification.userId,
        verificationType: verification.verificationType,
        status: verification.status,
        documentUrl: verification.documentUrl,
        documentHash: verification.documentHash,
        submittedAt: verification.submittedAt.toISOString(),
        slaDeadline: slaDeadline.toISOString(),
        slaHours: 48,
      },
    },
    { status: 201 }
  );
}, "POST /api/verification");

// GET /api/verification
// Query params (all optional):
//   ?enterpriseId=xxx  — filter by Enterprise
//   ?userId=xxx        — filter by Constitutional Partner
//   ?status=pending    — filter by lifecycle status
//   ?type=nosi_registration — filter by verificationType
//   ?limit=20          — pagination cap (1–100)
// Auth required. Returns a sanitized list. Stale verified records whose
// expiresAt has elapsed are auto-expired here so callers always see canonical
// status.
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  const userId = url.searchParams.get("userId");
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam ?? "20", 10) || 20, 1), 100);

  if (
    status &&
    !["pending", "under_review", "verified", "rejected", "expired"].includes(status)
  ) {
    return NextResponse.json(
      {
        error:
          "status must be one of: pending, under_review, verified, rejected, expired",
        code: "invalid_status",
      },
      { status: 400 }
    );
  }
  if (type && !VERIFICATION_TYPES.includes(type as (typeof VERIFICATION_TYPES)[number])) {
    return NextResponse.json(
      {
        error: `type must be one of: ${VERIFICATION_TYPES.join(", ")}`,
        code: "invalid_type",
      },
      { status: 400 }
    );
  }

  // Authorization: callers may only see verifications they own or that belong
  // to an Enterprise they are a member of, UNLESS they hold a trusted
  // institutional role (Law Firm / Accounting Firm / AURIENTA rep), in which
  // case the full filtered list is returned.
  const trustedRole = user.memberships.some(
    (m) =>
      m.role === "law_firm_rep" ||
      m.role === "accounting_firm_rep" ||
      m.role === "aurienta_rep"
  );

  const where: Record<string, unknown> = {};
  if (enterpriseId) where.enterpriseId = enterpriseId;
  if (userId) where.userId = userId;
  if (status) where.status = status;
  if (type) where.verificationType = type;

  // Apply access scoping for non-trusted callers.
  if (!trustedRole) {
    const memberEnterpriseIds = user.memberships.map((m) => m.enterpriseId);
    where.OR = [
      { userId: user.id },
      ...(memberEnterpriseIds.length > 0
        ? [{ enterpriseId: { in: memberEnterpriseIds } }]
        : []),
    ];
  }

  // ── Auto-expiry sweep ──
  // Any verified record whose expiresAt has elapsed is flipped to "expired"
  // so the returned list always reflects constitutional reality.
  await db.govApiVerification
    .updateMany({
      where: {
        status: { in: ["verified", "pending", "under_review"] },
        expiresAt: { lt: new Date() },
      },
      data: { status: "expired" },
    })
    .catch(() => {});

  const items = await db.govApiVerification.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    take: limit,
  });

  const sanitized = items.map((v) => ({
    id: v.id,
    enterpriseId: v.enterpriseId,
    userId: v.userId,
    verificationType: v.verificationType,
    status: v.status,
    documentUrl: v.documentUrl,
    documentHash: v.documentHash,
    submittedAt: v.submittedAt.toISOString(),
    reviewedAt: v.reviewedAt?.toISOString() ?? null,
    reviewedById: v.reviewedById,
    reviewNote: v.reviewNote,
    expiresAt: v.expiresAt?.toISOString() ?? null,
  }));

  return NextResponse.json({
    count: sanitized.length,
    items: sanitized,
    slaHours: 48,
    fallbackMode: "manual_upload",
    note:
      "Government API integrations (GAFI §12.3, Tax §12.5, NOSI §12.6, Police §12.7) are operating in manual-upload fallback mode with a 48-hour human-review SLA.",
  });
}, "GET /api/verification");

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
