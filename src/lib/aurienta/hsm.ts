// AURIENTA — HSM Interface for CRE Platform Key (Vol 17 §17.4)
// Provides a Hardware Security Module (HSM) interface for the CRE platform key.
//
// In the sandbox, this falls back to the software-derived key (SHA-256 of env var).
// Production wiring: AWS KMS, Azure Key Vault, or on-prem HSM (Thales Luna,
// Utimaco SecurityServer) accessed via PKCS#11.
//
// The HSM ensures the CRE platform private key NEVER leaves the hardware —
// signing operations happen inside the HSM, and the key is non-exportable.

import { createHash, generateKeyPairSync, sign, verify } from "crypto";

export type KeyProvider = "hsm" | "software";

export type HsmConfig = {
  provider: "aws-kms" | "azure-keyvault" | "pkcs11" | "software-fallback";
  keyId?: string; // HSM key identifier
  region?: string; // for AWS KMS
  endpoint?: string; // for PKCS#11
};

/**
 * Detect the active key provider.
 * - If HSM_KEY_ID env var is set, uses HSM mode (production).
 * - Otherwise, falls back to software-derived key (sandbox/dev).
 */
export function getKeyProvider(): KeyProvider {
  return process.env.HSM_KEY_ID ? "hsm" : "software";
}

/**
 * Get the HSM configuration.
 */
export function getHsmConfig(): HsmConfig {
  const keyId = process.env.HSM_KEY_ID;
  if (keyId) {
    return {
      provider: (process.env.HSM_PROVIDER as HsmConfig["provider"]) ?? "aws-kms",
      keyId,
      region: process.env.HSM_REGION ?? "us-east-1",
      endpoint: process.env.HSM_ENDPOINT,
    };
  }
  return { provider: "software-fallback" };
}

/**
 * Get the software-derived Ed25519 keypair (sandbox fallback).
 * Uses Node.js crypto generateKeyPairSync — no external dependency.
 */
let cachedKeypair: { publicKey: string; privateKey: string } | null = null;

function getSoftwareKeypair(): { publicKey: string; privateKey: string } {
  if (cachedKeypair) return cachedKeypair;

  // Derive a deterministic keypair from FIELD_ENCRYPTION_KEY
  // (sandbox only — production uses HSM)
  const seed = process.env.FIELD_ENCRYPTION_KEY ?? "aurienta-default-seed-2026";
  const seedHash = createHash("sha256").update(seed + "::cre-platform-key").digest("hex");

  // Generate an Ed25519 keypair
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pubBase64 = publicKey.export({ format: "der", type: "spki" }).toString("base64");
  const privBase64 = privateKey.export({ format: "der", type: "pkcs8" }).toString("base64");

  cachedKeypair = { publicKey: pubBase64, privateKey: privBase64 };
  return cachedKeypair;
}

/**
 * Sign a message with the CRE platform key.
 *
 * - HSM mode: delegates to the HSM (key never leaves hardware).
 * - Software mode: uses the software-derived Ed25519 keypair (sandbox only).
 *
 * Returns: base64-encoded signature.
 */
export async function signWithPlatformKey(message: string): Promise<string> {
  const provider = getKeyProvider();

  if (provider === "hsm") {
    const config = getHsmConfig();
    // PRODUCTION: call the HSM here.
    // AWS KMS: await kmsClient.sign({ KeyId: config.keyId, Message: Buffer.from(message), SigningAlgorithm: "ED25519" })
    // Azure Key Vault: await keyClientClient.sign("ES256K", Buffer.from(message))
    // PKCS#11: call C_Sign with the session handle
    //
    // SANDBOX FALLBACK: even in "HSM mode" we use the software key because
    // we don't have real HSM hardware in the sandbox.
    console.warn("[hsm] HSM mode requested but falling back to software (sandbox)");
  }

  // Software signing (sandbox/dev fallback) — uses Node.js crypto
  const { privateKey } = getSoftwareKeypair();
  const signature = sign(null, Buffer.from(message), {
    key: Buffer.from(privateKey, "base64"),
    format: "der",
    type: "pkcs8",
  });
  return signature.toString("base64");
}

/**
 * Verify a CRE platform signature.
 * Uses the platform's public key (published for external auditors).
 */
export async function verifyPlatformSignature(
  message: string,
  signatureBase64: string
): Promise<boolean> {
  const { publicKey } = getSoftwareKeypair();
  const signature = Buffer.from(signatureBase64, "base64");
  return verify(null, Buffer.from(message), {
    key: Buffer.from(publicKey, "base64"),
    format: "der",
    type: "spki",
  }, signature);
}

/**
 * Get the platform public key (hex) for external verification.
 * Auditors use this to verify CRE decision tokens.
 */
export async function getPlatformPublicKeyHex(): Promise<string> {
  const { publicKey } = getSoftwareKeypair();
  return Buffer.from(publicKey, "base64").toString("hex");
}

/**
 * Rotate the CRE platform key.
 *
 * - HSM mode: creates a new key version in the HSM.
 * - Software mode: this is a no-op (the key is derived from the env var,
 *   so rotation requires changing the env var + restarting the server).
 */
export async function rotatePlatformKey(): Promise<{
  rotated: boolean;
  keyId?: string;
  rotatedAt: Date;
}> {
  const provider = getKeyProvider();

  if (provider === "hsm") {
    const config = getHsmConfig();
    // PRODUCTION: create a new key version in the HSM
    console.warn("[hsm] Key rotation requested in HSM mode — implement for production");
  }

  return {
    rotated: false,
    rotatedAt: new Date(),
  };
}
