"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ShieldPlus,
  Loader2,
  Coins,
  HandCoins,
  Scroll,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
} from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { egp, pct, timeAgo } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  raisedEgp: number;
};

type VaultLoan = {
  id: string;
  enterpriseId: string;
  enterpriseName: string | null;
  enterpriseTier: string | null;
  amountEgp: number;
  reason: string;
  boardVotePct: number;
  status: string;
  repaidEgp: number;
  requestedAt: string;
  approvedAt: string | null;
  repaymentDueAt: string | null;
};

type VaultSummary = {
  id: string | null;
  enterpriseId: string;
  totalContributedEgp: number;
  currentBalanceEgp: number;
  totalLoanedEgp: number;
  totalRepaidEgp: number;
};

const REASON_LABELS: Record<string, string> = {
  pandemic: "Pandemic",
  currency_devaluation: "Currency devaluation",
  war: "War / conflict",
  natural_disaster: "Natural disaster",
};

const STATUS_META: Record<
  string,
  { label: string; cls: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    cls: "text-amber-300 border-amber-400/30 bg-amber-400/10",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    cls: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
    icon: CheckCircle2,
  },
  repaid: {
    label: "Repaid",
    cls: "text-gold-light border-gold/40 bg-gold/12",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    cls: "text-rose-300 border-rose-400/30 bg-rose-400/10",
    icon: AlertTriangle,
  },
  forgiven: {
    label: "Forgiven",
    cls: "text-muted-foreground border-gold/15 bg-foreground/5",
    icon: HandCoins,
  },
};

const LOAN_CAP_PCT = 20;
const VAULT_CONTRIBUTION_PCT = 0.5;
const REPAYMENT_MONTHS = 24;

export function VaultClient({
  enterprises,
  initialLoans,
}: {
  enterprises: Enterprise[];
  initialLoans: VaultLoan[];
}) {
  const { toast } = useToast();

  const [selectedId, setSelectedId] = React.useState<string>(
    enterprises[0]?.id ?? ""
  );
  const [vault, setVault] = React.useState<VaultSummary | null>(null);
  const [loadingVault, setLoadingVault] = React.useState(false);

  const [loans, setLoans] = React.useState<VaultLoan[]>(initialLoans);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    amountEgp: "",
    reason: "pandemic" as keyof typeof REASON_LABELS,
    boardVotePct: "55",
  });

  const selectedEnterprise = enterprises.find((e) => e.id === selectedId);
  const enterpriseLoans = loans.filter((l) => l.enterpriseId === selectedId);
  const capEgp = selectedEnterprise
    ? Math.round((selectedEnterprise.raisedEgp * LOAN_CAP_PCT) / 100)
    : 0;

  // Fetch vault balance whenever the selected enterprise changes.
  React.useEffect(() => {
    if (!selectedId) {
      setVault(null);
      return;
    }
    let cancelled = false;
    setLoadingVault(true);
    fetch(`/api/vault?enterpriseId=${encodeURIComponent(selectedId)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load vault");
        return r.json() as Promise<{ vault: VaultSummary; enterprise: unknown }>;
      })
      .then((data) => {
        if (!cancelled) setVault(data.vault);
      })
      .catch(() => {
        if (!cancelled) setVault(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingVault(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function submitLoan() {
    if (!selectedEnterprise) {
      toast({ title: "No enterprise selected", description: "Pick an enterprise first." });
      return;
    }
    const amount = Number(form.amountEgp);
    const boardVote = Number(form.boardVotePct);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive EGP amount." });
      return;
    }
    if (!Number.isFinite(boardVote) || boardVote < 0 || boardVote > 100) {
      toast({ title: "Invalid board vote", description: "Board vote must be 0–100%." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/vault/loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: selectedEnterprise.id,
          amountEgp: amount,
          reason: form.reason,
          boardVotePct: boardVote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Loan request failed");
      }
      const created: VaultLoan = {
        id: data.loan.id,
        enterpriseId: data.loan.enterpriseId,
        enterpriseName: selectedEnterprise.name,
        enterpriseTier: selectedEnterprise.tier,
        amountEgp: data.loan.amountEgp,
        reason: data.loan.reason,
        boardVotePct: data.loan.boardVotePct,
        status: data.loan.status,
        repaidEgp: data.loan.repaidEgp,
        requestedAt: data.loan.requestedAt,
        approvedAt: data.loan.approvedAt ?? null,
        repaymentDueAt: data.loan.repaymentDueAt ?? null,
      };
      setLoans((prev) => [created, ...prev]);
      setDialogOpen(false);
      setForm({ amountEgp: "", reason: "pandemic", boardVotePct: "55" });
      toast({
        title: "Loan petition filed",
        description: `${egp(amount)} for ${REASON_LABELS[form.reason]}. AURIENTA review pending.`,
      });
    } catch (e) {
      toast({
        title: "Could not file loan petition",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (enterprises.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-4 py-24 text-center">
        <ShieldPlus className="h-10 w-10 text-gold/60" />
        <h1 className="mt-4 font-serif text-2xl font-semibold">No enterprises yet</h1>
        <p className="mt-2 max-w-md font-sans text-sm text-muted-foreground">
          The Anti-Fragility Insurance Vault becomes visible once you belong to
          an enterprise. Join or found one to see its constitutional reserve.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-gold/20 glass-gold p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
                <ShieldPlus className="h-3.5 w-3.5 text-gold" />
              </span>
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.24em] text-gold-light/85">
                Anti-Fragility Insurance Vault
              </span>
            </div>
            <h1 className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl">
              Shocks make the network stronger
            </h1>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-muted-foreground sm:text-base">
              Every Capital Formation close contributes {VAULT_CONTRIBUTION_PCT}%
              into a constitutional reserve. Enterprises hit by exogenous shocks
              may petition for interest-free loans — capped at {LOAN_CAP_PCT}% of
              capital participated, repaid over {REPAYMENT_MONTHS} months,
              non-recourse.
            </p>
          </div>
          <div className="hidden shrink-0 flex-col items-end gap-1.5 lg:flex">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
              Blueprint anchor
            </span>
            <span className="font-sans text-xs text-gold/80">§5.4 — Anti-Fragility</span>
          </div>
        </div>
      </section>

      {/* Enterprise selector + Request loan */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex w-full max-w-md flex-col gap-1.5">
          <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
            Enterprise
          </Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="border-gold/20 bg-background/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {enterprises.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name} · T{e.tier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-gold-gradient text-[#0a0a0b] hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" /> Request vault loan
        </Button>
      </div>

      {/* Vault balance + rules */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Balance hero */}
        <Card className="border-gold/20 bg-card/60 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-gold" />
              <CardTitle className="font-serif text-base font-semibold">
                Vault balance · {selectedEnterprise?.name}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loadingVault ? (
              <div className="flex items-center gap-2 py-6 font-sans text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-gold" /> Loading
                constitutional reserve…
              </div>
            ) : vault ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                  label="Current balance"
                  value={egp(vault.currentBalanceEgp, { compact: true })}
                  accent
                />
                <Stat
                  label="Total contributed"
                  value={egp(vault.totalContributedEgp, { compact: true })}
                />
                <Stat
                  label="Total loaned"
                  value={egp(vault.totalLoanedEgp, { compact: true })}
                />
                <Stat
                  label="Total repaid"
                  value={egp(vault.totalRepaidEgp, { compact: true })}
                />
              </div>
            ) : (
              <p className="py-6 font-sans text-sm text-muted-foreground">
                No vault record yet — contributions begin with the first Capital
                Formation close.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Rules */}
        <Card className="border-gold/15 bg-card/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scroll className="h-4 w-4 text-gold/80" />
              <CardTitle className="font-serif text-sm font-semibold">
                Constitutional rules
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2.5 font-sans text-xs leading-relaxed text-muted-foreground">
              <li>
                • <span className="text-foreground">0.5%</span> of every Capital
                Formation close flows in.
              </li>
              <li>
                • Loan cap: <span className="text-foreground">{LOAN_CAP_PCT}%</span>{" "}
                of capital participated.
              </li>
              <li>
                • Repayment: <span className="text-foreground">{REPAYMENT_MONTHS} months</span>,
                interest-free.
              </li>
              <li>
                • <span className="text-foreground">Non-recourse</span> — forgiven
                if the enterprise fails before repayment.
              </li>
              <li>
                • Requires <span className="text-foreground">≥50% board vote</span>{" "}
                (simple majority).
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Loan history */}
      <Card className="border-gold/15 bg-card/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <GoldStar className="h-3 w-3" />
            <CardTitle className="font-serif text-base font-semibold">
              Loan history
            </CardTitle>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">
              {enterpriseLoans.length} loan{enterpriseLoans.length === 1 ? "" : "s"} ·
              cap {egp(capEgp, { compact: true })}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {enterpriseLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HandCoins className="h-10 w-10 text-gold/50" />
              <p className="mt-3 font-serif text-base font-semibold">
                No vault loans filed
              </p>
              <p className="mx-auto mt-1 max-w-sm font-sans text-xs text-muted-foreground">
                When this enterprise petitions the Anti-Fragility Vault, the
                record appears here with board vote, reason, and lifecycle
                status.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gold/12 hover:bg-transparent">
                    <TableHead className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                      Loan
                    </TableHead>
                    <TableHead className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                      Amount
                    </TableHead>
                    <TableHead className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                      Reason
                    </TableHead>
                    <TableHead className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                      Board vote
                    </TableHead>
                    <TableHead className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                      Repaid
                    </TableHead>
                    <TableHead className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground text-right">
                      Filed
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enterpriseLoans.map((l) => {
                    const meta = STATUS_META[l.status] ?? {
                      label: l.status,
                      cls: "text-muted-foreground border-gold/15 bg-foreground/5",
                      icon: Clock,
                    };
                    return (
                      <TableRow key={l.id} className="border-gold/8">
                        <TableCell className="font-mono text-xs text-gold-light">
                          #{l.id.slice(-8).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {egp(l.amountEgp, { compact: true })}
                        </TableCell>
                        <TableCell className="font-sans text-xs">
                          {REASON_LABELS[l.reason] ?? l.reason}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {pct(l.boardVotePct, 0)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {l.repaidEgp > 0
                            ? egp(l.repaidEgp, { compact: true })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide",
                              meta.cls
                            )}
                          >
                            <meta.icon className="h-3 w-3" /> {meta.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-sans text-xs text-muted-foreground/80">
                          {timeAgo(new Date(l.requestedAt))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request loan dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-gold/20 bg-card sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <HandCoins className="h-4 w-4 text-gold" />
              <DialogTitle className="font-serif text-base font-semibold">
                Petition the Anti-Fragility Vault
              </DialogTitle>
            </div>
            <DialogDescription className="font-sans text-xs text-muted-foreground">
              {selectedEnterprise?.name} · cap {egp(capEgp, { compact: true })} ·
              interest-free · {REPAYMENT_MONTHS}-month non-recourse.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                Amount (EGP)
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={capEgp}
                value={form.amountEgp}
                onChange={(e) => setForm((f) => ({ ...f, amountEgp: e.target.value }))}
                placeholder={`Up to ${capEgp.toLocaleString()}`}
                className="border-gold/20 bg-background/40 font-mono text-sm"
              />
              <span className="font-mono text-[10px] text-muted-foreground/80">
                Cap = {LOAN_CAP_PCT}% of capital participated ({egp(capEgp, { compact: true })})
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                Reason
              </Label>
              <Select
                value={form.reason}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, reason: v as typeof f.reason }))
                }
              >
                <SelectTrigger className="border-gold/20 bg-background/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REASON_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                Board vote (%)
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={form.boardVotePct}
                onChange={(e) => setForm((f) => ({ ...f, boardVotePct: e.target.value }))}
                placeholder="≥ 50 for simple majority"
                className="border-gold/20 bg-background/40 font-mono text-sm"
              />
              <span className="font-mono text-[10px] text-muted-foreground/80">
                Simple majority (≥50%) required — CRE-enforced.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-gold/20 hover:bg-gold/5"
            >
              Cancel
            </Button>
            <Button
              onClick={submitLoan}
              disabled={submitting}
              className="bg-gold-gradient text-[#0a0a0b] hover:opacity-90"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <HandCoins className="mr-2 h-4 w-4" />
              )}
              File petition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border p-3",
        accent
          ? "border-gold/30 bg-gold/10"
          : "border-gold/12 bg-foreground/[0.02]"
      )}
    >
      <div
        className={cn(
          "font-mono text-sm",
          accent ? "text-gold-light" : "text-foreground"
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 font-sans text-[11px] uppercase tracking-wide text-muted-foreground/85">
        {label}
      </div>
    </motion.div>
  );
}
