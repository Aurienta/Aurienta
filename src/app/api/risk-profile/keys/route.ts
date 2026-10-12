// AURIENTA — Risk Profile API Key generation endpoint (authed users only)
// POST /api/risk-profile/keys
//
// Returns { key, hash } — the raw key is shown ONCE. Only the hash is used
// to look up RiskProfileQuery history. The raw key is never persisted
// server-side.
//
// These keys are issued to INSURANCE PARTNERS — they consume the risk
// profile data API. AURIENTA does NOT underwrite insurance itself.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { audit } from "@/lib/aurienta/audit";
import { generateRiskProfileApiKey, RISK_PROFILE_DISCLAIMER } from "@/lib/aurienta/risk-profile";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { key, hash } = generateRiskProfileApiKey();

    await audit({
      actorId: user.id,
      action: "risk_profile.api_key.generated",
      target: `risk_profile_api_key:${hash.slice(0, 12)}`,
      result: "allowed",
      metadata: {
        keyPrefix: key.slice(0, 16),
        hashPrefix: hash.slice(0, 12),
      },
    });

    logger.info("risk_profile.api_key.generated", {
      userId: user.id,
      hashPrefix: hash.slice(0, 12),
    });

    return NextResponse.json(
      {
        ok: true,
        key,
        hash,
        keyPrefix: key.slice(0, 16) + "…",
        warning:
          "This key will only be shown once. Store it securely — you will not be able to retrieve it again.",
        disclaimer: RISK_PROFILE_DISCLAIMER,
        usage: {
          endpoint: "GET /api/risk-profile/[enterpriseId]",
          requiredHeaders: {
            "X-Risk-Profile-Api-Key": "<key>",
            "X-Disclaimer-Accepted": "true",
          },
          optionalHeaders: {
            "X-Requester-Org": "<insurance company name>",
          },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error("[POST /api/risk-profile/keys] error:", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Failed to generate risk-profile API key", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
