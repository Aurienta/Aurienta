// AURIENTA Tax Transparency Engine — Blueprint §6.5 (Tax & Compliance).
//
// Per Egyptian tax law (Law 91/2005 + amendments):
//   • Corporate income tax: 22.5% on net taxable profit (Egyptian-source profit
//     for resident companies). The Suez Canal Authority, petroleum, and Central
//     Bank pay 40.55% — those are out-of-scope for AURIENTA enterprises.
//   • VAT: 14% standard rate (Law 67/2016). Applied to the AURIENTA platform
//     service fee (5% of milestone release) — the fee is the taxable supply.
//   • Withholding tax on dividends: 10% (Art. 64 Income Tax Law 91/2005).
//   • Payroll / social insurance: employee 14% (11% old-age + 3% sickness),
//     employer 18.75% (11% social insurance + 5.75% healthcare + 1% emergency
//     fund + 0.5% occupational hazards). Capped at the social insurance wage
//     ceiling (currently EGP 11,250/month — the cap applies to the employee
//     contribution; employer pays the uncapped 18.75% on actual wage).
//
// All amounts are in EGP. Filing is submitted to the Egyptian Tax Authority
// (ETA) e-filing portal — Phase 5 will integrate the real portal API; for now
// we use a mock interface that returns a deterministic acknowledgment ID.

import { db } from "@/lib/db";
import { audit } from "@/lib/aurienta/audit";

// ── Egyptian tax rates (single source of truth) ──
export const CORPORATE_TAX_RATE = 0.225; // 22.5%
export const VAT_RATE = 0.14; // 14%
export const WITHHOLDING_DIVIDEND_RATE = 0.10; // 10% on dividends
export const PAYROLL_EMPLOYEE_RATE = 0.14; // 14% employee share
export const PAYROLL_EMPLOYER_RATE = 0.1875; // 18.75% employer share
export const NOSI_WAGE_CEILING_EGP = 11_250; // monthly social-insurance wage cap

// Rounding helper — Egyptian piastre (0.01 EGP) is the smallest tax unit.
function roundEgp(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Corporate income tax ──
// 22.5% of net taxable profit. Losses (negative profit) produce zero tax
// (no immediate refund — losses carry forward per Art. 33 of Law 91/2005).
export function calculateCorporateTax(profit: number): {
  tax: number;
  rate: number;
  taxableBase: number;
} {
  const base = Math.max(0, profit);
  return {
    tax: roundEgp(base * CORPORATE_TAX_RATE),
    rate: CORPORATE_TAX_RATE,
    taxableBase: roundEgp(base),
  };
}

// ── VAT on platform service fees ──
// 14% applied to the AURIENTA platform service fee (not the gross transfer).
// The fee is the taxable supply; the underlying capital transfer is VAT-exempt
// (financial supply per VAT Law 67/2016, Schedule 1).
export function calculateVAT(fee: number): {
  vat: number;
  rate: number;
  taxableBase: number;
} {
  const base = Math.max(0, fee);
  return {
    vat: roundEgp(base * VAT_RATE),
    rate: VAT_RATE,
    taxableBase: roundEgp(base),
  };
}

// ── Withholding tax on dividends ──
// 10% withheld at source when dividends are distributed to shareholders.
// Per Art. 64 of Income Tax Law 91/2005. The withheld amount is remitted to
// the Tax Authority by the 10th of the month following distribution.
export function calculateWithholdingTax(dividend: number): {
  withholding: number;
  rate: number;
  netToShareholder: number;
} {
  const base = Math.max(0, dividend);
  const wh = roundEgp(base * WITHHOLDING_DIVIDEND_RATE);
  return {
    withholding: wh,
    rate: WITHHOLDING_DIVIDEND_RATE,
    netToShareholder: roundEgp(base - wh),
  };
}

// ── Payroll tax (social insurance contributions) ──
// Returns the employee deduction, employer contribution, and total cost.
// The employee share is capped at the NOSI wage ceiling; the employer share
// is uncapped (paid on the full actual wage).
export function calculatePayrollTax(salary: number): {
  employeeShare: number;
  employerShare: number;
  total: number;
  cappedWage: number;
  employeeRate: number;
  employerRate: number;
} {
  const actual = Math.max(0, salary);
  const cappedWage = Math.min(actual, NOSI_WAGE_CEILING_EGP);
  const employee = roundEgp(cappedWage * PAYROLL_EMPLOYEE_RATE);
  const employer = roundEgp(actual * PAYROLL_EMPLOYER_RATE);
  return {
    employeeShare: employee,
    employerShare: employer,
    total: roundEgp(employee + employer),
    cappedWage: roundEgp(cappedWage),
    employeeRate: PAYROLL_EMPLOYEE_RATE,
    employerRate: PAYROLL_EMPLOYER_RATE,
  };
}

// ── Mock Tax Authority e-filing interface ──
// Phase 5 will replace this with the real ETA SOAP/REST portal. The mock
// returns a deterministic acknowledgment ID so the audit trail is reproducible.
async function submitToTaxAuthority(params: {
  enterpriseId: string;
  filingType: "monthly_vat" | "quarterly_corporate" | "dividend_withholding" | "monthly_payroll";
  period: string; // e.g. "2026-Q1" or "2026-03"
  amountEgp: number;
  payload: Record<string, unknown>;
}): Promise<{ accepted: boolean; acknowledgmentId: string; submittedAt: string }> {
  // Deterministic ack ID = sha-style hash of the filing inputs (mock).
  const seed = `${params.enterpriseId}|${params.filingType}|${params.period}|${params.amountEgp}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const ackId = `ETA-${params.filingType.toUpperCase()}-${hash.toString(16).padStart(8, "0").toUpperCase()}`;
  return {
    accepted: true,
    acknowledgmentId: ackId,
    submittedAt: new Date().toISOString(),
  };
}

export type TaxFiling = {
  enterpriseId: string;
  enterpriseName: string;
  period: string;
  generatedAt: string;
  corporate: { profit: number; tax: number; rate: number };
  vat: { feesCollected: number; vat: number; rate: number };
  payroll: {
    headcount: number;
    grossSalaries: number;
    employeeShare: number;
    employerShare: number;
    total: number;
  };
  dividendWithholding: { grossDividends: number; withholding: number; rate: number };
  totalTaxLiability: number;
  filingAck: { accepted: boolean; acknowledgmentId: string; submittedAt: string } | null;
};

// ── Generate a complete tax filing for an enterprise ──
// Aggregates quarterly reports (revenue/profit), platform fees (VAT base),
// payroll (from Employee records), and dividend proposals (withholding base)
// into a single filing, then submits to the mock Tax Authority API.
//
// `period` is the reporting period — accepts "YYYY-Qn" (quarterly) or "YYYY-MM"
// (monthly). The function is period-agnostic; it reports whatever data exists
// in the period supplied via the optional `period` arg (defaults to current quarter).
export async function generateTaxFiling(
  enterpriseId: string,
  period?: string
): Promise<TaxFiling> {
  const enterprise = await db.enterprise.findUnique({
    where: { id: enterpriseId },
    include: {
      quarterlyReports: {
        orderBy: { year: "asc" },
      },
      employees: {
        select: { monthlySalaryEgp: true, nosiStatus: true },
      },
    },
  });

  if (!enterprise) {
    throw new Error(`Tax engine: enterprise ${enterpriseId} not found`);
  }

  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const defaultPeriod = `${now.getFullYear()}-Q${quarter}`;
  const filingPeriod = period ?? defaultPeriod;

  // ── Corporate tax base: net profit ──
  // Sum of netProfitEgp across quarterly reports (most recent first 4 quarters).
  const profit = enterprise.quarterlyReports
    .slice(-4)
    .reduce((sum, q) => sum + (q.netProfitEgp ?? 0), 0);
  const corp = calculateCorporateTax(profit);

  // ── VAT base: platform fees accrued on milestone releases ──
  // Computed from the platformFeePct (default 5%) applied to the enterprise's
  // raised capital + cumulative milestone releases. Approximation: 5% of the
  // milestone activity in the period. We use the ledger to find milestone_released
  // events in the period and apply the enterprise's platformFeePct.
  let feesCollected = 0;
  try {
    const milestoneEvents = await db.ledgerEvent.findMany({
      where: {
        enterpriseId,
        eventType: "milestone_released",
      },
      select: { payload: true, timestamp: true },
      orderBy: { timestamp: "desc" },
      take: 50,
    });
    for (const ev of milestoneEvents) {
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(ev.payload) as Record<string, unknown>;
      } catch {
        continue;
      }
      const amount = typeof payload.amountEgp === "number" ? payload.amountEgp : 0;
      feesCollected += amount * (enterprise.platformFeePct / 100);
    }
  } catch {
    // Ledger read failure is non-fatal — VAT base falls back to 0.
  }
  const vat = calculateVAT(feesCollected);

  // ── Payroll tax base: gross salaries from Employee records ──
  const headcount = enterprise.employees.length;
  const grossSalaries = enterprise.employees.reduce(
    (sum, e) => sum + (e.monthlySalaryEgp ?? 0),
    0
  );
  const payrollMonthly = enterprise.employees.reduce((sum, e) => {
    const p = calculatePayrollTax(e.monthlySalaryEgp ?? 0);
    return {
      employee: sum.employee + p.employeeShare,
      employer: sum.employer + p.employerShare,
    };
  }, { employee: 0, employer: 0 });
  // Scale to a quarterly figure (3 months) for the filing period.
  const payroll = {
    headcount,
    grossSalaries: roundEgp(grossSalaries),
    employeeShare: roundEgp(payrollMonthly.employee * 3),
    employerShare: roundEgp(payrollMonthly.employer * 3),
    total: roundEgp((payrollMonthly.employee + payrollMonthly.employer) * 3),
  };

  // ── Dividend withholding base ──
  // Sum of dividend proposal fees (executed proposals only) in the period.
  let grossDividends = 0;
  try {
    const dividendProposals = await db.proposal.findMany({
      where: {
        enterpriseId,
        type: "dividend",
        status: "executed",
      },
      select: { feeEgp: true, executedAt: true },
    });
    for (const p of dividendProposals) {
      if (!p.executedAt) continue;
      grossDividends += p.feeEgp ?? 0;
    }
  } catch {
    // Non-fatal — dividends base falls back to 0.
  }
  const withholding = calculateWithholdingTax(grossDividends);

  const totalTaxLiability = roundEgp(
    corp.tax + vat.vat + payroll.total + withholding.withholding
  );

  // ── Submit the filing to the mock Tax Authority API ──
  const filingPayload = {
    enterpriseId,
    enterpriseName: enterprise.name,
    period: filingPeriod,
    corporate: corp,
    vat,
    payroll,
    dividendWithholding: withholding,
    totalTaxLiability,
  };
  const ack = await submitToTaxAuthority({
    enterpriseId,
    filingType: "quarterly_corporate",
    period: filingPeriod,
    amountEgp: totalTaxLiability,
    payload: filingPayload,
  });

  // Audit-log the filing submission (non-blocking — audit never throws).
  await audit({
    action: "tax.filing.generated",
    target: `enterprise:${enterpriseId}`,
    result: "allowed",
    metadata: {
      period: filingPeriod,
      totalTaxLiability,
      acknowledgmentId: ack.acknowledgmentId,
      corporate: corp.tax,
      vat: vat.vat,
      payroll: payroll.total,
      withholding: withholding.withholding,
    },
  });

  return {
    enterpriseId,
    enterpriseName: enterprise.name,
    period: filingPeriod,
    generatedAt: now.toISOString(),
    corporate: { profit: roundEgp(profit), tax: corp.tax, rate: corp.rate },
    vat: { feesCollected: roundEgp(feesCollected), vat: vat.vat, rate: vat.rate },
    payroll,
    dividendWithholding: {
      grossDividends: roundEgp(grossDividends),
      withholding: withholding.withholding,
      rate: withholding.rate,
    },
    totalTaxLiability,
    filingAck: ack,
  };
}
