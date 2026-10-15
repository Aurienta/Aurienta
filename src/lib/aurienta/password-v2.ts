// Argon2id password hashing — the gold standard (OWASP recommended).
// Replaces scrypt with Argon2id (memory-hard, side-channel resistant).
// Falls back to scrypt verify for legacy hashes (backward compatible).
//
// Hash format: "argon2id$<argon2-encoded-string>" (PHC format from @node-rs/argon2).
// Legacy scrypt format: "scrypt$<N>$<r>$<p>$<saltB64>$<hashB64>" — verified
// against the same algorithm as `password.ts`, then transparently upgraded
// to Argon2id on the next successful login.

import { hash, verify } from "@node-rs/argon2";
import { scryptSync, timingSafeEqual } from "crypto";

// OWASP-recommended Argon2id parameters (2024).
// memoryCost = 19456 KiB (19 MiB), timeCost = 2, parallelism = 1.
// These are the OWASP "minimum" baseline + a single iteration (time-cost 2)
// which yields ~100-200ms hashing latency on a 1-vCPU container — sufficient
// to make online brute-force economically impractical.
//
// `algorithm` is omitted: @node-rs/argon2 defaults to Argon2id (= 2), the
// OWASP-recommended hybrid. We avoid referencing `Algorithm.Argon2id`
// directly because the package declares `Algorithm` as a `const enum`, which
// cannot be referenced when `isolatedModules` is enabled (Next.js / SWC).
const ARGON2_OPTIONS = {
  memoryCost: 19456, // 19 MiB — OWASP recommended minimum
  timeCost: 2,       // 2 iterations
  parallelism: 1,
  // outputLen defaults to 32 bytes
} as const;

/**
 * Hash a password with Argon2id. Returns "argon2id$<encoded-hash>" where the
 * encoded hash is the standard PHC-string format produced by @node-rs/argon2
 * (it embeds the salt + all parameters needed for verification).
 */
export async function hashPasswordV2(plain: string): Promise<string> {
  const hashed = await hash(plain, ARGON2_OPTIONS);
  return `argon2id$${hashed}`;
}

/**
 * Verify a password against a stored hash. Supports BOTH:
 *  - "argon2id$..." — new state-of-the-art Argon2id (PHC-encoded).
 *  - "scrypt$..."    — legacy scrypt (verified then flagged for upgrade).
 *
 * Returns `{ valid, needsUpgrade }`. If `valid && needsUpgrade`, callers
 * should re-hash the password with `hashPasswordV2()` and persist the new
 * hash to the user record. This is done transparently at sign-in time.
 */
export async function verifyPasswordV2(
  plain: string,
  stored: string
): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  if (stored.startsWith("argon2id$")) {
    const encoded = stored.slice("argon2id$".length);
    const valid = await verify(encoded, plain);
    return { valid, needsUpgrade: false };
  }

  if (stored.startsWith("scrypt$")) {
    // Legacy scrypt verification (matches the format produced by password.ts).
    const parts = stored.split("$");
    if (parts.length !== 6) return { valid: false, needsUpgrade: false };
    const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
    const n = Number(nStr);
    const r = Number(rStr);
    const p = Number(pStr);
    if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) {
      return { valid: false, needsUpgrade: false };
    }
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    if (expected.length !== 32) return { valid: false, needsUpgrade: false };
    const actual = scryptSync(plain, salt, 32, {
      N: n,
      r,
      p,
      maxmem: 128 * 1024 * 1024,
    });
    const valid = timingSafeEqual(actual, expected);
    return { valid, needsUpgrade: valid };
  }

  return { valid: false, needsUpgrade: false };
}

/**
 * True if a stored hash is NOT a real hashed password (plaintext / mocked /
 * unknown format). Mirrors `isPlaintextHash()` from `password.ts` but also
 * recognizes the new `argon2id$` format.
 */
export function isPlaintextHash(stored: string): boolean {
  return (
    !stored ||
    (!stored.startsWith("argon2id$") && !stored.startsWith("scrypt$"))
  );
}
