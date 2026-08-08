import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  AOS_VERSION, AOS_FROZEN_AT,
  LEVEL_0_DOMAINS, LEVEL_1_GROUPS, LEVEL_2_PROCESSES, LEVEL_3_ACTIVITIES,
  PROCESS_LIBRARY, SOP_LIBRARY, SERVICE_CATALOG, CAPABILITY_MAP,
  OPERATING_KPIS, OPERATIONAL_DASHBOARDS, KNOWLEDGE_MANAGEMENT,
  CONTINUOUS_IMPROVEMENT, FUTURE_ROLES, CAREER_LADDER, SUCCESSION_PLAN, COMPETENCY_FRAMEWORK,
  PLANNING_SYSTEM, BALANCED_SCORECARD, OPERATIONAL_EXCELLENCE,
  ENTERPRISE_LIFECYCLE_SIMULATION, OPERATIONAL_MATURITY, MATURITY_GAP_ANALYSIS,
  EPR, CAPABILITY_HEAT_MAP, DIGITAL_TWIN, INSTITUTIONAL_MEMORY_ENGINE, MISSION_CONTROL,
  AOS_SYNCHRONIZATION,
} from "@/lib/aurienta/operating-system";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Network, FileStack, ClipboardList, Boxes, Gauge, LayoutDashboard,
  BookOpen, RefreshCw, Users, CalendarClock, Target, Sparkles,
  Workflow, TrendingUp, Cpu, Brain, Crosshair, ShieldCheck,
} from "lucide-react";

export const metadata = { title: "AURIENTA Operating System · AOS v1.0" };
export const dynamic = "force-dynamic";

const maturityColor = (lvl: number) =>
  lvl >= 4 ? "text-emerald-300" : lvl === 3 ? "text-amber-300" : "text-rose-300";
const priorityColor = (p: string) =>
  p === "P0" ? "text-rose-300" : p === "P1" ? "text-amber-300" : p === "P2" ? "text-sky-300" : "text-muted-foreground";
const riskColor = (r: string) =>
  r === "High" ? "text-rose-300" : r === "Medium" ? "text-amber-300" : "text-emerald-300";

export default async function OperatingSystemPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/operating-system");

  const avgMaturity =
    Math.round((CAPABILITY_MAP.reduce((s, c) => s + c.currentMaturity, 0) / CAPABILITY_MAP.length) * 10) / 10;
  const targetAvg =
    Math.round((CAPABILITY_MAP.reduce((s, c) => s + c.targetMaturity, 0) / CAPABILITY_MAP.length) * 10) / 10;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            AURIENTA Operating System · AOS v{AOS_VERSION} · Frozen {AOS_FROZEN_AT}
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">AURIENTA Operating System</h1>
        <p className="font-sans text-sm text-muted-foreground">
          How the institution executes work · {PROCESS_LIBRARY.length} processes · {SOP_LIBRARY.length} SOPs · {SERVICE_CATALOG.length} services · {CAPABILITY_MAP.length} capabilities · {OPERATING_KPIS.length} KPIs · scales Founder → 10 → 100 → 1,000 → 10,000 without redesign
        </p>
      </header>

      {/* Mission Control summary */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-gold" />
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Executive Mission Control Center</p>
              </div>
              <p className="mt-1 font-serif text-2xl font-semibold text-gold-gradient">{MISSION_CONTROL.purpose}</p>
              <p className="font-sans text-xs text-muted-foreground">Audience: {MISSION_CONTROL.audience} · Refresh: {MISSION_CONTROL.refresh}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className={`font-serif text-lg font-semibold ${maturityColor(avgMaturity)}`}>{avgMaturity}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Capability (now)</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-lg font-semibold text-gold">{targetAvg}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Capability (target)</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-lg font-semibold text-gold">{MATURITY_GAP_ANALYSIS.currentAverage}</p>
                <p className="font-mono text-[10px] text-muted-foreground">OpEx (now)</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-lg font-semibold text-emerald-300">{MATURITY_GAP_ANALYSIS.targetAverage}</p>
                <p className="font-mono text-[10px] text-muted-foreground">OpEx (target)</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-lg font-semibold text-gold">{EPR.coverage.processes + EPR.coverage.sops + EPR.coverage.services}</p>
                <p className="font-mono text-[10px] text-muted-foreground">EPR artifacts</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliverable 1 — Process Architecture L0-L3 */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Network className="h-4 w-4 text-gold" /> Enterprise Process Architecture (L0–L3)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 grid gap-2 sm:grid-cols-5">
            {LEVEL_0_DOMAINS.map(d => (
              <div key={d.id} className="rounded border border-gold/15 bg-gold/5 p-2 text-center">
                <p className="font-serif text-sm font-semibold text-gold">{d.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{d.owner}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <p className="mb-1 font-mono text-[11px] uppercase text-muted-foreground">Level 1 — {LEVEL_1_GROUPS.length} groups</p>
              <div className="max-h-56 overflow-y-auto rounded border border-gold/8 p-2">
                <ul className="flex flex-col gap-0.5">{LEVEL_1_GROUPS.map(g => <li key={g.id} className="font-sans text-[11px]"><span className="font-mono text-gold-light">{g.id}</span> {g.name}</li>)}</ul>
              </div>
            </div>
            <div>
              <p className="mb-1 font-mono text-[11px] uppercase text-muted-foreground">Level 2 — {LEVEL_2_PROCESSES.length} processes</p>
              <div className="max-h-56 overflow-y-auto rounded border border-gold/8 p-2">
                <ul className="flex flex-col gap-0.5">{LEVEL_2_PROCESSES.map(p => <li key={p.id} className="font-sans text-[11px]"><span className="font-mono text-gold-light">{p.id}</span> {p.name}</li>)}</ul>
              </div>
            </div>
            <div>
              <p className="mb-1 font-mono text-[11px] uppercase text-muted-foreground">Level 3 — {LEVEL_3_ACTIVITIES.length} activities (top processes)</p>
              <div className="max-h-56 overflow-y-auto rounded border border-gold/8 p-2">
                <ul className="flex flex-col gap-0.5">{LEVEL_3_ACTIVITIES.map(a => <li key={a.id} className="font-sans text-[11px]"><span className="font-mono text-gold-light">{a.id}</span> {a.name}</li>)}</ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliverable 2 — Process Library */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <FileStack className="h-4 w-4 text-gold" /> Process Library ({PROCESS_LIBRARY.length} processes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-gold/15">
                  <th className="pb-2 pr-3 font-medium">ID</th>
                  <th className="pb-2 pr-3 font-medium">Process</th>
                  <th className="pb-2 pr-3 font-medium">Domain</th>
                  <th className="pb-2 pr-3 font-medium">Owner</th>
                  <th className="pb-2 pr-3 font-medium">Cadence</th>
                  <th className="pb-2 font-medium">Automation</th>
                </tr>
              </thead>
              <tbody>
                {PROCESS_LIBRARY.map(p => (
                  <tr key={p.id} className="border-b border-gold/5">
                    <td className="py-1.5 pr-3 font-mono text-gold-light">{p.id}</td>
                    <td className="py-1.5 pr-3">{p.name}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{p.domain}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{p.owner}</td>
                    <td className="py-1.5 pr-3 font-mono text-[11px] text-muted-foreground">{p.cadence}</td>
                    <td className="py-1.5">
                      <Badge variant="outline" className="border-gold/15 font-mono text-[10px]">{p.automationLevel}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deliverable 3 — SOPs */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <ClipboardList className="h-4 w-4 text-gold" /> Standard Operating Procedures ({SOP_LIBRARY.length} detailed)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-2">
            {SOP_LIBRARY.map(sop => (
              <div key={sop.sopId} className="rounded border border-gold/10 bg-background/30 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-sans text-xs font-semibold">{sop.title}</span>
                  <span className="font-mono text-[10px] text-gold-light">{sop.sopId}</span>
                </div>
                <p className="font-sans text-[11px] text-muted-foreground">Owner: {sop.owner} · Trigger: {sop.trigger}</p>
                <p className="mt-1 font-sans text-[11px]"><span className="text-gold-light">Escalation:</span> {sop.escalation}</p>
                <p className="mt-1 font-sans text-[11px]"><span className="text-gold-light">Exceptions:</span> {sop.exceptions}</p>
                <p className="mt-1 font-sans text-[11px]"><span className="text-gold-light">Automation:</span> {sop.automationOpportunities}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deliverable 4 & 5 — Service Catalog + Capability Map */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Boxes className="h-4 w-4 text-gold" /> Service Catalog ({SERVICE_CATALOG.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto">
              {SERVICE_CATALOG.map(s => (
                <div key={s.serviceId} className="mb-2 border-b border-gold/5 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs font-medium">{s.name}</span>
                    <Badge variant="outline" className="border-gold/20 font-mono text-[10px]">{s.provider}</Badge>
                  </div>
                  <p className="font-sans text-[11px] text-muted-foreground">SLA: {s.serviceLevels}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Gauge className="h-4 w-4 text-gold" /> Enterprise Capability Map ({CAPABILITY_MAP.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto">
              {CAPABILITY_MAP.map(c => (
                <div key={c.capabilityId} className="mb-1.5 border-b border-gold/5 pb-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs font-medium">{c.name}</span>
                    <span className="font-mono text-[11px]">
                      <span className={maturityColor(c.currentMaturity)}>L{c.currentMaturity}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-gold">L{c.targetMaturity}</span>
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground">{c.owner} · {c.strategicImportance}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Rec 2 — Capability Heat Map */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <TrendingUp className="h-4 w-4 text-gold" /> Business Capability Heat Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {CAPABILITY_HEAT_MAP.map(h => (
              <div key={h.capability} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-sans text-[11px] font-medium">{h.capability}</p>
                <div className="mt-1 flex items-center justify-between font-mono text-[10px]">
                  <span className={maturityColor(h.maturity)}>L{h.maturity}</span>
                  <span className={riskColor(h.risk)}>{h.risk}</span>
                  <span className={priorityColor(h.investmentPriority)}>{h.investmentPriority}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deliverable 6 — Operating KPIs */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Target className="h-4 w-4 text-gold" /> Operating Metrics ({OPERATING_KPIS.length} KPIs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-gold/15">
                  <th className="pb-2 pr-3 font-medium">KPI</th><th className="pb-2 pr-3 font-medium">Category</th>
                  <th className="pb-2 pr-3 font-medium">Current</th><th className="pb-2 font-medium">Target</th>
                </tr>
              </thead>
              <tbody>
                {OPERATING_KPIS.map(k => (
                  <tr key={k.kpiId} className="border-b border-gold/5">
                    <td className="py-1.5 pr-3"><span className="font-mono text-[10px] text-gold-light">{k.kpiId}</span> {k.name}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{k.category}</td>
                    <td className="py-1.5 pr-3 font-mono text-[11px] text-amber-300">{k.current}</td>
                    <td className="py-1.5 font-mono text-[11px] text-emerald-300">{k.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deliverable 7 — Dashboards + Deliverable 12 — Scorecard */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <LayoutDashboard className="h-4 w-4 text-gold" /> Operational Dashboards ({OPERATIONAL_DASHBOARDS.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto">
              {OPERATIONAL_DASHBOARDS.map(d => (
                <div key={d.dashboardId} className="mb-1.5 border-b border-gold/5 pb-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs font-medium">{d.audience}</span>
                    <Badge variant="outline" className="border-gold/15 font-mono text-[10px]">{d.refresh}</Badge>
                  </div>
                  <p className="font-sans text-[11px] text-muted-foreground">{d.purpose}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Target className="h-4 w-4 text-gold" /> Balanced Scorecard ({BALANCED_SCORECARD.length} perspectives)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {BALANCED_SCORECARD.map(s => (
              <div key={s.perspective} className="mb-2 border-b border-gold/5 pb-2">
                <p className="font-sans text-xs font-semibold text-gold">{s.perspective}</p>
                <p className="font-sans text-[11px] text-muted-foreground">Objectives: {s.objectives.join(", ")}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Targets: {s.targets.join(" · ")}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Deliverable 9 — Continuous Improvement + Deliverable 13 — Op Excellence */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <RefreshCw className="h-4 w-4 text-gold" /> Continuous Improvement System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="mb-3 flex flex-col gap-0.5">
              {CONTINUOUS_IMPROVEMENT.principles.map(p => <li key={p} className="font-sans text-[11px] text-muted-foreground">• {p}</li>)}
            </ul>
            <div className="max-h-40 overflow-y-auto">
              {CONTINUOUS_IMPROVEMENT.practices.map(pr => (
                <div key={pr.practice} className="flex items-center justify-between border-b border-gold/5 py-1">
                  <span className="font-sans text-[11px]">{pr.practice}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{pr.cadence}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Sparkles className="h-4 w-4 text-gold" /> Operational Excellence Framework
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 font-sans text-[11px] font-medium text-gold">8 Wastes Targeted:</p>
            <div className="mb-3 grid grid-cols-2 gap-1">
              {OPERATIONAL_EXCELLENCE.wasteReduction.map(w => <span key={w} className="font-sans text-[10px] text-muted-foreground">• {w}</span>)}
            </div>
            <p className="font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Automation Strategy:</span> {OPERATIONAL_EXCELLENCE.automationStrategy}</p>
            <p className="font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Resilience:</span> {OPERATIONAL_EXCELLENCE.operationalResilience}</p>
          </CardContent>
        </Card>
      </div>

      {/* Deliverable 10 — Organizational Design */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Users className="h-4 w-4 text-gold" /> Organizational Design — Future Roles ({FUTURE_ROLES.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-gold/15">
                  <th className="pb-2 pr-3 font-medium">Role</th><th className="pb-2 pr-3 font-medium">Reports To</th>
                  <th className="pb-2 pr-3 font-medium">Activates At</th><th className="pb-2 font-medium">Span</th>
                </tr>
              </thead>
              <tbody>
                {FUTURE_ROLES.map(r => (
                  <tr key={r.roleId} className="border-b border-gold/5">
                    <td className="py-1.5 pr-3">{r.title}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{r.reportsTo}</td>
                    <td className="py-1.5 pr-3 font-mono text-[11px] text-gold-light">{r.activatesAt}</td>
                    <td className="py-1.5 text-muted-foreground">{r.spanOfControl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div>
              <p className="mb-1 font-mono text-[11px] uppercase text-muted-foreground">Career Ladders</p>
              {Object.entries(CAREER_LADDER).map(([track, levels]) => (
                <p key={track} className="font-sans text-[11px]"><span className="text-gold-light">{track}:</span> {levels.join(" → ")}</p>
              ))}
            </div>
            <div>
              <p className="mb-1 font-mono text-[11px] uppercase text-muted-foreground">Succession (Founder)</p>
              <p className="font-sans text-[11px] text-muted-foreground">{SUCCESSION_PLAN.founder}</p>
              <p className="mt-1 mb-1 font-mono text-[11px] uppercase text-muted-foreground">Competency Framework</p>
              {Object.entries(COMPETENCY_FRAMEWORK).map(([cat, skills]) => (
                <p key={cat} className="font-sans text-[11px]"><span className="text-gold-light">{cat}:</span> {skills.join(", ")}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliverable 17 — Enterprise Lifecycle Simulation */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Workflow className="h-4 w-4 text-gold" /> Enterprise Lifecycle Simulation ({ENTERPRISE_LIFECYCLE_SIMULATION.length} steps)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 font-sans text-[11px] text-muted-foreground">Founder creates enterprise → charter → law firm → capital partners → milestone funding → graduation → alumni → CAaaS → strategic partner. Every handoff, control, and evidence artifact documented.</p>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-gold/15">
                  <th className="pb-2 pr-2 font-medium">#</th><th className="pb-2 pr-2 font-medium">Phase</th>
                  <th className="pb-2 pr-2 font-medium">Actor</th><th className="pb-2 pr-2 font-medium">Action</th>
                  <th className="pb-2 pr-2 font-medium">Control</th><th className="pb-2 font-medium">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {ENTERPRISE_LIFECYCLE_SIMULATION.map(s => (
                  <tr key={s.step} className="border-b border-gold/5">
                    <td className="py-1.5 pr-2 font-mono text-gold-light">{s.step}</td>
                    <td className="py-1.5 pr-2 text-gold">{s.phase}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{s.actor}</td>
                    <td className="py-1.5 pr-2">{s.action}</td>
                    <td className="py-1.5 pr-2 font-mono text-[10px] text-muted-foreground">{s.control}</td>
                    <td className="py-1.5 text-muted-foreground">{s.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deliverable 18 — Maturity Assessment + Gap */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <TrendingUp className="h-4 w-4 text-gold" /> Operational Maturity Assessment ({OPERATIONAL_MATURITY.length} frameworks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {OPERATIONAL_MATURITY.map(m => (
              <div key={m.framework + m.capability} className="mb-2 border-b border-gold/5 pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-medium">{m.framework} — {m.capability}</span>
                  <span className="font-mono text-[11px]">
                    <span className={maturityColor(m.currentLevel)}>L{m.currentLevel}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-gold">L{m.targetLevel}</span>
                  </span>
                </div>
                <p className="font-sans text-[11px] text-muted-foreground">3yr: {m.threeYearRoadmap}</p>
                <p className="font-sans text-[11px] text-muted-foreground">5yr: {m.fiveYearRoadmap}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <ShieldCheck className="h-4 w-4 text-gold" /> Gap Analysis & Priority Investments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-2xl font-semibold text-amber-300">{MATURITY_GAP_ANALYSIS.currentAverage}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Current avg</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-2xl font-semibold text-emerald-300">{MATURITY_GAP_ANALYSIS.targetAverage}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Target avg</p>
              </div>
            </div>
            <p className="mb-1 font-mono text-[11px] uppercase text-muted-foreground">Biggest Gaps</p>
            <ul className="mb-3 flex flex-col gap-0.5">{MATURITY_GAP_ANALYSIS.biggestGaps.map(g => <li key={g} className="font-sans text-[11px] text-rose-300">• {g}</li>)}</ul>
            <p className="mb-1 font-mono text-[11px] uppercase text-muted-foreground">Priority Investments</p>
            <ul className="flex flex-col gap-0.5">{MATURITY_GAP_ANALYSIS.priorityInvestments.map(p => <li key={p} className="font-sans text-[11px] text-muted-foreground">• {p}</li>)}</ul>
          </CardContent>
        </Card>
      </div>

      {/* Additional Recommendations: EPR, Digital Twin, Institutional Memory, Knowledge Mgmt */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <FileStack className="h-4 w-4 text-gold" /> Enterprise Process Repository (EPR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground">{EPR.description}</p>
            <p className="mt-1 font-sans text-[11px]"><span className="text-gold-light">ID Scheme:</span> {EPR.identifierScheme}</p>
            <p className="font-sans text-[11px]"><span className="text-gold-light">Versioning:</span> {EPR.versioning}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="rounded border border-gold/8 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-gold">{EPR.coverage.processes}</p><p className="font-mono text-[10px] text-muted-foreground">Processes</p></div>
              <div className="rounded border border-gold/8 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-gold">{EPR.coverage.sops}</p><p className="font-mono text-[10px] text-muted-foreground">SOPs</p></div>
              <div className="rounded border border-gold/8 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-gold">{EPR.coverage.services}</p><p className="font-mono text-[10px] text-muted-foreground">Services</p></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Cpu className="h-4 w-4 text-gold" /> Operational Digital Twin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground">{DIGITAL_TWIN.purpose}</p>
            <p className="mt-1 font-sans text-[11px]"><span className="text-gold-light">Model:</span> {DIGITAL_TWIN.model}</p>
            <p className="font-sans text-[11px]"><span className="text-gold-light">Roadmap:</span> {DIGITAL_TWIN.roadmap}</p>
            <p className="font-sans text-[11px]"><span className="text-gold-light">Maturity:</span> <span className={maturityColor(DIGITAL_TWIN.currentMaturity)}>L{DIGITAL_TWIN.currentMaturity}</span> → <span className="text-gold">L{DIGITAL_TWIN.targetMaturity}</span></p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Brain className="h-4 w-4 text-gold" /> Institutional Memory Engine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground">{INSTITUTIONAL_MEMORY_ENGINE.purpose}</p>
            <p className="mt-1 mb-1 font-mono text-[11px] uppercase text-muted-foreground">Sources</p>
            <ul className="flex flex-col gap-0.5">{INSTITUTIONAL_MEMORY_ENGINE.sources.map(s => <li key={s} className="font-sans text-[11px] text-muted-foreground">• {s}</li>)}</ul>
            <p className="mt-1 font-sans text-[11px]"><span className="text-gold-light">Retention:</span> {INSTITUTIONAL_MEMORY_ENGINE.retention}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <BookOpen className="h-4 w-4 text-gold" /> Knowledge Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-1 font-mono text-[11px] uppercase text-muted-foreground">Taxonomy ({KNOWLEDGE_MANAGEMENT.taxonomy.length} domains)</p>
            <div className="max-h-32 overflow-y-auto">
              <ul className="flex flex-col gap-0.5">{KNOWLEDGE_MANAGEMENT.taxonomy.map(t => <li key={t} className="font-sans text-[11px] text-muted-foreground">• {t}</li>)}</ul>
            </div>
            <p className="mt-1 font-sans text-[11px]"><span className="text-gold-light">Workflow:</span> {KNOWLEDGE_MANAGEMENT.approvalWorkflow}</p>
            <p className="font-sans text-[11px]"><span className="text-gold-light">AI Indexing:</span> {KNOWLEDGE_MANAGEMENT.aiIndexing}</p>
            <p className="font-sans text-[11px]"><span className="text-gold-light">Retention:</span> {KNOWLEDGE_MANAGEMENT.retention}</p>
          </CardContent>
        </Card>
      </div>

      {/* Mission Control + Planning + Synchronization */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Crosshair className="h-4 w-4 text-gold" /> Executive Mission Control Center — Panels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MISSION_CONTROL.panels.map(p => (
              <div key={p} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-sans text-[11px]">{p}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 font-sans text-[11px]"><span className="text-gold-light">Alerts:</span> {MISSION_CONTROL.alerts}</p>
          <p className="font-sans text-[11px]"><span className="text-gold-light">Access:</span> {MISSION_CONTROL.access}</p>
        </CardContent>
      </Card>

      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <CalendarClock className="h-4 w-4 text-gold" /> Enterprise Planning System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(PLANNING_SYSTEM).map(([k, v]) => (
              <div key={k} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-mono text-[10px] uppercase text-gold-light">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                <p className="font-sans text-[11px] text-muted-foreground">{v}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Synchronization footer */}
      <Card className="border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <p className="font-serif text-base font-semibold text-gold-gradient">AOS v{AOS_VERSION} Synchronization & Scalability</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(AOS_SYNCHRONIZATION).map(([k, v]) => (
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
