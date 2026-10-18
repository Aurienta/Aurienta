// Delete a passkey. Auth required. Body: { credentialId: <row cuid> }.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { deletePasskey } from "@/lib/aurienta/passkey";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  // The PasskeyCredential row cuid. (Despite the name "credentialId" in the
  // body — preserved for API stability — this is the row id, not the
  // WebAuthn credential ID.)
  credentialId: z.string().min(1).max(64),
});

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "`credentialId` is required." },
      { status: 400 }
    );
  }

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // ── Rate-limit (DB-backed — AUD-030 / AUD-031) ──
  // 15/min/IP+user — destructive credential action, keep tight.
  const rl = await limiters.passkeyDb(`${user.id}:${ip}`);
  if (!rl.allowed) {
    logger.warn("passkey delete rate-limited", { ip, userId: user.id, resetAt: rl.resetAt });
    return rateLimitedResponse(rl.resetAt);
  }

  const deleted = await deletePasskey(user.id, parsed.credentialId);
  if (!deleted) {
    await audit({
      action: "auth.passkey.delete",
      actorId: user.id,
      result: "denied",
      reason: "not_found_or_not_owned",
      ip,
      userAgent,
    });
    return NextResponse.json(
      { error: "not_found", message: "Passkey not found or not owned by this account." },
      { status: 404 }
    );
  }

  await audit({
    action: "auth.passkey.delete",
    actorId: user.id,
    result: "allowed",
    ip,
    userAgent,
    metadata: { credentialRowId: parsed.credentialId },
  });
  logger.info("passkey delete", { userId: user.id, ip });

  return NextResponse.json({ ok: true });
}, "POST /api/auth/passkey/delete");
