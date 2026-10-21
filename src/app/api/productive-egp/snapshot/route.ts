// AURIENTA — REC-2 Productive EGP API.
//
// GET  /api/productive-egp/snapshot?enterpriseId=<id>
//      → returns the latest snapshot for an enterprise, or 404 if none.
//
// POST /api/productive-egp/snapshot
//      Body: { enterpriseId, inflationRatePct? }
//      → computes a new snapshot (CRE-validated), persists it, returns it.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import {
  computeSnapshot,
  getLatestSnapshot,
} from "@/lib/aurienta/productive-egp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — latest snapshot for an enterprise
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const enterpriseId = url.searchParams.get("enterpriseId");
  if (!enterpriseId) {
    return NextResponse.json(
      { error: "enterpriseId query param is required" },
      { status: 400 }
    );
  }

  const snapshot = await getLatestSnapshot(enterpriseId);
  if (!snapshot) {
    return NextResponse.json(
      { error: "No snapshot found. Compute one first.", code: "not_found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ snapshot });
}, "GET /api/productive-egp/snapshot");

// POST — compute a new snapshot
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  let body: { enterpriseId?: string; inflationRatePct?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body must be valid JSON" },
      { status: 400 }
    );
  }
  const enterpriseId = (body.enterpriseId ?? "").trim();
  if (!enterpriseId) {
    return NextResponse.json(
      { error: "enterpriseId is required" },
      { status: 400 }
    );
  }
  const inflationRatePct =
    typeof body.inflationRatePct === "number" ? body.inflationRatePct : undefined;

  try {
    const snapshot = await computeSnapshot(enterpriseId, {
      inflationRatePct,
      actorId: user.id,
    });
    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "CRE denied";
    const status = message.includes("not_found") ? 404 : 400;
    return NextResponse.json(
      { error: message, code: "snapshot_failed" },
      { status }
    );
  }
}, "POST /api/productive-egp/snapshot");
