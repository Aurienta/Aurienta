// AURIENTA field-level encryption — AES-256-GCM for PII at rest.
// Used for: nationalIdLast4, nosiNumber, whistleblower descriptions,
// Ed25519 private keys, TOTP secrets.
//
// Format: "enc$v1$<ivB64>$<ciphertextB64>$<tagB64>"
// The key is loaded once from env.FIELD_ENCRYPTION_KEY (32 bytes base64).

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "./env";

const KEY_LEN = 32; // AES-256
const IV_LEN = 12; // GCM standard
const TAG_LEN = 16;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = Buffer.from(env.fieldEncryptionKey, "base64");
  if (raw.length !== KEY_LEN) {
    throw new Error(
      `FIELD_ENCRYPTION_KEY must decode to ${KEY_LEN} bytes, got ${raw.length}`
    );
  }
  cachedKey = raw;
  return raw;
}

/** Encrypt a UTF-8 string. Returns "enc$v1$<iv>$<ct>$<tag>" (all base64). */
export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null;
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc$v1$${iv.toString("base64")}$${ct.toString("base64")}$${tag.toString("base64")}`;
}

/** Decrypt an encrypted field. Returns null if input is null/empty. Throws on tamper. */
export function decryptField(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith("enc$v1$")) {
    // Legacy plaintext — return as-is during migration. Log a warning in prod.
    return stored;
  }
  const parts = stored.split("$");
  if (parts.length !== 5) throw new Error("Malformed encrypted field");
  const [, , ivB64, ctB64, tagB64] = parts;
  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  if (iv.length !== IV_LEN || tag.length !== TAG_LEN) {
    throw new Error("Malformed IV or auth tag");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

/** Returns the last 4 chars of a (possibly encrypted) national ID. */
export function revealLast4(stored: string | null | undefined): string {
  const plain = decryptField(stored);
  if (!plain) return "";
  return plain.slice(-4);
}
