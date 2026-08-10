import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  PE_VERSION, PE_FROZEN_AT,
  PILOT_PMO, PILOT_SELECTION_CRITERIA, PILOT_SELECTION_MODEL,
  ONBOARDING_FACTORY, ONBOARDING_METRICS, PILOT_SUCCESS_KPIS,
  CUSTOMER_SUCCESS_OPS, FEEDBACK_CHANNELS, FEEDBACK_LOOP,
  STRATEGIC_PARTNER_EXECUTION, REGULATORY_ENGAGEMENT, REGULATOR_RELATIONSHIP_DASHBOARD,
  EVIDENCE_REPOSITORY, EVIDENCE_PROPERTIES, PILOT_MISSION_CONTROL,
  PILOT_COMPLETION_CRITERIA, PILOT_COMPLETION_RULE,
  READINESS_REASSESSMENT, PILOT_EXECUTION_REPORT, PILOT_SUCCESS_FRAMEWORK,
  CUSTOMER_SUCCESS_REPORT, STRATEGIC_PARTNERSHIP_REPORT, REGULATORY_ENGAGEMENT_REPORT,
  INSTITUTIONAL_EVIDENCE_REPORT, LESSONS_LEARNED_REPORT, EXECUTIVE_READINESS_ASSESSMENT,
  UPDATED_READINESS_SCORE, EXECUTIVE_CERTIFICATION_PE, COO_ROADMAP_EXECUTION, PE_SYNCHRONIZATION,
} from "@/lib/aurienta/pilot-execution";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList, Target, Factory, BarChart3, HeartHandshake, RefreshCw,
  Handshake, Landmark, Archive, Crosshair, CheckCircle2, TrendingUp,
  Trophy, FileText, ShieldCheck, Rocket,
  AlertCircle,
} from "lucide-react";

export const metadata = { title: "Pilot Execution · AURIENTA" };
export const dynamic = "force-dynamic";

const scoreColor = (s: number, t: number) =>
  s >= t ? "text-emerald-300" : s >= t - 10 ? "text-amber-300" : "text-rose-300";

export default async function PilotExecutionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/pilot-execution");

  const r = READINESS_REASSESSMENT.find(x => x.dimension === "Overall readiness")!;

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
          <Rocket className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            Pilot Deployment, Validation & Institutional Evidence · PE v{PE_VERSION} · Frozen {PE_FROZEN_AT} · From Building to Proving
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Pilot Execution & Validation</h1>
        <p className="font-sans text-sm text-muted-foreground">
          {PILOT_PMO.length} PMO functions · {PILOT_SELECTION_CRITERIA.length} selection criteria · {ONBOARDING_FACTORY.length} onboarding steps · {PILOT_SUCCESS_KPIS.length} pilot KPIs · {CUSTOMER_SUCCESS_OPS.length} CS operations · {FEEDBACK_CHANNELS.length} feedback channels · {STRATEGIC_PARTNER_EXECUTION.length} partner types · {REGULATORY_ENGAGEMENT.length} regulator engagements · {EVIDENCE_REPOSITORY.length} evidence types · {PILOT_COMPLETION_CRITERIA.length} completion criteria
        </p>
      </header>

      {/* Executive Certification + Readiness trajectory */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-gold" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{EXECUTIVE_CERTIFICATION_PE.title}</p>
                <p className="font-serif text-xl font-semibold text-gold-gradient">{EXECUTIVE_CERTIFICATION_PE.verdict}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded border border-rose-400/20 bg-background/30 p-2 text-center">
                <p className="font-serif text-2xl font-semibold text-rose-300">{r.beforePilot}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Before pilot</p>
              </div>
              <div className="rounded border border-amber-400/20 bg-background/30 p-2 text-center">
                <p className="font-serif text-2xl font-semibold text-amber-300">{r.duringPilot}</p>
                <p className="font-mono text-[10px] text-muted-foreground">During pilot</p>
              </div>
              <div className="rounded border border-emerald-400/20 bg-background/30 p-2 text-center">
                <p className={`font-serif text-2xl font-semibold ${scoreColor(r.afterPilot, 90)}`}>{r.afterPilot}</p>
                <p className="font-mono text-[10px] text-muted-foreground">After pilot → {90} target</p>
              </div>
            </div>
          </div>
          <p className="mt-3 font-sans text-sm italic text-gold-gradient">{EXECUTIVE_CERTIFICATION_PE.conclusion}</p>
        </CardContent>
      </Card>

      {/* WS1 — Pilot PMO + WS2 — Selection Framework */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><ClipboardList className="h-4 w-4 text-gold" /> WS1 · Pilot PMO ({PILOT_PMO.length} functions)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto">
              {PILOT_PMO.map(p => (
                <div key={p.functionId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{p.function}</span>
                    <span className="font-mono text-[10px] text-gold-light">{p.cadence}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{p.owner} · {p.output}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Target className="h-4 w-4 text-gold" /> WS2 · Pilot Selection ({PILOT_SELECTION_CRITERIA.length} criteria · threshold {PILOT_SELECTION_MODEL.threshold})</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto">
              {PILOT_SELECTION_CRITERIA.map(c => (
                <div key={c.criterionId} className="flex items-center justify-between border-b border-gold/5 py-1">
                  <div>
                    <span className="font-sans text-[11px]"><span className="font-mono text-[10px] text-gold-light">{c.criterionId}</span> {c.criterion}</span>
                    <p className="font-sans text-[10px] text-muted-foreground">{c.scoringGuide}</p>
                  </div>
                  <Badge variant="outline" className="border-gold/20 font-mono text-[10px]">w={c.weight}</Badge>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[11px] text-muted-foreground">{PILOT_SELECTION_MODEL.method}</p>
          </CardContent>
        </Card>
      </div>

      {/* WS3 — Onboarding Factory + WS4 — Pilot KPIs */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Factory className="h-4 w-4 text-gold" /> WS3 · Onboarding Factory ({ONBOARDING_FACTORY.length} steps · target {ONBOARDING_METRICS.totalDurationTarget})</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {ONBOARDING_FACTORY.map(o => (
                <div key={o.stepId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px]"><span className="font-mono text-[10px] text-gold-light">{o.stepId}</span> {o.step}</span>
                    <span className="font-mono text-[10px] text-gold">{o.durationTarget}</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{o.owner} · {o.exitCriteria}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[11px] text-emerald-300">Success rate target: {ONBOARDING_METRICS.successRateTarget}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><BarChart3 className="h-4 w-4 text-gold" /> WS4 · Pilot Success KPIs ({PILOT_SUCCESS_KPIS.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {PILOT_SUCCESS_KPIS.map(k => (
                <div key={k.kpiId} className="flex items-center justify-between border-b border-gold/5 py-1">
                  <div>
                    <span className="font-sans text-[11px]"><span className="font-mono text-[10px] text-gold-light">{k.kpiId}</span> {k.kpi}</span>
                    <p className="font-sans text-[10px] text-muted-foreground">{k.measurement}</p>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-300">{k.target}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WS5 — CS Ops + WS6 — Feedback */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><HeartHandshake className="h-4 w-4 text-gold" /> WS5 · Customer Success Operations ({CUSTOMER_SUCCESS_OPS.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {CUSTOMER_SUCCESS_OPS.map(c => (
                <div key={c.opId} className="flex items-center justify-between border-b border-gold/5 py-1">
                  <div>
                    <span className="font-sans text-[11px] font-medium">{c.operation}</span>
                    <p className="font-sans text-[10px] text-muted-foreground">{c.owner}</p>
                  </div>
                  <span className="font-mono text-[10px] text-gold-light">{c.cadence}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><RefreshCw className="h-4 w-4 text-gold" /> WS6 · Feedback & Continuous Improvement ({FEEDBACK_CHANNELS.length} channels)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {FEEDBACK_CHANNELS.map(f => (
                <div key={f.channelId} className="flex items-center justify-between border-b border-gold/5 py-1">
                  <span className="font-sans text-[11px]"><span className="font-mono text-[10px] text-gold-light">{f.channelId}</span> {f.channel}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{f.triage}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Loop:</span> {FEEDBACK_LOOP.process}</p>
            <p className="font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">SLA:</span> {FEEDBACK_LOOP.sla}</p>
          </CardContent>
        </Card>
      </div>

      {/* WS7 — Partner Execution + WS8 — Regulatory */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Handshake className="h-4 w-4 text-gold" /> WS7 · Strategic Partner Execution ({STRATEGIC_PARTNER_EXECUTION.length} types)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {STRATEGIC_PARTNER_EXECUTION.map(p => (
                <div key={p.partnerId} className="border-b border-gold/5 py-1">
                  <p className="font-sans text-[11px] font-medium">{p.partnerType}</p>
                  <p className="font-sans text-[10px] text-muted-foreground">SLA: {p.sla}</p>
                  <p className="font-sans text-[10px] text-muted-foreground">KPIs: {p.kpis}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Landmark className="h-4 w-4 text-gold" /> WS8 · Regulatory Engagement ({REGULATORY_ENGAGEMENT.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {REGULATORY_ENGAGEMENT.map(g => (
                <div key={g.engId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{g.regulator}</span>
                    <Badge variant="outline" className={`font-mono text-[10px] ${g.status === "PASS" ? "border-emerald-400/30 text-emerald-300" : g.status === "PARTIAL" ? "border-amber-400/30 text-amber-300" : "border-sky-400/30 text-sky-300"}`}>{g.status}</Badge>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{g.engagementType} · {g.nextStep}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Principle:</span> {REGULATOR_RELATIONSHIP_DASHBOARD.principle}</p>
          </CardContent>
        </Card>
      </div>

      {/* WS9 — Evidence Repository + WS10 — Mission Control */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Archive className="h-4 w-4 text-gold" /> WS9 · Institutional Evidence Repository ({EVIDENCE_REPOSITORY.length} types)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {EVIDENCE_REPOSITORY.map(e => (
                <div key={e.artifactId} className="border-b border-gold/5 py-1">
                  <p className="font-sans text-[11px] font-medium">{e.type}</p>
                  <p className="font-sans text-[10px] text-muted-foreground">{e.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Properties:</span> {EVIDENCE_PROPERTIES.versioning}</p>
            <p className="font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Linked:</span> {EVIDENCE_PROPERTIES.linked}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Crosshair className="h-4 w-4 text-gold" /> WS10 · Executive Mission Control</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground">{PILOT_MISSION_CONTROL.purpose}</p>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {PILOT_MISSION_CONTROL.panels.map(p => (
                <div key={p} className="rounded border border-gold/8 bg-background/30 p-1.5">
                  <p className="font-sans text-[10px]">{p}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Refresh:</span> {PILOT_MISSION_CONTROL.refresh}</p>
            <p className="font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Alerts:</span> {PILOT_MISSION_CONTROL.alerts}</p>
          </CardContent>
        </Card>
      </div>

      {/* WS11 — Completion Framework + WS12 — Readiness Reassessment */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><CheckCircle2 className="h-4 w-4 text-gold" /> WS11 · Pilot Completion Framework ({PILOT_COMPLETION_CRITERIA.length} criteria)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {PILOT_COMPLETION_CRITERIA.map(c => (
                <div key={c.criterionId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{c.criterion}</span>
                    {c.required && <span className="font-mono text-[10px] text-rose-300">REQUIRED</span>}
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{c.measurement} → {c.threshold}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[11px] text-amber-300">{PILOT_COMPLETION_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><TrendingUp className="h-4 w-4 text-gold" /> WS12 · Institutional Readiness Reassessment</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead className="sticky top-0 bg-background/95"><tr className="border-b border-gold/15">
                  <th className="pb-1 pr-2 font-medium">Dimension</th>
                  <th className="pb-1 pr-2 font-medium">Before</th><th className="pb-1 pr-2 font-medium">During</th><th className="pb-1 font-medium">After</th>
                </tr></thead>
                <tbody>
                  {READINESS_REASSESSMENT.map(d => (
                    <tr key={d.dimension} className="border-b border-gold/5">
                      <td className="py-1 pr-2 text-[10px]">{d.dimension}</td>
                      <td className="py-1 pr-2 font-mono text-[10px] text-rose-300">{d.beforePilot}</td>
                      <td className="py-1 pr-2 font-mono text-[10px] text-amber-300">{d.duringPilot}</td>
                      <td className="py-1 font-mono text-[10px] text-emerald-300">{d.afterPilot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Final Reports summary */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><FileText className="h-4 w-4 text-gold" /> Final Reports Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded border border-gold/8 bg-background/30 p-2"><p className="font-mono text-[10px] uppercase text-gold-light">Pilot Execution</p><p className="font-sans text-[11px] text-muted-foreground">{PILOT_EXECUTION_REPORT.pmoFunctions} PMO · {PILOT_EXECUTION_REPORT.onboardingSteps} onboarding · {PILOT_EXECUTION_REPORT.pilotKpis} KPIs</p></div>
            <div className="rounded border border-gold/8 bg-background/30 p-2"><p className="font-mono text-[10px] uppercase text-gold-light">Customer Success</p><p className="font-sans text-[11px] text-muted-foreground">{CUSTOMER_SUCCESS_REPORT.operations} ops · {CUSTOMER_SUCCESS_REPORT.metrics.join(", ")}</p></div>
            <div className="rounded border border-gold/8 bg-background/30 p-2"><p className="font-mono text-[10px] uppercase text-gold-light">Partnerships</p><p className="font-sans text-[11px] text-muted-foreground">{STRATEGIC_PARTNERSHIP_REPORT.partners} types · {STRATEGIC_PARTNERSHIP_REPORT.priority}</p></div>
            <div className="rounded border border-gold/8 bg-background/30 p-2"><p className="font-mono text-[10px] uppercase text-gold-light">Regulatory</p><p className="font-sans text-[11px] text-muted-foreground">{REGULATORY_ENGAGEMENT_REPORT.engagements} · {REGULATORY_ENGAGEMENT_REPORT.principle}</p></div>
            <div className="rounded border border-gold/8 bg-background/30 p-2"><p className="font-mono text-[10px] uppercase text-gold-light">Evidence</p><p className="font-sans text-[11px] text-muted-foreground">{INSTITUTIONAL_EVIDENCE_REPORT.evidenceTypes} types · {INSTITUTIONAL_EVIDENCE_REPORT.properties}</p></div>
            <div className="rounded border border-gold/8 bg-background/30 p-2"><p className="font-mono text-[10px] uppercase text-gold-light">Lessons Learned</p><p className="font-sans text-[11px] text-muted-foreground">{LESSONS_LEARNED_REPORT.process}</p></div>
            <div className="rounded border border-gold/8 bg-background/30 p-2"><p className="font-mono text-[10px] uppercase text-gold-light">Success Framework</p><p className="font-sans text-[11px] text-muted-foreground">{PILOT_SUCCESS_FRAMEWORK.criteria} criteria · {PILOT_SUCCESS_FRAMEWORK.rule.substring(0, 60)}...</p></div>
            <div className="rounded border border-gold/8 bg-background/30 p-2"><p className="font-mono text-[10px] uppercase text-gold-light">Readiness</p><p className="font-sans text-[11px] text-muted-foreground">{EXECUTIVE_READINESS_ASSESSMENT.beforePilot} → {EXECUTIVE_READINESS_ASSESSMENT.duringPilot} → {EXECUTIVE_READINESS_ASSESSMENT.afterPilot} / {EXECUTIVE_READINESS_ASSESSMENT.target}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* COO Roadmap + Executive Certification */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Rocket className="h-4 w-4 text-gold" /> COO Roadmap Forward (execution-led)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {COO_ROADMAP_EXECUTION.map(s => (
              <div key={s.step} className="rounded border border-gold/8 bg-background/30 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-medium"><span className="font-mono text-[10px] text-gold-light">{s.step}</span> {s.action}</span>
                </div>
                <p className="font-sans text-[10px] text-muted-foreground">{s.detail}</p>
                <p className="font-sans text-[10px] text-emerald-300">Evidence: {s.evidence}</p>
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
            <p className="font-serif text-lg font-semibold text-gold-gradient">{EXECUTIVE_CERTIFICATION_PE.title}</p>
          </div>
          <p className="mt-2 font-sans text-sm text-muted-foreground">{EXECUTIVE_CERTIFICATION_PE.statement}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {EXECUTIVE_CERTIFICATION_PE.criteria.map(c => (
              <div key={c} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-sans text-[11px]"><CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-300" />{c}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 font-serif text-sm italic text-gold-gradient">{EXECUTIVE_CERTIFICATION_PE.conclusion}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-gold/30 font-mono text-xs text-gold">{EXECUTIVE_CERTIFICATION_PE.verdict}</Badge>
            <span className="font-mono text-[11px] text-muted-foreground">Certified by: {EXECUTIVE_CERTIFICATION_PE.certifiedBy} · {EXECUTIVE_CERTIFICATION_PE.certifiedAt}</span>
          </div>
        </CardContent>
      </Card>

      {/* Synchronization */}
      <Card className="border-gold/12 glass">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <p className="font-serif text-base font-semibold text-gold-gradient">PE v{PE_VERSION} Synchronization</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(PE_SYNCHRONIZATION).map(([k, v]) => (
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
