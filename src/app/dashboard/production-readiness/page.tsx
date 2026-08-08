import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  PH_VERSION, PH_FROZEN_AT,
  WS1_DATABASE, WS2_SECURITY, WS3_DEVSECOPS, WS4_OBSERVABILITY, WS5_IDENTITY,
  WS6_QUALITY, WS7_PERFORMANCE, WS8_OPS, WS9_COMPLIANCE, WS10_DOCS, WS11_PILOT, WS12_TECH_DEBT,
  WORKSTREAM_SCORES, OVERALL_READINESS_SCORE, OVERALL_READINESS_TARGET,
  PRODUCTION_READINESS_REPORT, ENTERPRISE_SECURITY_REPORT, PERFORMANCE_BENCHMARK,
  SOC2_READINESS, ISO27001_READINESS, GO_LIVE_CHECKLIST, REMAINING_GAPS,
  EXECUTIVE_CERTIFICATION_PH, ROADMAP_FORWARD, PH_SYNCHRONIZATION,
} from "@/lib/aurienta/production-readiness";
import type { ReadinessStatus } from "@/lib/aurienta/production-readiness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database, ShieldCheck, GitBranch, Activity, KeyRound, TestTube2,
  Gauge, Settings, FileCheck, BookOpen, Rocket, Trash2,
  Trophy, AlertTriangle, CheckCircle2, TrendingUp, FileText, ShieldAlert,
} from "lucide-react";

export const metadata = { title: "Production Readiness · AURIENTA" };
export const dynamic = "force-dynamic";

const statusBadge = (s: ReadinessStatus) => {
  const map = {
    PASS: { cls: "border-emerald-400/30 text-emerald-300", label: "PASS" },
    PARTIAL: { cls: "border-amber-400/30 text-amber-300", label: "PARTIAL" },
    PENDING: { cls: "border-sky-400/30 text-sky-300", label: "PENDING" },
    BLOCKED: { cls: "border-rose-400/30 text-rose-300", label: "BLOCKED" },
  } as const;
  const m = map[s];
  return <Badge variant="outline" className={`font-mono text-[10px] ${m.cls}`}>{m.label}</Badge>;
};

const scoreColor = (s: number, t: number) =>
  s >= t ? "text-emerald-300" : s >= t - 15 ? "text-amber-300" : "text-rose-300";

const WS_META = [
  { icon: Database, items: WS1_DATABASE, title: "WS1 · Database Modernization" },
  { icon: ShieldCheck, items: WS2_SECURITY, title: "WS2 · Security Hardening" },
  { icon: GitBranch, items: WS3_DEVSECOPS, title: "WS3 · DevSecOps (CI/CD)" },
  { icon: Activity, items: WS4_OBSERVABILITY, title: "WS4 · Observability" },
  { icon: KeyRound, items: WS5_IDENTITY, title: "WS5 · Enterprise Identity" },
  { icon: TestTube2, items: WS6_QUALITY, title: "WS6 · Quality Engineering" },
  { icon: Gauge, items: WS7_PERFORMANCE, title: "WS7 · Performance" },
  { icon: Settings, items: WS8_OPS, title: "WS8 · Enterprise Operations" },
  { icon: FileCheck, items: WS9_COMPLIANCE, title: "WS9 · Compliance Evidence" },
  { icon: BookOpen, items: WS10_DOCS, title: "WS10 · Documentation" },
  { icon: Rocket, items: WS11_PILOT, title: "WS11 · Pilot Readiness" },
  { icon: Trash2, items: WS12_TECH_DEBT, title: "WS12 · Technical Debt" },
];

export default async function ProductionReadinessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/production-readiness");

  const glPass = GO_LIVE_CHECKLIST.filter(g => g.status === "PASS").length;
  const glPartial = GO_LIVE_CHECKLIST.filter(g => g.status === "PARTIAL").length;
  const glPending = GO_LIVE_CHECKLIST.filter(g => g.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            Production Hardening & Enterprise Readiness · PH v{PH_VERSION} · Frozen {PH_FROZEN_AT} · Evidence, Not Architecture
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Production Readiness</h1>
        <p className="font-sans text-sm text-muted-foreground">
          12 workstreams · {WORKSTREAM_SCORES.reduce((s, w) => s + w.total, 0)} items · {GO_LIVE_CHECKLIST.length}-item go-live checklist · SOC 2 + ISO 27001 readiness · {REMAINING_GAPS.length} external gaps
        </p>
      </header>

      {/* Executive Certification banner */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-gold" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{EXECUTIVE_CERTIFICATION_PH.title}</p>
                <p className="font-serif text-xl font-semibold text-gold-gradient">{EXECUTIVE_CERTIFICATION_PH.verdict}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className={`font-serif text-2xl font-semibold ${scoreColor(OVERALL_READINESS_SCORE, OVERALL_READINESS_TARGET)}`}>{OVERALL_READINESS_SCORE}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Overall /100</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className={`font-serif text-2xl font-semibold ${scoreColor(SOC2_READINESS.overallScore, 85)}`}>{SOC2_READINESS.overallScore}</p>
                <p className="font-mono text-[10px] text-muted-foreground">SOC 2</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className={`font-serif text-2xl font-semibold ${scoreColor(ISO27001_READINESS.overallScore, 85)}`}>{ISO27001_READINESS.overallScore}</p>
                <p className="font-mono text-[10px] text-muted-foreground">ISO 27001</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-2xl font-semibold text-emerald-300">{ENTERPRISE_SECURITY_REPORT.criticalFindings}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Critical findings</p>
              </div>
            </div>
          </div>
          <p className="mt-3 font-sans text-sm italic text-gold-gradient">{EXECUTIVE_CERTIFICATION_PH.conclusion}</p>
        </CardContent>
      </Card>

      {/* Workstream scores grid */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <TrendingUp className="h-4 w-4 text-gold" /> Workstream Readiness Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {WORKSTREAM_SCORES.map(w => (
              <div key={w.workstream} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-sans text-[11px] font-medium">{w.workstream}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className={`font-serif text-lg font-semibold ${scoreColor(w.score, w.target)}`}>{w.score}<span className="text-xs text-muted-foreground">/{w.target}</span></span>
                  <span className="font-mono text-[10px] text-muted-foreground">{w.pass}P · {w.partial}p · {w.pending}○</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background/50">
                  <div className={`h-full ${w.score >= w.target ? "bg-emerald-400" : w.score >= w.target - 15 ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${w.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workstream item tables (2 per row) */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {WS_META.map(({ icon: Icon, items, title }) => (
          <Card key={title} className="border-gold/12 glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-sm">
                <Icon className="h-4 w-4 text-gold" /> {title} ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={item.itemId} className="flex items-start justify-between border-b border-gold/5 py-1.5">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-sans text-[11px]"><span className="font-mono text-[10px] text-gold-light">{item.itemId}</span> {item.item}</p>
                      {"notes" in item && item.notes && <p className="font-sans text-[10px] text-muted-foreground">{item.notes}</p>}
                    </div>
                    {statusBadge(item.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Final Reports row */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Production Readiness Report */}
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><CheckCircle2 className="h-4 w-4 text-gold" /> Production Readiness Report</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground">{PRODUCTION_READINESS_REPORT.summary}</p>
            <p className="mt-2 font-mono text-[10px] uppercase text-emerald-300">Strengths</p>
            <ul className="mb-2 flex flex-col gap-0.5">{PRODUCTION_READINESS_REPORT.strengths.map(s => <li key={s} className="font-sans text-[10px] text-muted-foreground">• {s}</li>)}</ul>
            <p className="font-mono text-[10px] uppercase text-amber-300">Critical Gaps</p>
            <ul className="flex flex-col gap-0.5">{PRODUCTION_READINESS_REPORT.criticalGaps.map(g => <li key={g} className="font-sans text-[10px] text-muted-foreground">• {g}</li>)}</ul>
          </CardContent>
        </Card>

        {/* Enterprise Security Report */}
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><ShieldAlert className="h-4 w-4 text-gold" /> Enterprise Security Report</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground">Posture: <span className="text-emerald-300">{ENTERPRISE_SECURITY_REPORT.posture}</span></p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded border border-rose-400/20 bg-background/30 p-1.5"><p className="font-serif text-lg font-semibold text-rose-300">{ENTERPRISE_SECURITY_REPORT.criticalFindings}</p><p className="font-mono text-[9px] text-muted-foreground">Critical</p></div>
              <div className="rounded border border-amber-400/20 bg-background/30 p-1.5"><p className="font-serif text-lg font-semibold text-amber-300">{ENTERPRISE_SECURITY_REPORT.highFindings}</p><p className="font-mono text-[9px] text-muted-foreground">High</p></div>
              <div className="rounded border border-sky-400/20 bg-background/30 p-1.5"><p className="font-serif text-lg font-semibold text-sky-300">{ENTERPRISE_SECURITY_REPORT.mediumFindings}</p><p className="font-mono text-[9px] text-muted-foreground">Medium</p></div>
            </div>
            <p className="mt-2 mb-1 font-mono text-[10px] uppercase text-gold-light">Control Domains</p>
            <div className="max-h-32 overflow-y-auto">
              {ENTERPRISE_SECURITY_REPORT.controlDomains.map(d => (
                <div key={d.domain} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[10px]">{d.domain}</span>
                  <span className={`font-mono text-[10px] ${scoreColor(d.score, 85)}`}>{d.score}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance + SOC2 + ISO27001 */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><Gauge className="h-4 w-4 text-gold" /> Performance Benchmark</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-1 font-mono text-[10px] uppercase text-gold-light">Core Web Vitals</p>
            <div className="flex items-center justify-between border-b border-gold/5 py-0.5"><span className="font-sans text-[10px]">LCP</span><span className="font-mono text-[10px] text-muted-foreground">{PERFORMANCE_BENCHMARK.coreWebVitals.LCP.current}</span></div>
            <div className="flex items-center justify-between border-b border-gold/5 py-0.5"><span className="font-sans text-[10px]">FID</span><span className="font-mono text-[10px] text-muted-foreground">{PERFORMANCE_BENCHMARK.coreWebVitals.FID.current}</span></div>
            <div className="flex items-center justify-between border-b border-gold/5 py-0.5"><span className="font-sans text-[10px]">CLS</span><span className="font-mono text-[10px] text-muted-foreground">{PERFORMANCE_BENCHMARK.coreWebVitals.CLS.current}</span></div>
            <p className="mt-2 mb-1 font-mono text-[10px] uppercase text-gold-light">API Latency (P95)</p>
            <div className="flex items-center justify-between border-b border-gold/5 py-0.5"><span className="font-sans text-[10px]">Read</span><span className="font-mono text-[10px] text-emerald-300">{PERFORMANCE_BENCHMARK.apiLatency.readP95.current}</span></div>
            <div className="flex items-center justify-between border-b border-gold/5 py-0.5"><span className="font-sans text-[10px]">Write</span><span className="font-mono text-[10px] text-emerald-300">{PERFORMANCE_BENCHMARK.apiLatency.writeP95.current}</span></div>
            <div className="flex items-center justify-between border-b border-gold/5 py-0.5"><span className="font-sans text-[10px]">CRE</span><span className="font-mono text-[10px] text-emerald-300">{PERFORMANCE_BENCHMARK.apiLatency.creEnforce.current}</span></div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><FileCheck className="h-4 w-4 text-gold" /> SOC 2 Readiness · {SOC2_READINESS.overallScore}/100</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-emerald-300">{SOC2_READINESS.verdict}</p>
            <p className="font-mono text-[10px] text-gold-light">Target: {SOC2_READINESS.targetAuditDate}</p>
            <div className="mt-1 max-h-40 overflow-y-auto">
              {SOC2_READINESS.trustServicesCriteria.map(c => (
                <div key={c.criteria} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[10px]">{c.criteria}</span>
                  <span className={`font-mono text-[10px] ${scoreColor(c.score, 85)}`}>{c.score}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><FileCheck className="h-4 w-4 text-gold" /> ISO 27001 Readiness · {ISO27001_READINESS.overallScore}/100</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-emerald-300">{ISO27001_READINESS.verdict}</p>
            <p className="font-mono text-[10px] text-gold-light">Target: {ISO27001_READINESS.targetCertificationDate}</p>
            <div className="mt-1 max-h-40 overflow-y-auto">
              {ISO27001_READINESS.annexAControls.map(c => (
                <div key={c.control} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[10px]">{c.control}</span>
                  <span className={`font-mono text-[10px] ${scoreColor(c.score, 85)}`}>{c.score}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Go-Live Checklist */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <CheckCircle2 className="h-4 w-4 text-gold" /> Production Go-Live Checklist ({GO_LIVE_CHECKLIST.length} items · {glPass} PASS · {glPartial} PARTIAL · {glPending} PENDING)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-gold/15">
                  <th className="pb-2 pr-3 font-medium">ID</th><th className="pb-2 pr-3 font-medium">Category</th>
                  <th className="pb-2 pr-3 font-medium">Item</th><th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 font-medium">Required</th>
                </tr>
              </thead>
              <tbody>
                {GO_LIVE_CHECKLIST.map(g => (
                  <tr key={g.itemId} className="border-b border-gold/5">
                    <td className="py-1.5 pr-3 font-mono text-gold-light">{g.itemId}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{g.category}</td>
                    <td className="py-1.5 pr-3">{g.item}</td>
                    <td className="py-1.5 pr-3">{statusBadge(g.status)}</td>
                    <td className="py-1.5">{g.required ? <span className="text-rose-300">Yes</span> : <span className="text-muted-foreground">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Remaining Gaps + Roadmap */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><AlertTriangle className="h-4 w-4 text-gold" /> Remaining Gap Analysis ({REMAINING_GAPS.length} — all external)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto">
              {REMAINING_GAPS.map(g => (
                <div key={g.gap} className="border-b border-gold/5 py-1.5">
                  <p className="font-sans text-[11px] font-medium">{g.gap}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{g.type} · Owner: {g.owner} · Blocks: {g.blocks}</p>
                  <p className="font-sans text-[10px] text-emerald-300">→ {g.resolution}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><TrendingUp className="h-4 w-4 text-gold" /> Roadmap Forward (COO sequence)</CardTitle></CardHeader>
          <CardContent>
            {ROADMAP_FORWARD.map((r, i) => (
              <div key={r.phase} className="border-b border-gold/5 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-medium">{r.phase}</span>
                  <Badge variant="outline" className={`font-mono text-[10px] ${r.status.includes("COMPLETE") ? "border-emerald-400/30 text-emerald-300" : r.status === "NEXT" ? "border-gold/30 text-gold" : "border-sky-400/30 text-sky-300"}`}>{r.status}</Badge>
                </div>
                <p className="font-sans text-[10px] text-muted-foreground">{r.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Executive Certification full */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" />
            <p className="font-serif text-lg font-semibold text-gold-gradient">{EXECUTIVE_CERTIFICATION_PH.title}</p>
          </div>
          <p className="mt-2 font-sans text-sm text-muted-foreground">{EXECUTIVE_CERTIFICATION_PH.statement}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {EXECUTIVE_CERTIFICATION_PH.criteria.map(c => (
              <div key={c} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-sans text-[11px]"><CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-300" />{c}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 font-serif text-sm italic text-gold-gradient">{EXECUTIVE_CERTIFICATION_PH.conclusion}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-gold/30 font-mono text-xs text-gold">{EXECUTIVE_CERTIFICATION_PH.verdict}</Badge>
            <span className="font-mono text-[11px] text-muted-foreground">Certified by: {EXECUTIVE_CERTIFICATION_PH.certifiedBy} · {EXECUTIVE_CERTIFICATION_PH.certifiedAt}</span>
          </div>
        </CardContent>
      </Card>

      {/* Synchronization */}
      <Card className="border-gold/12 glass">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <p className="font-serif text-base font-semibold text-gold-gradient">PH v{PH_VERSION} Synchronization</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(PH_SYNCHRONIZATION).map(([k, v]) => (
              <div key={k} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-mono text-[10px] uppercase text-gold-light">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                <p className="font-sans text-[11px] text-muted-foreground">{v}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
