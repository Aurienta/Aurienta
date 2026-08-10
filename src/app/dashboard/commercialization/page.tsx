import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  ACS_VERSION, ACS_FROZEN_AT,
  COMMERCIAL_ORGANIZATION, COMMERCIAL_FUNNEL, SALES_PLAYBOOKS, CUSTOMER_JOURNEY,
  PARTNER_LIFECYCLE, GOVERNMENT_FRAMEWORK, PRICING_ARCHITECTURE, PRICING_CONSTRAINTS,
  COMMERCIAL_KPIS, GLOBAL_EXPANSION, INSTITUTIONAL_BRAND, COMPETITIVE_POSITIONING,
  COMPETITIVE_MOAT, COMMERCIAL_RISK_REGISTER, DUE_DILIGENCE_PACKS, COMMERCIAL_DASHBOARDS,
  COO_FRAMEWORKS, COMMERCIALIZATION_READINESS, READINESS_SCORE_BEFORE, READINESS_SCORE_AFTER,
  READINESS_SCORE_TARGET, GAP_ANALYSIS, EXECUTIVE_CERTIFICATION, ACS_SYNCHRONIZATION,
} from "@/lib/aurienta/commercialization-system";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Filter, BookOpen, Route, Handshake, Landmark, DollarSign,
  BarChart3, Globe, Sparkles, Crosshair, ShieldAlert, FileSearch, LayoutDashboard,
  Award, TrendingUp, Target, Trophy, ShieldCheck, CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const metadata = { title: "Commercialization System · AURIENTA" };
export const dynamic = "force-dynamic";

const scoreColor = (s: number, target: number) =>
  s >= target - 5 ? "text-emerald-300" : s >= target - 15 ? "text-amber-300" : "text-rose-300";
const riskColor = (i: string) =>
  i === "Critical" ? "text-rose-300" : i === "High" ? "text-amber-300" : i === "Medium" ? "text-sky-300" : "text-emerald-300";
const phaseColor = (p: string) =>
  p.includes("Expansion") || p === "Advocacy" ? "text-emerald-300" :
  p === "Retention" ? "text-sky-300" :
  p === "Activation" ? "text-amber-300" : "text-gold-light";

export default async function CommercializationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/commercialization");

  const kpiByCategory = COMMERCIAL_KPIS.reduce((acc, k) => {
    (acc[k.category] = acc[k.category] || []).push(k);
    return acc;
  }, {} as Record<string, typeof COMMERCIAL_KPIS>);

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
          <TrendingUp className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            AURIENTA Commercialization System · ACS v{ACS_VERSION} · Frozen {ACS_FROZEN_AT} · Final Architecture Phase
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Institutional Commercialization & Global Go-To-Market</h1>
        <p className="font-sans text-sm text-muted-foreground">
          {COMMERCIAL_ORGANIZATION.length} commercial entities · {COMMERCIAL_FUNNEL.length}-stage funnel · {SALES_PLAYBOOKS.length} sales playbooks · {CUSTOMER_JOURNEY.length} journey touchpoints · {PARTNER_LIFECYCLE.length}-stage partner lifecycle · {GOVERNMENT_FRAMEWORK.length} government stakeholders · {PRICING_ARCHITECTURE.length} pricing lines · {COMMERCIAL_KPIS.length} KPIs · {GLOBAL_EXPANSION.length} regions · {COMPETITIVE_POSITIONING.length} competitors · {COMMERCIAL_RISK_REGISTER.length} commercial risks · {COO_FRAMEWORKS ? Object.keys(COO_FRAMEWORKS).length : 0} COO frameworks
        </p>
      </header>

      {/* Readiness Score + Executive Certification */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold" />
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Commercialization Readiness Score</p>
              </div>
              <p className="mt-1 font-serif text-4xl font-semibold text-gold-gradient">
                <span className={scoreColor(READINESS_SCORE_AFTER, READINESS_SCORE_TARGET)}>{READINESS_SCORE_AFTER}</span>
                <span className="text-lg text-muted-foreground">/100</span>
              </p>
              <p className="font-sans text-xs text-muted-foreground">
                Before Prompt 6: <span className="text-rose-300">{READINESS_SCORE_BEFORE}</span> → After: <span className="text-emerald-300">{READINESS_SCORE_AFTER}</span> → Target: <span className="text-gold">{READINESS_SCORE_TARGET}</span>
              </p>
            </div>
            <div className="flex-1 lg:max-w-xl">
              <div className="rounded border border-gold/15 bg-background/30 p-3">
                <p className="font-mono text-[10px] uppercase text-gold-light">{EXECUTIVE_CERTIFICATION.title}</p>
                <p className="mt-1 font-sans text-[11px] text-muted-foreground">{EXECUTIVE_CERTIFICATION.conclusion}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Part 1 — Commercial Organization */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Building2 className="h-4 w-4 text-gold" /> Part 1 · Commercial Operating Model ({COMMERCIAL_ORGANIZATION.length} entities)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-gold/15">
                  <th className="pb-2 pr-3 font-medium">Entity</th><th className="pb-2 pr-3 font-medium">Role</th>
                  <th className="pb-2 pr-3 font-medium">Activates</th><th className="pb-2 font-medium">Responsibilities</th>
                </tr>
              </thead>
              <tbody>
                {COMMERCIAL_ORGANIZATION.map(e => (
                  <tr key={e.entityId} className="border-b border-gold/5">
                    <td className="py-1.5 pr-3 font-medium">{e.entity}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{e.commercialRole}</td>
                    <td className="py-1.5 pr-3 font-mono text-[11px] text-gold-light">{e.activatesAt}</td>
                    <td className="py-1.5 text-muted-foreground">{e.responsibilities.join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Part 2 — Commercial Funnel */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Filter className="h-4 w-4 text-gold" /> Part 2 · Commercial Funnel ({COMMERCIAL_FUNNEL.length} stages)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {COMMERCIAL_FUNNEL.map(f => (
              <div key={f.stageId} className="rounded border border-gold/10 bg-background/30 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-medium">{f.stage}</span>
                  <span className={`font-mono text-[10px] ${phaseColor(f.phase)}`}>{f.phase}</span>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground">{f.stageId} · {f.owner}</p>
                <p className="font-sans text-[11px] text-muted-foreground">{f.objective}</p>
                <p className="font-mono text-[10px] text-emerald-300">{f.conversionTarget}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Part 3 — Sales Playbooks */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <BookOpen className="h-4 w-4 text-gold" /> Part 3 · Sales Operating System ({SALES_PLAYBOOKS.length} playbooks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-gold/15">
                  <th className="pb-2 pr-3 font-medium">Segment</th><th className="pb-2 pr-3 font-medium">Buyer</th>
                  <th className="pb-2 pr-3 font-medium">Cycle</th><th className="pb-2 pr-3 font-medium">Avg Deal</th>
                  <th className="pb-2 font-medium">Closing Lever</th>
                </tr>
              </thead>
              <tbody>
                {SALES_PLAYBOOKS.map(p => (
                  <tr key={p.playbookId} className="border-b border-gold/5">
                    <td className="py-1.5 pr-3"><span className="font-mono text-[10px] text-gold-light">{p.playbookId}</span> {p.segment}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{p.buyer}</td>
                    <td className="py-1.5 pr-3 font-mono text-[11px] text-muted-foreground">{p.cycle}</td>
                    <td className="py-1.5 pr-3 font-mono text-[11px] text-gold">{p.avgDeal}</td>
                    <td className="py-1.5 text-muted-foreground">{p.closingLever}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Part 4 — Customer Journey + Part 5 — Partner Lifecycle */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Route className="h-4 w-4 text-gold" /> Part 4 · Customer Journey ({CUSTOMER_JOURNEY.length} touchpoints)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto">
              {CUSTOMER_JOURNEY.map(t => (
                <div key={t.touchpointId} className="flex items-center justify-between border-b border-gold/5 py-1">
                  <div>
                    <span className="font-sans text-[11px]">{t.touchpoint}</span>
                    <span className="ml-2 font-mono text-[10px] text-muted-foreground">{t.channel}</span>
                  </div>
                  <Badge variant="outline" className={`border-gold/15 font-mono text-[10px] ${
                    t.emotion === "Delight" ? "text-emerald-300" : t.emotion === "Satisfied" ? "text-sky-300" : t.emotion === "Frustrated" ? "text-rose-300" : "text-muted-foreground"
                  }`}>{t.emotion}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Handshake className="h-4 w-4 text-gold" /> Part 5 · Partner Lifecycle ({PARTNER_LIFECYCLE.length} stages)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto">
              {PARTNER_LIFECYCLE.map(s => (
                <div key={s.stageId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{s.stage}</span>
                    <span className="font-mono text-[10px] text-gold-light">{s.duration}</span>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground">{s.stageId} · {s.owner}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Part 6 — Government + Part 7 — Pricing */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Landmark className="h-4 w-4 text-gold" /> Part 6 · Government Engagement ({GOVERNMENT_FRAMEWORK.length} stakeholders)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto">
              {GOVERNMENT_FRAMEWORK.map(g => (
                <div key={g.stakeholderId} className="mb-1.5 border-b border-gold/5 pb-1.5">
                  <p className="font-sans text-xs font-medium">{g.stakeholder}</p>
                  <p className="font-sans text-[11px] text-muted-foreground">{g.adoptionModel}</p>
                  <p className="font-mono text-[10px] text-gold-light">Cycle: {g.cycle}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <DollarSign className="h-4 w-4 text-gold" /> Part 7 · Pricing Architecture ({PRICING_ARCHITECTURE.length} lines)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {PRICING_ARCHITECTURE.map(p => (
                <div key={p.pricingId} className="flex items-center justify-between border-b border-gold/5 py-1">
                  <div>
                    <span className="font-sans text-[11px] font-medium">{p.line}</span>
                    <p className="font-mono text-[10px] text-muted-foreground">{p.model}</p>
                  </div>
                  <span className="font-mono text-[10px] text-gold">{p.range}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">Constitutional Constraints</p>
            <ul className="flex flex-col gap-0.5">{PRICING_CONSTRAINTS.map(c => <li key={c} className="font-sans text-[10px] text-muted-foreground">• {c}</li>)}</ul>
          </CardContent>
        </Card>
      </div>

      {/* Part 8 — Commercial KPIs (110) */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <BarChart3 className="h-4 w-4 text-gold" /> Part 8 · Commercial KPIs ({COMMERCIAL_KPIS.length} across {Object.keys(kpiByCategory).length} categories)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <div className="grid gap-3 lg:grid-cols-2">
              {Object.entries(kpiByCategory).map(([cat, kpis]) => (
                <div key={cat} className="rounded border border-gold/8 bg-background/30 p-2">
                  <p className="font-mono text-[10px] uppercase text-gold-light">{cat} ({kpis.length})</p>
                  <div className="mt-1 max-h-40 overflow-y-auto">
                    {kpis.map(k => (
                      <div key={k.kpiId} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                        <span className="font-sans text-[11px]"><span className="font-mono text-[10px] text-muted-foreground">{k.kpiId}</span> {k.name}</span>
                        <span className="font-mono text-[10px] text-emerald-300">{k.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Part 9 — Global Expansion */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Globe className="h-4 w-4 text-gold" /> Part 9 · Global Expansion Readiness ({GLOBAL_EXPANSION.length} regions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {GLOBAL_EXPANSION.map(r => (
              <div key={r.regionId} className="rounded border border-gold/10 bg-background/30 p-2">
                <p className="font-sans text-xs font-semibold text-gold">{r.region}</p>
                <p className="font-mono text-[10px] text-muted-foreground">Trigger: {r.activationTrigger}</p>
                <p className="font-sans text-[11px] text-muted-foreground">Capital: {r.resources.capital}</p>
                <p className="font-sans text-[11px] text-muted-foreground">People: {r.resources.people}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Part 10 — Branding + Part 11 — Competitive */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Sparkles className="h-4 w-4 text-gold" /> Part 10 · Institutional Branding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Positioning:</span> {INSTITUTIONAL_BRAND.positioning}</p>
            <p className="mt-1 font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Narrative:</span> {INSTITUTIONAL_BRAND.narrative}</p>
            <p className="mt-1 mb-1 font-mono text-[10px] uppercase text-gold-light">Audience Narratives ({INSTITUTIONAL_BRAND.narratives.length})</p>
            <div className="max-h-40 overflow-y-auto">
              {INSTITUTIONAL_BRAND.narratives.map(n => (
                <div key={n.audience} className="border-b border-gold/5 py-1">
                  <p className="font-sans text-[11px] font-medium">{n.audience}</p>
                  <p className="font-sans text-[10px] text-muted-foreground">{n.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Crosshair className="h-4 w-4 text-gold" /> Part 11 · Competitive Positioning ({COMPETITIVE_POSITIONING.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-44 overflow-y-auto">
              {COMPETITIVE_POSITIONING.map(c => (
                <div key={c.competitorId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{c.competitor}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{c.category}</span>
                  </div>
                  <p className="font-sans text-[10px] text-emerald-300">AURIENTA: {c.aurentaAdvantage}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Moat:</span> {COMPETITIVE_MOAT}</p>
          </CardContent>
        </Card>
      </div>

      {/* Part 12 — Commercial Risk + Part 14 — DD Packs */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <ShieldAlert className="h-4 w-4 text-gold" /> Part 12 · Commercial Risk Register ({COMMERCIAL_RISK_REGISTER.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto">
              {COMMERCIAL_RISK_REGISTER.map(r => (
                <div key={r.riskId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px]"><span className="font-mono text-[10px] text-gold-light">{r.riskId}</span> {r.risk}</span>
                    <span className="font-mono text-[10px]">
                      <span className={riskColor(r.impact)}>{r.impact}</span>
                    </span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{r.mitigation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <FileSearch className="h-4 w-4 text-gold" /> Part 14 · Due Diligence Packs ({DUE_DILIGENCE_PACKS.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto">
              {DUE_DILIGENCE_PACKS.map(d => (
                <div key={d.ddId} className="border-b border-gold/5 py-1">
                  <p className="font-sans text-[11px] font-medium">{d.audience}</p>
                  <p className="font-sans text-[10px] text-muted-foreground">{d.contents.join(", ")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Part 15 — Dashboards + COO Frameworks */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <LayoutDashboard className="h-4 w-4 text-gold" /> Part 15 · Commercial Dashboards ({COMMERCIAL_DASHBOARDS.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {COMMERCIAL_DASHBOARDS.map(d => (
              <div key={d.dashboardId} className="mb-1.5 border-b border-gold/5 pb-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-medium">{d.audience}</span>
                  <Badge variant="outline" className="border-gold/15 font-mono text-[10px]">{d.refresh}</Badge>
                </div>
                <p className="font-sans text-[11px] text-muted-foreground">{d.widgets.join(" · ")}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Award className="h-4 w-4 text-gold" /> COO Frameworks ({Object.keys(COO_FRAMEWORKS).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto">
              {Object.entries(COO_FRAMEWORKS).map(([k, v]) => (
                <div key={k} className="border-b border-gold/5 py-1">
                  <p className="font-mono text-[10px] uppercase text-gold-light">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                  <p className="font-sans text-[10px] text-muted-foreground">
                    {typeof v === "object" && v !== null
                      ? Object.entries(v).map(([fk, fv]) => `${fk}: ${Array.isArray(fv) ? fv.join(", ") : fv}`).join(" | ")
                      : String(v)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Part 18 — Readiness Audit */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Target className="h-4 w-4 text-gold" /> Part 18 · Commercialization Readiness Audit ({COMMERCIALIZATION_READINESS.length} dimensions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-gold/15">
                  <th className="pb-2 pr-3 font-medium">Dimension</th>
                  <th className="pb-2 pr-3 font-medium">Before</th>
                  <th className="pb-2 pr-3 font-medium">After</th>
                  <th className="pb-2 font-medium">Target</th>
                </tr>
              </thead>
              <tbody>
                {COMMERCIALIZATION_READINESS.map(d => (
                  <tr key={d.dimension} className="border-b border-gold/5">
                    <td className="py-1.5 pr-3">{d.dimension}</td>
                    <td className="py-1.5 pr-3 font-mono text-rose-300">{d.beforeScore}</td>
                    <td className={`py-1.5 pr-3 font-mono ${scoreColor(d.afterScore, d.target)}`}>{d.afterScore}</td>
                    <td className="py-1.5 font-mono text-gold">{d.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Gap Analysis + Execution Priorities */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <ShieldAlert className="h-4 w-4 text-gold" /> Gap Analysis — Remaining Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-0.5">{GAP_ANALYSIS.remainingGaps.map(g => <li key={g} className="font-sans text-[11px] text-amber-300">• {g}</li>)}</ul>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <TrendingUp className="h-4 w-4 text-gold" /> Execution Priorities (Next Phase)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-0.5">{GAP_ANALYSIS.executionPriorities.map(p => <li key={p} className="font-sans text-[11px] text-emerald-300">• {p}</li>)}</ul>
          </CardContent>
        </Card>
      </div>

      {/* Executive Certification */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-gold" />
            <p className="font-serif text-lg font-semibold text-gold-gradient">{EXECUTIVE_CERTIFICATION.title}</p>
          </div>
          <p className="mt-2 font-sans text-sm text-muted-foreground">{EXECUTIVE_CERTIFICATION.statement}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {EXECUTIVE_CERTIFICATION.criteria.map(c => (
              <div key={c} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-sans text-[11px]"><CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-300" />{c}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
              <p className="font-serif text-2xl font-semibold text-rose-300">{EXECUTIVE_CERTIFICATION.readinessScore}</p>
              <p className="font-mono text-[10px] text-muted-foreground">After (now)</p>
            </div>
            <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
              <p className="font-serif text-2xl font-semibold text-gold">{EXECUTIVE_CERTIFICATION.readinessTarget}</p>
              <p className="font-mono text-[10px] text-muted-foreground">Target</p>
            </div>
            <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
              <p className="font-serif text-sm font-semibold text-emerald-300">CERTIFIED</p>
              <p className="font-mono text-[10px] text-muted-foreground">{EXECUTIVE_CERTIFICATION.certifiedAt}</p>
            </div>
          </div>
          <p className="mt-3 font-serif text-sm italic text-gold-gradient">{EXECUTIVE_CERTIFICATION.conclusion}</p>
        </CardContent>
      </Card>

      {/* Synchronization footer */}
      <Card className="border-gold/12 glass">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <p className="font-serif text-base font-semibold text-gold-gradient">ACS v{ACS_VERSION} Synchronization & Scalability</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(ACS_SYNCHRONIZATION).map(([k, v]) => (
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
