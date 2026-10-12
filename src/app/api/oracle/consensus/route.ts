// AURIENTA — AI Consensus Oracle Network · public query endpoint
// POST /api/oracle/consensus
//
// Body: { query: string, apiKey: string }
//
// Public endpoint — authentication is via the oracle API key (not a session).
// Each call is rate-limited per API key hash and recorded as an OracleQuery.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import {
  queryConsensus,
  hashApiKey,
  ORACLE_DISCLAIMER,
  ORACLE_QUERY_PRICE_EGP,
  platformPublicKeyHex,
} from "@/lib/aurienta/oracle-network";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const oracleLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  key: "oracle_consensus",
});

const BodySchema = z.object({
  query: z.string().min(3).max(4000),
  apiKey: z.string().min(16).max(128),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: parsed.error.flatten(),
        disclaimer: ORACLE_DISCLAIMER,
      },
      { status: 400 }
    );
  }

  const apiKeyHash = hashApiKey(parsed.data.apiKey);

  // Rate limit per API key hash (not per IP — public endpoint).
  const rl = oracleLimiter(apiKeyHash);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  try {
    const result = await queryConsensus(parsed.data.query, apiKeyHash);

    await audit({
      actorId: "system",
      action: "oracle.consensus_api_call",
      target: `api_key:${apiKeyHash.slice(0, 12)}`,
      result: "allowed",
      metadata: {
        queryLength: parsed.data.query.length,
        responseTimeMs: result.responseTimeMs,
        modelsConsulted: result.modelsConsulted,
        priceEgp: ORACLE_QUERY_PRICE_EGP,
      },
      ip,
      userAgent,
    });

    return NextResponse.json(
      {
        verdict: result.verdict,
        decisionToken: result.decisionToken,
        modelsConsulted: result.modelsConsulted,
        responseTimeMs: result.responseTimeMs,
        disclaimer: result.disclaimer,
        platformPublicKey: platformPublicKeyHex(),
        priceEgp: ORACLE_QUERY_PRICE_EGP,
      },
      { status: 200 }
    );
  } catch (err) {
    logger.error("[POST /api/oracle/consensus] error:", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: "Consensus query failed",
        disclaimer: ORACLE_DISCLAIMER,
      },
      { status: 500 }
    );
  }
}

/** GET — surface the disclaimer + price + platform public key for documentation. */
export async function GET() {
  return NextResponse.json({
    service: "AURIENTA AI Consensus Oracle Network",
    disclaimer: ORACLE_DISCLAIMER,
    priceEgpPerQuery: ORACLE_QUERY_PRICE_EGP,
    platformPublicKey: platformPublicKeyHex(),
    endpoint: "POST /api/oracle/consensus",
    requiredHeaders: { "Content-Type": "application/json" },
    bodySchema: { query: "string (3-4000 chars)", apiKey: "string" },
  });
}
