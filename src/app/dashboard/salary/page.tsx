import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { SalaryCalculatorClient } from "@/components/dashboard/workforce/salary-calculator-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Salary Engine · AURIENTA",
  description:
    "Constitutionally-compliant compensation calculator. Salary = Base × Tier × Performance × Regional × Profit — every figure validated by the Constitutional Brain AI.",
};

export default async function SalaryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/salary");

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <SalaryCalculatorClient
          user={{
            id: user.id,
            legalName: user.legalName,
          }}
        />
      </main>
      <footer className="mt-auto border-t border-gold/10 py-6 text-center text-xs text-muted-foreground">
        AURIENTA Compensation Intelligence · Blueprint §8.4 · Every salary is
        CRE-validated, ledger-anchored, and never below the 2026 minimum wage.
      </footer>
    </div>
  );
}
