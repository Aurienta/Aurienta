import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  MES_VERSION, MES_FROZEN_AT,
  EXECUTION_INTEGRITY_RULE, EXECUTION_STATUS_REGISTER,
  IDEAL_CUSTOMER_PROFILE, ANCHOR_QUALIFICATION_MODEL, QUALIFICATION_RULE,
  TARGET_ACCOUNT_SCHEMA, TARGET_ACCOUNT_RULE, TARGET_TIERS,
  SALES_PIPELINE, PIPELINE_RULE,
  COMMERCIAL_OFFER_VALIDATION, PRICING_VALIDATION_RULE,
  REVENUE_VALIDATION, REVENUE_RULE,
  PARTNER_EXECUTION, PARTNER_RULE,
  LAW_FIRM_CRITERIA, LAW_FIRM_PIPELINE,
  REGULATORY_ENGAGEMENT_EXECUTION, REGULATORY_TERMINOLOGY_RULE,
  PILOT_EXECUTION_FRAMEWORK,
  CASE_STUDY_TEMPLATE, CASE_STUDY_RULE,
  PMF_TRACKING,
  LOST_OPPORTUNITY_REASONS, LOSS_RULE,
  CUSTOMER_HEALTH_MODEL,
  EXECUTION_BOARD,
  FOUNDER_WEEKLY_SCORECARD,
  NINETY_DAY_PLAN, NINETY_DAY_RULE,
  TWELVE_MONTH_ROADMAP, ROADMAP_RULE,
  UNIT_ECONOMICS, UNIT_ECONOMICS_RULE,
  FINANCIAL_SURVIVAL, FINANCIAL_RULE,
  COST_PRIORITY,
  EVIDENCE_LEDGER_EVENTS, EVIDENCE_LEDGER_RULE,
  BRAIN_AI_EXECUTION_ROLE,
  COMMERCIAL_READINESS_SCORE, OVERALL_COMMERCIAL_READINESS, READINESS_RULE,
  MARKET_VALIDATION_GATES, GATE_RULE,
  GLOBAL_EXPANSION_RULE,
  CERTIFICATION_LEVELS, FINAL_CERTIFICATION_MES,
  COO_RULE, MES_SYNCHRONIZATION,
} from "@/lib/aurienta/market-execution";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crosshair, Target, Filter, DollarSign, Handshake, Scale, FlaskConical,
  FileText, TrendingDown, HeartPulse, CalendarClock, Trophy, AlertTriangle,
  CheckCircle2, XCircle, Crown, Rocket, Brain, ShieldCheck,
  AlertCircle,
} from "lucide-react";

export const metadata = { title: "Market Execution · AURIENTA" };
export const dynamic = "force-dynamic";

const statusBadge = (s: string) => {
  const cls =
    s === "ACHIEVED" || s === "APPROVED" || s === "PASSED" ? "border-emerald-400/30 text-emerald-300" :
    s === "IN PROGRESS" || s === "IN PROGRESS" || s === "BEING TESTED" ? "border-amber-400/30 text-amber-300" :
    s === "PENDING" || s === "THEORETICAL" ? "border-sky-400/30 text-sky-300" :
    s === "INSUFFICIENT DATA" ? "border-muted-foreground/30 text-muted-foreground" :
    "border-rose-400/30 text-rose-300"; // NOT ACHIEVED / NOT PASSED / NOT STARTED / NOT SUBMITTED
  return <Badge variant="outline" className={`font-mono text-[10px] ${cls}`}>{s}</Badge>;
};

export default async function MarketExecutionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/market-execution");

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
            Market Execution, Anchor Customer Acquisition & Revenue Validation · MES v{MES_VERSION} · Frozen {MES_FROZEN_AT} · Execution Over Architecture
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Market Execution System</h1>
        <p className="font-sans text-sm text-muted-foreground">
          Turning architecture into real partners → real enterprises → real deployments → real evidence → real revenue. Honest status: {EXECUTION_STATUS_REGISTER.filter(r => r.status === "NOT ACHIEVED").length} NOT ACHIEVED · {EXECUTION_STATUS_REGISTER.filter(r => r.status === "PENDING").length} PENDING · {EXECUTION_STATUS_REGISTER.filter(r => r.status === "IN PROGRESS").length} IN PROGRESS · 0 ACHIEVED
        </p>
      </header>

      {/* HONEST Certification banner — the most important card */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-gold" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{FINAL_CERTIFICATION_MES.title}</p>
                <p className="font-serif text-xl font-semibold text-gold-gradient">{FINAL_CERTIFICATION_MES.verdict}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded border border-emerald-400/20 bg-background/30 p-2 text-center">
                <p className="font-serif text-xl font-semibold text-emerald-300">2</p>
                <p className="font-mono text-[9px] text-muted-foreground">Levels achieved</p>
              </div>
              <div className="rounded border border-rose-400/20 bg-background/30 p-2 text-center">
                <p className="font-serif text-xl font-semibold text-rose-300">4</p>
                <p className="font-mono text-[9px] text-muted-foreground">NOT achieved</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-xl font-semibold text-gold">{OVERALL_COMMERCIAL_READINESS}</p>
                <p className="font-mono text-[9px] text-muted-foreground">Commercial Readiness</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-xl font-semibold text-rose-300">0</p>
                <p className="font-mono text-[9px] text-muted-foreground">Gates passed</p>
              </div>
            </div>
          </div>
          <p className="mt-3 font-sans text-sm italic text-gold-gradient">{FINAL_CERTIFICATION_MES.honestStatement}</p>
          <p className="mt-2 font-serif text-sm font-semibold text-center text-gold">EXECUTION NOW HAS PRIORITY OVER ARCHITECTURE.</p>
        </CardContent>
      </Card>

      {/* Execution Integrity Rule — critical */}
      <Card className="mb-6 border-rose-400/20 glass">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-300" />
            <p className="font-serif text-sm font-semibold text-rose-300">EXECUTION INTEGRITY RULE — CLAIM ≠ EVIDENCE ≠ STATUS ≠ TARGET ≠ FORECAST</p>
          </div>
          <p className="mt-1 font-sans text-[11px] text-muted-foreground">{EXECUTION_INTEGRITY_RULE.rule}</p>
          <div className="mt-2 grid gap-1 sm:grid-cols-2">
            {EXECUTION_INTEGRITY_RULE.examples.map(ex => (
              <div key={ex.prohibited} className="rounded border border-rose-400/10 bg-background/30 p-1.5">
                <p className="font-sans text-[10px]"><span className="text-rose-300">✗ PROHIBITED:</span> "{ex.prohibited}"</p>
                <p className="font-sans text-[10px]"><span className="text-emerald-300">✓ CORRECT:</span> "{ex.correct}"</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Honest Execution Status Register — the truth */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Crosshair className="h-4 w-4 text-gold" /> Honest Execution Status Register (current factual state — all zeros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-gold/15">
                  <th className="pb-2 pr-3 font-medium">Capability</th>
                  <th className="pb-2 pr-3 font-medium">Count</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 font-medium">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {EXECUTION_STATUS_REGISTER.map(r => (
                  <tr key={r.capability} className="border-b border-gold/5">
                    <td className="py-1.5 pr-3 font-medium">{r.capability}</td>
                    <td className="py-1.5 pr-3 font-mono text-[11px] text-gold">{r.count}</td>
                    <td className="py-1.5 pr-3">{statusBadge(r.status)}</td>
                    <td className="py-1.5 text-muted-foreground">{r.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Market Validation Gates — the path forward */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <CheckCircle2 className="h-4 w-4 text-gold" /> Market Validation Gates (7 gates — sequential, evidence-required)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {MARKET_VALIDATION_GATES.map(g => (
              <div key={g.gate} className={`rounded border p-2 ${g.status === "PASSED" ? "border-emerald-400/20 bg-emerald-400/5" : g.status === "IN PROGRESS" ? "border-amber-400/20 bg-amber-400/5" : "border-rose-400/20 bg-rose-400/5"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-gold-light">{g.gate}</span>
                  {statusBadge(g.status)}
                </div>
                <p className="font-sans text-[11px] font-medium">{g.name}</p>
                <p className="font-sans text-[10px] text-muted-foreground">{g.criteria}</p>
                <p className="font-sans text-[10px] text-muted-foreground">Evidence: {g.evidence}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 font-sans text-[11px] text-amber-300">{GATE_RULE}</p>
        </CardContent>
      </Card>

      {/* Certification Levels — honest */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Trophy className="h-4 w-4 text-gold" /> Final Execution Certification Levels (strongest evidence-supported = {FINAL_CERTIFICATION_MES.verdict})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CERTIFICATION_LEVELS.map(l => (
              <div key={l.level} className={`rounded border p-2 ${l.achieved ? "border-emerald-400/20 bg-emerald-400/5" : "border-rose-400/20 bg-rose-400/5"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-medium">{l.level}</span>
                  {l.achieved ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <XCircle className="h-4 w-4 text-rose-300" />}
                </div>
                <p className="font-sans text-[10px] text-muted-foreground">{l.requirement}</p>
                <p className="font-sans text-[10px] text-muted-foreground">Evidence: {l.evidence}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Commercial Readiness Score — honest */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Crosshair className="h-4 w-4 text-gold" /> Commercial Readiness Score (evidence-driven, no inflation · Overall {OVERALL_COMMERCIAL_READINESS}/100)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {COMMERCIAL_READINESS_SCORE.map(c => (
              <div key={c.category} className="rounded border border-gold/8 bg-background/30 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-medium">{c.category}</span>
                  <span className={`font-mono text-[11px] ${c.score >= 70 ? "text-emerald-300" : c.score >= 40 ? "text-amber-300" : "text-rose-300"}`}>{c.score}</span>
                </div>
                <p className="font-sans text-[10px] text-muted-foreground">{c.evidence}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 font-sans text-[11px] text-amber-300">{READINESS_RULE}</p>
        </CardContent>
      </Card>

      {/* Anchor Customer Strategy + Qualification */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Target className="h-4 w-4 text-gold" /> Anchor Customer ICP ({IDEAL_CUSTOMER_PROFILE.length} attributes)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {IDEAL_CUSTOMER_PROFILE.map(a => (
                <div key={a.attribute} className="border-b border-gold/5 py-1">
                  <span className="font-sans text-[11px] font-medium">{a.attribute}:</span>
                  <p className="font-sans text-[10px] text-muted-foreground">{a.definition}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Filter className="h-4 w-4 text-gold" /> Anchor Qualification Model ({ANCHOR_QUALIFICATION_MODEL.length} criteria · threshold {QUALIFICATION_RULE.threshold})</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {ANCHOR_QUALIFICATION_MODEL.map(c => (
                <div key={c.criterion} className="flex items-center justify-between border-b border-gold/5 py-1">
                  <div>
                    <span className="font-sans text-[11px] font-medium">{c.criterion}</span>
                    <p className="font-sans text-[10px] text-muted-foreground">{c.minimumThreshold}</p>
                  </div>
                  <Badge variant="outline" className="border-gold/20 font-mono text-[10px]">w{c.weight}</Badge>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground">{QUALIFICATION_RULE.rule}</p>
          </CardContent>
        </Card>
      </div>

      {/* Target Tiers + Sales Pipeline */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Target className="h-4 w-4 text-gold" /> First 100 Target Tiers (current count: 0 — research pending)</CardTitle></CardHeader>
          <CardContent>
            {TARGET_TIERS.map(t => (
              <div key={t.tier} className="border-b border-gold/5 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-medium"><span className="font-mono text-gold-light">{t.tier}</span> {t.description}</span>
                  <span className="font-mono text-[10px] text-rose-300">{t.currentCount}/{t.expectedCount}</span>
                </div>
                <p className="font-sans text-[10px] text-muted-foreground">Qualification: {t.qualificationScore}</p>
              </div>
            ))}
            <p className="mt-2 font-sans text-[10px] text-amber-300">{TARGET_ACCOUNT_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Filter className="h-4 w-4 text-gold" /> Sales Execution Pipeline ({SALES_PIPELINE.length} stages · 0 opportunities)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {SALES_PIPELINE.map(s => (
                <div key={s.stageId} className="border-b border-gold/5 py-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px]"><span className="font-mono text-[10px] text-gold-light">{s.stageId}</span> {s.stage}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{s.expectedDuration}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{PIPELINE_RULE}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Validation + Commercial Offer Validation */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><DollarSign className="h-4 w-4 text-gold" /> Revenue Validation (only collected revenue counts)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {REVENUE_VALIDATION.map(r => (
                <div key={r.metric} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px]">{r.metric}</span>
                  <span className="font-mono text-[10px] text-rose-300">{r.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{REVENUE_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><DollarSign className="h-4 w-4 text-gold" /> Commercial Offer Validation (THEORETICAL vs VALIDATED)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {COMMERCIAL_OFFER_VALIDATION.map(p => (
                <div key={p.package} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{p.package}</span>
                    {statusBadge(p.status)}
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">Theoretical: {p.theoreticalPrice} · Validated: <span className="text-rose-300">{p.validatedPrice}</span></p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{PRICING_VALIDATION_RULE}</p>
          </CardContent>
        </Card>
      </div>

      {/* Partner Execution + Regulatory Engagement */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Handshake className="h-4 w-4 text-gold" /> Partner Execution ({PARTNER_EXECUTION.length} types · 0 signed)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {PARTNER_EXECUTION.map(p => (
                <div key={p.partnerType} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px]"><span className={`font-mono text-[10px] ${p.priority === "P0" ? "text-rose-300" : p.priority === "P1" ? "text-amber-300" : "text-sky-300"}`}>{p.priority}</span> {p.partnerType}</span>
                    <span className="font-mono text-[10px] text-rose-300">{p.signed} signed</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{p.status}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{PARTNER_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Scale className="h-4 w-4 text-gold" /> Regulatory Engagement (honest status)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {REGULATORY_ENGAGEMENT_EXECUTION.map(r => (
                <div key={r.authority} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{r.authority}</span>
                    {statusBadge(r.status)}
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{r.purpose}</p>
                  <p className="font-sans text-[10px] text-muted-foreground">Next: {r.nextAction}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{REGULATORY_TERMINOLOGY_RULE.rule}</p>
          </CardContent>
        </Card>
      </div>

      {/* 90-Day Plan + 12-Month Roadmap */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><CalendarClock className="h-4 w-4 text-gold" /> 90-Day Execution Plan ({NINETY_DAY_PLAN.length} items · all NOT STARTED)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {NINETY_DAY_PLAN.map((p, i) => (
                <div key={i} className="flex items-center justify-between border-b border-gold/5 py-1">
                  <div>
                    <span className="font-mono text-[10px] text-gold-light">{p.day}</span>
                    <span className="font-sans text-[11px] ml-1">{p.priority}</span>
                  </div>
                  {statusBadge(p.status)}
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{NINETY_DAY_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><CalendarClock className="h-4 w-4 text-gold" /> 12-Month Roadmap (TARGET vs ACTUAL)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {TWELVE_MONTH_ROADMAP.map(q => (
                <div key={q.quarter} className="border-b border-gold/5 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{q.quarter}</span>
                    {statusBadge(q.status)}
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground"><span className="text-gold-light">Target:</span> {q.target}</p>
                  <p className="font-sans text-[10px] text-rose-300"><span className="text-muted-foreground">Actual:</span> {q.actual}</p>
                  <p className="font-sans text-[10px] text-amber-300"><span className="text-muted-foreground">Forecast:</span> {q.forecast}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{ROADMAP_RULE}</p>
          </CardContent>
        </Card>
      </div>

      {/* Next 10 Highest-Value Actions + Remaining Blockers */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Rocket className="h-4 w-4 text-gold" /> Next 10 Highest-Value Founder Actions</CardTitle></CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-1">
              {FINAL_CERTIFICATION_MES.next10HighestValueActions.map(a => (
                <li key={a} className="font-sans text-[11px] text-emerald-300">→ {a}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><AlertTriangle className="h-4 w-4 text-gold" /> Remaining Blockers + Evidence Gaps</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-1 font-mono text-[10px] uppercase text-rose-300">Blockers</p>
            <ul className="mb-2 flex flex-col gap-0.5">{FINAL_CERTIFICATION_MES.remainingBlockers.map(b => <li key={b} className="font-sans text-[10px] text-muted-foreground">• {b}</li>)}</ul>
            <p className="mb-1 font-mono text-[10px] uppercase text-amber-300">Evidence Gaps</p>
            <ul className="flex flex-col gap-0.5">{FINAL_CERTIFICATION_MES.evidenceGaps.map(g => <li key={g} className="font-sans text-[10px] text-muted-foreground">• {g}</li>)}</ul>
          </CardContent>
        </Card>
      </div>

      {/* Unit Economics + Financial Survival */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><DollarSign className="h-4 w-4 text-gold" /> Unit Economics (INSUFFICIENT DATA where appropriate)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {UNIT_ECONOMICS.map(u => (
                <div key={u.metric} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px]">{u.metric}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{u.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{UNIT_ECONOMICS_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><DollarSign className="h-4 w-4 text-gold" /> Cash & Financial Survival Controls</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {FINANCIAL_SURVIVAL.map(f => (
                <div key={f.metric} className="border-b border-gold/5 py-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px]">{f.metric}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{f.value}</span>
                  </div>
                  <p className="font-sans text-[10px] text-amber-300">Alert: {f.alert}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-muted-foreground">{FINANCIAL_RULE}</p>
          </CardContent>
        </Card>
      </div>

      {/* Founder Weekly Scorecard + Cost Priority */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Crown className="h-4 w-4 text-gold" /> Founder Weekly Scorecard ({FOUNDER_WEEKLY_SCORECARD.length} sections)</CardTitle></CardHeader>
          <CardContent>
            {FOUNDER_WEEKLY_SCORECARD.map(s => (
              <div key={s.section} className="border-b border-gold/5 py-1">
                <p className="font-sans text-[11px] font-medium text-gold">{s.section}</p>
                <p className="font-sans text-[10px] text-muted-foreground">{s.metrics.join(" · ")}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><DollarSign className="h-4 w-4 text-gold" /> No-Cost / Low-Cost Execution Priority</CardTitle></CardHeader>
          <CardContent>
            {COST_PRIORITY.map(c => (
              <div key={c.priority} className="border-b border-gold/5 py-1.5">
                <p className="font-sans text-[11px] font-medium">{c.priority}</p>
                <p className="font-sans text-[10px] text-muted-foreground">{c.activities.join(", ")}</p>
                <p className="font-sans text-[10px] text-amber-300">{c.principle}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Brain AI Execution Chief of Staff + COO Rule */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Brain className="h-4 w-4 text-gold" /> Brain AI — Execution Chief of Staff</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground">{BRAIN_AI_EXECUTION_ROLE.role}</p>
            <div className="mt-2 max-h-40 overflow-y-auto">
              {BRAIN_AI_EXECUTION_ROLE.behaviors.map(b => (
                <div key={b.question} className="border-b border-gold/5 py-1">
                  <p className="font-sans text-[10px] font-medium text-gold-light">Q: {b.question}</p>
                  <p className="font-sans text-[10px] text-muted-foreground">A: {b.response}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-rose-300">{BRAIN_AI_EXECUTION_ROLE.fabricationProhibition}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 glass-gold">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-gold" />
              <p className="font-serif text-sm font-semibold text-gold-gradient">Most Important COO Rule</p>
            </div>
            <p className="mt-2 font-sans text-[11px] text-muted-foreground">{COO_RULE.rule}</p>
            <p className="mt-1 font-mono text-[10px] uppercase text-gold-light">Primary Metrics</p>
            <div className="flex flex-wrap gap-1">
              {COO_RULE.primaryMetrics.map(m => <Badge key={m} variant="outline" className="border-gold/15 font-mono text-[10px]">{m}</Badge>)}
            </div>
            <p className="mt-2 font-sans text-[11px] italic text-gold-gradient">{COO_RULE.finalMandate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Synchronization */}
      <Card className="border-gold/12 glass">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <p className="font-serif text-base font-semibold text-gold-gradient">MES v{MES_VERSION} Synchronization</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(MES_SYNCHRONIZATION).map(([k, v]) => (
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
