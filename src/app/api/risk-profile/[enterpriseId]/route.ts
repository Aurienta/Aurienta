// AURIENTA — Risk Profile API · GET /api/risk-profile/[enterpriseId]
//
// Public endpoint — authentication is via the X-Risk-Profile-Api-Key header
// (not a session). The X-Disclaimer-Accepted: true header is REQUIRED —
// the CRE policy `enforceRiskProfileQuery` fails closed without it (403).
//
// Returns the enterprise risk profile (9 vital signs + recommendation +
// Ed25519-signed decision token) + the compliance disclaimer.

import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import {
  generateRiskProfile,
  hashApiKey,
  RISK_PROFILE_DISCLAIMER,
  platformPublicKeyHex,
} from "@/lib/aurienta/risk-profile";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const riskLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  key: "risk_profile",
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ enterpriseId: string }> }
) {
  const { enterpriseId } = await params;

  if (!enterpriseId) {
    return NextResponse.json(
      { error: "Enterprise ID is required", disclaimer: RISK_PROFILE_DISCLAIMER },
      { status: 400 }
    );
  }

  const apiKey = req.headers.get("x-risk-profile-api-key");
  if (!apiKey || apiKey.length < 16) {
    return NextResponse.json(
      {
        error:
          "X-Risk-Profile-Api-Key header is required (issue a key via POST /api/risk-profile/keys)",
        disclaimer: RISK_PROFILE_DISCLAIMER,
      },
      { status: 401 }
    );
  }

  // Disclaimer MUST be explicitly accepted via header — enforced by the CRE.
  const disclaimerAccepted =
    req.headers.get("x-disclaimer-accepted")?.toLowerCase() === "true";
  if (!disclaimerAccepted) {
    await audit({
      actorId: "system",
      action: "risk_profile.disclaimer_missing",
      target: `enterprise:${enterpriseId}`,
      result: "denied",
      reason: "X-Disclaimer-Accepted: true header required",
    });
    return NextResponse.json(
      {
        error:
          "X-Disclaimer-Accepted: true header is required. AURIENTA does NOT underwrite insurance — this API provides enterprise risk data only.",
        disclaimer: RISK_PROFILE_DISCLAIMER,
      },
      { status: 403 }
    );
  }

  const apiKeyHash = hashApiKey(apiKey);

  const rl = riskLimiter(apiKeyHash);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  // Requester org is sourced from the optional X-Requester-Org header
  // (insurance company name). Defaults to "external" if not provided.
  const requesterOrg =
    req.headers.get("x-requester-org")?.slice(0, 120) ?? "external";

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  try {
    const profile = await generateRiskProfile(
      enterpriseId,
      requesterOrg,
      apiKeyHash
    );

    await audit({
      actorId: "system",
      action: "risk_profile.api_call",
      target: `enterprise:${enterpriseId}`,
      result: "allowed",
      metadata: {
        requesterOrg,
        healthScore: profile.healthScore,
        recommendation: profile.recommendation,
        apiKeyHashPrefix: apiKeyHash.slice(0, 12),
      },
      ip,
      userAgent,
    });

    return NextResponse.json(
      {
        enterpriseId,
        ...profile,
        platformPublicKey: platformPublicKeyHex(),
      },
      { status: 200 }
    );
  } catch (err) {
    logger.error("[GET /api/risk-profile/[enterpriseId]] error:", {
      err: err instanceof Error ? err.message : String(err),
      enterpriseId,
    });
    const status = err instanceof Error && err.message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Risk profile generation failed",
        disclaimer: RISK_PROFILE_DISCLAIMER,
      },
      { status }
    );
  }
}
