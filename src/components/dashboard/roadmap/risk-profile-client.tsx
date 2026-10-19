"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Umbrella,
  KeyRound,
  Loader2,
  Copy,
  ShieldCheck,
  Terminal,
  AlertCircle,
  Building2,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { timeAgo } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/dashboard/ux/empty-state";

type Enterprise = {
  id: string;
  name: string;
  tier: string;
  sector: string;
  healthRating: string | null;
  healthScore: number;
  status: string;
};

type HistoryEntry = {
  id: string;
  enterpriseId: string;
  enterpriseName: string | null;
  enterpriseTier: string | null;
  requesterOrg: string;
  healthScore: number;
  recommendation: string;
  riskFactors: string;
  createdAt: string;
};

type ProfileResult = {
  healthScore: number;
  healthRating: string;
  trend: string;
  riskFactors: string;
  recommendation: "low_risk" | "moderate_risk" | "elevated_risk";
  decisionToken: string;
  disclaimer: string;
  calculatedAt: string;
};

const DISCLAIMER =
  "AURIENTA does NOT underwrite insurance. This API provides enterprise risk data. Insurance companies partner with enterprises directly. Compliant with FRA Insurance Law 10/1981.";

const CURL_EXAMPLE = `curl -X GET "https://aurienta.vercel.app/api/risk-profile/<enterpriseId>" \\
  -H "X-Risk-Profile-Api-Key: aur_risk-<your-key>" \\
  -H "X-Disclaimer-Accepted: true" \\
  -H "X-Requester-Org: ACME Insurance Co."`;

type VitalSign = {
  name: string;
  score: number;
  target: number;
  status: "healthy" | "warning" | "critical";
  detail: string;
};

export function RiskProfileClient({
  userEmail,
  isAurientaRep,
  demoApiKey,
  platformPublicKey,
  enterprises,
  history,
}: {
  userEmail: string;
  isAurientaRep: boolean;
  demoApiKey: string;
  platformPublicKey: string;
  enterprises: Enterprise[];
  history: HistoryEntry[];
}) {
  const [selectedEntId, setSelectedEntId] = React.useState<string>("");
  const [apiKey, setApiKey] = React.useState<string>(demoApiKey);
  const [generatedKey, setGeneratedKey] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = React.useState(false);
  const [profile, setProfile] = React.useState<ProfileResult | null>(null);

  const selected = enterprises.find((e) => e.id === selectedEntId) ?? null;

  async function generateKey() {
    setGenerating(true);
    try {
      const res = await csrfFetch("/api/risk-profile/keys", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate key");
      setGeneratedKey(data.key);
      setApiKey(data.key);
      toast.success("Risk-Profile API key generated", {
        description: "Store it securely — shown only once.",
      });
    } catch (e) {
      toast.error("Could not generate API key", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function generateProfile() {
    if (!selectedEntId) {
      toast.error("Select an enterprise first");
      return;
    }
    if (!disclaimerAccepted) {
      toast.error("You must accept the disclaimer to generate a profile");
      return;
    }
    if (apiKey.trim().length < 16) {
      toast.error("A valid API key (≥16 chars) is required");
      return;
    }
    setRunning(true);
    setProfile(null);
    try {
      const res = await fetch(
        `/api/risk-profile/${encodeURIComponent(selectedEntId)}`,
        {
          method: "GET",
          headers: {
            "X-Risk-Profile-Api-Key": apiKey.trim(),
            "X-Disclaimer-Accepted": "true",
            "X-Requester-Org": `${userEmail} (dashboard)`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Profile generation failed");
      setProfile(data as ProfileResult);
      toast.success("Risk profile generated", {
        description: `Health score ${data.healthScore} · ${data.recommendation}`,
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast.error("Profile generation failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setRunning(false);
    }
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Clipboard not available");
    }
  }

  const vitalSigns = React.useMemo<VitalSign[]>(() => {
    if (!profile) return [];
    try {
      const parsed = JSON.parse(profile.riskFactors) as {
        vital_signs?: VitalSign[];
      };
      return parsed.vital_signs ?? [];
    } catch {
      return [];
    }
  }, [profile]);

  const riskDrivers = React.useMemo<string[]>(() => {
    if (!profile) return [];
    try {
      const parsed = JSON.parse(profile.riskFactors) as {
        risk_drivers?: string[];
      };
      return parsed.risk_drivers ?? [];
    } catch {
      return [];
    }
  }, [profile]);

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
            <Umbrella className="h-5 w-5 text-indigo-700" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-indigo-700">
              Risk Profile API
            </p>
            <h1 className="mt-1.5 font-serif text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
              Data service for insurance partners
            </h1>
            <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-slate-600">
              AURIENTA provides data, not insurance. Insurance companies partner
              with enterprises directly. Every response carries a compliance
              disclaimer and an Ed25519-signed decision token.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Compliance banner (indigo) */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
        <div className="font-sans text-sm leading-relaxed text-indigo-900">
          <span className="font-semibold">Compliance:</span> {DISCLAIMER}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* API Key + Enterprise selector */}
        <Card className="border-indigo-200 bg-white">
          <CardHeader className="border-b border-indigo-100">
            <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
              <KeyRound className="h-4 w-4 text-indigo-600" /> API Key + Enterprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div>
              <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                Enterprise
              </Label>
              <Select value={selectedEntId} onValueChange={setSelectedEntId}>
                <SelectTrigger className="mt-1.5 border-slate-300 bg-white">
                  <SelectValue placeholder="Select an enterprise" />
                </SelectTrigger>
                <SelectContent>
                  {enterprises.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <span className="font-sans">{e.name}</span>
                      <span className="ml-2 font-mono text-[11px] text-slate-500">
                        T{e.tier} · {e.sector}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selected && (
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs">
                  <div>
                    <div className="font-sans text-[10px] uppercase tracking-wide text-slate-500">
                      Tier
                    </div>
                    <div className="font-mono text-slate-700">T{selected.tier}</div>
                  </div>
                  <div>
                    <div className="font-sans text-[10px] uppercase tracking-wide text-slate-500">
                      Sector
                    </div>
                    <div className="font-mono text-slate-700">{selected.sector}</div>
                  </div>
                  <div>
                    <div className="font-sans text-[10px] uppercase tracking-wide text-slate-500">
                      Health rating
                    </div>
                    <div className="font-mono text-slate-700">
                      {selected.healthRating ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="font-sans text-[10px] uppercase tracking-wide text-slate-500">
                      Health score
                    </div>
                    <div className="font-mono text-slate-700">{selected.healthScore}</div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                  Active API key (used by the console below)
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateKey}
                  disabled={generating}
                  className="h-7 border-indigo-300 bg-white px-2 text-[11px] text-indigo-700 hover:bg-indigo-50"
                >
                  {generating ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <KeyRound className="mr-1 h-3 w-3" />
                  )}
                  Generate new key
                </Button>
              </div>
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1.5 border-slate-300 bg-white font-mono text-xs"
                placeholder="aur_risk-..."
              />
              <p className="mt-1 font-sans text-[11px] text-slate-500">
                Defaults to a deterministic demo key for {userEmail}.
              </p>
              {generatedKey && (
                <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2.5">
                  <Label className="font-sans text-[11px] uppercase tracking-wide text-rose-600">
                    New key (shown once)
                  </Label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 truncate font-mono text-[11px] text-rose-900">
                      {generatedKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyText(generatedKey, "API key")}
                      className="h-7 border-rose-300 bg-white px-2 text-[11px] text-rose-700 hover:bg-rose-100"
                    >
                      <Copy className="mr-1 h-3 w-3" /> Copy
                    </Button>
                  </div>
                  <p className="mt-1 font-sans text-[11px] text-rose-600">
                    Store securely, shown once.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2.5">
              <Checkbox
                id="disclaimer"
                checked={disclaimerAccepted}
                onCheckedChange={(v) => setDisclaimerAccepted(v === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="disclaimer"
                className="font-sans text-xs leading-relaxed text-indigo-900"
              >
                I acknowledge that AURIENTA does NOT underwrite insurance.
                This API provides enterprise risk data only. Insurance
                companies partner with enterprises directly.
              </label>
            </div>

            <Button
              onClick={generateProfile}
              disabled={
                running ||
                !selectedEntId ||
                !disclaimerAccepted ||
                apiKey.trim().length < 16
              }
              className="w-full bg-purple-600 text-white hover:bg-purple-700"
            >
              {running ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              {running ? "Generating risk profile..." : "Generate Risk Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Risk profile display */}
        <Card className="border-indigo-200 bg-white">
          <CardHeader className="border-b border-indigo-100">
            <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
              <Activity className="h-4 w-4 text-indigo-600" /> Risk Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {!profile ? (
              <EmptyState
                icon={Umbrella}
                title="No Risk Profile"
                description="Select an enterprise and generate a risk profile to see constitutional health data."
              />
            ) : (
              <div className="space-y-4">
                {/* Health score gauge */}
                <div className="flex items-center gap-4 rounded-md border border-indigo-200 bg-indigo-50/60 p-4">
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        className="text-slate-200"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={
                          2 * Math.PI * 34 * (1 - profile.healthScore / 100)
                        }
                        className={cn(
                          profile.healthScore >= 80
                            ? "text-emerald-500"
                            : profile.healthScore >= 60
                            ? "text-indigo-500"
                            : "text-rose-500"
                        )}
                      />
                    </svg>
                    <span className="absolute font-serif text-2xl font-semibold text-slate-900">
                      {profile.healthScore}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-[11px] uppercase tracking-wide text-slate-500">
                      Health score · {profile.healthRating} · {profile.trend}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "mt-1.5 font-mono text-[11px]",
                        profile.recommendation === "low_risk"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : profile.recommendation === "moderate_risk"
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-rose-300 bg-rose-50 text-rose-700"
                      )}
                    >
                      {profile.recommendation.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                {/* 9 vital signs grid */}
                <div>
                  <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                    9 Vital Signs
                  </Label>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {vitalSigns.map((vs) => (
                      <div
                        key={vs.name}
                        className={cn(
                          "rounded-md border px-2.5 py-2",
                          vs.status === "healthy"
                            ? "border-emerald-200 bg-emerald-50"
                            : vs.status === "warning"
                            ? "border-indigo-200 bg-indigo-50"
                            : "border-rose-200 bg-rose-50"
                        )}
                      >
                        <div className="font-sans text-[10px] uppercase tracking-wide text-slate-600">
                          {vs.name}
                        </div>
                        <div className="mt-0.5 font-mono text-sm font-semibold text-slate-900">
                          {vs.score}
                          <span className="ml-1 text-[10px] text-slate-500">
                            / {vs.target}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk drivers */}
                {riskDrivers.length > 0 && (
                  <div>
                    <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                      Top risk drivers
                    </Label>
                    <ul className="mt-1.5 space-y-1">
                      {riskDrivers.map((d, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 font-sans text-[11px] text-slate-700"
                        >
                          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-indigo-500" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Decision token */}
                <div>
                  <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                    Decision Token (Ed25519)
                  </Label>
                  <div className="mt-1 flex items-center gap-2 rounded border border-slate-200 bg-white px-2.5 py-1.5">
                    <code className="flex-1 truncate font-mono text-[11px] text-slate-700">
                      {profile.decisionToken.slice(0, 32)}…
                      {profile.decisionToken.slice(-12)}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyText(profile.decisionToken, "Decision token")}
                      className="h-7 border-indigo-300 bg-white px-2 text-[11px] text-indigo-700 hover:bg-indigo-50"
                    >
                      <Copy className="mr-1 h-3 w-3" /> Copy
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 rounded border border-indigo-200 bg-indigo-50 px-2.5 py-1.5">
                  <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-indigo-600" />
                  <p className="font-sans text-[11px] leading-relaxed text-indigo-800">
                    {profile.disclaimer}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Query History */}
      <Card className="border-indigo-200 bg-white">
        <CardHeader className="border-b border-indigo-100">
          <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
            <Activity className="h-4 w-4 text-indigo-600" /> Query History
            <span className="ml-auto font-mono text-[11px] font-normal text-slate-500">
              {history.length} {isAurientaRep ? "(all — aurienta_rep)" : "(your queries)"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-[28rem] overflow-y-auto">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <Umbrella className="h-10 w-10 text-indigo-300" />
                <p className="mt-3 font-serif text-base font-semibold text-slate-700">
                  No risk-profile queries yet
                </p>
                <p className="mt-1 max-w-sm font-sans text-xs text-slate-500">
                  Generate your first risk profile above. Each query is signed
                  with the platform Ed25519 key and persisted for audit.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-indigo-100">
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-500">Enterprise</th>
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-500">Requester</th>
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-500">Score</th>
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-500">Recommendation</th>
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-500">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-indigo-50/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                          <span className="font-sans text-xs text-slate-800">
                            {h.enterpriseName ?? "—"}
                          </span>
                          {h.enterpriseTier && (
                            <Badge variant="outline" className="font-mono text-[10px] text-slate-500">
                              T{h.enterpriseTier}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        {h.requesterOrg}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                        {h.healthScore}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px]",
                            h.recommendation === "low_risk"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : h.recommendation === "moderate_risk"
                              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                              : "border-rose-300 bg-rose-50 text-rose-700"
                          )}
                        >
                          {h.recommendation.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-sans text-[11px] text-slate-500">
                        {timeAgo(new Date(h.createdAt))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Code example */}
      <Card className="border-indigo-200 bg-white">
        <CardHeader className="border-b border-indigo-100">
          <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
            <Terminal className="h-4 w-4 text-indigo-600" /> Code Example
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <pre className="overflow-x-auto rounded-md border border-slate-800 bg-slate-900 p-4 font-mono text-[11px] leading-relaxed text-slate-100">
            {CURL_EXAMPLE}
          </pre>
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-600">
            Platform Ed25519 public key (for verifying decision tokens):
            <div className="mt-1 break-all text-indigo-700">
              {platformPublicKey}
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-center font-sans text-[11px] leading-relaxed text-slate-500">
        AURIENTA does NOT underwrite insurance. Risk profiles are derived
        from the same 9 constitutional vital signs used by the CRE — no
        proprietary scoring. Compliant with FRA Insurance Law 10/1981.
      </p>
    </div>
  );
}
