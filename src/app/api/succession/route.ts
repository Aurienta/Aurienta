import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { encryptField } from "@/lib/aurienta/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Cryptographic Succession (Blueprint Vol 16 §16.1)
//
// POST /api/succession       — create or replace the current user's declaration
// GET  /api/succession       — fetch the current user's declaration (if any)
//
// POST lifecycle:
//   - If no declaration exists → create one in status "draft"
//   - If one exists in status "draft" → update it (still draft)
//   - If one exists in status "filed" → rejected (must revoke + re-file; the
//     blueprint requires explicit revocation to prevent silent mutation of
//     an in-force declaration)
//   - If one exists in status "activated" / "executed" → rejected (terminal;
//     cannot be modified)
//
// The status "draft" → "filed" transition is performed by a separate
// `PATCH /api/succession/[id]` (not implemented in this gap — coming with
// the next sprint). For this gap, POST auto-files when `status: "filed"`
// is passed in the body.
// ─────────────────────────────────────────────────────────────────────────────

const beneficiarySchema = z.object({
  name: z.string().min(2).max(120),
  relationship: z.string().min(2).max(40),
  percentage: z.number().min(0).max(100),
  nationalIdLast4: z
    .string()
    .length(4)
    .regex(/^\d{4}$/, "Last 4 of national ID must be 4 digits")
    .optional(),
});

const conditionsSchema = z
  .object({
    onDeath: z.boolean().default(true),
    onIncapacitation: z.boolean().default(false),
    thresholdDays: z.number().int().min(30).max(180).default(90),
  })
  .default({ onDeath: true, onIncapacitation: false, thresholdDays: 90 });

const successionSchema = z.object({
  beneficiaryUserId: z.string().min(1).max(64).optional(),
  beneficiaryName: z.string().min(2).max(120).optional(),
  beneficiaryNationalId: z
    .string()
    .min(4)
    .max(64)
    .optional(), // encrypted server-side; do NOT log
  conditions: conditionsSchema,
  economicBeneficiaries: z.array(beneficiarySchema).min(1).max(20),
  emergencyManagerId: z.string().min(1).max(64).optional(),
  status: z.enum(["draft", "filed"]).default("draft"),
});

// POST /api/succession — create or replace the current user's declaration?.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = successionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid succession declaration body",
        code: "invalid_body",
        issues: parsed.error.issues,
      },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // ── Validate economic-beneficiary percentages sum to 100 ──
  // The blueprint requires the economic beneficiaries' percentages to sum
  // to 100 across the declaration?. This is the constitutional invariant
  // enforced by the CRE on file.
  const totalPct = data.economicBeneficiaries.reduce((s, b) => s + b.percentage, 0);
  if (Math.abs(totalPct - 100) > 0.01) {
    return NextResponse.json(
      {
        error: `Economic beneficiaries' percentages must sum to 100. Currently sum to ${totalPct}.`,
        code: "invalid_percentages",
        total: totalPct,
      },
      { status: 400 }
    );
  }

  // ── Validate that at least one beneficiary designation is present ──
  if (!data.beneficiaryUserId && !data.beneficiaryName) {
    return NextResponse.json(
      {
        error:
          "A succession declaration must designate a beneficiary — either a platform user (beneficiaryUserId) or an external beneficiary (beneficiaryName).",
        code: "missing_beneficiary",
      },
      { status: 400 }
    );
  }

  // ── Validate beneficiaryUserId exists (when supplied) ──
  if (data.beneficiaryUserId) {
    const beneficiary = await db.user.findUnique({
      where: { id: data.beneficiaryUserId },
      select: { id: true, legalName: true },
    });
    if (!beneficiary) {
      return NextResponse.json(
        { error: "Designated successor (beneficiaryUserId) not found.", code: "beneficiary_not_found" },
        { status: 404 }
      );
    }
  }

  // ── Validate emergency manager holds police clearance (when supplied) ──
  if (data.emergencyManagerId) {
    const em = await db.user.findUnique({
      where: { id: data.emergencyManagerId },
      select: { id: true, legalName: true, policeClearanceValid: true, policeClearanceExpiresAt: true },
    });
    if (!em) {
      return NextResponse.json(
        { error: "Emergency manager not found.", code: "emergency_manager_not_found" },
        { status: 404 }
      );
    }
    const expired =
      em.policeClearanceExpiresAt && em.policeClearanceExpiresAt.getTime() < Date.now();
    if (!em.policeClearanceValid || expired) {
      return NextResponse.json(
        {
          error:
            "Emergency manager must hold a valid police clearance certificate (Vol 16 §16.1).",
          code: "emergency_manager_no_clearance",
        },
        { status: 400 }
      );
    }
  }

  // ── Existing declaration check ──
  const existing = await db.successionDeclaration.findFirst({
    where: { userId: user.id },
    orderBy: { declaredAt: "desc" },
    include: { economicBeneficiaries: true },
  });

  if (existing && (existing.status === "filed" || existing.status === "activated" || existing.status === "executed")) {
    return NextResponse.json(
      {
        error: `An existing declaration is in status '${existing.status}' — it cannot be modified. Revoke it first (separate endpoint) or file a new one after revocation.`,
        code: "declaration_locked",
        declarationId: existing.id,
      },
      { status: 409 }
    );
  }

  // ── Encrypt PII fields ──
  const beneficiaryNationalIdEnc = data.beneficiaryNationalId
    ? encryptField(data.beneficiaryNationalId)
    : null;

  // ── Persist (create or update the draft) ──
  const conditionsStr = JSON.stringify(data.conditions);
  const declaration = await db.$transaction(async (tx) => {
    let decl = existing;
    if (decl) {
      // Replace the existing draft's fields + economic beneficiaries.
      decl = await (tx.successionDeclaration.update({
        where: { id: decl?.id },
        data: {
          beneficiaryUserId: data.beneficiaryUserId ?? null,
          beneficiaryName: data.beneficiaryName ?? null,
          beneficiaryNationalId: beneficiaryNationalIdEnc,
          conditions: conditionsStr,
          emergencyManagerId: data.emergencyManagerId ?? null,
          status: data.status,
        },
      }) as any);
      // Delete old beneficiaries and re-create.
      await tx.economicBeneficiary.deleteMany({
        where: { successionDeclarationId: decl!.id },
      });
    } else {
      decl = await (tx.successionDeclaration.create({
        data: {
          userId: user.id,
          beneficiaryUserId: data.beneficiaryUserId ?? null,
          beneficiaryName: data.beneficiaryName ?? null,
          beneficiaryNationalId: beneficiaryNationalIdEnc,
          conditions: conditionsStr,
          emergencyManagerId: data.emergencyManagerId ?? null,
          status: data.status,
        },
      }) as any);
    }

    // Insert economic beneficiaries (encrypted nationalIdLast4).
    for (const b of data.economicBeneficiaries) {
      await tx.economicBeneficiary.create({
        data: {
          successionDeclarationId: decl!.id,
          name: b.name,
          relationship: b.relationship,
          percentage: b.percentage,
          nationalIdLast4: b.nationalIdLast4 ? encryptField(b.nationalIdLast4) : null,
        },
      });
    }

    return decl;
  });

  // ── Audit ──
  await audit({
    actorId: user.id,
    action: "succession.create",
    target: `succession:${declaration?.id}`,
    result: "allowed",
    metadata: {
      status: declaration?.status,
      hasBeneficiaryUserId: !!data.beneficiaryUserId,
      hasBeneficiaryName: !!data.beneficiaryName,
      hasEmergencyManager: !!data.emergencyManagerId,
      economicBeneficiaryCount: data.economicBeneficiaries.length,
      economicBeneficiaryTotalPct: totalPct,
      conditions: data.conditions,
    },
  });

  return NextResponse.json(
    {
      declaration: {
        id: declaration?.id,
        status: declaration?.status,
        beneficiaryUserId: declaration?.beneficiaryUserId,
        beneficiaryName: declaration?.beneficiaryName,
        conditions: data.conditions,
        emergencyManagerId: declaration?.emergencyManagerId,
        votingProxyActive: declaration?.votingProxyActive,
        votingProxyActivatedAt: declaration?.votingProxyActivatedAt?.toISOString() ?? null,
        declaredAt: declaration?.declaredAt.toISOString(),
        updatedAt: declaration?.updatedAt.toISOString(),
      },
      economicBeneficiaries: data.economicBeneficiaries.map((b) => ({
        name: b.name,
        relationship: b.relationship,
        percentage: b.percentage,
        hasNationalIdLast4: !!b.nationalIdLast4,
      })),
    },
    { status: 201 }
  );
}, "POST /api/succession");

// GET /api/succession — fetch the current user's declaration (if any).
// PII (beneficiaryNationalId, economicBeneficiary.nationalIdLast4) is NOT
// returned — those are server-side encrypted and only the last-4 is exposed
// via a separate, audited reveal endpoint (not in this gap).
export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const declaration = await db.successionDeclaration.findFirst({
    where: { userId: user.id },
    orderBy: { declaredAt: "desc" },
    include: { economicBeneficiaries: true },
  });

  if (!declaration) {
    return NextResponse.json({
      declaration: null,
      economicBeneficiaries: [],
      note:
        "No succession declaration on file. Founding Operators, Managers, Board Members, and >10% Capital Partners are constitutionally required to file one (Vol 16 §16.1).",
    });
  }

  return NextResponse.json({
    declaration: {
      id: declaration?.id,
      status: declaration?.status,
      beneficiaryUserId: declaration?.beneficiaryUserId,
      beneficiaryName: declaration?.beneficiaryName,
      // Never expose the encrypted national ID directly. The last-4 of the
      // national ID can be revealed via the same /api/admin/users/[id] flow
      // that handles the declarant's own nationalIdLast4.
      hasBeneficiaryNationalId: !!declaration?.beneficiaryNationalId,
      conditions: JSON.parse(declaration?.conditions),
      emergencyManagerId: declaration?.emergencyManagerId,
      votingProxyActive: declaration?.votingProxyActive,
      votingProxyActivatedAt: declaration?.votingProxyActivatedAt?.toISOString() ?? null,
      declaredAt: declaration?.declaredAt.toISOString(),
      updatedAt: declaration?.updatedAt.toISOString(),
    },
    economicBeneficiaries: declaration?.economicBeneficiaries.map((b) => ({
      id: b.id,
      name: b.name,
      relationship: b.relationship,
      percentage: b.percentage,
      hasNationalIdLast4: !!b.nationalIdLast4,
    })),
  });
}, "GET /api/succession");

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
