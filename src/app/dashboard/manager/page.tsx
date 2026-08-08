import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { ManagerHeader } from "@/components/dashboard/manager/manager-header";
import { ManagerSummaryCards } from "@/components/dashboard/manager/manager-summary-cards";
import { ExpenseDashboard, type ExpenseRow } from "@/components/dashboard/manager/expense-dashboard";
import { egp, timeAgo } from "@/lib/aurienta/format";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, HardHat, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Manager Console · AURIENTA" };

export default async function ManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ enterprise?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const sp = await searchParams;

  // Find enterprises where the user is manager or founding_operator
  const managerMemberships = user.memberships.filter(
    (m) => m.role === "manager" || m.role === "founding_operator"
  );
  const enterpriseIds = managerMemberships.map((m) => m.enterpriseId);

  if (enterpriseIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5">
          <HardHat className="h-7 w-7 text-gold" />
        </div>
        <h1 className="font-serif text-2xl font-semibold">No manager seats</h1>
        <p className="mt-2 max-w-md font-sans text-sm text-muted-foreground">
          You are not currently appointed as a manager or founding operator of any enterprise.
          Found a new enterprise to gain a manager seat (subject to police clearance).
        </p>
        <Link
          href="/dashboard/founder"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 font-sans text-sm font-semibold text-black"
        >
          Open Founder Studio
        </Link>
      </div>
    );
  }

  const enterprises = await db.enterprise.findMany({
    where: { id: { in: enterpriseIds } },
    orderBy: { name: "asc" },
  });

  // Pick the selected enterprise (from query) or the first
  const selected =
    enterprises.find((e) => e.id === sp.enterprise || e.slug === sp.enterprise) ?? enterprises[0];

  // Fetch expenses, employees, milestones for the selected enterprise
  const [expenses, employees, milestones] = await Promise.all([
    db.expense.findMany({
      where: { enterpriseId: selected.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { approver1: true, submitter: true },
    }),
    db.employee.findMany({
      where: { enterpriseId: selected.id },
      include: { user: true },
      orderBy: { hireDate: "desc" },
    }),
    db.milestone.findMany({
      where: { enterpriseId: selected.id },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
  ]);

  // Map expenses to the ExpenseRow type expected by the component
  const userId = user.id;
  const expenseRows: ExpenseRow[] = expenses.map((e) => ({
    id: e.id,
    category: e.category,
    description: e.description,
    vendor: e.vendor,
    amountEgp: e.amountEgp,
    status: e.status,
    aiRiskFlag: e.aiRiskFlag,
    createdAt: e.createdAt.toISOString(),
    approver1Name: e.approver1?.legalName ?? null,
    approver2Name: null,
    submitterName: e.submitter?.legalName ?? "—",
    hasMySignature: e.approver1Id === userId || e.approver2Id === userId,
  }));

  // Summary card data
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthExpenseTotal = expenses
    .filter((e) => e.createdAt >= monthStart && e.status === "approved")
    .reduce((s, e) => s + e.amountEgp, 0);
  const pendingApprovals = expenses.filter(
    (e) => e.status === "pending" || e.status === "dual_signature_pending"
  ).length;
  const capital = selected.totalEquityUnits * selected.equityUnitPriceEgp;
  const roles = managerMemberships
    .filter((m) => m.enterpriseId === selected.id)
    .map((m) => m.role);

  // NOSI compliance
  const nosiRegistered = employees.filter((e) => e.nosiStatus === "registered").length;
  const nosiPct = employees.length > 0 ? (nosiRegistered / employees.length) * 100 : 100;

  // Salary-to-equity (the "Invest in Yourself" doctrine)
  const discountedPrice = selected.equityUnitPriceEgp * 0.85;

  return (
    <div className="flex flex-col gap-6">
      <ManagerHeader
        enterprises={enterprises.map((e) => ({
          id: e.id,
          name: e.name,
          slug: e.slug,
          tier: e.tier,
          policeClearanceValid: e.policeClearanceValid,
        }))}
        selectedId={selected.id}
        policeClearanceValid={selected.policeClearanceValid}
        role={roles[0] ?? "manager"}
      />

      <ManagerSummaryCards
        data={{
          monthExpenseTotal,
          monthlyBudget: selected.monthlyBurnEgp,
          pendingApprovals,
          lawFirmClientAccountBalanceEgp: selected.lawFirmClientAccountBalanceEgp,
          monthlyBurnEgp: selected.monthlyBurnEgp,
        }}
      />

      <ExpenseDashboard
        expenses={expenseRows}
        enterpriseId={selected.id}
        capital={capital}
        roles={roles}
        canApprove={roles.includes("manager") || roles.includes("board_member") || roles.includes("founding_operator")}
      />

      {/* Two-column: Employee Registry + Salary-to-Equity */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Employee Registry */}
        <div className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-gold" />
              <h2 className="font-serif text-lg font-semibold">Employee Registry</h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {nosiRegistered}/{employees.length} NOSI · {nosiPct.toFixed(0)}%
            </span>
          </div>

          {nosiPct < 100 && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2">
              <span className="text-sm">⚠️</span>
              <p className="font-sans text-xs text-amber-300/90">
                {employees.length - nosiRegistered} employee(s) not yet NOSI-registered. Law Firm Client Account
                freezes new expenses after 60 days of non-compliance.
              </p>
            </div>
          )}

          {employees.length === 0 ? (
            <p className="py-6 text-center font-sans text-sm text-muted-foreground">
              No workforce partners registered yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gold/10 font-sans text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Name</th>
                    <th className="pb-2 pr-3 font-medium">Position</th>
                    <th className="pb-2 pr-3 font-medium">NOSI</th>
                    <th className="pb-2 pr-3 text-right font-medium">Salary</th>
                    <th className="pb-2 text-right font-medium">Equity</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gold/5 last:border-0">
                      <td className="py-2.5 pr-3">
                        <p className="font-sans text-sm font-medium">{emp.user.legalName}</p>
                        <p className="font-sans text-xs text-muted-foreground">{emp.department}</p>
                      </td>
                      <td className="py-2.5 pr-3 font-sans text-xs">{emp.position}</td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] ${
                            emp.nosiStatus === "registered"
                              ? "bg-emerald-400/10 text-emerald-400"
                              : emp.nosiStatus === "pending"
                              ? "bg-amber-400/10 text-amber-400"
                              : "bg-red-400/10 text-red-400"
                          }`}
                        >
                          {emp.nosiStatus === "registered" ? "🟢" : emp.nosiStatus === "pending" ? "🟡" : "🔴"} {emp.nosiStatus}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono text-xs">{egp(emp.monthlySalaryEgp)}</td>
                      <td className="py-2.5 text-right">
                        {emp.equityConversionPct > 0 ? (
                          <Badge variant="outline" className="border-gold/20 text-xs text-gold/80">
                            {emp.equityConversionPct}% → equity
                          </Badge>
                        ) : (
                          <span className="font-sans text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Salary-to-Equity panel */}
        <div className="rounded-2xl border border-gold/12 glass-gold p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2.5">
            <TrendingUp className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-lg font-semibold">Invest in Yourself</h2>
          </div>
          <p className="font-sans text-xs leading-relaxed text-muted-foreground">
            Workforce Partners may convert up to <span className="text-gold-light">10% of monthly salary</span> into
            Equity Units at a <span className="text-gold-light">15% discount</span>, with a 12-month lockup.
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-gold/10 bg-background/40 p-3">
              <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Current AI fundamental price</p>
              <p className="font-serif text-xl font-semibold text-gold-light">{egp(selected.equityUnitPriceEgp)}</p>
            </div>
            <div className="rounded-xl border border-gold/10 bg-background/40 p-3">
              <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Discounted price (×0.85)</p>
              <p className="font-serif text-xl font-semibold text-gold-gradient">{egp(discountedPrice, { decimals: 2 })}</p>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
              <p className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider text-emerald-400">
                <Wallet className="h-3 w-3" /> 12-month lockup
              </p>
              <p className="mt-1 font-sans text-[11px] text-muted-foreground">
                Restricted shares vest immediately on graduation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones mini-panel */}
      {milestones.length > 0 && (
        <div className="rounded-2xl border border-gold/12 glass p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <HardHat className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-lg font-semibold">Milestones</h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {milestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-gold/10 bg-background/40 p-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm font-medium">{m.title}</p>
                  <p className="font-sans text-[11px] text-muted-foreground">
                    {egp(m.amountEgp)} · EVE {m.eveConfidence.toFixed(2)} ·{" "}
                    {m.dueAt ? `due ${timeAgo(m.dueAt)}` : "no due date"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    m.status === "released"
                      ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-400"
                      : m.status === "evidence_submitted"
                      ? "border-amber-400/30 bg-amber-400/5 text-amber-400"
                      : m.status === "approved"
                      ? "border-gold/30 bg-gold/5 text-gold"
                      : "border-gold/15 text-muted-foreground"
                  }
                >
                  {m.status.replace(/_/g, " ")}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
