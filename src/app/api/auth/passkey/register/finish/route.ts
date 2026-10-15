// Passkey registration — finish.
//
// Verifies the WebAuthn attestation returned by the browser and stores the
// new credential in the PasskeyCredential table. Auth required (the same
// user who started the ceremony must complete it — checked by challenge
// cookie + session).

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { getRpConfig, verifyRegistration } from "@/lib/aurienta/passkey";
import {
  readChallengeCookie,
  clearChallengeCookie,
} from "@/lib/aurienta/passkey-challenge";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  response: z.record(z.string(), z.unknown()),
  name: z.string().min(1).max(80).optional(),
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

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Missing or invalid WebAuthn response." },
      { status: 400 }
    );
  }

  // Read + clear the challenge cookie (single-use).
  const expectedChallenge = await readChallengeCookie();
  await clearChallengeCookie();
  if (!expectedChallenge) {
    return NextResponse.json(
      { error: "challenge_expired", message: "Please restart the passkey enrollment." },
      { status: 400 }
    );
  }

  // Use the stashed name cookie if the body didn't carry it.
  let label = parsed.name;
  if (!label) {
    const store = await cookies();
    label = store.get("aurienta_passkey_name")?.value ?? undefined;
    store.delete("aurienta_passkey_name");
  }

  const host = req.headers.get("host");
  const rpConfig = getRpConfig(host);

  try {
    const stored = await verifyRegistration(
      user.id,
      // The browser returns the canonical RegistrationResponseJSON; we cast
      // through `unknown` to satisfy TS — the @simplewebauthn/server verify
      // function will reject malformed payloads.
      parsed.response as never,
      expectedChallenge,
      rpConfig,
      label
    );

    await audit({
      action: "auth.passkey.register.finish",
      actorId: user.id,
      result: "allowed",
      ip,
      userAgent,
      metadata: {
        credentialId: stored.credentialId.slice(0, 12),
        deviceType: stored.deviceType,
        backedUp: stored.backedUp,
        name: label ?? null,
      },
    });
    logger.info("passkey register finish", { userId: user.id, ip });

    return NextResponse.json({
      ok: true,
      credential: {
        credentialId: stored.credentialId,
        name: label ?? null,
        deviceType: stored.deviceType,
        backedUp: stored.backedUp,
        transports: stored.transports,
      },
    });
  } catch (e) {
    await audit({
      action: "auth.passkey.register.finish",
      actorId: user.id,
      result: "denied",
      reason: e instanceof Error ? e.message : "verification_failed",
      ip,
      userAgent,
    });
    logger.warn("passkey register finish failed", {
      userId: user.id,
      err: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "verification_failed", message: "Passkey enrollment could not be verified." },
      { status: 400 }
    );
  }
}, "POST /api/auth/passkey/register/finish");
