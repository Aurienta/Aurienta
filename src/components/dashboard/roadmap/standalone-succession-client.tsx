"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  Globe,
  HeartHandshake,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  Plus,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { egp, shortHash, timeRemaining } from "@/lib/aurienta/format";

// ─────────────────────────────────────────────────────────────────────────────
// Standalone Succession Protocol — dashboard client.
//
// Indigo/purple theme, light background, NO blue (per Phase-2 design brief).
// Composed of:
//   1. Page header + compliance banner (legal/governance, not fund management).
//   2. "Create Succession Case" form.
//   3. Cases list (cards with status, k-of-n Shamir params, declaration hash,
//      activation date, fee, and an Activate button for drafted cases).
//   4. Educational section explaining Shamir secret sharing (k-of-n).
//   5. Diaspora Corridor — Open Capital Rounds (Egypt-only; secondary section
//      embedded here because there's no dedicated nav entry for the corridor).
// ─────────────────────────────────────────────────────────────────────────────

type CaseStatus = "drafted" | "activated" | "executing" | "completed";

type SuccessionCase = {
  id: string;
  businessName: string;
  businessType: string;
  jurisdiction: string;
  declarationHash: string;
  shamirThreshold: number;
  shamirShares: number;
  activationDate: string | null;
  status: CaseStatus;
  feeEgp: number;
  createdAt: string;
};

type DiasporaRound = {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  enterpriseSlug: string;
  enterpriseTier: string;
  enterpriseSector: string;
  totalPledgedEgp: number;
  participantCount: number;
  fxRateLocked: number;
  status: "open" | "closed" | "settled";
  closesAt: string;
  createdAt: string;
};

type Props = {
  user: { id: string; legalName: string; email: string };
  cases: SuccessionCase[];
  rounds: DiasporaRound[];
};

const BUSINESS_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "family_business", label: "Family Business" },
  { value: "sme", label: "SME" },
  { value: "holding", label: "Holding Company" },
];

const THRESHOLD_OPTIONS = [2, 3];
const SHARES_OPTIONS = [3, 4, 5];

const STATUS_STYLES: Record<CaseStatus, { label: string; className: string }> = {
  drafted: {
    label: "Drafted",
    className:
      "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700",
  },
  activated: {
    label: "Activated",
    className:
      "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800",
  },
  executing: {
    label: "Executing",
    className:
      "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-amber-950/70 dark:text-indigo-300 dark:border-indigo-800",
  },
  completed: {
    label: "Completed",
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800",
  },
};

const ROUND_STATUS_STYLES: Record<
  DiasporaRound["status"],
  { label: string; className: string }
> = {
  open: {
    label: "Open",
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800",
  },
  closed: {
    label: "Closed",
    className:
      "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700",
  },
  settled: {
    label: "Settled",
    className:
      "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800",
  },
};

export function StandaloneSuccessionClient({ user, cases, rounds }: Props) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [activatingId, setActivatingId] = React.useState<string | null>(null);
  const [refreshingRounds, setRefreshingRounds] = React.useState(false);
  const [openRounds, setOpenRounds] = React.useState<DiasporaRound[]>(rounds);

  const [form, setForm] = React.useState({
    businessName: "",
    businessType: "family_business" as (typeof BUSINESS_TYPE_OPTIONS)[number]["value"],
    shamirThreshold: "2",
    shamirShares: "3",
  });

  async function handleCreate() {
    const businessName = form.businessName.trim();
    if (businessName.length < 2) {
      toast.error("Business name is required", {
        description: "Use the legal trading name of the family business.",
      });
      return;
    }
    const threshold = parseInt(form.shamirThreshold, 10);
    const shares = parseInt(form.shamirShares, 10);
    if (threshold > shares) {
      toast.error("Invalid Shamir parameters", {
        description: `Threshold (${threshold}) cannot exceed total shares (${shares}).`,
      });
      return;
    }

    setCreating(true);
    try {
      const res = await csrfFetch("/api/standalone-succession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          businessType: form.businessType,
          shamirThreshold: threshold,
          shamirShares: shares,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create case");
      toast.success("Succession case created", {
        description: "Status: drafted. Activate when ready to mint Shamir shares.",
      });
      setForm({
        businessName: "",
        businessType: "family_business",
        shamirThreshold: "2",
        shamirShares: "3",
      });
      router.refresh();
    } catch (e) {
      toast.error("Could not create case", { description: (e as Error).message });
    } finally {
      setCreating(false);
    }
  }

  async function handleActivate(caseId: string) {
    setActivatingId(caseId);
    try {
      const res = await csrfFetch(
        `/api/standalone-succession/${encodeURIComponent(caseId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "activate" }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to activate case");
      toast.success("Succession case activated", {
        description:
          "CRE decision token emitted. Shamir shares minted and ready for distribution.",
      });
      router.refresh();
    } catch (e) {
      toast.error("Activation failed", { description: (e as Error).message });
    } finally {
      setActivatingId(null);
    }
  }

  async function handleRefreshRounds() {
    setRefreshingRounds(true);
    try {
      const res = await csrfFetch("/api/diaspora-corridor", { method: "GET" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load rounds");
      setOpenRounds((data.rounds as DiasporaRound[]) ?? []);
    } catch (e) {
      toast.error("Could not refresh corridor rounds", {
        description: (e as Error).message,
      });
    } finally {
      setRefreshingRounds(false);
    }
  }

  const firstName = user.legalName.split(" ")[0] || user.legalName;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Page container with light indigo/purple accent (no blue) */}
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm dark:border-indigo-900 dark:bg-slate-900">
          <div className="border-b border-indigo-100 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 px-6 py-7 dark:border-indigo-900 dark:from-indigo-950 dark:via-violet-950 dark:to-purple-950">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-300 bg-indigo-100 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                <HeartHandshake className="h-4 w-4" />
              </span>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700 dark:text-indigo-300">
                Standalone Succession Protocol · Phase 2
              </span>
            </div>
            <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Standalone Succession Protocol
            </h1>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
              Cryptographic succession for family businesses. Shamir 2/3 secret sharing +
              CRE-enforced execution.
            </p>
          </div>

          {/* Compliance banner */}
          <div className="border-t border-indigo-200 bg-indigo-50 px-6 py-4 dark:border-indigo-900 dark:bg-amber-950/40">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700 dark:text-indigo-300" />
              <p className="font-sans text-[12px] leading-relaxed text-indigo-900 dark:text-indigo-100">
                <strong className="font-semibold">This is a legal/governance service — not fund management.</strong>{" "}
                No securities, no custody. Solves the 70% family business succession failure rate by
                cryptographically preparing continuity BEFORE a crisis — not through probate months later.
              </p>
            </div>
          </div>
        </header>

        {/* Create case form */}
        <Card className="border-indigo-200 bg-white shadow-sm dark:border-indigo-900 dark:bg-slate-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <CardTitle className="font-serif text-lg">Create Succession Case</CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              File a cryptographic succession declaration for a family business you control.
              The case starts in <span className="font-medium">drafted</span> status — activate it
              when you are ready to mint and distribute Shamir shares to your trustees.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="businessName" className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Business name
              </Label>
              <Input
                id="businessName"
                className="mt-1.5 border-slate-300 dark:border-slate-700"
                placeholder="e.g. El-Nour Family Textiles"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Business type
              </Label>
              <Select
                value={form.businessType}
                onValueChange={(v) => setForm({ ...form, businessType: v })}
              >
                <SelectTrigger className="mt-1.5 w-full border-slate-300 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Shamir k (threshold)
                </Label>
                <Select
                  value={form.shamirThreshold}
                  onValueChange={(v) => setForm({ ...form, shamirThreshold: v })}
                >
                  <SelectTrigger className="mt-1.5 w-full border-slate-300 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THRESHOLD_OPTIONS.map((t) => (
                      <SelectItem key={t} value={String(t)}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Shamir n (shares)
                </Label>
                <Select
                  value={form.shamirShares}
                  onValueChange={(v) => setForm({ ...form, shamirShares: v })}
                >
                  <SelectTrigger className="mt-1.5 w-full border-slate-300 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHARES_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-900 dark:bg-indigo-950/40">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-mono text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  {form.shamirThreshold}-of-{form.shamirShares} secret sharing
                </span>
              </div>
              <span className="font-sans text-sm text-slate-700 dark:text-slate-300">
                Service fee: <strong className="font-semibold text-indigo-700 dark:text-indigo-300">{egp(5000)}</strong>
              </span>
            </div>

            <div className="sm:col-span-2">
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full bg-indigo-600 font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 sm:w-auto"
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create succession case
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cases list */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-serif text-lg font-semibold">Your succession cases</h2>
            </div>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {cases.length} filed
            </span>
          </div>

          {cases.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
              <CardContent className="py-10 text-center">
                <Layers className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-600" />
                <p className="mt-3 font-sans text-sm text-slate-600 dark:text-slate-400">
                  No succession cases filed yet. Use the form above to file your first case.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {cases.map((c) => {
                const status = STATUS_STYLES[c.status];
                const typeLabel =
                  BUSINESS_TYPE_OPTIONS.find((o) => o.value === c.businessType)?.label ??
                  c.businessType;
                const canActivate = c.status === "drafted";
                return (
                  <Card
                    key={c.id}
                    className="border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="truncate font-serif text-base">
                            {c.businessName}
                          </CardTitle>
                          <CardDescription className="mt-0.5 text-xs">
                            {typeLabel} · {c.jurisdiction}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 ${status.className}`}
                        >
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 font-sans text-[12px]">
                        <div className="flex items-center gap-1.5">
                          <KeyRound className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                          <span className="text-slate-600 dark:text-slate-400">Shamir</span>
                          <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                            {c.shamirThreshold}-of-{c.shamirShares}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                          <span className="text-slate-600 dark:text-slate-400">Fee</span>
                          <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                            {egp(c.feeEgp)}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-slate-600 dark:text-slate-400">Decl. hash</span>
                          <span
                            className="font-mono text-[11px] text-slate-700 dark:text-slate-300"
                            title={c.declarationHash}
                          >
                            {shortHash(c.declarationHash)}
                          </span>
                        </div>
                        {c.activationDate ? (
                          <div className="col-span-2 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-slate-600 dark:text-slate-400">Activated</span>
                            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {new Date(c.activationDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        ) : (
                          <div className="col-span-2 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
                            <span className="text-slate-500 dark:text-slate-400">
                              Filed {new Date(c.createdAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })} · not yet activated
                            </span>
                          </div>
                        )}
                      </div>

                      {canActivate && (
                        <Button
                          onClick={() => handleActivate(c.id)}
                          disabled={activatingId === c.id}
                          className="mt-1 w-full bg-violet-600 font-semibold text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400"
                          size="sm"
                        >
                          {activatingId === c.id ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                          )}
                          Activate case
                        </Button>
                      )}
                      {c.status === "activated" && (
                        <div className="mt-1 flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 dark:border-indigo-900 dark:bg-indigo-950/40">
                          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span className="font-sans text-[11px] text-indigo-800 dark:text-indigo-200">
                            CRE decision token emitted. Shares distributed to trustees out-of-band.
                          </span>
                        </div>
                      )}
                      {(c.status === "executing" || c.status === "completed") && (
                        <div className="mt-1 flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 dark:border-indigo-900 dark:bg-amber-950/40">
                          <AlertTriangle className="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-300" />
                          <span className="font-sans text-[11px] text-indigo-900 dark:text-indigo-100">
                            Execution in progress — bank signatory transfer, customer notification,
                            ownership handover governed by CRE policies.
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Educational — Shamir secret sharing */}
        <Card className="border-violet-200 bg-white shadow-sm dark:border-violet-900 dark:bg-slate-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <CardTitle className="font-serif text-lg">
                How Shamir Secret Sharing works (k-of-n)
              </CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              The cryptographic primitive that protects your succession declaration.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 sm:grid-cols-3">
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
              <div className="mb-1 flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                <Users className="h-3.5 w-3.5" /> 1. Mint n shares
              </div>
              <p>
                On activation, the system splits the recovery key into{" "}
                <span className="font-mono font-medium">n</span> cryptographic shares — for
                example, 3 shares distributed to your spouse, eldest child, and family lawyer.
                No single share reveals anything about the recovery key.
              </p>
            </div>
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
              <div className="mb-1 flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                <KeyRound className="h-3.5 w-3.5" /> 2. Reconstruct with k
              </div>
              <p>
                To reconstruct the recovery key and trigger the succession,{" "}
                <span className="font-mono font-medium">k</span> shares must be presented
                together — for example, 2 of 3. With k−1 shares the key is mathematically
                unrecoverable, so a single compromised trustee cannot act alone.
              </p>
            </div>
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
              <div className="mb-1 flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                <ShieldCheck className="h-3.5 w-3.5" /> 3. CRE enforces execution
              </div>
              <p>
                The Constitutional Runtime Engine verifies the k-of-n reconstruction, emits a
                signed decision token, and anchors the activation on the immutable ledger.
                Subsequent steps (bank signatory transfer, customer notification, ownership
                handover) are governed by the same CRE policies — never by ad-hoc manual ops.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Diaspora Corridor — Open Capital Rounds */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="font-serif text-lg font-semibold">
                  Diaspora Corridor — Open Capital Rounds
                </h2>
                <p className="font-sans text-xs text-slate-600 dark:text-slate-400">
                  Egypt-only. Diaspora capital channeled to Egyptian enterprises at a locked FX rate.
                </p>
              </div>
            </div>
            <Button
              onClick={handleRefreshRounds}
              disabled={refreshingRounds}
              variant="outline"
              size="sm"
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
            >
              {refreshingRounds ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <TrendingUp className="mr-2 h-3.5 w-3.5" />
              )}
              Refresh
            </Button>
          </div>

          {openRounds.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
              <CardContent className="py-10 text-center">
                <Building2 className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-600" />
                <p className="mt-3 font-sans text-sm text-slate-600 dark:text-slate-400">
                  No open diaspora corridor rounds at this time. Enterprise managers can open
                  rounds from their enterprise dashboard.
                </p>
                <p className="mt-1 font-sans text-xs text-slate-500 dark:text-slate-500">
                  Zero Custody (I 1.1) — AURIENTA never holds the pledged capital. Settlement is
                  via regulated bank rails.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {openRounds.map((r) => {
                const roundStatus = ROUND_STATUS_STYLES[r.status];
                const remaining = timeRemaining(new Date(r.closesAt));
                return (
                  <Card
                    key={r.id}
                    className="border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="truncate font-serif text-base">
                            {r.enterpriseName}
                          </CardTitle>
                          <CardDescription className="mt-0.5 text-xs">
                            {r.enterpriseSector} · Tier {r.enterpriseTier}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 ${roundStatus.className}`}
                        >
                          {roundStatus.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 font-sans text-[12px]">
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Pledged</span>
                          <p className="font-mono font-semibold text-indigo-700 dark:text-indigo-300">
                            {egp(r.totalPledgedEgp, { compact: true })}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Participants</span>
                          <p className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {r.participantCount}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">FX locked</span>
                          <p className="font-mono font-medium text-violet-700 dark:text-violet-300">
                            {r.fxRateLocked.toFixed(2)} EGP/USD
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Closes in</span>
                          <p className="font-mono font-medium text-slate-900 dark:text-slate-100">
                            {remaining}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md border border-indigo-100 bg-indigo-50/60 px-3 py-2 dark:border-indigo-900 dark:bg-indigo-950/30">
                        <p className="font-sans text-[11px] leading-relaxed text-indigo-900 dark:text-indigo-200">
                          <ShieldCheck className="mr-1 inline h-3 w-3 align-text-bottom" />
                          Zero Custody — pledges settle via regulated bank rails. AML Law 80/2002
                          source-of-funds checks apply per participant.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer note */}
        <p className="mt-2 text-center font-mono text-[11px] leading-relaxed text-slate-500 dark:text-slate-500">
          Standalone Succession Protocol + Diaspora Corridor · Phase 2 ·{" "}
          {firstName}, signed in as {user.email}
        </p>
      </div>
    </div>
  );
}
