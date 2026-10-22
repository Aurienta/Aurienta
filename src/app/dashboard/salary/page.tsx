import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { SalaryCalculatorClient } from "@/components/dashboard/workforce/salary-calculator-client";
import {
  SalaryToEquityConverter,
  type SalaryToEquityContext,
} from "@/components/dashboard/workforce/salary-to-equity-converter";
import { HardHat, ArrowRightLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Salary Engine · AURIENTA",
  description:
    "Constitutionally-compliant compensation calculator. Salary = Base × Tier × Performance × Regional × Profit — every figure validated by the Constitutional Brain AI.",
};

const DEFAULT_LOCKUP_MONTHS = 12;

export default async function SalaryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/salary");

  // Load the user's Employee records (across all their enterprises) so the
  // salary-to-equity converter can render one card per eligible employment.
  // Empty list → the converter section is hidden (the user has no
  // Workforce-Partner relationship yet).
  const employees = await db.employee.findMany({
    where: { userId: user.id },
    include: {
      enterprise: {
        select: {
          id: true,
          name: true,
          slug: true,
          equityUnitPriceEgp: true,
        },
      },
    },
    orderBy: { hireDate: "desc" },
  });

  const converterContexts: SalaryToEquityContext[] = employees
    .filter((e) => Number(e.enterprise.equityUnitPriceEgp) > 0)
    .map((e) => ({
      employeeId: e.id,
      enterpriseId: e.enterpriseId,
      enterpriseName: e.enterprise.name,
      monthlySalaryEgp: Number(e.monthlySalaryEgp),
      equityUnitPriceEgp: Number(e.enterprise.equityUnitPriceEgp),
      currentEquityConversionPct: Number(e.equityConversionPct ?? 0),
      restrictedUntilMonths: DEFAULT_LOCKUP_MONTHS,
    }));

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <SalaryCalculatorClient
          user={{
            id: user.id,
            legalName: user.legalName,
          }}
        />

        {converterContexts.length > 0 ? (
          <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-12 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-400/30 bg-indigo-500/10">
                <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-300" />
              </span>
              <div className="flex flex-col">
                <span className="font-sans text-[11px] font-medium uppercase tracking-[0.24em] text-indigo-300/85">
                  Salary-to-Equity Conversion · Vol 8
                </span>
                <h2 className="font-serif text-xl font-semibold tracking-tight text-indigo-100 sm:text-2xl">
                  Capitalize your salary
                </h2>
              </div>
            </div>
            <p className="max-w-2xl font-sans text-sm leading-relaxed text-muted-foreground">
              Workforce Partners may convert up to 10% of monthly salary into
              Equity Units at a 15% discount to the fundamental CPP price.
              Issued units carry a 12-month lock-up enforced by{" "}
              <code className="rounded bg-foreground/[0.04] px-1 py-0.5 font-mono text-[11px]">
                equity_lockup.rego
              </code>
              . One card per active employment:
            </p>
            <div className="grid gap-6 lg:grid-cols-2">
              {converterContexts.map((ctx) => (
                <SalaryToEquityConverter key={ctx.employeeId} ctx={ctx} />
              ))}
            </div>
          </section>
        ) : (
          <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 pb-12 text-center sm:px-6">
            <HardHat className="h-8 w-8 text-muted-foreground/50" />
            <p className="max-w-md font-sans text-sm text-muted-foreground">
              You are not enrolled as a Workforce Partner in any enterprise
              yet. Once an enterprise enrolls you as an employee, the
              salary-to-equity converter will appear here.
            </p>
          </section>
        )}
      </main>
      <footer className="mt-auto border-t border-gold/10 py-6 text-center text-xs text-muted-foreground">
        AURIENTA Compensation Intelligence · Blueprint §8.4 · Every salary is
        CRE-validated, ledger-anchored, and never below the 2026 minimum wage.
      </footer>
    </div>
  );
}
