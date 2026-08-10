"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Lock,
} from "lucide-react";
import { GoldStar } from "@/components/aurienta-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { egp, pct, shortHash, timeAgo } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  status: string;
  internalBalanceEgp: number;
};

type Membership = { enterpriseId: string; role: string };

type Assertion = {
  id: string;
  enterpriseId: string;
  enterpriseName: string | null;
  enterpriseTier: string | null;
  lawFirmBalanceEgp: number;
  internalBalanceEgp: number;
  varianceEgp: number;
  variancePct: number;
  healthLevel: number;
  assertionHash: string;
  createdAt: string;
};

const ELIGIBLE_ROLES = ["law_firm_rep", "aurienta_rep"];

type HealthMeta = {
  level: number;
  label: string;
  cls: string;
  ringCls: string;
  icon: React.ElementType;
};

function getHealthMeta(level: number): HealthMeta {
  // API contract (Blueprint §5.5):
  //   0 = OK (no flag) · 1 = pending reconcile (internal) · 2 = warning (all partners) · 3 = freeze (regulator)
  // User-facing 3-level display maps 0/1 → green, 2 → yellow, 3 → red.
  if (level >= 3) {
    return {
      level: 3,
      label: "Level 3 · Freeze",
      cls: "text-rose-300 border-rose-400/30 bg-rose-400/10",
      ringCls: "border-rose-400/40 bg-rose-400/8",
      icon: ShieldAlert,
    };
  }
  if (level === 2) {
    return {
      level: 2,
      label: "Level 2 · Warning",
      cls: "text-amber-300 border-amber-400/30 bg-amber-400/10",
      ringCls: "border-amber-400/40 bg-amber-400/8",
      icon: AlertTriangle,
    };
  }
  return {
    level: 1,
    label: level === 0 ? "Level 1 · OK" : "Level 1 · Pending reconcile",
    cls: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
    ringCls: "border-emerald-400/40 bg-emerald-400/8",
    icon: CheckCircle2,
  };
}

export function SolvencyClient({
  enterprises,
  memberships,
  initialAssertions,
}: {
  enterprises: Enterprise[];
  memberships: Membership[];
  initialAssertions: Assertion[];
}) {
  const { toast } = useToast();

  const [selectedId, setSelectedId] = React.useState<string>(
    enterprises[0]?.id ?? ""
  );
  const [latest, setLatest] = React.useState<Assertion | null>(null);
  const [healthLevel, setHealthLevel] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(false);

  const [assertions, setAssertions] = React.useState<Assertion[]>(initialAssertions);
  const [submitting, setSubmitting] = React.useState(false);
  const [lawFirmBalance, setLawFirmBalance] = React.useState("");

  const selectedEnterprise = enterprises.find((e) => e.id === selectedId);
  const enterpriseAssertions = assertions
    .filter((a) => a.enterpriseId === selectedId)
    .slice(0, 10);

  const roles = memberships
    .filter((m) => m.enterpriseId === selectedId)
    .map((m) => m.role);
  const canAssert = roles.some((r) => ELIGIBLE_ROLES.includes(r));

  // Fetch latest assertion for the selected enterprise.
  React.useEffect(() => {
    if (!selectedId) {
      setLatest(null);
      setHealthLevel(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/solvency?enterpriseId=${encodeURIComponent(selectedId)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load solvency assertion");
        return r.json() as Promise<{
          enterprise: { internalBalanceEgp: number };
          assertion: Assertion | null;
          healthLevel: number;
        }>;
      })
      .then((data) => {
        if (cancelled) return;
        setLatest(data.assertion);
        setHealthLevel(data.healthLevel);
      })
      .catch(() => {
        if (!cancelled) {
          setLatest(null);
          setHealthLevel(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function submitAssertion() {
    if (!selectedEnterprise) return;
    const amount = Number(lawFirmBalance);
    if (!Number.isFinite(amount) || amount < 0) {
      toast({
        title: "Invalid balance",
        description: "Enter a non-negative EGP amount.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/solvency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseId: selectedEnterprise.id,
          lawFirmBalanceEgp: amount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Assertion rejected");
      }
      const created: Assertion = {
        id: data.assertion.id,
        enterpriseId: data.assertion.enterpriseId,
        enterpriseName: selectedEnterprise.name,
        enterpriseTier: selectedEnterprise.tier,
        lawFirmBalanceEgp: data.assertion.lawFirmBalanceEgp,
        internalBalanceEgp: data.assertion.internalBalanceEgp,
        varianceEgp: data.assertion.varianceEgp,
        variancePct: data.assertion.variancePct,
        healthLevel: data.assertion.healthLevel,
        assertionHash: data.assertion.assertionHash,
        createdAt: data.assertion.createdAt,
      };
      setAssertions((prev) => [created, ...prev]);
      setLatest(created);
      setHealthLevel(data.assertion.healthLevel);
      setLawFirmBalance("");
      toast({
        title: "Assertion filed",
        description: data.emergencyFreeze
          ? `Variance >10% — emergency freeze triggered. Decision token ${shortHash(
              data.freezeVerdict?.decisionToken,
              10,
              4
            )}.`
          : `Health level ${data.assertion.healthLevel} · variance ${pct(
              data.assertion.variancePct,
              2
            )}.`,
      });
    } catch (e) {
      toast({
        title: "Assertion failed",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (enterprises.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-4 py-24 text-center">
        <ShieldCheck className="h-10 w-10 text-gold/60" />
        <h1 className="mt-4 font-serif text-2xl font-semibold">
          No enterprises yet
        </h1>
        <p className="mt-2 max-w-md font-sans text-sm text-muted-foreground">
          Proof-of-Solvency assertions are filed per enterprise. Join or found
          one to see the law-firm reconciliation feed.
        </p>
      </div>
    );
  }

  const meta = getHealthMeta(healthLevel);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-gold/20 glass-gold p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gold/25 bg-gold/8">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" />
              </span>
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.24em] text-gold-light/85">
                Proof-of-Solvency
              </span>
            </div>
            <h1 className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl">
              Every balance, reconciled in the open
            </h1>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-muted-foreground sm:text-base">
              Law firm representatives file signed balance assertions. The
              Constitutional Runtime Engine compares them against the internal
              ledger and classifies a 3-level health flag — variance above 10%
              triggers an emergency freeze.
            </p>
          </div>
          <div className="hidden shrink-0 flex-col items-end gap-1.5 lg:flex">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
              Blueprint anchor
            </span>
            <span className="font-sans text-xs text-gold/80">§5.5 — Solvency</span>
          </div>
        </div>
      </section>

      {/* Enterprise selector */}
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
                {e.status === "frozen" ? " · FROZEN" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Latest assertion + health flag */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          className={cn(
            "border bg-card/60 lg:col-span-2",
            meta.ringCls
          )}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-gold" />
              <CardTitle className="font-serif text-base font-semibold">
                Latest assertion · {selectedEnterprise?.name}
              </CardTitle>
              {selectedEnterprise?.status === "frozen" && (
                <Badge
                  variant="outline"
                  className="border-rose-400/30 bg-rose-400/10 text-[11px] text-rose-300"
                >
                  Enterprise frozen
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-6 font-sans text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-gold" /> Loading
                latest assertion…
              </div>
            ) : latest ? (
              <div className="flex flex-col gap-4">
                <div
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-4",
                    meta.ringCls
                  )}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <meta.icon className="h-3.5 w-3.5 text-gold" />
                      <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                        Health flag
                      </span>
                    </div>
                    <div className="mt-1 font-serif text-xl font-semibold">
                      {meta.label}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wide",
                      meta.cls
                    )}
                  >
                    <meta.icon className="h-3.5 w-3.5" /> Variance{" "}
                    {pct(latest.variancePct, 2)}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat
                    label="Law firm balance"
                    value={egp(latest.lawFirmBalanceEgp, { compact: true })}
                  />
                  <Stat
                    label="Internal balance"
                    value={egp(latest.internalBalanceEgp, { compact: true })}
                  />
                  <Stat
                    label="Variance EGP"
                    value={`${latest.varianceEgp >= 0 ? "+" : ""}${egp(
                      latest.varianceEgp,
                      { compact: true }
                    )}`}
                    danger={Math.abs(latest.varianceEgp) > 0}
                  />
                  <Stat
                    label="Variance %"
                    value={pct(latest.variancePct, 2)}
                    danger={latest.variancePct > 0.1}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground/80">
                  <FileText className="h-3 w-3" />
                  <span>Assertion hash</span>
                  <span className="text-gold-light">
                    {shortHash(latest.assertionHash, 14, 6)}
                  </span>
                  <span>· filed {timeAgo(new Date(latest.createdAt))}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Scale className="h-10 w-10 text-gold/50" />
                <p className="mt-3 font-serif text-base font-semibold">
                  No assertion filed yet
                </p>
                <p className="mx-auto mt-1 max-w-sm font-sans text-xs text-muted-foreground">
                  When the law firm representative files a signed balance, the
                  CRE reconciles it against the internal ledger and assigns a
                  health level.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit assertion form */}
        <Card className="border-gold/15 bg-card/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-gold/80" />
              <CardTitle className="font-serif text-sm font-semibold">
                Submit Balance Assertion
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {canAssert ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-3">
                  <div className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                    Internal ledger balance
                  </div>
                  <div className="mt-1 font-mono text-sm text-gold-light">
                    {egp(selectedEnterprise?.internalBalanceEgp ?? 0)}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                    Law firm balance (EGP)
                  </Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={lawFirmBalance}
                    onChange={(e) => setLawFirmBalance(e.target.value)}
                    placeholder="Reported by law firm"
                    className="border-gold/20 bg-background/40 font-mono text-sm"
                  />
                  <span className="font-mono text-[10px] text-muted-foreground/80">
                    Thresholds: &gt;0.1% pending · &gt;2% warning · &gt;10% freeze
                  </span>
                </div>
                <Button
                  onClick={submitAssertion}
                  disabled={submitting}
                  className="bg-gold-gradient text-[#0a0a0b] hover:opacity-90"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  File signed assertion
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Lock className="h-8 w-8 text-gold/40" />
                <p className="mt-2 font-sans text-xs text-muted-foreground">
                  Only a Law Firm Representative or an AURIENTA Representative
                  may file a Proof-of-Solvency assertion for this enterprise.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historical assertions */}
      <Card className="border-gold/15 bg-card/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <GoldStar className="h-3 w-3" />
            <CardTitle className="font-serif text-base font-semibold">
              Historical assertions
            </CardTitle>
            <span className="ml-auto font-mono text-xs text-muted-foreground/80">
              last {enterpriseAssertions.length} · hash-anchored
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {enterpriseAssertions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-10 w-10 text-gold/50" />
              <p className="mt-3 font-serif text-base font-semibold">
                No assertions on record
              </p>
              <p className="mx-auto mt-1 max-w-sm font-sans text-xs text-muted-foreground">
                Filed assertions appear here in a tamper-evident hash chain —
                each SHA-256 anchored to the prior assertion.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gold/12 hover:bg-transparent">
                    <TableHead className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                      Filed
                    </TableHead>
                    <TableHead className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                      Law firm
                    </TableHead>
                    <TableHead className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                      Internal
                    </TableHead>
                    <TableHead className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                      Variance
                    </TableHead>
                    <TableHead className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                      Level
                    </TableHead>
                    <TableHead className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">
                      Hash
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enterpriseAssertions.map((a) => {
                    const m = getHealthMeta(a.healthLevel);
                    return (
                      <TableRow key={a.id} className="border-gold/8">
                        <TableCell className="font-sans text-xs text-muted-foreground/80">
                          {timeAgo(new Date(a.createdAt))}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {egp(a.lawFirmBalanceEgp, { compact: true })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {egp(a.internalBalanceEgp, { compact: true })}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-mono text-xs",
                            Math.abs(a.variancePct) > 0.1
                              ? "text-amber-300"
                              : "text-emerald-300"
                          )}
                        >
                          {pct(a.variancePct, 2)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide",
                              m.cls
                            )}
                          >
                            <m.icon className="h-3 w-3" /> L{m.level}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gold-light">
                          {shortHash(a.assertionHash, 10, 4)}
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

      {/* Legend */}
      <div className="grid gap-3 sm:grid-cols-3">
        <LegendItem
          cls="border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          label="Level 1 · OK / Pending"
          desc="Variance ≤ 2% — internal reconciliation, no partner alert."
        />
        <LegendItem
          cls="border-amber-400/30 bg-amber-400/10 text-amber-300"
          label="Level 2 · Warning"
          desc="Variance 2–10% — all partners notified for review."
        />
        <LegendItem
          cls="border-rose-400/30 bg-rose-400/10 text-rose-300"
          label="Level 3 · Freeze"
          desc="Variance > 10% — emergency CRE freeze, regulator informed."
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gold/12 bg-foreground/[0.02] p-3"
    >
      <div
        className={cn(
          "font-mono text-sm",
          danger ? "text-amber-300" : "text-gold-light"
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

function LegendItem({
  cls,
  label,
  desc,
}: {
  cls: string;
  label: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-gold/12 bg-card/40 p-4">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide",
          cls
        )}
      >
        {label}
      </span>
      <p className="mt-2 font-sans text-xs leading-relaxed text-muted-foreground">
        {desc}
      </p>
    </div>
  );
}
