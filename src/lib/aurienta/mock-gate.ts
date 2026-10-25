// AURIENTA — Mock Gate Helper
// (PLATFORM-FULL-AUDIT-AND-REMEDIATION-001 / P0-1E fixes)
//
// Trust-path mocks (gov-api, EVE bank verification, IPFS pin verify, ERP sync,
// milestone eveConfidence, proposal aiRiskScore) must NOT fabricate success in
// production. This helper returns true when mocks are allowed (dev/test only).
//
// In production (NODE_ENV === 'production'), mocks are DISABLED and the calling
// code must return fail-safe values (verified: false, pending, not_configured).
//
// Per mandate §13: "Do not treat intentional test mocks as defects merely
// because they exist. Instead, verify that production paths use the real
// intended dependencies and that mocks cannot accidentally be activated in
// production."

export const MOCKS_DISABLED = process.env.NODE_ENV === "production";

/**
 * Returns true when mocks are allowed (development / test).
 * Returns false in production — callers MUST return fail-safe values.
 */
export function mocksAllowed(): boolean {
  return !MOCKS_DISABLED;
}

/**
 * Returns true when a specific provider's real API is configured.
 * Provider → env var mapping for real integrations.
 */
export function isProviderConfigured(provider: "gafi" | "nosi" | "eta" | "bank" | "ipfs" | "erp"): boolean {
  const map: Record<string, string | undefined> = {
    gafi: process.env.GAFI_API_KEY,
    nosi: process.env.NOSI_API_KEY,
    eta: process.env.ETA_API_KEY,
    bank: process.env.BANK_API_KEY,
    ipfs: process.env.PINATA_API_KEY,
    erp: process.env.ERP_API_KEY,
  };
  const key = map[provider];
  return typeof key === "string" && key.length > 0;
}

/**
 * Unified "not configured" result for trust-path verifiers.
 * Returns verified: false with a clear reason.
 */
export function notConfiguredResult(provider: string, reference: string) {
  return {
    verified: false as const,
    confidence: 0,
    sources: [] as string[],
    discrepancies: [
      `${provider} verification is not configured — verification pending. ` +
        `Set the corresponding API key in the environment to enable real verification.`,
    ],
    reference,
    notConfigured: true as const,
  };
}
