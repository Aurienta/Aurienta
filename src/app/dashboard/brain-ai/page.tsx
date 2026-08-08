import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { Brain, Cpu, Zap, Database, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Brain AI · AURIENTA" };
export const dynamic = "force-dynamic";

export default async function BrainAiPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/brain-ai");

  // Fetch AI artifacts (Brain memory) — the training data
  const [totalArtifacts, artifactsByKind, recentArtifacts, providerStats] = await Promise.all([
    db.aiArtifact.count(),
    db.aiArtifact.groupBy({ by: ["kind"], _count: true, orderBy: { _count: { kind: "desc" } } }),
    db.aiArtifact.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, kind: true, content: true, payload: true, confidence: true, createdAt: true },
    }),
    db.aiArtifact.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      select: { payload: true },
    }),
  ]);

  // Parse provider stats from artifact payloads
  const providerCounts: Record<string, number> = {};
  providerStats.forEach((a) => {
    try {
      const p = JSON.parse(a.payload);
      const provider = p.provider ?? "unknown";
      providerCounts[provider] = (providerCounts[provider] ?? 0) + 1;
    } catch {}
  });

  // The 5 configured providers
  const PROVIDERS = [
    { name: "Google Gemini", key: "gemini", model: "gemini-1.5-flash", task: "Complex reasoning, feasibility, analysis", color: "#4285f4" },
    { name: "OpenAI GPT-4", key: "openai", model: "gpt-4o-mini", task: "Conversational copilot, explanations", color: "#10a37f" },
    { name: "Groq Llama 3.2", key: "groq", model: "llama-3.3-70b-versatile", task: "Low-latency: fraud, anomaly, triage", color: "#f55036" },
    { name: "HuggingFace Mixtral", key: "huggingface", model: "mixtral-8x7b-instruct", task: "Sanity check, consistency review", color: "#ff9d00" },
    { name: "OpenRouter", key: "openrouter", model: "llama-3.3-70b-instruct", task: "Multi-model gateway fallback", color: "#8b5cf6" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            AURIENTA Brain AI — Multi-Model Orchestration
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">The Constitutional Brain</h1>
        <p className="font-sans text-sm text-muted-foreground">
          6 AI providers · 18 AI endpoints · {totalArtifacts} persisted memory artifacts · task-specific routing with automatic fallback
        </p>
      </header>

      {/* Brain status summary */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="border-gold/12 glass-gold">
          <CardContent className="flex items-center gap-3 p-4">
            <Cpu className="h-5 w-5 text-gold/70" />
            <div>
              <p className="font-serif text-2xl font-semibold">6</p>
              <p className="font-sans text-[11px] text-muted-foreground">AI Providers Configured</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gold/12 glass-gold">
          <CardContent className="flex items-center gap-3 p-4">
            <Zap className="h-5 w-5 text-gold/70" />
            <div>
              <p className="font-serif text-2xl font-semibold">18</p>
              <p className="font-sans text-[11px] text-muted-foreground">AI Orchestration Endpoints</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gold/12 glass-gold">
          <CardContent className="flex items-center gap-3 p-4">
            <Database className="h-5 w-5 text-gold/70" />
            <div>
              <p className="font-serif text-2xl font-semibold">{totalArtifacts}</p>
              <p className="font-sans text-[11px] text-muted-foreground">Brain Memory Artifacts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider registry */}
      <Card className="mb-6 border-gold/15 glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <Cpu className="h-4 w-4 text-gold" /> Multi-Model Provider Registry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROVIDERS.map((p) => {
              const calls = providerCounts[p.key] ?? 0;
              const isSandboxPrimary = false;
              return (
                <div key={p.key} className="rounded-lg border border-gold/10 bg-background/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="font-serif text-sm font-semibold text-foreground">{p.name}</span>
                    </div>
                    {isSandboxPrimary && (
                      <Badge variant="outline" className="border-gold/30 bg-gold/10 font-mono text-[11px] text-gold-light">
                        SANDBOX PRIMARY
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{p.model}</p>
                  <p className="mt-1 font-sans text-[11px] text-muted-foreground">{p.task}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="border-gold/15 font-mono text-[11px]">
                      {calls} calls
                    </Badge>
                    {calls > 0 ? (
                      <span className="flex items-center gap-1 font-sans text-[11px] text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-sans text-[11px] text-muted-foreground">
                        <XCircle className="h-3 w-3" /> Standby
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Task routing table */}
      <Card className="mb-6 border-gold/12 glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <Zap className="h-4 w-4 text-gold" /> Task-Specific Routing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gold/10">
                  <th className="pb-2 pr-4 font-mono text-[11px] uppercase text-muted-foreground">Task</th>
                  <th className="pb-2 font-mono text-[11px] uppercase text-muted-foreground">Provider Chain (sandbox → production)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Feasibility Engine", "zai → gemini → openai"],
                  ["Pitch Deck Generator", "zai → gemini → openai"],
                  ["Copilot (conversational)", "zai → openai → gemini"],
                  ["Anomaly Narration", "zai → groq → openai"],
                  ["Fraud Detection", "zai → groq"],
                  ["Sanity Check", "zai → huggingface → groq"],
                  ["Notification Triage", "zai → groq → openai"],
                  ["Multilingual", "zai → openai → gemini"],
                  ["Advisory (tax/IR)", "zai → gemini → openai"],
                ].map(([task, chain]) => (
                  <tr key={task} className="border-b border-gold/5">
                    <td className="py-2 pr-4 font-sans text-xs text-foreground">{task}</td>
                    <td className="py-2 font-mono text-[11px] text-gold-light">{chain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-sans text-[11px] text-muted-foreground">
            In production (supported regions), the external providers take priority for better quality. In sandbox, z-ai is primary because external APIs are geo-restricted. The router automatically falls back to the next provider on failure.
          </p>
        </CardContent>
      </Card>

      {/* Brain memory (training artifacts) */}
      <Card className="mb-6 border-gold/12 glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <Database className="h-4 w-4 text-gold" /> Brain Memory — Training Artifacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {artifactsByKind.map((a) => (
              <div key={a.kind} className="rounded border border-gold/8 bg-background/30 p-2.5 text-center">
                <p className="font-serif text-lg font-semibold text-foreground">{a._count}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{a.kind}</p>
              </div>
            ))}
          </div>
          <p className="mb-3 font-sans text-[11px] uppercase tracking-wider text-muted-foreground">Recent interactions (last 10)</p>
          <div className="max-h-72 overflow-y-auto">
            {recentArtifacts.map((a) => {
              let provider = "unknown", model = "unknown", fellBack = false;
              try {
                const p = JSON.parse(a.payload);
                provider = p.provider ?? "unknown";
                model = p.model ?? "unknown";
                fellBack = p.fellBack ?? false;
              } catch {}
              return (
                <div key={a.id} className="flex items-center justify-between border-b border-gold/5 py-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-gold/20 font-mono text-[11px] text-gold-light">{a.kind}</Badge>
                    <span className="font-mono text-[11px] text-muted-foreground">{provider} / {model}</span>
                    {fellBack && <Badge variant="outline" className="border-amber-400/30 font-mono text-[11px] text-amber-300">fallback</Badge>}
                  </div>
                  <span className="font-sans text-[11px] text-muted-foreground">{new Date(a.createdAt).toLocaleString("en-GB")}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-center font-sans text-[11px] text-muted-foreground">
        Every AI interaction is persisted with full prompt + response + provider + model + tokens for audit trail and future fine-tuning.
      </p>
    </div>
  );
}
