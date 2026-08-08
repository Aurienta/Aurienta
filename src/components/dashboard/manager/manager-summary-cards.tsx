import { Receipt, Gauge, ClipboardCheck, Vault } from "lucide-react";
import { egp, pct } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

type SummaryData = {
  monthExpenseTotal: number;
  monthlyBudget: number; // mock monthly budget = monthly burn
  pendingApprovals: number;
  lawFirmClientAccountBalanceEgp: number;
  monthlyBurnEgp: number;
};

/**
 * Four summary cards across the top of the Manager Console.
 *  - Total expenses this month
 *  - Budget utilisation % (vs monthly burn) — colour coded
 *  - Pending approvals (count) — colour coded
 *  - Law Firm Client Account balance + runway months
 */
export function ManagerSummaryCards({
  data,
}: {
  data: SummaryData;
}) {
  const utilisationPct =
    data.monthlyBudget > 0 ? (data.monthExpenseTotal / data.monthlyBudget) * 100 : 0;
  const runway =
    data.monthlyBurnEgp > 0 ? data.lawFirmClientAccountBalanceEgp / data.monthlyBurnEgp : 0;

  const utilTone =
    utilisationPct > 100 ? "red" : utilisationPct > 80 ? "amber" : "green";
  const pendTone =
    data.pendingApprovals >= 5 ? "red" : data.pendingApprovals >= 2 ? "amber" : "green";
  const runwayTone = runway < 6 ? "red" : runway < 12 ? "amber" : "green";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        icon={Receipt}
        label="Expenses this month"
        value={egp(data.monthExpenseTotal, { compact: data.monthExpenseTotal >= 1_000_000 })}
        sub={`Budget: ${egp(data.monthlyBudget, { compact: data.monthlyBudget >= 1_000_000 })}`}
        tone="neutral"
      />
      <Card
        icon={Gauge}
        label="Budget utilisation"
        value={pct(utilisationPct, 1)}
        sub={`${egp(data.monthExpenseTotal, { compact: true })} of ${egp(data.monthlyBudget, { compact: true })}`}
        tone={utilTone}
        progress={Math.min(utilisationPct, 100)}
      />
      <Card
        icon={ClipboardCheck}
        label="Pending approvals"
        value={`${data.pendingApprovals}`}
        sub={data.pendingApprovals === 1 ? "1 expense awaits" : `${data.pendingApprovals} expenses await`}
        tone={pendTone}
      />
      <Card
        icon={Vault}
        label="Law Firm Client Account balance"
        value={egp(data.lawFirmClientAccountBalanceEgp, { compact: data.lawFirmClientAccountBalanceEgp >= 1_000_000 })}
        sub={`${runway.toFixed(1)} mo runway · zero custody`}
        tone={runwayTone}
      />
    </div>
  );
}

function Card({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  progress,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  tone: "neutral" | "green" | "amber" | "red";
  progress?: number;
}) {
  const toneMap = {
    neutral: { dot: "bg-gold", text: "text-foreground", ring: "border-gold/15" },
    green: { dot: "bg-emerald-400", text: "text-emerald-300", ring: "border-emerald-400/25" },
    amber: { dot: "bg-amber-400", text: "text-amber-300", ring: "border-amber-400/25" },
    red: { dot: "bg-red-400", text: "text-red-300", ring: "border-red-400/25" },
  }[tone];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border glass p-5",
        toneMap.ring
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
            tone === "neutral"
              ? "border-gold/20 bg-gold/5"
              : tone === "green"
              ? "border-emerald-400/25 bg-emerald-400/5"
              : tone === "amber"
              ? "border-amber-400/25 bg-amber-400/5"
              : "border-red-400/25 bg-red-400/5"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              tone === "neutral"
                ? "text-gold"
                : tone === "green"
                ? "text-emerald-400"
                : tone === "amber"
                ? "text-amber-400"
                : "text-red-400"
            )}
          />
        </div>
        <span className={cn("h-2 w-2 rounded-full", toneMap.dot)} aria-hidden />
      </div>
      <p className="mt-3 font-sans text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 font-serif text-2xl font-semibold", toneMap.text)}>{value}</p>
      <p className="mt-1 font-sans text-[11px] text-muted-foreground">{sub}</p>

      {progress !== undefined && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-gold/10">
          <div
            className={cn(
              "h-full rounded-full",
              tone === "green"
                ? "bg-emerald-400"
                : tone === "amber"
                ? "bg-amber-400"
                : tone === "red"
                ? "bg-red-400"
                : "bg-gold-gradient"
            )}
            style={{ width: `${Math.max(progress, 3)}%` }}
          />
        </div>
      )}
    </div>
  );
}
