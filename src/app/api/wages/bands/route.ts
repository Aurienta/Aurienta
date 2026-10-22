// AURIENTA — REC-5 Constitutional Wages API.
//
// GET  /api/wages/bands?enterpriseId=<id>&includeUnpublished=<bool>
//      → returns the wage bands for an enterprise (default: published only).
//
// POST /api/wages/bands
//      Body: { enterpriseId, action: "generate" | "publish" }
//      → "generate"  : AI-generate the 4 constitutional wage bands (CRE-validated).
//      → "publish"   : mark all unpublished bands as published (public visibility).
//
// Auth: session cookie. The caller must be a member of the enterprise.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { audit } from "@/lib/aurienta/audit";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import {
  generateWageBands,
  publishWageBands,
  getWageBands,
} from "@/lib/aurienta/constitutional-wages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — list bands for an enterprise
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
  const includeUnpublished =
    url.searchParams.get("includeUnpublished") === "true";

  // If viewing unpublished bands, caller must be a member. Published bands
  // are public (constitutional transparency) — anyone can view them.
  if (includeUnpublished) {
    const isMember = user.memberships.some(
      (m) => m.enterpriseId === enterpriseId
    );
    const isPlatformAdmin =
      user.primaryIntent === "aurienta_rep" ||
      user.memberships.some((m) => m.role === "aurienta_rep");
    if (!isMember && !isPlatformAdmin) {
      return NextResponse.json(
        { error: "Only enterprise members may view unpublished wage bands." },
        { status: 403 }
      );
    }
  }

  const bands = await getWageBands(enterpriseId, { includeUnpublished });
  return NextResponse.json({ bands });
}, "GET /api/wages/bands");

// POST — generate AI bands or publish existing bands
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated", code: "unauthenticated" },
      { status: 401 }
    );
  }

  const rl = limiters.governance(user.id);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  let body: { enterpriseId?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body must be valid JSON" },
      { status: 400 }
    );
  }

  const enterpriseId = (body.enterpriseId ?? "").trim();
  const action = (body.action ?? "").trim();
  if (!enterpriseId) {
    return NextResponse.json(
      { error: "enterpriseId is required" },
      { status: 400 }
    );
  }
  if (action !== "generate" && action !== "publish") {
    return NextResponse.json(
      { error: "action must be 'generate' or 'publish'" },
      { status: 400 }
    );
  }

  // Authorization: caller must be a member of the enterprise OR aurienta_rep.
  const isMember = user.memberships.some(
    (m) => m.enterpriseId === enterpriseId
  );
  const isPlatformAdmin =
    user.primaryIntent === "aurienta_rep" ||
    user.memberships.some((m) => m.role === "aurienta_rep");
  if (!isMember && !isPlatformAdmin) {
    await audit({
      actorId: user.id,
      action: "wage_band." + action,
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "not_enterprise_member",
    });
    return NextResponse.json(
      {
        error: "Only enterprise members may " + action + " wage bands.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  try {
    if (action === "generate") {
      const bands = await generateWageBands(enterpriseId);
      return NextResponse.json({ bands }, { status: 201 });
    }
    // action === "publish"
    const bands = await publishWageBands(enterpriseId);
    return NextResponse.json({ bands });
  } catch (e) {
    const message = e instanceof Error ? e.message : "CRE denied";
    const status = message.includes("No wage bands") ? 404 : 400;
    return NextResponse.json(
      { error: message, code: "wage_band_failed" },
      { status }
    );
  }
}, "POST /api/wages/bands");
