// AURIENTA — AI Consensus Oracle Network (Phase 4)
//
// External queries to AURIENTA's 4-provider AI consensus. Each query is
// answered by the multi-model Brain (groq / nvidia / gemini / huggingface)
// running in consensus mode and signed with the platform Ed25519
// key so external consumers can verify the verdict cryptographically.
//
// COMPLIANCE: This is a technology service, NOT financial/investment advice.
// Every response carries a disclaimer. Per-query pricing is recorded.
// Verdicts are attestations of model agreement, not recommendations.

import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { audit } from "./audit";
import { signWithPlatformKey, platformPublicKeyHex } from "./signing";
import { askMultiModel, type AiProvider } from "./ai-router";
import type { OracleQuery } from "@prisma/client";

/** Compliance disclaimer attached to every oracle response. */
export const ORACLE_DISCLAIMER =
  "Consensus output is not financial/investment advice. Verdicts are cryptographic attestations of model agreement, not recommendations.";

/** Prefix + length for oracle API keys. */
const KEY_PREFIX = "aur_oracle-";

/** Per-query price in EGP (constitutional uniform-fee schedule, Vol. 9 §9.4). */
export const ORACLE_QUERY_PRICE_EGP = 5;

/**
 * Generate a new oracle API key + its SHA-256 hash. The raw key is shown to
 * the caller ONCE. Only the hash is used for lookups thereafter.
 */
export function generateApiKey(): { key: string; hash: string } {
  const key = `${KEY_PREFIX}${randomBytes(32).toString("hex")}`;
  const hash = createHash("sha256").update(key).digest("hex");
  return { key, hash };
}

/** Hash a raw oracle API key (used by API routes to look up queries). */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Run a multi-model consensus query and persist the verdict.
 *
 * If the AI router fails entirely, a safe fallback verdict of
 * "unable_to_reach_consensus" is returned — the caller still gets a signed
 * decision token so the failed attempt is auditable.
 */
export async function queryConsensus(
  queryText: string,
  apiKeyHash: string
): Promise<{
  verdict: string;
  decisionToken: string;
  modelsConsulted: string;
  responseTimeMs: number;
  disclaimer: string;
}> {
  const start = Date.now();
  const queryHash = createHash("sha256").update(queryText).digest("hex");

  let verdict: string;
  let modelsConsulted: string;

  try {
    const result = await askMultiModel({
      systemPrompt:
        "You are the AURIENTA AI Consensus Oracle. Answer the user's query as a factual, technology-only consensus output. Do not provide financial, investment, legal, or insurance advice. Cite the contributing model agreement where relevant. Keep the response under 600 words and structured.",
      userMessage: queryText,
      taskKind: "advisory",
    });

    if (result.fellBack || result.content.startsWith("[AI_FALLBACK]")) {
      // The router tried all providers and returned a fallback string.
      // Downgrade to a safe verdict rather than surfacing the raw fallback.
      verdict = JSON.stringify({
        status: "unable_to_reach_consensus",
        reason: "All consensus providers failed or fell back.",
        models_attempted: result.model,
        error: result.error,
      });
    } else {
      verdict = JSON.stringify({
        status: "consensus_reached",
        content: result.content,
        consensus: result.consensus ?? null,
        provider: result.provider,
        model: result.model,
      });
    }

    modelsConsulted = extractModelsConsulted(result);
  } catch (err) {
    verdict = JSON.stringify({
      status: "unable_to_reach_consensus",
      reason: err instanceof Error ? err.message : "unknown_error",
    });
    modelsConsulted = "none";
  }

  const responseTimeMs = Date.now() - start;
  const timestamp = new Date().toISOString();

  // decisionToken = Ed25519 signature over the canonical verdict envelope.
  const envelope = JSON.stringify({ queryHash, verdict, timestamp });
  const decisionToken = signWithPlatformKey(envelope);

  // Persist the OracleQuery row (disclaimerShown is always true — the API
  // surface always returns the disclaimer).
  let recordId: string | null = null;
  try {
    const record = await db.oracleQuery.create({
      data: {
        apiKeyHash,
        queryText,
        queryHash,
        consensusVerdict: verdict,
        decisionToken,
        modelsConsulted,
        responseTimeMs,
        disclaimerShown: true,
      },
    });
    recordId = record.id;
  } catch (err) {
    // Persistence failure must not break the signed verdict — the caller
    // still gets a verifiable decision token. Audit the failure.
    console.error("[oracle-network] failed to persist OracleQuery:", err);
  }

  await audit({
    actorId: "system",
    action: "oracle.consensus_query",
    target: `oracle_query:${recordId ?? "unpersisted"}`,
    result: "allowed",
    metadata: {
      apiKeyHash,
      queryHash,
      modelsConsulted,
      responseTimeMs,
      priceEgp: ORACLE_QUERY_PRICE_EGP,
    },
  });

  return {
    verdict,
    decisionToken,
    modelsConsulted,
    responseTimeMs,
    disclaimer: ORACLE_DISCLAIMER,
  };
}

/**
 * Return prior oracle queries for a given API key hash (most recent first).
 */
export async function getQueryHistory(
  apiKeyHash: string,
  limit = 50
): Promise<OracleQuery[]> {
  return db.oracleQuery.findMany({
    where: { apiKeyHash },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(1, limit), 200),
  });
}

/** Build the comma-separated modelsConsulted string from a router result. */
function extractModelsConsulted(result: {
  provider: AiProvider;
  model: string;
  consensus?: { modelsQueried?: string[]; providersQueried?: string[] } | null;
}): string {
  if (result.consensus?.modelsQueried && result.consensus.modelsQueried.length > 0) {
    return result.consensus.modelsQueried.join(",");
  }
  return `${result.provider}/${result.model}`;
}

/** Re-export the platform public key so consumers can verify oracle tokens. */
export { platformPublicKeyHex };
