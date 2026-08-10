import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  FOCC_VERSION, FOCC_FROZEN_AT,
  FOUNDER_OFFICE, ENTERPRISE_PMO, DECISION_RECORD_SCHEMA, DECISION_INTELLIGENCE,
  MISSION_CONTROL_PANELS, EXECUTIVE_BRIEFINGS, CORPORATE_INTELLIGENCE, INTELLIGENCE_ASSESSMENT,
  KNOWLEDGE_GRAPH_ENTITIES, KNOWLEDGE_GRAPH_PROPERTIES, EXECUTIVE_WORKFLOWS,
  INSTITUTIONAL_MEMORY, INSTITUTIONAL_MEMORY_PROPERTIES,
  CEO_PERFORMANCE_DASHBOARD, OVERALL_INSTITUTIONAL_HEALTH,
  COO_RECOMMENDATIONS_FO, EXECUTIVE_CERTIFICATION_FOCC, FOCC_SYNCHRONIZATION,
} from "@/lib/aurienta/founder-office";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crown, ClipboardList, GitBranch, Crosshair, FileText, Radar,
  Share2, Zap, Database, Gauge, Trophy, CheckCircle2, ShieldCheck, Brain,
  AlertCircle,
} from "lucide-react";

export const metadata = { title: "Founder Office · AURIENTA" };
export const dynamic = "force-dynamic";

const scoreColor = (s: number) =>
  s >= 80 ? "text-emerald-300" : s >= 70 ? "text-amber-300" : "text-rose-300";
const trendIcon = (t: string) =>
  t === "Up" ? "↑" : t === "Down" ? "↓" : "→";

export default async function FounderOfficePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/founder-office");

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-500" />
        <p className="text-xs text-amber-200/90">
          <span className="font-semibold">DEMONSTRATION:</span> This dashboard displays architectural reference data, not live enterprise data. No real metrics are shown.
        </p>
      </div>
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            Founder Office, Executive Intelligence & Corporate Command Center · FOCC v{FOCC_VERSION} · Frozen {FOCC_FROZEN_AT} · Executive Nervous System
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Founder Office & Command Center</h1>
        <p className="font-sans text-sm text-muted-foreground">
          {FOUNDER_OFFICE.length} Founder Office modules · {ENTERPRISE_PMO.length} PMO modules · {DECISION_RECORD_SCHEMA.length}-field decision schema · {MISSION_CONTROL_PANELS.length} Mission Control panels · {EXECUTIVE_BRIEFINGS.length} briefing types · {CORPORATE_INTELLIGENCE.length} intelligence domains · {KNOWLEDGE_GRAPH_ENTITIES.length} graph entities · {EXECUTIVE_WORKFLOWS.length} workflows · {INSTITUTIONAL_MEMORY.length} memory categories · {CEO_PERFORMANCE_DASHBOARD.length} performance dimensions
        </p>
      </header>

      {/* Executive Certification + Institutional Health Score */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-gold" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{EXECUTIVE_CERTIFICATION_FOCC.title}</p>
                <p className="font-serif text-xl font-semibold text-gold-gradient">{EXECUTIVE_CERTIFICATION_FOCC.verdict}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className={`font-serif text-3xl font-semibold ${scoreColor(OVERALL_INSTITUTIONAL_HEALTH)}`}>{OVERALL_INSTITUTIONAL_HEALTH}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Institutional Health /100</p>
              </div>
            </div>
          </div>
          <p className="mt-3 font-sans text-sm italic text-gold-gradient">{EXECUTIVE_CERTIFICATION_FOCC.conclusion}</p>
        </CardContent>
      </Card>

      {/* Part 10 — CEO Performance Dashboard (early, high visibility) */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Gauge className="h-4 w-4 text-gold" /> Part 10 · CEO Performance Dashboard ({CEO_PERFORMANCE_DASHBOARD.length} dimensions · Overall {OVERALL_INSTITUTIONAL_HEALTH}/100)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {CEO_PERFORMANCE_DASHBOARD.map(d => (
              <div key={d.dimensionId} className="rounded border border-gold/8 bg-background/30 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-medium">{d.dimension}</span>
                  <span className={`font-mono text-[10px] ${d.trend === "Up" ? "text-emerald-300" : d.trend === "Down" ? "text-rose-300" : "text-muted-foreground"}`}>{trendIcon(d.trend)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className={`font-serif text-lg font-semibold ${scoreColor(d.score)}`}>{d.score}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background/50">
                  <div className={`h-full ${d.score >= 80 ? "bg-emerald-400" : d.score >= 70 ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${d.score}%` }} />
                </div>
                <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">{d.source}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Part 4 — Mission Control (20 panels) */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Crosshair className="h-4 w-4 text-gold" /> Part 4 · Mission Control ({MISSION_CONTROL_PANELS.length} panels · unified Founder cockpit)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {MISSION_CONTROL_PANELS.map(p => (
              <div key={p.panelId} className="rounded border border-gold/10 bg-background/30 p-2">
                <p className="font-sans text-[11px] font-medium">{p.panel}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{p.source}</p>
                <p className="font-sans text-[10px] text-amber-300">Alert: {p.alertThreshold}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Part 1 — Founder Office + Part 2 — PMO */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Crown className="h-4 w-4 text-gold" /> Part 1 · Founder Office ({FOUNDER_OFFICE.length} modules)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto">
              {FOUNDER_OFFICE.map(m => (
                <div key={m.moduleId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{m.module}</span>
                    <span className="font-mono text-[10px] text-gold-light">{m.cadence}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{m.purpose}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><ClipboardList className="h-4 w-4 text-gold" /> Part 2 · Enterprise PMO ({ENTERPRISE_PMO.length} modules)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto">
              {ENTERPRISE_PMO.map(m => (
                <div key={m.moduleId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{m.module}</span>
                    <span className="font-mono text-[10px] text-gold-light">{m.cadence}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{m.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Part 3 — Decision Intelligence + Part 5 — Briefings */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><GitBranch className="h-4 w-4 text-gold" /> Part 3 · Executive Decision Intelligence ({DECISION_RECORD_SCHEMA.length} fields)</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground">{DECISION_INTELLIGENCE.principle}</p>
            <div className="mt-2 max-h-48 overflow-y-auto">
              {DECISION_RECORD_SCHEMA.map(f => (
                <div key={f.fieldId} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px]"><span className="font-mono text-[10px] text-gold-light">{f.fieldId}</span> {f.field}</span>
                  {f.required && <span className="font-mono text-[10px] text-rose-300">REQ</span>}
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground"><span className="text-gold-light">Brain AI:</span> {DECISION_INTELLIGENCE.brainAiRole}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><FileText className="h-4 w-4 text-gold" /> Part 5 · Executive Briefings ({EXECUTIVE_BRIEFINGS.length} types · Brain AI auto-prepares)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {EXECUTIVE_BRIEFINGS.map(b => (
                <div key={b.briefingId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{b.briefing}</span>
                    <span className="font-mono text-[10px] text-gold-light">{b.cadence}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{b.contents}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Part 6 — Corporate Intelligence + Part 7 — Knowledge Graph */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Radar className="h-4 w-4 text-gold" /> Part 6 · Corporate Intelligence ({CORPORATE_INTELLIGENCE.length} domains)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {CORPORATE_INTELLIGENCE.map(d => (
                <div key={d.domainId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{d.domain}</span>
                    <span className="font-mono text-[10px] text-gold-light">{d.cadence}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{d.monitored}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground"><span className="text-gold-light">Per item:</span> {INTELLIGENCE_ASSESSMENT.perItem}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Share2 className="h-4 w-4 text-gold" /> Part 7 · Executive Knowledge Graph ({KNOWLEDGE_GRAPH_ENTITIES.length} entity types)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {KNOWLEDGE_GRAPH_ENTITIES.map(e => (
                <div key={e.entityId} className="border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px] font-medium">{e.entityType}</span>
                  <p className="font-sans text-[10px] text-muted-foreground">→ {e.connectsTo}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground"><span className="text-gold-light">Brain AI:</span> {KNOWLEDGE_GRAPH_PROPERTIES.brainAiRole}</p>
          </CardContent>
        </Card>
      </div>

      {/* Part 8 — Workflow Automation + Part 9 — Institutional Memory */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Zap className="h-4 w-4 text-gold" /> Part 8 · Executive Workflow Automation ({EXECUTIVE_WORKFLOWS.length} workflows)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {EXECUTIVE_WORKFLOWS.map(w => (
                <div key={w.workflowId} className="border-b border-gold/5 py-1">
                  <span className="font-sans text-[11px] font-medium">{w.workflow}</span>
                  <p className="font-sans text-[10px] text-muted-foreground">Trigger: {w.trigger}</p>
                  <p className="font-sans text-[10px] text-emerald-300">→ {w.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Database className="h-4 w-4 text-gold" /> Part 9 · Institutional Memory ({INSTITUTIONAL_MEMORY.length} categories)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {INSTITUTIONAL_MEMORY.map(m => (
                <div key={m.categoryId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{m.category}</span>
                    <span className="font-mono text-[10px] text-gold-light">{m.retention}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{m.example}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground"><span className="text-gold-light">Brain AI:</span> {INSTITUTIONAL_MEMORY_PROPERTIES.brainAiRole}</p>
          </CardContent>
        </Card>
      </div>

      {/* COO Recommendations */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Brain className="h-4 w-4 text-gold" /> COO Additional Recommendations ({COO_RECOMMENDATIONS_FO.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {COO_RECOMMENDATIONS_FO.map(r => (
              <div key={r.recId} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-sans text-[11px] font-medium"><span className="font-mono text-[10px] text-gold-light">{r.recId}</span> {r.name}</p>
                <p className="font-sans text-[10px] text-muted-foreground">{r.purpose}</p>
                <p className="font-sans text-[10px] text-muted-foreground">{r.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Executive Certification full */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" />
            <p className="font-serif text-lg font-semibold text-gold-gradient">{EXECUTIVE_CERTIFICATION_FOCC.title}</p>
          </div>
          <p className="mt-2 font-sans text-sm text-muted-foreground">{EXECUTIVE_CERTIFICATION_FOCC.statement}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {EXECUTIVE_CERTIFICATION_FOCC.criteria.map(c => (
              <div key={c} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-sans text-[11px]"><CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-300" />{c}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 font-serif text-sm italic text-gold-gradient">{EXECUTIVE_CERTIFICATION_FOCC.conclusion}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-gold/30 font-mono text-xs text-gold">{EXECUTIVE_CERTIFICATION_FOCC.verdict}</Badge>
            <span className="font-mono text-[11px] text-muted-foreground">Certified by: {EXECUTIVE_CERTIFICATION_FOCC.certifiedBy} · {EXECUTIVE_CERTIFICATION_FOCC.certifiedAt}</span>
          </div>
        </CardContent>
      </Card>

      {/* Synchronization */}
      <Card className="border-gold/12 glass">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <p className="font-serif text-base font-semibold text-gold-gradient">FOCC v{FOCC_VERSION} Synchronization</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(FOCC_SYNCHRONIZATION).map(([k, v]) => (
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
