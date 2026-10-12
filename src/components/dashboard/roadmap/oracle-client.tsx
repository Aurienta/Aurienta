"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Satellite,
  KeyRound,
  Loader2,
  Copy,
  Play,
  ShieldAlert,
  Clock,
  Cpu,
  Terminal,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { csrfFetch } from "@/lib/aurienta/csrf-client";
import { shortHash, timeAgo } from "@/lib/aurienta/format";
import { cn } from "@/lib/utils";

type HistoryEntry = {
  id: string;
  queryText: string;
  queryHash: string;
  verdict: string;
  decisionToken: string | null;
  modelsConsulted: string;
  responseTimeMs: number;
  disclaimerShown: boolean;
  createdAt: string;
};

type ConsensusResult = {
  verdict: string;
  decisionToken: string;
  modelsConsulted: string;
  responseTimeMs: number;
  disclaimer: string;
};

const DISCLAIMER =
  "Consensus output is NOT financial/investment advice. Verdicts are cryptographic attestations of model agreement, not recommendations.";

const CURL_EXAMPLE = `curl -X POST https://aurienta.vercel.app/api/oracle/consensus \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "Summarise the constitutional capital-formation phases for Tier C.",
    "apiKey": "aur_oracle-<your-key>"
  }'`;

export function OracleClient({
  userEmail,
  isAurientaRep,
  demoApiKey,
  platformPublicKey,
  history,
}: {
  userEmail: string;
  isAurientaRep: boolean;
  demoApiKey: string;
  platformPublicKey: string;
  history: HistoryEntry[];
}) {
  const [query, setQuery] = React.useState("");
  const [apiKey, setApiKey] = React.useState<string>(demoApiKey);
  const [generatedKey, setGeneratedKey] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<ConsensusResult | null>(null);
  const [copiedToken, setCopiedToken] = React.useState(false);

  async function generateKey() {
    setGenerating(true);
    try {
      const res = await csrfFetch("/api/oracle/keys", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate key");
      setGeneratedKey(data.key);
      setApiKey(data.key);
      toast.success("Oracle API key generated", {
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

  async function runConsensus() {
    if (query.trim().length < 3) {
      toast.error("Query must be at least 3 characters");
      return;
    }
    if (apiKey.trim().length < 16) {
      toast.error("A valid API key (≥16 chars) is required");
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/oracle/consensus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Consensus query failed");
      setResult(data as ConsensusResult);
      toast.success("Consensus reached", {
        description: `${data.modelsConsulted?.split(",")?.length ?? 0} models · ${data.responseTimeMs}ms`,
      });
      // Refresh the history list so the new query appears.
      setTimeout(() => window.location.reload(), 1400);
    } catch (e) {
      toast.error("Consensus query failed", {
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

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-300/60 bg-indigo-100">
            <Satellite className="h-5 w-5 text-indigo-700" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-indigo-700">
              AI Consensus Oracle Network
            </p>
            <h1 className="mt-1.5 font-serif text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
              External queries to AURIENTA&apos;s 5-provider AI consensus
            </h1>
            <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-slate-600">
              Ed25519-signed verdicts. Per-query pricing. The Brain AI runs
              Gemini, Groq, OpenRouter, NVIDIA, and HuggingFace in consensus —
              the output is a cryptographic attestation of model agreement.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Compliance banner (amber) */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="font-sans text-sm leading-relaxed text-amber-900">
          <span className="font-semibold">Compliance:</span> {DISCLAIMER}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* API Key Management */}
        <Card className="border-indigo-200 bg-white">
          <CardHeader className="border-b border-indigo-100">
            <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
              <KeyRound className="h-4 w-4 text-indigo-600" /> API Key Management
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <p className="font-sans text-sm text-slate-600">
              Generate an API key for external access (e.g. via curl). The key
              is shown <span className="font-semibold text-rose-600">once</span> —
              store it securely.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                onClick={generateKey}
                disabled={generating}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
                )}
                Generate API Key
              </Button>
              {generatedKey && (
                <Badge
                  variant="outline"
                  className="border-emerald-400/50 bg-emerald-50 text-emerald-700"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" /> New key ready
                </Badge>
              )}
            </div>

            {generatedKey && (
              <div className="mt-4">
                <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                  Your new API key (shown once)
                </Label>
                <div className="mt-1.5 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2">
                  <code className="flex-1 truncate font-mono text-xs text-rose-900">
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
                <p className="mt-1.5 font-sans text-[11px] text-rose-600">
                  Store securely, shown once. Treat it like a password.
                </p>
              </div>
            )}

            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
              <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                Active API key (used by the console below)
              </Label>
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1.5 border-slate-300 bg-white font-mono text-xs"
                placeholder="aur_oracle-..."
              />
              <p className="mt-1 font-sans text-[11px] text-slate-500">
                Defaults to a deterministic demo key for {userEmail}. Replace
                with a real key for external use.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Query Console */}
        <Card className="border-indigo-200 bg-white">
          <CardHeader className="border-b border-indigo-100">
            <CardTitle className="flex items-center gap-2 font-serif text-base text-slate-900">
              <Play className="h-4 w-4 text-indigo-600" /> Query Console
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
              Query
            </Label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Summarise the constitutional capital-formation phases for a Tier C enterprise."
              className="mt-1.5 min-h-24 border-slate-300 bg-white text-sm"
              maxLength={4000}
            />
            <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-slate-400">
              <span>{query.length}/4000 chars</span>
              <span>5 EGP per query</span>
            </div>

            <Button
              onClick={runConsensus}
              disabled={running || query.trim().length < 3}
              className="mt-4 w-full bg-purple-600 text-white hover:bg-purple-700"
            >
              {running ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Satellite className="mr-2 h-4 w-4" />
              )}
              {running ? "Reaching consensus..." : "Run Consensus"}
            </Button>

            {result && (
              <div className="mt-4 space-y-3 rounded-md border border-indigo-200 bg-indigo-50/50 p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {result.modelsConsulted.split(",").map((m) => (
                    <Badge
                      key={m}
                      variant="outline"
                      className="border-indigo-300 bg-white font-mono text-[10px] text-indigo-700"
                    >
                      <Cpu className="mr-1 h-2.5 w-2.5" />
                      {m}
                    </Badge>
                  ))}
                  <span className="ml-auto inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" /> {result.responseTimeMs}ms
                  </span>
                </div>
                <div>
                  <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                    Verdict (JSON)
                  </Label>
                  <pre className="mt-1 max-h-48 overflow-y-auto rounded border border-slate-200 bg-white p-2 font-mono text-[11px] text-slate-800">
                    {prettyJson(result.verdict)}
                  </pre>
                </div>
                <div>
                  <Label className="font-sans text-[11px] uppercase tracking-wide text-slate-500">
                    Decision Token (Ed25519)
                  </Label>
                  <div className="mt-1 flex items-center gap-2 rounded border border-slate-200 bg-white px-2.5 py-1.5">
                    <code className="flex-1 truncate font-mono text-[11px] text-slate-700">
                      {shortHash(result.decisionToken, 24, 8)}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        copyText(result.decisionToken, "Decision token");
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 1500);
                      }}
                      className="h-7 border-indigo-300 bg-white px-2 text-[11px] text-indigo-700 hover:bg-indigo-50"
                    >
                      {copiedToken ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <Copy className="mr-1 h-3 w-3" />
                      )}
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-1.5 rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                  <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                  <p className="font-sans text-[11px] leading-relaxed text-amber-800">
                    {result.disclaimer}
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
            <Clock className="h-4 w-4 text-indigo-600" /> Query History
            <span className="ml-auto font-mono text-[11px] font-normal text-slate-500">
              {history.length} {isAurientaRep ? "(all — aurienta_rep)" : "(your queries)"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-[28rem] overflow-y-auto">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <Satellite className="h-10 w-10 text-indigo-300" />
                <p className="mt-3 font-serif text-base font-semibold text-slate-700">
                  No queries yet
                </p>
                <p className="mt-1 max-w-sm font-sans text-xs text-slate-500">
                  Run your first consensus query above. Each query is signed
                  with the platform Ed25519 key and persisted for audit.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-indigo-100">
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-500">Query</th>
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-500">Verdict</th>
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-500">Models</th>
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-500">Latency</th>
                    <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-500">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((h) => {
                    const summary = verdictSummary(h.verdict);
                    return (
                      <tr key={h.id} className="hover:bg-indigo-50/40">
                        <td className="max-w-xs px-4 py-3 font-sans text-xs text-slate-800">
                          <span className="line-clamp-2">{h.queryText}</span>
                          <span className="mt-0.5 block font-mono text-[10px] text-slate-400">
                            {shortHash(h.queryHash, 10, 4)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono text-[10px]",
                              summary.reached
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-rose-300 bg-rose-50 text-rose-700"
                            )}
                          >
                            {summary.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                          {h.modelsConsulted.split(",").length} model(s)
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                          {h.responseTimeMs}ms
                        </td>
                        <td className="px-4 py-3 font-sans text-[11px] text-slate-500">
                          {timeAgo(new Date(h.createdAt))}
                        </td>
                      </tr>
                    );
                  })}
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
        Every consensus query is signed with the platform Ed25519 key and
        persisted as an OracleQuery row for court-admissible audit. Per-query
        pricing is recorded at 5 EGP (uniform-fee schedule, Vol. 9 §9.4).
      </p>
    </div>
  );
}

function prettyJson(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}

function verdictSummary(verdict: string): { reached: boolean; status: string } {
  try {
    const parsed = JSON.parse(verdict) as { status?: string };
    const status = parsed.status ?? "unknown";
    return { reached: status === "consensus_reached", status };
  } catch {
    return { reached: false, status: "parse_error" };
  }
}
