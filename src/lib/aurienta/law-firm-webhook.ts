// AURIENTA — Law Firm Webhook Signature Verification (Vol 5 §5.2)
// Verifies Ed25519 signatures on incoming law firm escrow webhooks.

import { createPublicKey, createVerify, generateKeyPairSync, verify as cryptoVerify, type KeyObject } from "crypto";

/**
 * Verify an Ed25519 signature on a webhook payload.
 *
 * @param payload The raw request body (string or Buffer)
 * @param signature Base64-encoded Ed25519 signature from the X-LawFirm-Signature header
 * @param publicKeyBase64 Base64-encoded Ed25519 public key of the law firm
 * @returns true if the signature is valid
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  publicKeyBase64: string
): boolean {
  try {
    // Construct an Ed25519 public key from the raw base64 bytes
    const keyBytes = Buffer.from(publicKeyBase64, "base64");
    if (keyBytes.length !== 32) {
      // Not a raw Ed25519 public key
      return false;
    }

    // Create a KeyObject from the raw public key bytes (Ed25519 SPKI format)
    const pubKeyObj: KeyObject = createPublicKey({
      key: Buffer.concat([
        // SPKI header for Ed25519 public key (OID 1.3.101.112)
        Buffer.from("302a300506032b6570032100", "hex"),
        keyBytes,
      ]),
      format: "der",
      type: "spki",
    });

    const payloadBuffer = typeof payload === "string" ? Buffer.from(payload) : payload;
    const sigBytes = Buffer.from(signature, "base64");

    // Use the one-shot crypto.verify for Ed25519 (algorithm = null means use key's default)
    return cryptoVerify(null, payloadBuffer, pubKeyObj, sigBytes);
  } catch (e) {
    console.error("[law-firm-webhook] Signature verification failed:", e);
    return false;
  }
}

/**
 * Generate a deterministic test keypair for sandbox law firms.
 * In production, law firms generate their own Ed25519 keypair and register
 * the public key with AURIENTA during onboarding.
 */
export function generateTestKeypair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    publicKey: publicKey.export({ format: "der", type: "spki" }).toString("base64"),
    privateKey: privateKey.export({ format: "der", type: "pkcs8" }).toString("base64"),
  };
}
