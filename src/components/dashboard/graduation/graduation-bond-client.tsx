"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BadgeCheck,
  Loader2,
  ShieldCheck,
  Building2,
  Search,
  Copy,
  CheckCircle2,
  XCircle,
  HeartPulse,
  Users,
  Coins,
  FileCheck,
  Calendar,
  Hash,
  Award,
  Lock,
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
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { egp, shortHash, timeAgo } from "@/lib/aurienta/format";
import { EmptyState } from "@/components/dashboard/ux/empty-state";
import type { GraduationBondRow } from "@/lib/aurienta/graduation-bond";

type Enterprise = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  sector: string;
  status: string;
  stage: string;
  healthScore: number;
  raisedEgp: number;
  fundraisingGoalEgp: number;
  monthlyRevenueEgp: number;
  monthlyBurnEgp: number;
  employeeCount: number;
  nosiCompliantPct: number;
  policeClearanceValid: boolean;
  transparencyScore: number;
  stageSince: string;
  hasBond: boolean;
};

type VitalSign = {
  name: string;
  healthy: boolean;
  detail: string;
};

type Verification = {
  valid: boolean;
  reason?: string;
  bond?: {
    enterpriseId: string;
    bondHash: string;
    graduationDate: string;
    healthScoreAtGraduation: number;
    partnerCount: number;
    capitalRaisedTotal: number;
    creDecisionsCount: number;
  };
  enterprise?: {
    id: string;
    name: string;
    slug: string;
    tier: string;
    sector: string;
    status: string;
    healthScore: number;
  };
};

const VITAL_SIGN_LABELS: Record<string, string> = {
  health_score: "Health Score ≥90",
  capital_raised: "Capital Goal Met",
  revenue_active: "Revenue Active",
  runway: "6+ Month Runway",
  workforce: "Workforce Registered",
  nosi_compliance: "NOSI ≥80%",
  police_clearance: "Police Clearance",
  transparency_score: "Transparency ≥60",
  graduation_status: "Graduated Stage",
};

export function GraduationBondClient({
  enterprises,
  initialBond,
  initialEnterpriseId,
}: {
  enterprises: Enterprise[];
  initialBond: GraduationBondRow | null;
  initialEnterpriseId: string;
}) {
  const [selectedEntId, setSelectedEntId] = React.useState(initialEnterpriseId);
  const [bond, setBond] = React.useState<GraduationBondRow | null>(initialBond);
  const [issuing, setIssuing] = React.useState(false);
  const [verifyInput, setVerifyInput] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [verification, setVerification] = React.useState<Verification | null>(null);
  const [copied, setCopied] = React.useState(false);

  const selected = enterprises.find((e) => e.id === selectedEntId);
  const eligible =
    !!selected &&
    selected.status === "graduated" &&
    selected.healthScore >= 90;
  const canIssue = eligible && !bond;

  async function refresh(enterpriseId: string) {
    if (!enterpriseId) return;
    try {
      const res = await fetch(
        `/api/graduation-bond/${encodeURIComponent(enterpriseId)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        setBond(data.bond ?? null);
      }
    } catch {
      // ignore — bond stays as-is
    }
  }

  React.useEffect(() => {
    refresh(selectedEntId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntId]);

  async function handleIssue() {
    if (!selectedEntId) return;
    setIssuing(true);
    try {
      const res = await csrfFetch("/api/graduation-bond/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterpriseId: selectedEntId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Issuance failed");
      setBond(data.bond);
      toast.success("Graduation Bond issued", {
        description: "Cryptographic certificate · irrevocable · publicly verifiable",
      });
    } catch (e) {
      toast.error("Bond issuance denied", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setIssuing(false);
    }
  }

  async function handleVerify() {
    if (!verifyInput.trim()) {
      toast.error("Enter a Bond ID to verify");
      return;
    }
    setVerifying(true);
    setVerification(null);
    try {
      const res = await fetch(
        `/api/graduation-bond/verify/${encodeURIComponent(verifyInput.trim())}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setVerification(data);
      if (res.ok && data.valid) {
        toast.success("Bond verified", {
          description: `${data.enterprise?.name} · graduated`,
        });
      } else if (res.status === 404) {
        toast.error("Bond not found", {
          description: data.reason ?? "No bond matches that ID.",
        });
      } else {
        toast.error("Bond invalid", {
          description: data.reason ?? "Verification failed",
        });
      }
    } catch (e) {
      toast.error("Verification failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setVerifying(false);
    }
  }

  async function copyBondId() {
    if (!bond) return;
    try {
      await navigator.clipboard.writeText(bond.id);
      setCopied(true);
      toast.success("Bond ID copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard not available");
    }
  }

  const vitalSigns: VitalSign[] = React.useMemo(() => {
    if (!selected) return [];
    const runway = selected.monthlyBurnEgp > 0
      ? Math.floor(selected.monthlyRevenueEgp / selected.monthlyBurnEgp)
      : 0;
    const fundraisingPct =
      selected.fundraisingGoalEgp > 0
        ? (selected.raisedEgp / selected.fundraisingGoalEgp) * 100
        : 0;
    return [
      { name: "health_score", healthy: selected.healthScore >= 90, detail: `Health ${selected.healthScore} (≥90)` },
      { name: "capital_raised", healthy: fundraisingPct >= 100, detail: `${fundraisingPct.toFixed(0)}% of goal` },
      { name: "revenue_active", healthy: selected.monthlyRevenueEgp > 0, detail: `${egp(selected.monthlyRevenueEgp, { compact: true })}/mo` },
      { name: "runway", healthy: runway >= 6, detail: `${runway} months` },
      { name: "workforce", healthy: selected.employeeCount > 0, detail: `${selected.employeeCount} employees` },
      { name: "nosi_compliance", healthy: selected.nosiCompliantPct >= 80, detail: `${selected.nosiCompliantPct}%` },
      { name: "police_clearance", healthy: selected.policeClearanceValid, detail: selected.policeClearanceValid ? "Valid" : "Expired" },
      { name: "transparency_score", healthy: selected.transparencyScore >= 60, detail: `${selected.transparencyScore}/100` },
      { name: "graduation_status", healthy: selected.status === "graduated", detail: selected.status },
    ];
  }, [selected]);

  const healthySigns = vitalSigns.filter((v) => v.healthy).length;

  if (enterprises.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <EmptyState
          icon={BadgeCheck}
          title="No graduated enterprise yet"
          description="Graduation Bonds are issued to enterprises with 'graduated' status, health ≥90, and 7/9 vital signs healthy. Join or found an enterprise to begin the graduation path."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-200/40 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-300/60 bg-indigo-100">
            <BadgeCheck className="h-5 w-5 text-indigo-700" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-indigo-700">
              REC-6 · Graduation Bond
            </p>
            <h1 className="mt-1.5 font-serif text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
              Cryptographic certificate of constitutional compliance
            </h1>
            <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-slate-600">
              Issued once per enterprise upon graduation. SHA-256 hash of the
              full constitutional history (ledger + audit logs). Irrevocable.
              Publicly verifiable by anyone — no auth required.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Enterprise selector */}
      <Card className="border-indigo-200 bg-white">
        <CardHeader className="border-b border-indigo-100 pb-3">
          <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
            <Building2 className="h-4 w-4 text-indigo-600" /> Enterprise
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Select value={selectedEntId} onValueChange={setSelectedEntId}>
            <SelectTrigger className="border-slate-300 bg-white">
              <SelectValue placeholder="Select an enterprise" />
            </SelectTrigger>
            <SelectContent>
              {enterprises.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  <span className="font-sans">{e.name}</span>
                  <span className="ml-2 font-mono text-[11px] text-slate-500">
                    T{e.tier} · {e.status}
                  </span>
                  {e.hasBond && (
                    <Badge variant="outline" className="ml-2 border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px]">
                      Bonded
                    </Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Bond certificate OR eligibility view */}
      {bond ? (
        <Card className="border-indigo-300 bg-gradient-to-br from-white via-indigo-50/40 to-purple-50/30">
          <CardHeader className="border-b border-indigo-200">
            <CardTitle className="flex items-center gap-2 font-serif text-lg text-slate-900">
              <Award className="h-5 w-5 text-indigo-600" /> Graduation Bond Certificate
              <Badge variant="outline" className="ml-auto border-emerald-300 bg-emerald-50 text-emerald-700">
                <Lock className="mr-1 h-3 w-3" /> Irrevocable
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <CertField
                icon={<Calendar className="h-4 w-4 text-indigo-600" />}
                label="Graduation Date"
                value={new Date(bond.graduationDate).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
              <CertField
                icon={<HeartPulse className="h-4 w-4 text-indigo-600" />}
                label="Health Score at Graduation"
                value={bond.healthScoreAtGraduation.toString()}
              />
              <CertField
                icon={<Users className="h-4 w-4 text-indigo-600" />}
                label="Partner Count"
                value={bond.partnerCount.toString()}
              />
              <CertField
                icon={<Coins className="h-4 w-4 text-indigo-600" />}
                label="Capital Raised Total"
                value={egp(bond.capitalRaisedTotal, { compact: true })}
              />
              <CertField
                icon={<FileCheck className="h-4 w-4 text-indigo-600" />}
                label="CRE Decisions Count"
                value={bond.creDecisionsCount.toString()}
              />
              <CertField
                icon={<Hash className="h-4 w-4 text-indigo-600" />}
                label="Constitution Hash"
                value={shortHash(bond.constitutionHash, 12, 6)}
              />
            </div>

            <div className="mt-5">
              <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                Bond ID (public verification key)
              </Label>
              <div className="mt-1.5 flex items-center gap-2 rounded-md border border-indigo-200 bg-white px-3 py-2">
                <code className="flex-1 truncate font-mono text-[11px] text-slate-700">
                  {bond.id}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyBondId}
                  className="h-7 border-indigo-300 bg-white px-2 text-[11px] text-indigo-700 hover:bg-indigo-50"
                >
                  {copied ? (
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                  ) : (
                    <Copy className="mr-1 h-3 w-3" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="mt-3">
              <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                Bond Hash (SHA-256 of constitutional history)
              </Label>
              <div className="mt-1.5 rounded-md border border-indigo-200 bg-white px-3 py-2">
                <code className="block truncate font-mono text-[11px] text-slate-700">
                  {bond.bondHash}
                </code>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-start gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px]">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-indigo-600" />
                <p className="font-sans leading-relaxed text-indigo-900">
                  Anyone can verify this bond at
                  <code className="mx-1 rounded bg-white px-1 font-mono">
                    /api/graduation-bond/verify/{bond.id.slice(0, 12)}…
                  </code>
                  — no auth required.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-indigo-200 bg-white">
          <CardHeader className="border-b border-indigo-100">
            <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
              <HeartPulse className="h-4 w-4 text-indigo-600" /> Graduation Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2">
                <span className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                  Status
                </span>
                <Badge
                  variant="outline"
                  className={
                    selected?.status === "graduated"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-rose-300 bg-rose-50 text-rose-700"
                  }
                >
                  {selected?.status ?? "—"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2">
                <span className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                  Health Score
                </span>
                <span
                  className={
                    (selected?.healthScore ?? 0) >= 90
                      ? "font-mono text-sm font-semibold text-emerald-700"
                      : "font-mono text-sm font-semibold text-rose-700"
                  }
                >
                  {selected?.healthScore ?? 0} / 90
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2">
                <span className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                  Vital Signs
                </span>
                <span
                  className={
                    healthySigns >= 7
                      ? "font-mono text-sm font-semibold text-emerald-700"
                      : "font-mono text-sm font-semibold text-rose-700"
                  }
                >
                  {healthySigns} / 9 healthy
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {vitalSigns.map((v) => (
                <div
                  key={v.name}
                  className={
                    "rounded-md border px-2.5 py-2 " +
                    (v.healthy
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-rose-200 bg-rose-50")
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="font-sans text-[10px] uppercase tracking-wide text-slate-600">
                      {VITAL_SIGN_LABELS[v.name] ?? v.name}
                    </div>
                    {v.healthy ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-rose-600" />
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-slate-700">
                    {v.detail}
                  </div>
                </div>
              ))}
            </div>

            {canIssue ? (
              <Button
                onClick={handleIssue}
                disabled={issuing}
                className="mt-5 w-full bg-purple-600 text-white hover:bg-purple-700"
              >
                {issuing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BadgeCheck className="mr-2 h-4 w-4" />
                )}
                {issuing ? "Issuing bond…" : "Issue Graduation Bond"}
              </Button>
            ) : (
              <div className="mt-5">
                <EmptyState
                  icon={BadgeCheck}
                  title="Not eligible for graduation bond"
                  description={
                    "Graduation requires status='graduated', health score ≥90, and ≥7 of 9 vital signs healthy. " +
                    `Current: status=${selected?.status ?? "—"}, health=${selected?.healthScore ?? 0}, vital signs=${healthySigns}/9.`
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Public verification */}
      <Card className="border-indigo-200 bg-white">
        <CardHeader className="border-b border-indigo-100">
          <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
            <Search className="h-4 w-4 text-indigo-600" /> Verify a Bond (public)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div>
            <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
              Bond ID
            </Label>
            <Input
              className="mt-1.5 border-slate-300 bg-white font-mono text-xs"
              placeholder="clxxxx…"
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value)}
            />
            <p className="mt-1 font-sans text-[11px] text-slate-500">
              No auth required. Anyone can verify any bond by ID.
            </p>
          </div>
          <Button
            onClick={handleVerify}
            disabled={verifying || !verifyInput.trim()}
            variant="outline"
            className="border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50"
          >
            {verifying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            {verifying ? "Verifying…" : "Verify Bond"}
          </Button>

          {verification && (
            <div
              className={
                "rounded-md border px-4 py-3 " +
                (verification.valid
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-rose-300 bg-rose-50")
              }
            >
              {verification.valid ? (
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-sans text-sm font-semibold text-emerald-800">
                      Bond is valid
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 font-mono text-[11px] text-emerald-900">
                    <span>Enterprise: {verification.enterprise?.name}</span>
                    <span>Tier {verification.enterprise?.tier} · {verification.enterprise?.sector}</span>
                    <span>Health: {verification.enterprise?.healthScore}</span>
                    <span>Graduated: {verification.bond ? new Date(verification.bond.graduationDate).toLocaleDateString("en-GB") : "—"}</span>
                    <span>Partners: {verification.bond?.partnerCount}</span>
                    <span>Capital: {verification.bond ? egp(verification.bond.capitalRaisedTotal, { compact: true }) : "—"}</span>
                    <span>CRE decisions: {verification.bond?.creDecisionsCount}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span className="font-sans text-sm font-semibold text-rose-800">
                      Bond invalid
                    </span>
                  </div>
                  <p className="mt-1 font-sans text-xs text-rose-900">
                    {verification.reason ?? "Verification failed."}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CertField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-white/80 p-3.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-sans text-[10px] uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <p className="mt-1.5 font-serif text-base font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}
