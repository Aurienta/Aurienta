import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { audit } from "@/lib/aurienta/audit";
import {
  createCase,
  listCasesForUser,
  BUSINESS_TYPES,
} from "@/lib/aurienta/standalone-succession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Standalone Succession Protocol — collection route.
//
// POST /api/standalone-succession        — file a new cryptographic succession
//                                          case (status='drafted').
// GET  /api/standalone-succession        — list the caller's filed cases.
//
// This is a LEGAL/GOVERNANCE service, not fund management. No securities,
// no custody. The flat 5,000 EGP fee is for the cryptographic + governance
// infrastructure; AURIENTA never touches the family business's money.
// ─────────────────────────────────────────────────────────────────────────────

const createCaseSchema = z.object({
  businessName: z.string().trim().min(2).max(200),
  businessType: z.enum(BUSINESS_TYPES),
  shamirThreshold: z.number().int().min(2).max(10).optional(),
  shamirShares: z.number().int().min(3).max(10).optional(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createCaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        code: "invalid_body",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  let created;
  try {
    created = await createCase({
      businessName: parsed.data.businessName,
      businessType: parsed.data.businessType,
      declarantId: user.id,
      shamirThreshold: parsed.data.shamirThreshold,
      shamirShares: parsed.data.shamirShares,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "create_failed";
    await audit({
      actorId: user.id,
      action: "standalone_succession.create",
      result: "denied",
      reason: message,
    });
    return NextResponse.json(
      { error: message, code: "create_failed" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      case: {
        id: created.id,
        businessName: created.businessName,
        businessType: created.businessType,
        jurisdiction: created.jurisdiction,
        declarationHash: created.declarationHash,
        shamirThreshold: created.shamirThreshold,
        shamirShares: created.shamirShares,
        activationDate: created.activationDate?.toISOString() ?? null,
        status: created.status,
        feeEgp: created.feeEgp,
        createdAt: created.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}, "POST /api/standalone-succession");

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const cases = await listCasesForUser(user.id);

  return NextResponse.json({
    cases: cases.map((c) => ({
      id: c.id,
      businessName: c.businessName,
      businessType: c.businessType,
      jurisdiction: c.jurisdiction,
      declarationHash: c.declarationHash,
      shamirThreshold: c.shamirThreshold,
      shamirShares: c.shamirShares,
      activationDate: c.activationDate?.toISOString() ?? null,
      status: c.status,
      feeEgp: c.feeEgp,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}, "GET /api/standalone-succession");

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
