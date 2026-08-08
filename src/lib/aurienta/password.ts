// AURIENTA password hashing — Node.js scrypt (no external dependency).
// Hash format: "scrypt$<N>$<r>$<p>$<saltB64>$<hashB64>"
// scrypt is memory-hard, available natively in Node 18+, and used by
// Argon2 holdouts who can't ship native modules in a serverless runtime.

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const N = 16384; // CPU/memory cost — ~64 MiB.  Tuned for ~120ms/verify on a 1-vCPU box.
const R = 8;
const P = 1;
const KEY_LEN = 32;
const SALT_LEN = 16;

export function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(plain, salt, KEY_LEN, { N, r: R, p: P, maxmem: 128 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  // Legacy plaintext or malformed hash → never verify.
  if (!stored || !stored.startsWith("scrypt$")) return false;
  const parts = stored.split("$");
  if (parts.length !== 6) return false;
  const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
  const n = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  if (expected.length !== KEY_LEN) return false;

  const actual = scryptSync(plain, salt, KEY_LEN, { N: n, r, p, maxmem: 128 * 1024 * 1024 });
  return timingSafeEqual(actual, expected);
}

/** True if a stored hash looks like a real hashed password (not plaintext). */
export function isPlaintextHash(stored: string): boolean {
  return !stored || !stored.startsWith("scrypt$");
}
