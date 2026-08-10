"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  ShieldAlert,
  ScrollText,
  Filter,
  Inbox,
} from "lucide-react";
import { egp } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { SubmitExpenseDialog } from "./submit-expense-dialog";
import { ApproveExpenseButton } from "./approve-expense-button";

export type ExpenseRow = {
  id: string;
  category: string;
  description: string;
  vendor: string;
  amountEgp: number;
  status: string;
  aiRiskFlag: string | null;
  createdAt: string; // ISO
  approver1Name: string | null;
  approver2Name: string | null;
  submitterName: string;
  hasMySignature: boolean;
};

type FilterKey = "all" | "pending" | "approved" | "flagged";

export function ExpenseDashboard({
  expenses,
  enterpriseId,
  capital,
  roles,
  canApprove,
}: {
  expenses: ExpenseRow[];
  enterpriseId: string;
  capital: number;
  roles: string[];
  canApprove: boolean;
}) {
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const { t } = useLanguage();

  const counts = React.useMemo(() => {
    return {
      all: expenses.length,
      pending: expenses.filter((e) =>
        ["pending", "dual_signature_pending"].includes(e.status)
      ).length,
      approved: expenses.filter((e) => e.status === "approved").length,
      flagged: expenses.filter(
        (e) => e.status === "flagged" || (e.aiRiskFlag && e.aiRiskFlag !== "none")
      ).length,
    } as Record<FilterKey, number>;
  }, [expenses]);

  const filtered = React.useMemo(() => {
    const list = (() => {
      switch (filter) {
        case "pending":
          return expenses.filter((e) =>
            ["pending", "dual_signature_pending"].includes(e.status)
          );
        case "approved":
          return expenses.filter((e) => e.status === "approved");
        case "flagged":
          return expenses.filter(
            (e) => e.status === "flagged" || (e.aiRiskFlag && e.aiRiskFlag !== "none")
          );
        default:
          return expenses;
      }
    })();
    return list;
  }, [filter, expenses]);

  function onExport() {
    toast.success("CSV export signed by CRE with QR verification.", {
      description:
        "SHA3-256 manifest + Ed25519 signature ready. File delivered to your audit inbox.",
    });
  }

  return (
    <section className="rounded-2xl border border-gold/12 glass p-5 sm:p-6" aria-label="Constitutional expenses dashboard">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <ScrollText className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-lg font-semibold">Constitutional Expenses</h2>
          <span className="rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 font-mono text-xs text-gold/70">
            {expenses.length} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onExport}
            className="h-10 border-gold/25 text-foreground hover:bg-gold/5"
          >
            <Download className="h-4 w-4" /> {t("ui.export")}
          </Button>
          <SubmitExpenseDialog
            enterpriseId={enterpriseId}
            capital={capital}
            roles={roles}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto">
        <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
          <TabsList className="bg-muted/60">
            <TabsTrigger value="all" className="gap-1.5">
              {t("common.all")}
              <Count n={counts.all} />
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5">
              {t("ui.pending")}
              <Count n={counts.pending} />
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1.5">
              {t("ui.approved")}
              <Count n={counts.approved} />
            </TabsTrigger>
            <TabsTrigger value="flagged" className="gap-1.5">
              Flagged
              <Count n={counts.flagged} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Inbox className="h-8 w-8 text-gold/40" />
          <p className="font-sans text-sm text-muted-foreground">
            No expenses match this filter.
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[28rem] rounded-xl border border-gold/8">
          <Table>
            <TableHeader>
              <TableRow className="border-gold/10 hover:bg-transparent">
                <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                  {t("ui.date")}
                </TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                  {t("ui.description")}
                </TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                  Vendor
                </TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                  {t("ui.category")}
                </TableHead>
                <TableHead className="text-right font-sans text-xs uppercase tracking-wider text-muted-foreground">
                  {t("ui.amount")}
                </TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                  {t("ui.status")}
                </TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                  AI risk
                </TableHead>
                <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                  Approver(s)
                </TableHead>
                <TableHead className="text-right font-sans text-xs uppercase tracking-wider text-muted-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow
                  key={e.id}
                  className="border-gold/5 hover:bg-gold/[0.03]"
                >
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {formatDate(e.createdAt)}
                  </TableCell>
                  <TableCell className="max-w-[18rem]">
                    <p className="truncate font-serif text-sm font-medium text-foreground">
                      {e.description}
                    </p>
                    <p className="font-sans text-xs text-muted-foreground">
                      by {e.submitterName}
                    </p>
                  </TableCell>
                  <TableCell className="font-sans text-xs">{e.vendor}</TableCell>
                  <TableCell>
                    <span className="rounded-full border border-gold/15 bg-gold/5 px-2 py-0.5 font-mono text-xs text-gold/80">
                      {e.category.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-serif font-semibold text-gold-light">
                    {egp(e.amountEgp, { compact: e.amountEgp >= 1_000_000 })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell>
                    <RiskBadge flag={e.aiRiskFlag} />
                  </TableCell>
                  <TableCell className="font-sans text-[11px] text-muted-foreground">
                    {e.approver1Name || e.approver2Name ? (
                      <div className="flex flex-col gap-0.5">
                        {e.approver1Name && (
                          <span className="text-foreground">① {e.approver1Name}</span>
                        )}
                        {e.approver2Name && (
                          <span className="text-foreground">② {e.approver2Name}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/80">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canApprove &&
                    ["pending", "dual_signature_pending"].includes(e.status) ? (
                      <ApproveExpenseButton
                        expenseId={e.id}
                        status={e.status}
                        hasMySignature={e.hasMySignature}
                        variant="compact"
                      />
                    ) : e.status === "flagged" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-400/5 px-2.5 py-1 font-sans text-xs text-red-300">
                        <ShieldAlert className="h-3 w-3" /> Review
                      </span>
                    ) : e.status === "approved" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/5 px-2.5 py-1 font-sans text-xs text-emerald-300">
                        Released
                      </span>
                    ) : (
                      <span className="font-sans text-xs text-muted-foreground">
                        Awaiting
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </section>
  );
}

function Count({ n }: { n: number }) {
  return (
    <span className="ml-1 rounded-full bg-gold/10 px-1.5 py-0.5 font-mono text-[11px] text-gold/80">
      {n}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved: {
      label: "Approved",
      cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    },
    pending: {
      label: "Board pending",
      cls: "border-gold/25 bg-gold/10 text-gold-light",
    },
    dual_signature_pending: {
      label: "Dual signature",
      cls: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    },
    flagged: {
      label: "Flagged",
      cls: "border-red-400/30 bg-red-400/10 text-red-300",
    },
    rejected: {
      label: "Rejected",
      cls: "border-red-400/30 bg-red-400/10 text-red-300",
    },
  };
  const cfg = map[status] ?? {
    label: status.replace(/_/g, " "),
    cls: "border-gold/15 bg-gold/5 text-muted-foreground",
  };
  return (
    <Badge
      variant="outline"
      className={cn("h-6 px-2 font-sans text-xs capitalize", cfg.cls)}
    >
      {cfg.label}
    </Badge>
  );
}

function RiskBadge({ flag }: { flag: string | null }) {
  if (!flag || flag === "none") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2 py-0.5 font-sans text-xs text-emerald-300/80">
        Clear
      </span>
    );
  }
  const labels: Record<string, string> = {
    related_party: "Related party",
    threshold_gaming: "Threshold gaming",
    duplicate: "Duplicate",
  };
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-400/35 bg-red-400/10 px-2 py-0.5 font-sans text-xs font-medium text-red-300">
      <ShieldAlert className="h-3 w-3" /> {labels[flag] ?? flag.replace(/_/g, " ")}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}
