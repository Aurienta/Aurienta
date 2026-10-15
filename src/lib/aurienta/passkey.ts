// AURIENTA WebAuthn / Passkey support — passwordless authentication.
//
// State-of-the-art: phishing-resistant, device-bound, replay-protected.
// Implements the server side of the WebAuthn L3 spec using
// @simplewebauthn/server v14. Credential IDs and public keys are stored
// as base64url strings; counters are persisted to detect cloned
// authenticators; transports + device-type + backup-eligibility are
// captured so future conditional-UI prompts can be optimized.
//
// The Relying Party is "AURIENTA". The RP ID (= the WebAuthn scope domain)
// is derived from `PUBLIC_BASE_URL` (env) — or, when a `host` argument is
// passed in (e.g. from `request.headers.host`), that host is preferred so
// the same code path works under preview deploys and tunnelled hosts.
//
// Storage contract (PasskeyCredential table):
//   credentialId  base64url string (unique)
//   publicKey     base64url string (COSE-encoded)
//   counter       integer sign-count (replay protection)
//   transports    comma-separated: internal|hybrid|usb|nfc|ble
//   deviceType    "singleDevice" | "multiDevice"
//   backedUp      boolean (true if multi-device + backed up)

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  WebAuthnCredential,
} from "@simplewebauthn/server";

import { env } from "@/lib/aurienta/env";
import { db } from "@/lib/db";

export const RP_NAME = "AURIENTA";

// 5 minutes is the max time a user has to complete a WebAuthn ceremony
// (register or authenticate) before the challenge expires.
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

// ── RP / origin derivation ──────────────────────────────────────────────

export type RpConfig = {
  rpID: string;
  expectedOrigin: string;
};

/**
 * Derive the WebAuthn Relying Party configuration from the request host or
 * the `PUBLIC_BASE_URL` env var. The host argument (preferred) comes from
 * `request.headers.host` — this lets the same code path work under preview
 * deploys, tunnelled hosts, and localhost.
 *
 * `rpID` MUST be a registrable domain suffix (no port, no scheme). For
 * localhost in dev the spec allows the bare host. `expectedOrigin` is the
 * full origin (scheme + host + port) used to verify the client-data JSON.
 */
export function getRpConfig(host?: string | null): RpConfig {
  const baseUrl = env.publicBaseUrl || "http://localhost:3000";

  // Prefer the explicit host header — it reflects the actual URL the browser
  // is on, which is what WebAuthn compares against the attestation origin.
  let origin = baseUrl;
  if (host) {
    // Determine scheme: localhost (dev) = http, everything else = https.
    // WebAuthn requires HTTPS except on localhost, so this matches the
    // browser's actual origin in both environments.
    const scheme = host.includes("localhost") ? "http" : "https";
    origin = `${scheme}://${host}`;
  }

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    url = new URL("http://localhost:3000");
  }

  // rpID is the hostname (no port, no scheme). WebAuthn accepts the bare host
  // for localhost in dev, and the registrable domain in prod.
  return { rpID: url.hostname, expectedOrigin: url.origin };
}

// ── Existing credential lookup helpers ───────────────────────────────────

export type ExistingCredential = {
  id: string;
  transports?: string[];
};

type StoredCredentialRow = {
  credentialId: string;
  transports: string | null;
};

function rowToExisting(row: StoredCredentialRow): ExistingCredential {
  return {
    id: row.credentialId,
    transports: row.transports
      ? row.transports.split(",").filter(Boolean)
      : undefined,
  };
}

// ── Registration (enroll a new passkey) ──────────────────────────────────

/**
 * Generate registration options for the WebAuthn `navigator.credentials.create`
 * flow. Returns options suitable for passing directly to
 * `startRegistration()` from @simplewebauthn/browser.
 *
 * The returned `options.challenge` MUST be persisted (cookie) and re-checked
 * at finish — see `verifyRegistration()`.
 */
export async function generateRegistrationOptionsForUser(
  userId: string,
  email: string,
  displayName: string,
  rpConfig: RpConfig
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  // Exclude credentials already registered by this user so they can't register
  // the same authenticator twice.
  const existingRows = await db.passkeyCredential.findMany({
    where: { userId },
    select: { credentialId: true, transports: true },
  });

  // userID must be a Uint8Array. We use the user's cuid (utf-8 encoded) —
  // stable per user, unique per account. cuid is ~24 chars = 24 bytes, well
  // under the 64-byte spec limit.
  const userID = isoBase64URL.toBuffer(
    Buffer.from(userId, "utf8").toString("base64url")
  );

  return generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rpConfig.rpID,
    userName: email,
    userID,
    userDisplayName: displayName || email,
    timeout: CHALLENGE_TTL_MS,
    attestationType: "none", // attestation = "none" — we don't trust AAGUIDs
    excludeCredentials: existingRows.map(rowToExisting),
    authenticatorSelection: {
      residentKey: "preferred", // enable passkey sync (iCloud, Google, etc.)
      userVerification: "preferred", // require UV when the device supports it
    },
  });
}

export type VerifiedRegistration = {
  credentialId: string; // base64url
  publicKey: string;     // base64url
  counter: number;
  transports: string[];  // internal|hybrid|usb|nfc|ble
  deviceType: string;   // singleDevice | multiDevice
  backedUp: boolean;
};

/**
 * Verify a WebAuthn registration response (attestation) and persist the new
 * credential to the PasskeyCredential table. Throws on verification failure.
 * Returns the stored credential row.
 */
export async function verifyRegistration(
  userId: string,
  attestationResponse: RegistrationResponseJSON,
  expectedChallenge: string,
  rpConfig: RpConfig,
  name?: string
): Promise<VerifiedRegistration> {
  const verification = await verifyRegistrationResponse({
    response: attestationResponse,
    expectedChallenge,
    expectedOrigin: rpConfig.expectedOrigin,
    expectedRPID: rpConfig.rpID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Registration verification failed");
  }

  const info = verification.registrationInfo;
  const credential = info.credential;

  const stored = await db.passkeyCredential.create({
    data: {
      userId,
      credentialId: credential.id,
      publicKey: isoBase64URL.fromBuffer(credential.publicKey),
      counter: credential.counter,
      transports: (credential.transports ?? []).join(","),
      deviceType: info.credentialDeviceType,
      backedUp: info.credentialBackedUp,
      name: name ?? null,
    },
  });

  return {
    credentialId: stored.credentialId,
    publicKey: stored.publicKey,
    counter: stored.counter,
    transports: stored.transports ? stored.transports.split(",").filter(Boolean) : [],
    deviceType: stored.deviceType,
    backedUp: stored.backedUp,
  };
}

// ── Authentication (sign in with a passkey) ──────────────────────────────

/**
 * Generate authentication options. When `existingCredentials` is empty the
 * browser will prompt the user to pick any of their synced passkeys (or any
 * passkey bound to this RP ID on the local device).
 */
export async function generateAuthenticationOptionsForCredentials(
  existingCredentials: ExistingCredential[],
  rpConfig: RpConfig
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  return generateAuthenticationOptions({
    rpID: rpConfig.rpID,
    timeout: CHALLENGE_TTL_MS,
    allowCredentials: existingCredentials.map((c) => ({
      id: c.id,
      transports: c.transports,
    })),
    userVerification: "preferred",
  });
}

export type VerifiedAuthentication = {
  credentialId: string;
  newCounter: number;
  userVerified: boolean;
  userId: string;
};

/**
 * Verify a WebAuthn authentication response (assertion). Looks up the stored
 * PasskeyCredential row by `response.id`, rebuilds the WebAuthnCredential
 * object expected by @simplewebauthn/server, runs verification, and on
 * success updates the persisted counter (replay protection: a future
 * assertion with a counter <= this value MUST be rejected) + lastUsedAt.
 *
 * Returns the credential ID + new counter + owning userId. The caller is
 * responsible for creating the session.
 */
export async function verifyAuthentication(
  assertionResponse: AuthenticationResponseJSON,
  expectedChallenge: string,
  rpConfig: RpConfig
): Promise<VerifiedAuthentication> {
  // Look up the stored credential by credential ID. If no row exists the
  // authenticator is unknown — refuse.
  const stored = await db.passkeyCredential.findUnique({
    where: { credentialId: assertionResponse.id },
    select: {
      id: true,
      userId: true,
      publicKey: true,
      counter: true,
      transports: true,
    },
  });
  if (!stored) {
    throw new Error("Unknown credential");
  }

  // Build the WebAuthnCredential shape expected by @simplewebauthn/server.
  const credential: WebAuthnCredential = {
    id: assertionResponse.id,
    publicKey: isoBase64URL.toBuffer(stored.publicKey),
    counter: stored.counter,
    transports: stored.transports
      ? stored.transports.split(",").filter(Boolean)
      : undefined,
  };

  const verification = await verifyAuthenticationResponse({
    response: assertionResponse,
    expectedChallenge,
    expectedOrigin: rpConfig.expectedOrigin,
    expectedRPID: rpConfig.rpID,
    credential,
    requireUserVerification: true,
  });

  if (!verification.verified) {
    throw new Error("Authentication verification failed");
  }

  // Update the persisted counter + lastUsedAt. If the new counter is
  // somehow <= the stored one, @simplewebauthn/server already raised —
  // but we also defensively refuse to write a counter regression.
  if (verification.authenticationInfo.newCounter > stored.counter) {
    await db.passkeyCredential.update({
      where: { id: stored.id },
      data: {
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      },
    });
  } else {
    // Still bump lastUsedAt even if the authenticator reported a static counter
    // (some authenticators, e.g. U2F-only keys, always report counter = 0).
    await db.passkeyCredential.update({
      where: { id: stored.id },
      data: { lastUsedAt: new Date() },
    });
  }

  return {
    credentialId: verification.authenticationInfo.credentialID,
    newCounter: verification.authenticationInfo.newCounter,
    userVerified: verification.authenticationInfo.userVerified,
    userId: stored.userId,
  };
}

// ── Passkey management (list / delete) ───────────────────────────────────

export type PasskeyInfo = {
  id: string;             // PasskeyCredential.id (cuid) — used for delete
  credentialId: string;    // WebAuthn credential ID (base64url)
  name: string | null;
  deviceType: string;
  backedUp: boolean;
  transports: string[];
  createdAt: Date;
  lastUsedAt: Date | null;
};

/**
 * Returns all passkeys registered by the given user. Newest first.
 */
export async function listPasskeys(userId: string): Promise<PasskeyInfo[]> {
  const rows = await db.passkeyCredential.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    credentialId: r.credentialId,
    name: r.name,
    deviceType: r.deviceType,
    backedUp: r.backedUp,
    transports: r.transports ? r.transports.split(",").filter(Boolean) : [],
    createdAt: r.createdAt,
    lastUsedAt: r.lastUsedAt,
  }));
}

/**
 * Returns the user's existing credentials in the format used by
 * `generateAuthenticationOptions` (allowCredentials list). Used by the
 * "sign in with passkey" flow when the user provides their email first.
 */
export async function listCredentialsForUser(
  userId: string
): Promise<ExistingCredential[]> {
  const rows = await db.passkeyCredential.findMany({
    where: { userId },
    select: { credentialId: true, transports: true },
  });
  return rows.map(rowToExisting);
}

/**
 * Returns the user id that owns a credential identified by email. Used by
 * the passwordless signin flow so we can scope allowCredentials to a single
 * user before the WebAuthn ceremony begins.
 *
 * PasskeyCredential.userId is a plain string FK (no Prisma relation) per
 * the foundation's isolation pattern, so we resolve the user first then
 * query credentials by userId.
 */
export async function listCredentialsForEmail(
  email: string
): Promise<{ userId: string; credentials: ExistingCredential[] }> {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return { userId: "", credentials: [] };
  const credentials = await listCredentialsForUser(user.id);
  return { userId: user.id, credentials };
}

/**
 * Delete a passkey by its cuid (PasskeyCredential.id). Verifies ownership
 * before deleting — a user cannot delete another user's passkey.
 */
export async function deletePasskey(
  userId: string,
  credentialRowId: string
): Promise<boolean> {
  const result = await db.passkeyCredential.deleteMany({
    where: { id: credentialRowId, userId },
  });
  return result.count > 0;
}

export const PASSKEY_CHALLENGE_TTL_MS = CHALLENGE_TTL_MS;
