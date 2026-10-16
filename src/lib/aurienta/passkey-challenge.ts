// AURIENTA WebAuthn challenge cookie helper.
//
// The challenge is a random, single-use, short-lived nonce that the
// authenticator signs during a WebAuthn ceremony (registration or
// authentication). The server MUST persist it between the start and
// finish calls so it can verify the response.challenge matches what it
// generated.
//
// Implementation: signed HttpOnly cookie. The cookie value is
// `<base64url-challenge>.<base64url-hmac>`. The HMAC prevents tampering
// even if an attacker can read the cookie (e.g. via a sub-domain XSS).
// Cookies expire after PASSKEY_CHALLENGE_TTL_MS (5 minutes).

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { env } from "@/lib/aurienta/env";
import { PASSKEY_CHALLENGE_TTL_MS } from "@/lib/aurienta/passkey";

const COOKIE_NAME = "aurienta_passkey_challenge";

/**
 * Derive the HMAC signing key. In production this MUST come from
 * FIELD_ENCRYPTION_KEY (already provisioned for the encryption module).
 * We re-use it here rather than introducing a new env var — it has the
 * right properties (32+ bytes, unique per deploy).
 */
function signingKey(): Buffer {
  // The env module already returns a base64-encoded 44-char key (32 raw bytes)
  // or a dev fallback. We use the raw bytes here.
  try {
    return Buffer.from(env.fieldEncryptionKey, "base64");
  } catch {
    // Fallback: derive from a constant. This only happens in broken envs.
    return Buffer.from("aurienta-passkey-challenge-key-v2", "utf8");
  }
}

function sign(challenge: string): string {
  const mac = createHmac("sha256", signingKey())
    .update(challenge)
    .digest("base64url");
  return mac;
}

/** Set a signed challenge cookie. */
export async function setChallengeCookie(challenge: string): Promise<void> {
  const mac = sign(challenge);
  const value = `${challenge}.${mac}`;
  const store = await cookies();
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    path: "/",
    maxAge: Math.floor(PASSKEY_CHALLENGE_TTL_MS / 1000),
  });
}

/**
 * Read + verify the challenge cookie. Returns the stored challenge if it
 * exists and the HMAC is valid, or null otherwise. Single-use semantics
 * (the cookie is cleared after read) are enforced by `clearChallengeCookie()`
 * — callers MUST call it after consuming the challenge.
 */
export async function readChallengeCookie(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return null;

  const dot = value.lastIndexOf(".");
  if (dot <= 0 || dot === value.length - 1) return null;

  const challenge = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  const expected = sign(challenge);

  // Constant-time comparison to avoid timing oracles.
  try {
    const a = Buffer.from(mac, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
  } catch {
    return null;
  }

  return challenge;
}

/** Clear the challenge cookie — called after a ceremony completes (or fails). */
export async function clearChallengeCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Generate a fresh high-entropy challenge (32 bytes, base64url).
 * Used as a fallback if @simplewebauthn/server's internal generation fails.
 */
export function generateChallenge(): string {
  return randomBytes(32).toString("base64url");
}
