// Passkey authentication — finish.
//
// Verifies the WebAuthn assertion returned by the browser, updates the
// credential's sign-count (replay protection), and creates a new session
// for the user that owns the credential. No auth required.
//
// Security: passkey authentication is phishing-resistant (the browser
// only releases a signed assertion to a request whose origin matches the
// RP ID the credential was registered under). Combined with user-
// verification (biometric / PIN), this is the strongest sign-in available.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, getCurrentUser } from "@/lib/aurienta/auth";
import { getRpConfig, verifyAuthentication } from "@/lib/aurienta/passkey";
import {
  readChallengeCookie,
  clearChallengeCookie,
} from "@/lib/aurienta/passkey-challenge";
import { resetLockout } from "@/lib/aurienta/account-lockout";
import { withErrorHandler } from "@/lib/aurienta/api-handler";
import { audit } from "@/lib/aurienta/audit";
import { logger } from "@/lib/aurienta/logger";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  response: z.record(z.string(), z.unknown()),
});

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  // If the user is already signed in, the call is a no-op — return the
  // current user without performing a new ceremony. This matches the
  // behavior of the password signin route (idempotent).
  const existing = await getCurrentUser();
  if (existing) {
    return NextResponse.json({
      user: { id: existing.id, email: existing.email, legalName: existing.legalName },
    });
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

  const expectedChallenge = await readChallengeCookie();
  await clearChallengeCookie();
  if (!expectedChallenge) {
    return NextResponse.json(
      { error: "challenge_expired", message: "Please restart the passkey sign-in." },
      { status: 400 }
    );
  }

  const host = req.headers.get("host");
  const rpConfig = getRpConfig(host);

  let result: { userId: string; credentialId: string; newCounter: number; userVerified: boolean };
  try {
    result = await verifyAuthentication(
      parsed.response as never,
      expectedChallenge,
      rpConfig
    );
  } catch (e) {
    await audit({
      action: "auth.passkey.authenticate",
      result: "denied",
      reason: e instanceof Error ? e.message : "verification_failed",
      ip,
      userAgent,
    });
    logger.warn("passkey authenticate failed", {
      ip,
      err: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "verification_failed", message: "Passkey sign-in could not be verified." },
      { status: 401 }
    );
  }

  // Look up the user that owns this credential.
  const user = await db.user.findUnique({
    where: { id: result.userId },
    select: { id: true, email: true, legalName: true },
  });
  if (!user) {
    // Credential exists but user was deleted — clean up the orphaned row.
    await db.passkeyCredential.deleteMany({
      where: { credentialId: result.credentialId },
    }).catch(() => {});
    return NextResponse.json(
      { error: "verification_failed", message: "Account no longer exists." },
      { status: 401 }
    );
  }

  // Create a server-side session. Passkey auth already proved user-verification
  // (biometric/PIN), so we tag the session as MFA-verified — sensitive
  // downstream actions can be performed without a separate TOTP challenge.
  await createSession(user.id, { ip, userAgent, mfaVerifiedAt: new Date() });

  // Clear any outstanding password-attempt lockout for this email — passkey
  // success proves the account owner is in control of their device.
  await resetLockout(user.email);

  await audit({
    action: "auth.passkey.authenticate",
    actorId: user.id,
    result: "allowed",
    ip,
    userAgent,
    metadata: {
      credentialId: result.credentialId.slice(0, 12),
      userVerified: result.userVerified,
    },
  });
  logger.info("passkey authenticate success", { userId: user.id, ip });

  return NextResponse.json({
    user: { id: user.id, email: user.email, legalName: user.legalName },
  });
}, "POST /api/auth/passkey/authenticate/finish");
