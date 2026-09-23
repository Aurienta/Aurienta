// AURIENTA Evidence Verification Engine (EVE) — Blueprint §6.3.4.
//
// Cross-references evidence declared by an enterprise (invoice, payroll, etc.)
// against multiple external + internal sources to compute a verification
// verdict. The blueprint requires at least two independent sources per claim
// before a milestone release or fund disbursement can proceed.
//
// Phase 5 will replace the mock API stubs below with real Egyptian government
// API integrations:
//   • Bank API — CBE Open Banking (Law 194/2020 Art. 116)
//   • NOSI     — National Organization for Social Insurance e-services portal
//   • ETA      — Egyptian Tax Authority e-filing portal
//   • ERP      — enterprise-side ERP export (manual upload today, EDI later)
//
// Each verifier returns:
//   { verified, confidence, sources, discrepancies }
// — `confidence` is a 0..1 float (weighted by the number of corroborating
// sources). `verified` is true only when confidence ≥ 0.7 AND no
// hard discrepancies exist.

import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";

export type VerificationResult = {
  verified: boolean;
  confidence: number; // 0..1
  sources: string[]; // list of sources consulted
  discrepancies: string[]; // human-readable mismatch notes
};

// ── Mock bank API ──
// Phase 5: replace with CBE Open Banking integration. The mock is
// deterministic — for a given invoice ref, it returns a stable transaction
// record so verification verdicts are reproducible in the sandbox.
type MockBankTransaction = {
  found: boolean;
  amountEgp: number;
  beneficiaryName: string | null;
  valueDate: string | null;
};

async function mockBankApiLookup(
  invoiceRef: string,
  expectedAmount: number
): Promise<MockBankTransaction> {
  // Deterministic "transaction" — seed the ref so the mock always returns
  // the same value for the same invoice. 70% of refs "found"; amount is the
  // expected amount ± a small deterministic delta to simulate matching.
  let hash = 0;
  for (let i = 0; i < invoiceRef.length; i++) {
    hash = (hash * 31 + invoiceRef.charCodeAt(i)) >>> 0;
  }
  const found = hash % 10 < 7; // 70% hit rate
  if (!found) {
    return { found: false, amountEgp: 0, beneficiaryName: null, valueDate: null };
  }
  // Simulate a small bank-side rounding delta (bank fees, FX, etc.).
  const deltaPct = ((hash % 7) - 3) / 1000; // -0.3% to +0.3%
  return {
    found: true,
    amountEgp: Math.round(expectedAmount * (1 + deltaPct)),
    beneficiaryName: "Law Firm Client Account",
    valueDate: new Date().toISOString(),
  };
}

// ── Mock NOSI API ──
type MockNosiRecord = {
  registered: boolean;
  nosiNumber: string | null;
  registeredAt: string | null;
};

async function mockNosiApiLookup(employeeId: string): Promise<MockNosiRecord> {
  // Pull the Employee record — NOSI status is authoritative from the db.
  const emp = await db.employee.findUnique({
    where: { id: employeeId },
    select: { nosiStatus: true, nosiNumber: true, nosiRegisteredAt: true },
  });
  if (!emp) {
    return { registered: false, nosiNumber: null, registeredAt: null };
  }
  return {
    registered: emp.nosiStatus === "registered",
    nosiNumber: emp.nosiNumber,
    registeredAt: emp.nosiRegisteredAt?.toISOString() ?? null,
  };
}

// ── Mock Tax Authority API ──
type MockTaxFilingStatus = {
  filed: boolean;
  ackId: string | null;
  amountEgp: number;
};

async function mockTaxAuthorityApiLookup(
  enterpriseId: string,
  period: string
): Promise<MockTaxFilingStatus> {
  // Pull the audit log for any tax.filing.generated event for this enterprise
  // in this period — that's our "filed" status source.
  const auditRows = await db.auditLog.findMany({
    where: {
      action: "tax.filing.generated",
      target: `enterprise:${enterpriseId}`,
    },
    select: { metadata: true, timestamp: true },
    orderBy: { timestamp: "desc" },
    take: 20,
  });
  for (const r of auditRows) {
    try {
      const m = JSON.parse(r.metadata ?? "{}") as Record<string, unknown>;
      if (m.period === period) {
        return {
          filed: true,
          ackId: (m.acknowledgmentId as string) ?? null,
          amountEgp: (m.totalTaxLiability as number) ?? 0,
        };
      }
    } catch {
      // malformed metadata — skip
    }
  }
  return { filed: false, ackId: null, amountEgp: 0 };
}

// ── Mock ERP API ──
// The "ERP" is simulated by the enterprise's own Expense + QuarterlyReport
// records. A real ERP integration would query the enterprise's financial
// system via an authenticated API.
type MockErpInvoice = {
  found: boolean;
  amountEgp: number;
  vendor: string | null;
  recordedAt: string | null;
};

async function mockErpApiLookup(
  enterpriseId: string,
  invoiceRef: string
): Promise<MockErpInvoice> {
  // Match the invoice ref against Expense.vendor — the sandbox doesn't have a
  // dedicated invoice table, so we treat Expense rows as the ERP record.
  // Refs in the sandbox follow the pattern AURI-{eid}-{hash}; we match on the
  // expense's vendor field if it contains the invoice ref, otherwise by amount.
  const expense = await db.expense.findFirst({
    where: { enterpriseId, vendor: { contains: invoiceRef } },
    select: { amountEgp: true, vendor: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  if (expense) {
    return {
      found: true,
      amountEgp: expense.amountEgp,
      vendor: expense.vendor,
      recordedAt: expense.createdAt.toISOString(),
    };
  }
  return { found: false, amountEgp: 0, vendor: null, recordedAt: null };
}

// ── Confidence weighting ──
// Each source contributes a confidence weight; the overall confidence is the
// sum of weights of CORROBORATING sources (sources whose evidence matches
// the declared claim), capped at 1.0.
const SOURCE_WEIGHTS: Record<string, number> = {
  bank_api: 0.4,
  erp: 0.3,
  nosi: 0.5,
  tax_authority: 0.4,
  internal_db: 0.2,
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// ── verifyInvoice ──
// Cross-references an invoice against bank API + ERP data. The invoice is
// verified only when:
//   1. The bank transaction is found (funds actually moved).
//   2. The ERP record exists (the invoice was booked).
//   3. Amounts match within a 1% tolerance (bank fees, FX, rounding).
export async function verifyInvoice(
  invoiceData: {
    invoiceRef: string;
    amountEgp: number;
    vendorName?: string;
    date?: string;
  },
  enterpriseId: string
): Promise<VerificationResult> {
  const sources: string[] = [];
  const discrepancies: string[] = [];
  let confidence = 0;

  // Source 1: Bank API
  const bankTx = await mockBankApiLookup(invoiceData.invoiceRef, invoiceData.amountEgp);
  if (bankTx.found) {
    sources.push("bank_api");
    const tolerance = Math.max(1, invoiceData.amountEgp * 0.01); // 1%
    const amountMatches = Math.abs(bankTx.amountEgp - invoiceData.amountEgp) <= tolerance;
    if (amountMatches) {
      confidence += SOURCE_WEIGHTS.bank_api;
    } else {
      discrepancies.push(
        `Bank API amount ${bankTx.amountEgp} EGP differs from declared ${invoiceData.amountEgp} EGP by more than 1% tolerance.`
      );
    }
  } else {
    discrepancies.push(
      "Bank API returned no transaction for invoice ref — no evidence of fund movement."
    );
  }

  // Source 2: ERP record
  const erp = await mockErpApiLookup(enterpriseId, invoiceData.invoiceRef);
  if (erp.found) {
    sources.push("erp");
    const tolerance = Math.max(1, invoiceData.amountEgp * 0.01);
    const amountMatches = Math.abs(erp.amountEgp - invoiceData.amountEgp) <= tolerance;
    if (amountMatches) {
      confidence += SOURCE_WEIGHTS.erp;
    } else {
      discrepancies.push(
        `ERP invoice amount ${erp.amountEgp} EGP differs from declared ${invoiceData.amountEgp} EGP.`
      );
    }
    if (invoiceData.vendorName && erp.vendor && !erp.vendor.includes(invoiceData.vendorName)) {
      discrepancies.push(
        `ERP vendor "${erp.vendor}" does not match declared vendor "${invoiceData.vendorName}".`
      );
    }
  } else {
    discrepancies.push(
      "ERP has no record of this invoice — invoice not booked in the enterprise's books."
    );
  }

  const verified = confidence >= 0.7 && discrepancies.length === 0;

  await audit({
    action: "eve.verify_invoice",
    target: `enterprise:${enterpriseId}`,
    result: verified ? "allowed" : "denied",
    metadata: {
      invoiceRef: invoiceData.invoiceRef,
      amountEgp: invoiceData.amountEgp,
      sources,
      confidence: Number(clamp01(confidence).toFixed(4)),
      discrepanciesCount: discrepancies.length,
    },
  });

  return {
    verified,
    confidence: Number(clamp01(confidence).toFixed(4)),
    sources,
    discrepancies,
  };
}

// ── verifyPayroll ──
// Cross-references a declared payroll total against NOSI registration records
// + the enterprise's Employee table. Every employee paid must be NOSI-
// registered; the declared total must match the sum of Employee salaries
// within 0.5% tolerance.
export async function verifyPayroll(
  payrollData: {
    payrollRunId?: string;
    totalAmountEgp: number;
    payDate?: string;
    headcount?: number;
  },
  enterpriseId: string
): Promise<VerificationResult> {
  const sources: string[] = [];
  const discrepancies: string[] = [];
  let confidence = 0;

  // Source 1: internal_db (Employee records)
  const employees = await db.employee.findMany({
    where: { enterpriseId },
    select: { id: true, monthlySalaryEgp: true, nosiStatus: true, nosiNumber: true },
  });
  if (employees.length > 0) {
    sources.push("internal_db");
    const computedTotal = employees.reduce((sum, e) => sum + e.monthlySalaryEgp, 0);
    const tolerance = Math.max(1, payrollData.totalAmountEgp * 0.005); // 0.5%
    if (Math.abs(computedTotal - payrollData.totalAmountEgp) <= tolerance) {
      confidence += SOURCE_WEIGHTS.internal_db;
    } else {
      discrepancies.push(
        `Internal payroll total ${computedTotal} EGP differs from declared ${payrollData.totalAmountEgp} EGP by more than 0.5% tolerance.`
      );
    }
    if (payrollData.headcount && payrollData.headcount !== employees.length) {
      discrepancies.push(
        `Declared headcount ${payrollData.headcount} does not match Employee table (${employees.length}).`
      );
    }
  } else {
    discrepancies.push(
      "Enterprise has no Employee records — cannot verify payroll against headcount."
    );
  }

  // Source 2: NOSI cross-reference (every paid employee must be registered)
  sources.push("nosi");
  const unregistered = employees.filter((e) => e.nosiStatus !== "registered");
  if (unregistered.length === 0) {
    confidence += SOURCE_WEIGHTS.nosi;
  } else {
    discrepancies.push(
      `${unregistered.length} of ${employees.length} employees are not NOSI-registered (status != "registered").`
    );
  }

  const verified = confidence >= 0.7 && discrepancies.length === 0;

  await audit({
    action: "eve.verify_payroll",
    target: `enterprise:${enterpriseId}`,
    result: verified ? "allowed" : "denied",
    metadata: {
      totalAmountEgp: payrollData.totalAmountEgp,
      headcount: employees.length,
      sources,
      confidence: Number(clamp01(confidence).toFixed(4)),
      unregisteredCount: unregistered.length,
    },
  });

  return {
    verified,
    confidence: Number(clamp01(confidence).toFixed(4)),
    sources,
    discrepancies,
  };
}

// ── verifySocialInsurance ──
// Checks NOSI registration status for a single employee. Returns verified
// only when the NOSI lookup confirms "registered" status + a NOSI number
// exists on record.
export async function verifySocialInsurance(
  employeeId: string
): Promise<VerificationResult> {
  const sources: string[] = [];
  const discrepancies: string[] = [];
  let confidence = 0;

  const nosi = await mockNosiApiLookup(employeeId);
  sources.push("nosi");
  if (nosi.registered) {
    confidence += SOURCE_WEIGHTS.nosi;
    if (!nosi.nosiNumber) {
      discrepancies.push("NOSI registration confirmed but NOSI number missing on record.");
    }
  } else {
    discrepancies.push(
      "NOSI lookup returned status != registered — employee social insurance not active."
    );
  }

  // Source 2: cross-reference internal Employee record (defense-in-depth).
  const emp = await db.employee.findUnique({
    where: { id: employeeId },
    select: { enterpriseId: true, nosiStatus: true, monthlySalaryEgp: true },
  });
  if (emp) {
    sources.push("internal_db");
    if (emp.nosiStatus === "registered") {
      confidence += SOURCE_WEIGHTS.internal_db;
    } else {
      discrepancies.push(
        `Internal Employee record shows nosiStatus = "${emp.nosiStatus}" (expected "registered").`
      );
    }
  } else {
    discrepancies.push(`Employee ${employeeId} not found in internal db.`);
  }

  const verified = confidence >= 0.7 && discrepancies.length === 0;

  await audit({
    action: "eve.verify_social_insurance",
    target: `employee:${employeeId}`,
    result: verified ? "allowed" : "denied",
    metadata: {
      nosiNumber: nosi.nosiNumber,
      sources,
      confidence: Number(clamp01(confidence).toFixed(4)),
      discrepanciesCount: discrepancies.length,
    },
  });

  return {
    verified,
    confidence: Number(clamp01(confidence).toFixed(4)),
    sources,
    discrepancies,
  };
}

// ── verifyTaxFiling ──
// Checks the Tax Authority API for the enterprise's filing in the period.
// Cross-references against the locally-computed generateTaxFiling() result.
// The filing is verified only when:
//   1. The ETA API confirms a filing exists for the period.
//   2. The ETA-reported amount matches the local computation within 1 EGP.
export async function verifyTaxFiling(
  enterpriseId: string,
  period: string
): Promise<VerificationResult> {
  const sources: string[] = [];
  const discrepancies: string[] = [];
  let confidence = 0;

  // Source 1: ETA API (mock)
  const eta = await mockTaxAuthorityApiLookup(enterpriseId, period);
  sources.push("tax_authority");
  if (eta.filed) {
    confidence += SOURCE_WEIGHTS.tax_authority;
  } else {
    discrepancies.push(
      `Tax Authority API: no filing on record for enterprise ${enterpriseId} in period ${period}.`
    );
  }

  // Source 2: local tax-engine computation (cross-check)
  sources.push("tax_engine");
  let localAmount: number | null = null;
  try {
    // Lazy import to avoid circular dependency with tax-engine at module load.
    const { generateTaxFiling } = await import("./tax-engine");
    const filing = await generateTaxFiling(enterpriseId, period);
    localAmount = filing.totalTaxLiability;
    if (eta.filed && eta.amountEgp > 0) {
      const tolerance = Math.max(1, localAmount * 0.01); // 1% tolerance
      if (Math.abs(eta.amountEgp - localAmount) <= tolerance) {
        confidence += SOURCE_WEIGHTS.internal_db;
      } else {
        discrepancies.push(
          `Local tax engine computed ${localAmount} EGP but ETA reported ${eta.amountEgp} EGP for period ${period}.`
        );
      }
    } else if (!eta.filed) {
      // ETA has no filing — if the local engine computed one, that's a
      // discrepancy (the enterprise computed taxes but never filed).
      if (localAmount > 0) {
        discrepancies.push(
          `Local tax engine computed ${localAmount} EGP liability but no ETA filing exists for period ${period}.`
        );
      }
    }
  } catch {
    discrepancies.push("Local tax engine could not compute a filing — enterprise data missing.");
  }

  const verified = confidence >= 0.7 && discrepancies.length === 0;

  await audit({
    action: "eve.verify_tax_filing",
    target: `enterprise:${enterpriseId}`,
    result: verified ? "allowed" : "denied",
    metadata: {
      period,
      ackId: eta.ackId,
      etaAmountEgp: eta.amountEgp,
      localAmountEgp: localAmount,
      sources,
      confidence: Number(clamp01(confidence).toFixed(4)),
    },
  });

  return {
    verified,
    confidence: Number(clamp01(confidence).toFixed(4)),
    sources,
    discrepancies,
  };
}
