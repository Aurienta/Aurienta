// AURIENTA — Oracle API Key generation endpoint (authed users only)
// POST /api/oracle/keys
//
// Returns { key, hash } — the raw key is shown ONCE. Only the hash is used
// to look up OracleQuery history. The raw key is never persisted server-side.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { audit } from "@/lib/aurienta/audit";
import { generateApiKey } from "@/lib/aurienta/oracle-network";
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

    const { key, hash } = generateApiKey();

    await audit({
      actorId: user.id,
      action: "oracle.api_key.generated",
      target: `oracle_api_key:${hash.slice(0, 12)}`,
      result: "allowed",
      metadata: {
        keyPrefix: key.slice(0, 16),
        hashPrefix: hash.slice(0, 12),
      },
    });

    logger.info("oracle.api_key.generated", { userId: user.id, hashPrefix: hash.slice(0, 12) });

    return NextResponse.json(
      {
        ok: true,
        key,
        hash,
        keyPrefix: key.slice(0, 16) + "…",
        warning:
          "This key will only be shown once. Store it securely — you will not be able to retrieve it again.",
        disclaimer:
          "Oracle queries are a technology service, NOT financial/investment advice.",
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error("[POST /api/oracle/keys] error:", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Failed to generate oracle API key", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
