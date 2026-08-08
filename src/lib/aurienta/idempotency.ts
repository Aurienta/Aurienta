// AURIENTA idempotency — replay-safe POSTs for money-moving endpoints.
// Callers send an `Idempotency-Key` header; we cache the first response
// and replay it on retries.

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";

/** Read the Idempotency-Key header (or synthesize one from the body hash + user).
 *  Returns null if none provided (non-idempotent request). */
export async function getIdempotencyContext(
  req: NextRequest,
  userId: string,
  body: unknown
): Promise<{ key: string; bodyHash: string } | null> {
  const explicit = req.headers.get("idempotency-key");
  if (explicit) {
    const bodyHash = hashBody(body);
    return { key: `${userId}:${explicit}`, bodyHash };
  }
  return null;
}

function hashBody(body: unknown): string {
  return createHash("sha3-256").update(JSON.stringify(body)).digest("hex").slice(0, 16);
}

/** Check for a cached idempotent response. If found, replay it. */
export async function checkIdempotency(
  ctx: { key: string; bodyHash: string },
  route: string
): Promise<NextResponse | null> {
  const existing = await db.idempotencyRecord.findUnique({
    where: { key: ctx.key },
  });
  if (!existing) return null;
  // Body hash mismatch = caller reused a key with different data → reject.
  if (existing.requestBodyHash !== ctx.bodyHash) {
    return NextResponse.json(
      { error: "idempotency_key_reuse", message: "Idempotency-Key was already used with a different request body." },
      { status: 422 }
    );
  }
  // Replay the cached response.
  let body: unknown;
  try {
    body = JSON.parse(existing.responseBody);
  } catch {
    body = existing.responseBody;
  }
  return NextResponse.json(body, { status: existing.status });
}

/** Cache a response for future replays. */
export async function storeIdempotency(
  ctx: { key: string; bodyHash: string },
  route: string,
  userId: string,
  status: number,
  body: unknown
): Promise<void> {
  try {
    await db.idempotencyRecord.create({
      data: {
        key: ctx.key,
        userId,
        route,
        requestBodyHash: ctx.bodyHash,
        status,
        responseBody: JSON.stringify(body),
      },
    });
  } catch {
    // Unique-constraint violation = race; another request already stored it.
    // Acceptable — the first response wins.
  }
}
