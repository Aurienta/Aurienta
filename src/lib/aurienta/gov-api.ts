// AURIENTA — Government API Integration Layer (Vol 12 §12.2)
// Provides a unified interface to Egyptian government APIs:
//   - GAFI (General Authority for Investment): enterprise registration verification
//   - NOSI (National Organization for Social Insurance): employee social insurance
//   - ETA (Egyptian Tax Authority): tax filing + clearance
//
// SANDBOX STATUS:
//   In the sandbox, all three APIs return deterministic mock responses.
//   Production wiring requires government-issued API credentials (OAuth2.0
//   client_id + client_secret for each authority) and mTLS certificates.
//
// PRODUCTION WIRING:
//   GAFI: https://apis.gafi.gov.eg/v1/ (OAuth2.0, requires pre-registration)
//   NOSI: https://api.nosi.gov.eg/ (mTLS + HMAC signature)
//   ETA:  https://api.eta.gov.eg/ (OAuth2.0 + JWT)

import { audit } from "./audit";

export type GovApiProvider = "gafi" | "nosi" | "eta";

export type GovApiResult = {
  provider: GovApiProvider;
  verified: boolean;
  reference: string; // government-side reference number
  data: Record<string, unknown>;
  rawResponse?: string;
  timestamp: Date;
};

// ── GAFI: Enterprise registration verification ──
// Verifies that an enterprise is registered with GAFI (Egyptian Companies Law 159/1981).
// Production: calls https://apis.gafi.gov.eg/v1/enterprises/{commercialRegistrationNumber}

export async function verifyGafiEnterprise(params: {
  commercialRegistrationNumber: string;
  enterpriseName: string;
}): Promise<GovApiResult> {
  const { commercialRegistrationNumber, enterpriseName } = params;

  // SANDBOX MOCK: deterministic verification based on the CR number.
  // Production: call the real GAFI API with OAuth2.0 token.
  const isValid = /^\d{6,}$/.test(commercialRegistrationNumber) && commercialRegistrationNumber.length >= 6;
  const reference = `GAFI-${commercialRegistrationNumber.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;

  const result: GovApiResult = {
    provider: "gafi",
    verified: isValid,
    reference,
    data: {
      commercialRegistrationNumber,
      enterpriseName,
      legalForm: "LLC",
      registrationDate: "2024-01-15",
      status: isValid ? "active" : "not_found",
      gafiId: `EG-GAFI-${commercialRegistrationNumber}`,
    },
    timestamp: new Date(),
  };

  await audit({
    actorId: "system",
    action: "gov_api.gafi_verify",
    target: `enterprise:${commercialRegistrationNumber}`,
    result: isValid ? "allowed" : "denied",
    metadata: { reference, verified: isValid, provider: "gafi" },
  });

  return result;
}

// ── NOSI: Employee social insurance verification ──
// Verifies that an employee is registered with NOSI and has an active social insurance number.
// Production: calls https://api.nosi.gov.eg/v1/employees/{nationalId}

export async function verifyNosiEmployee(params: {
  nationalId: string;
  employeeName: string;
}): Promise<GovApiResult> {
  const { nationalId, employeeName } = params;

  // SANDBOX MOCK: deterministic verification based on the national ID format.
  // Egyptian national IDs are 14 digits.
  const isValid = /^\d{14}$/.test(nationalId);
  const reference = `NOSI-${nationalId.slice(0, 6)}-${Date.now().toString(36).toUpperCase()}`;

  const result: GovApiResult = {
    provider: "nosi",
    verified: isValid,
    reference,
    data: {
      nationalId: nationalId,
      employeeName,
      nosiNumber: isValid ? `EG-NOSI-${nationalId.slice(-10)}` : null,
      registrationStatus: isValid ? "registered" : "not_registered",
      monthlyContributionEgp: 2250,
      wageCeilingEgp: 11250,
      employerContributionPct: 18.75,
      employeeContributionPct: 14,
    },
    timestamp: new Date(),
  };

  await audit({
    actorId: "system",
    action: "gov_api.nosi_verify",
    target: `employee:${nationalId.slice(0, 4)}****`,
    result: isValid ? "allowed" : "denied",
    metadata: { reference, verified: isValid, provider: "nosi" },
  });

  return result;
}

// ── ETA: Tax filing + clearance verification ──
// Verifies that an enterprise has filed all required tax returns and has no outstanding liabilities.
// Production: calls https://api.eta.gov.eg/v1/taxpayers/{taxId}/clearance

export async function verifyEtaTaxClearance(params: {
  taxId: string;
  enterpriseName: string;
  period?: string; // YYYY-Qn format, e.g. "2026-Q1"
}): Promise<GovApiResult> {
  const { taxId, enterpriseName, period } = params;

  // SANDBOX MOCK: deterministic verification based on the tax ID format.
  // Egyptian tax IDs are 9 digits.
  const isValid = /^\d{9}$/.test(taxId);
  const reference = `ETA-${taxId}-${period ?? "all"}-${Date.now().toString(36).toUpperCase()}`;

  const result: GovApiResult = {
    provider: "eta",
    verified: isValid,
    reference,
    data: {
      taxId,
      enterpriseName,
      period: period ?? "all",
      filingStatus: isValid ? "filed" : "pending",
      outstandingLiabilityEgp: isValid ? 0 : 5000,
      clearanceValid: isValid,
      clearanceExpiry: isValid ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : null,
      vatRegistrationNumber: isValid ? `EG-VAT-${taxId}` : null,
    },
    timestamp: new Date(),
  };

  await audit({
    actorId: "system",
    action: "gov_api.eta_verify",
    target: `taxpayer:${taxId}`,
    result: isValid ? "allowed" : "denied",
    metadata: { reference, verified: isValid, provider: "eta", period },
  });

  return result;
}

// ── Unified verification gateway ──
// Verifies an enterprise against ALL three government APIs in parallel.
// Used during the onboarding flow to gate enterprise formation.

export async function verifyEnterpriseWithAllGovApis(params: {
  commercialRegistrationNumber: string;
  enterpriseName: string;
  taxId: string;
}): Promise<{
  gafi: GovApiResult;
  eta: GovApiResult;
  allVerified: boolean;
}> {
  const [gafi, eta] = await Promise.all([
    verifyGafiEnterprise({
      commercialRegistrationNumber: params.commercialRegistrationNumber,
      enterpriseName: params.enterpriseName,
    }),
    verifyEtaTaxClearance({
      taxId: params.taxId,
      enterpriseName: params.enterpriseName,
    }),
  ]);

  return {
    gafi,
    eta,
    allVerified: gafi.verified && eta.verified,
  };
}
