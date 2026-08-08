// AURIENTA Ed25519 cryptographic signing — REAL signatures, not mocked.
// Used for: Constitutional Pledge signatures, CRE decision tokens,
// ledger event authentication.
//
// Each user gets an Ed25519 keypair at onboarding. The public key
// (identityAnchor) is stored in plaintext. The private key is AES-GCM
// encrypted (identitySecretEnc) using the field-encryption key.
//
// CRE decision tokens are signed by a platform keypair (rotated periodically),
// NOT per-user. This lets any party verify a CRE decision without trusting
// AURIENTA's database.

import nacl from "tweetnacl";
import { encryptField, decryptField } from "./encryption";
import { env } from "./env";
import { createHash } from "crypto";

// ── Platform CRE signing key ──
// In production this is HSM-backed. Here we derive a deterministic keypair
// from FIELD_ENCRYPTION_KEY so it's stable across restarts but not hardcoded.
let platformKeypair: { secretKey: Uint8Array; publicKey: Uint8Array } | null = null;

function getPlatformKeypair() {
  if (platformKeypair) return platformKeypair;
  const seed = createHash("sha256")
    .update(env.fieldEncryptionKey + "::cre-platform-key")
    .digest();
  const kp = nacl.sign.keyPair.fromSeed(new Uint8Array(seed));
  platformKeypair = kp;
  return kp;
}

/** The platform's Ed25519 public key (hex) — published so external auditors
 *  can verify any CRE decision token. */
export function platformPublicKeyHex(): string {
  return Buffer.from(getPlatformKeypair().publicKey).toString("hex");
}

/** Sign an arbitrary message string with the platform CRE key. Returns base64. */
export function signWithPlatformKey(message: string): string {
  const kp = getPlatformKeypair();
  const sig = nacl.sign.detached(
    Buffer.from(message, "utf8"),
    kp.secretKey
  );
  return Buffer.from(sig).toString("base64");
}

/** Verify a platform CRE signature. Returns true if valid. */
export function verifyPlatformSignature(message: string, signatureB64: string): boolean {
  try {
    const kp = getPlatformKeypair();
    const sig = Buffer.from(signatureB64, "base64");
    if (sig.length !== 64) return false;
    return nacl.sign.detached.verify(
      Buffer.from(message, "utf8"),
      new Uint8Array(sig),
      kp.publicKey
    );
  } catch {
    return false;
  }
}

// ── Per-user keypair management ──

export type UserKeypair = {
  publicKeyHex: string; // stored as identityAnchor
  secretEnc: string; // AES-GCM encrypted private key, stored as identitySecretEnc
};

/** Generate a new Ed25519 keypair for a user. Returns public key (hex) +
 *  AES-GCM-encrypted private key (base64) ready to persist. */
export function generateUserKeypair(): UserKeypair {
  const kp = nacl.sign.keyPair();
  const publicKeyHex = Buffer.from(kp.publicKey).toString("hex");
  const secretEnc = encryptField(Buffer.from(kp.secretKey).toString("base64"))!;
  return { publicKeyHex, secretEnc };
}

/** Decrypt a user's private key and sign a message with it (e.g. the pledge). */
export function signWithUserKey(secretEnc: string, message: string): string {
  const privKeyB64 = decryptField(secretEnc);
  if (!privKeyB64) throw new Error("Cannot decrypt user private key");
  const secretKey = new Uint8Array(Buffer.from(privKeyB64, "base64"));
  if (secretKey.length !== 64) throw new Error("Malformed private key");
  const sig = nacl.sign.detached(Buffer.from(message, "utf8"), secretKey);
  return Buffer.from(sig).toString("base64");
}

/** Verify a user signature against their public key (hex). */
export function verifyUserSignature(
  publicKeyHex: string,
  message: string,
  signatureB64: string
): boolean {
  try {
    const publicKey = new Uint8Array(Buffer.from(publicKeyHex, "hex"));
    if (publicKey.length !== 32) return false;
    const sig = Buffer.from(signatureB64, "base64");
    if (sig.length !== 64) return false;
    return nacl.sign.detached.verify(
      Buffer.from(message, "utf8"),
      new Uint8Array(sig),
      publicKey
    );
  } catch {
    return false;
  }
}

/** Build a CRE decision token: a signed envelope over policy + payload hash. */
export function issueCreDecisionToken(params: {
  policy: string;
  payloadHash: string;
  allowed: boolean;
  actorId?: string;
}): string {
  const message = `${params.policy}|${params.allowed ? "allow" : "deny"}|${params.payloadHash}|${params.actorId ?? "system"}`;
  const sig = signWithPlatformKey(message);
  // Token = base64(message) + "." + base64(sig)
  return `cre.${Buffer.from(message, "utf8").toString("base64url")}.${sig}`;
}

/** Verify a CRE decision token and return its parsed payload. Throws if invalid. */
export function verifyCreDecisionToken(token: string): {
  policy: string;
  allowed: boolean;
  payloadHash: string;
  actorId: string;
} {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "cre") {
    throw new Error("Malformed CRE decision token");
  }
  const message = Buffer.from(parts[1], "base64url").toString("utf8");
  const sig = parts[2];
  if (!verifyPlatformSignature(message, sig)) {
    throw new Error("Invalid CRE decision token signature");
  }
  const [policy, verdict, payloadHash, actorId] = message.split("|");
  return {
    policy,
    allowed: verdict === "allow",
    payloadHash,
    actorId: actorId === "system" ? "" : actorId,
  };
}
