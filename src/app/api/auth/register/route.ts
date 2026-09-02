// AURIENTA registration API — creates a Constitutional Partner with a real
// Ed25519 Identity Anchor, scrypt password hash, and signed Constitutional Pledge.
//
// Hardening (REMED-1A):
// - Email/mobile uniqueness enforced (409 on collision).
// - Password hashed via scrypt (hashPassword).
// - nationalIdLast4 AES-GCM encrypted at rest (encryptField).
// - Ed25519 keypair generated server-side; private key encrypted before persistence.
// - Pledge is signed with the user's private key over a deterministic message
//   (email + ISO timestamp) so it is verifiable later via verifyUserSignature.
// - Session is created immediately after registration (no second sign-in step).
// - Rate-limited via `limiters.signin` (shares the sign-in budget — an attacker
//   cannot enumerate registration to bypass).
// - Audit-logged.

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { logger } from "@/lib/aurienta/logger";
import { limiters, rateLimitedResponse } from "@/lib/aurienta/rate-limit";
import { audit } from "@/lib/aurienta/audit";
import { parseBody, registerSchema } from "@/lib/aurienta/validation";
import { createSession } from "@/lib/aurienta/auth";
import { hashPassword } from "@/lib/aurienta/password";
import { generateUserKeypair, signWithUserKey } from "@/lib/aurienta/signing";
import { encryptField } from "@/lib/aurienta/encryption";
import { withErrorHandler } from "@/lib/aurienta/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return "unknown";
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // ── Rate-limit ──
  const rl = limiters.signin(ip);
  if (!rl.allowed) {
    logger.warn("register rate-limited", { ip, resetAt: rl.resetAt });
    return rateLimitedResponse(rl.resetAt);
  }

  // ── Parse + validate body ──
  const body = await parseBody(req, registerSchema);
  if (body instanceof NextResponse) return body;

  const email = body.email.trim().toLowerCase();
  const mobile = body.mobile.trim();

  // ── Email / mobile uniqueness ──
  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { mobile }] },
    select: { id: true, email: true, mobile: true },
  });
  if (existing) {
    const conflict = existing.email === email ? "email" : "mobile";
    await audit({
      action: "auth.register",
      result: "denied",
      reason: `${conflict}_taken`,
      metadata: { email, mobile },
      ip,
      userAgent,
    });
    return NextResponse.json(
      { error: "conflict", message: `That ${conflict} is already registered.`, conflict },
      { status: 409 }
    );
  }

  // ── Generate Ed25519 Identity Anchor ──
  // The keypair is the user's long-term signing identity. The private key is
  // AES-GCM encrypted under FIELD_ENCRYPTION_KEY before persistence.
  const kp = generateUserKeypair();

  // ── Sign the Constitutional Pledge ──
  // Deterministic message — email binds to identity, ISO timestamp binds to
  // the moment of consent. Stored alongside the public key so any party can
  // verify the pledge later via verifyUserSignature(identityAnchor, msg, sig).
  const pledgeMessage = `AURIENTA Constitutional Pledge — ${email} — ${new Date().toISOString()}`;
  const pledgeSignature = signWithUserKey(kp.secretEnc, pledgeMessage);

  // ── Password + PII hashing/encryption ──
  const passwordHash = hashPassword(body.password);
  const nationalIdLast4Enc = body.nationalIdLast4
    ? encryptField(body.nationalIdLast4)
    : null;

  // Identity dup-prevention hash — SHA3-256 over a stable identity tuple.
  // Not PII — just a uniqueness guard (e.g. prevents re-using a national ID
  // under a different email). For now we hash email+mobile (+ optional
  // nationalIdLast4) as a placeholder for the full identity-hash flow.
  const identityHash = createHash("sha3-256")
    .update(`${email}|${mobile}|${body.nationalIdLast4 ?? ""}`)
    .digest("hex");

  // ── Persist user ──
  const newUser = await db.user.create({
    data: {
      email,
      mobile,
      legalName: body.legalName.trim(),
      passwordHash,
      verificationLevel: body.verificationLevel,
      nationality: body.nationality,
      nationalIdLast4: nationalIdLast4Enc,
      identityHash,
      identityAnchor: kp.publicKeyHex,
      identitySecretEnc: kp.secretEnc,
      pledgeSignedAt: new Date(),
      pledgeSignature: pledgeSignature,
      // New partners start at the Emerging Participant tier (Sovereign Trust Score 65).
      sovereignTrustScore: 65,
      tier: "Emerging Participant",
      primaryIntent: body.primaryIntent ?? null,
    },
    select: { id: true, email: true, legalName: true, identityAnchor: true },
  });

  // ── Audit + session ──
  await audit({
    action: "auth.register",
    actorId: newUser.id,
    result: "allowed",
    metadata: { verificationLevel: body.verificationLevel, identityAnchor: kp.publicKeyHex },
    ip,
    userAgent,
  });

  await createSession(newUser.id, { ip, userAgent });

  logger.info("register success", { userId: newUser.id, email, ip });

  return NextResponse.json(
    { user: newUser },
    { status: 201 }
  );
}, "POST /api/auth/register");
