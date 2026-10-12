import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { audit } from "@/lib/aurienta/audit";
import { activateCase, getCase } from "@/lib/aurienta/standalone-succession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Standalone Succession Protocol — single-case route.
//
// GET   /api/standalone-succession/[caseId]   — fetch one case (ownership-checked).
// PATCH /api/standalone-succession/[caseId]   — activate a drafted case.
//
// Activation moves the case status drafted -> activated and stamps the
// activationDate. The CRE emits a signed decision token (anchored on the
// immutable ledger via appendLedgerEvent) at the moment of activation.
// Subsequent execution steps (bank signatory transfer, customer
// notification, ownership handover) are governed by the same CRE policies.
// ─────────────────────────────────────────────────────────────────────────────

function casePathParam(req: NextRequest): string | null {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  // ["api", "standalone-succession", "<caseId>"]
  const raw = segments[segments.length - 1];
  if (!raw || raw.length < 1) return null;
  return decodeURIComponent(raw);
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const caseId = casePathParam(req);
  if (!caseId) {
    return NextResponse.json(
      { error: "Missing caseId", code: "missing_id" },
      { status: 400 }
    );
  }

  const found = await getCase(caseId, user.id);
  if (!found) {
    return NextResponse.json(
      { error: "Case not found or not owned by caller", code: "not_found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    case: {
      id: found.id,
      businessName: found.businessName,
      businessType: found.businessType,
      jurisdiction: found.jurisdiction,
      declarationHash: found.declarationHash,
      shamirThreshold: found.shamirThreshold,
      shamirShares: found.shamirShares,
      activationDate: found.activationDate?.toISOString() ?? null,
      status: found.status,
      feeEgp: found.feeEgp,
      createdAt: found.createdAt.toISOString(),
    },
  });
}, "GET /api/standalone-succession/[caseId]");

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const caseId = casePathParam(req);
  if (!caseId) {
    return NextResponse.json(
      { error: "Missing caseId", code: "missing_id" },
      { status: 400 }
    );
  }

  // Optional body: { action: "activate" } (default). Future PATCH actions
  // (mark_executing, mark_completed) will be added in subsequent sprints.
  const body = await req.json().catch(() => ({}));
  const action = (body as { action?: string })?.action ?? "activate";
  if (action !== "activate") {
    return NextResponse.json(
      { error: `Unsupported PATCH action: ${action}`, code: "unsupported_action" },
      { status: 400 }
    );
  }

  let updated;
  try {
    updated = await activateCase(caseId, user.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "activate_failed";
    const status =
      message === "case_not_found" ? 404 :
      message === "forbidden" ? 403 :
      message.startsWith("case_not_draftable") ? 409 :
      400;
    await audit({
      actorId: user.id,
      action: "standalone_succession.activate",
      target: `standalone_succession:${caseId}`,
      result: "denied",
      reason: message,
    });
    return NextResponse.json(
      { error: message, code: "activate_failed" },
      { status }
    );
  }

  return NextResponse.json({
    case: {
      id: updated.id,
      businessName: updated.businessName,
      businessType: updated.businessType,
      jurisdiction: updated.jurisdiction,
      declarationHash: updated.declarationHash,
      shamirThreshold: updated.shamirThreshold,
      shamirShares: updated.shamirShares,
      activationDate: updated.activationDate?.toISOString() ?? null,
      status: updated.status,
      feeEgp: updated.feeEgp,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}, "PATCH /api/standalone-succession/[caseId]");

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
