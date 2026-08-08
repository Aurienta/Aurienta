import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  MAS_VERSION, MAS_FROZEN_AT, FACTUAL_BASELINE,
  TARGET_ACCOUNT_ENGINE, TARGET_ENGINE_RULE, TARGETS_ENTERED,
  TARGET_SEGMENTATION, CAPACITY_RULE,
  SOURCING_METHODOLOGY, EGYPT_MARKET_FOCUS,
  FIRST_25_PROCESS, FIRST_25_RULE,
  OUTREACH_WORKFLOW, OUTREACH_SENT, OUTREACH_QUALITY,
  DISCOVERY_SYSTEM, PROBLEM_VALIDATION,
  FIRST_CUSTOMER_OFFER, PILOT_CONVERSION,
  REVENUE_CLASSIFICATION, REVENUE_RULE,
  RELATIONSHIP_MAP_SCHEMA, RELATIONSHIP_STRENGTH_SCALE, RELATIONSHIPS_RECORDED, RELATIONSHIP_RULE,
  INTRODUCTION_ENGINE,
  DAILY_COMMAND,
  CONVERSION_FUNNEL, FUNNEL_RULE,
  WEEKLY_REVIEW, WEEKLY_REVIEW_RULE,
  MARKET_LEARNING_LOOP,
  LOST_DEAL_REASONS, LOST_DEAL_RULE,
  EVIDENCE_HIERARCHY, EVIDENCE_HIERARCHY_RULE,
  BRAIN_AI_MARKET_AGENT,
  WEEKLY_EXECUTION_TARGETS, WEEKLY_TARGET_RULE,
  FOUNDER_TIME_ALLOCATION, TIME_ALLOCATION_RULE,
  FIRST_CUSTOMER_STANDARD, FIRST_PARTNER_STANDARD,
  REGULATORY_ACTIVATION, REGULATORY_STATUS_LANGUAGE, REGULATORY_LANGUAGE_RULE,
  DATA_INTEGRITY,
  HONEST_CERTIFICATION, COO_DIRECTIVE, MAS_SYNCHRONIZATION,
} from "@/lib/aurienta/market-activation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target, Filter, Search, Rocket, MessageSquare, Microscope,
  DollarSign, Share2, Crosshair, TrendingDown, RefreshCw, Brain,
  Crown, AlertTriangle, CheckCircle2, XCircle, Trophy, Zap, Clock,
} from "lucide-react";

export const metadata = { title: "Market Activation · AURIENTA" };
export const dynamic = "force-dynamic";

export default async function MarketActivationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/market-activation");

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            Market Activation System · MAS v{MAS_VERSION} · Frozen {MAS_FROZEN_AT} · Market Execution Is Now The Product
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Founder Market Activation</h1>
        <p className="font-sans text-sm text-muted-foreground">
          First 100 target engine · {OUTREACH_WORKFLOW.length}-stage outreach · {DISCOVERY_SYSTEM.length}-section discovery · Evidence E0-E9 · Relationship map 0-5 · Daily command · Weekly review. HONEST baseline: {FACTUAL_BASELINE.targetsResearched} targets · {FACTUAL_BASELINE.outreachSent} outreach · {FACTUAL_BASELINE.meetingsHeld} meetings · {FACTUAL_BASELINE.opportunities} opportunities · {FACTUAL_BASELINE.collectedRevenue} EGP collected · Evidence level {FACTUAL_BASELINE.highestEvidenceLevel}
        </p>
      </header>

      {/* HONEST Certification + Factual Baseline */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-gold" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{HONEST_CERTIFICATION.title}</p>
                <p className="font-serif text-xl font-semibold text-gold-gradient">{HONEST_CERTIFICATION.verdict}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded border border-emerald-400/20 bg-background/30 p-2 text-center">
                <p className="font-serif text-lg font-semibold text-emerald-300">{HONEST_CERTIFICATION.achieved.length}</p>
                <p className="font-mono text-[9px] text-muted-foreground">Achieved</p>
              </div>
              <div className="rounded border border-rose-400/20 bg-background/30 p-2 text-center">
                <p className="font-serif text-lg font-semibold text-rose-300">{HONEST_CERTIFICATION.notAchieved.length}</p>
                <p className="font-mono text-[9px] text-muted-foreground">NOT achieved</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-lg font-semibold text-gold">{HONEST_CERTIFICATION.readinessScore}</p>
                <p className="font-mono text-[9px] text-muted-foreground">Readiness /100</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-lg font-semibold text-rose-300">{HONEST_CERTIFICATION.evidenceLevel}</p>
                <p className="font-mono text-[9px] text-muted-foreground">Evidence level</p>
              </div>
            </div>
          </div>
          <p className="mt-3 font-sans text-sm italic text-gold-gradient">{HONEST_CERTIFICATION.statement}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded border border-emerald-400/10 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-emerald-300">Achieved</p>
              {HONEST_CERTIFICATION.achieved.map(a => <p key={a} className="font-sans text-[10px] text-muted-foreground">✓ {a}</p>)}
            </div>
            <div className="rounded border border-rose-400/10 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-rose-300">NOT Achieved (no evidence)</p>
              {HONEST_CERTIFICATION.notAchieved.map(n => <p key={n} className="font-sans text-[10px] text-muted-foreground">✗ {n}</p>)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Command — Top 5 (the Founder's immediate view) */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Crosshair className="h-4 w-4 text-gold" /> Founder Daily Command — Top 5 (starts EMPTY; execution fills)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded border border-gold/10 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-emerald-300">Top 5 Actions Today</p>
              <p className="font-sans text-[11px] text-muted-foreground">{DAILY_COMMAND.top5Actions.current}</p>
              <p className="font-mono text-[9px] text-muted-foreground">Fields: {DAILY_COMMAND.top5Actions.fields.join(", ")}</p>
            </div>
            <div className="rounded border border-gold/10 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-rose-300">Top 5 Blockers</p>
              <p className="font-sans text-[11px] text-muted-foreground">{DAILY_COMMAND.top5Blockers.current}</p>
              <p className="font-mono text-[9px] text-muted-foreground">Fields: {DAILY_COMMAND.top5Blockers.fields.join(", ")}</p>
            </div>
            <div className="rounded border border-gold/10 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-amber-300">Top 5 Opportunities</p>
              <p className="font-sans text-[11px] text-muted-foreground">{DAILY_COMMAND.top5Opportunities.current}</p>
              <p className="font-mono text-[9px] text-muted-foreground">Fields: {DAILY_COMMAND.top5Opportunities.fields.join(", ")}</p>
            </div>
            <div className="rounded border border-gold/10 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-sky-300">Top 5 Relationships</p>
              <p className="font-sans text-[11px] text-muted-foreground">{DAILY_COMMAND.top5Relationships.current}</p>
              <p className="font-mono text-[9px] text-muted-foreground">Fields: {DAILY_COMMAND.top5Relationships.fields.join(", ")}</p>
            </div>
          </div>
          <p className="mt-2 font-sans text-[10px] text-amber-300">{DAILY_COMMAND.rule}</p>
        </CardContent>
      </Card>

      {/* Evidence Hierarchy E0-E9 — critical */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Trophy className="h-4 w-4 text-gold" /> Evidence Hierarchy (E0-E9) — current highest: {EVIDENCE_HIERARCHY_RULE.currentHighest}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-5">
            {EVIDENCE_HIERARCHY.map(e => (
              <div key={e.level} className={`rounded border p-1.5 ${e.level === "E0" ? "border-rose-400/30 bg-rose-400/5" : "border-gold/8 bg-background/30"}`}>
                <p className={`font-mono text-[11px] font-semibold ${e.level === "E0" ? "text-rose-300" : "text-gold"}`}>{e.level}</p>
                <p className="font-sans text-[10px] font-medium">{e.name}</p>
                <p className="font-sans text-[9px] text-muted-foreground">{e.description}</p>
                {e.level === "E0" && <p className="font-mono text-[9px] text-rose-300">← CURRENT</p>}
              </div>
            ))}
          </div>
          <p className="mt-2 font-sans text-[10px] text-amber-300">{EVIDENCE_HIERARCHY_RULE.rule}</p>
          <p className="font-sans text-[10px] text-muted-foreground">{EVIDENCE_HIERARCHY_RULE.climbRule}</p>
        </CardContent>
      </Card>

      {/* Conversion Funnel — all zeros */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <TrendingDown className="h-4 w-4 text-gold" /> Execution Conversion Funnel ({CONVERSION_FUNNEL.length} stages · all 0 · rates INSUFFICIENT DATA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {CONVERSION_FUNNEL.map((f, i) => (
              <div key={f.stage} className="rounded border border-gold/8 bg-background/30 p-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] text-gold-light">{i + 1}</span>
                  <span className="font-mono text-[11px] text-rose-300">{f.currentCount}</span>
                </div>
                <p className="font-sans text-[10px] font-medium">{f.stage}</p>
                <p className="font-mono text-[9px] text-muted-foreground">Rate: {f.conversionRate}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 font-sans text-[10px] text-amber-300">{FUNNEL_RULE}</p>
        </CardContent>
      </Card>

      {/* First 100 Target Engine + Target Segmentation */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Target className="h-4 w-4 text-gold" /> First 100 Target Account Engine ({TARGET_ACCOUNT_ENGINE.length} fields · {TARGETS_ENTERED} entered)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {TARGET_ACCOUNT_ENGINE.map(f => (
                <div key={f.field} className="border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px] font-medium">{f.field}{f.required && <span className="text-rose-300"> *</span>}</span>
                  <p className="font-sans text-[9px] text-muted-foreground">Default: {f.defaultIfUnknown}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{TARGET_ENGINE_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Filter className="h-4 w-4 text-gold" /> Target Segmentation (P0-P3 · all 0 current)</CardTitle></CardHeader>
          <CardContent>
            {TARGET_SEGMENTATION.map(t => (
              <div key={t.tier} className="border-b border-gold/5 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-medium">{t.tier}</span>
                  <span className="font-mono text-[10px] text-rose-300">{t.currentCount}</span>
                </div>
                <p className="font-sans text-[10px] text-muted-foreground">{t.description}</p>
                <p className="font-sans text-[10px] text-gold-light">Capacity: {t.capacityRule}</p>
              </div>
            ))}
            <p className="mt-2 font-sans text-[10px] text-amber-300">{CAPACITY_RULE}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sourcing Methodology + Egypt Market */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Search className="h-4 w-4 text-gold" /> Target Sourcing Methodology ({SOURCING_METHODOLOGY.confidenceLevels.length} confidence levels)</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-[10px] uppercase text-gold-light">Permitted Sources</p>
            <div className="flex flex-wrap gap-1">
              {SOURCING_METHODOLOGY.permittedSources.map(s => <Badge key={s} variant="outline" className="border-gold/10 font-mono text-[9px]">{s}</Badge>)}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">Confidence Levels</p>
            {SOURCING_METHODOLOGY.confidenceLevels.map(c => (
              <div key={c.level} className="border-b border-gold/5 py-0.5">
                <span className={`font-mono text-[10px] ${c.level === "HIGH" ? "text-emerald-300" : c.level === "MEDIUM" ? "text-amber-300" : "text-rose-300"}`}>{c.level}</span>
                <span className="font-sans text-[10px] text-muted-foreground"> — {c.meaning} ({c.treatment})</span>
              </div>
            ))}
            <p className="mt-2 font-sans text-[10px] text-amber-300">{SOURCING_METHODOLOGY.rule}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Target className="h-4 w-4 text-gold" /> First Market: {EGYPT_MARKET_FOCUS.market}</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {EGYPT_MARKET_FOCUS.targetCategories.map(c => (
                <p key={c} className="font-sans text-[11px] text-muted-foreground">• {c}</p>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{EGYPT_MARKET_FOCUS.rule}</p>
          </CardContent>
        </Card>
      </div>

      {/* First 25 Process + Outreach Workflow */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Filter className="h-4 w-4 text-gold" /> First 25 Priority Process ({FIRST_25_PROCESS.length} steps per target)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {FIRST_25_PROCESS.map(s => (
                <div key={s.step} className="border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px]"><span className="font-mono text-[10px] text-gold-light">{s.step}.</span> {s.action}</span>
                  <p className="font-sans text-[10px] text-muted-foreground">{s.detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{FIRST_25_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><MessageSquare className="h-4 w-4 text-gold" /> Founder Outreach System ({OUTREACH_WORKFLOW.length} stages · {OUTREACH_SENT} sent)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {OUTREACH_WORKFLOW.map(s => (
                <div key={s.stageId} className="border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px]"><span className="font-mono text-[10px] text-gold-light">{s.stageId}</span> {s.stage}</span>
                  <p className="font-sans text-[10px] text-muted-foreground">Next: {s.nextAction}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{OUTREACH_QUALITY.rule}</p>
          </CardContent>
        </Card>
      </div>

      {/* Discovery + Problem Validation */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Microscope className="h-4 w-4 text-gold" /> Discovery Meeting System ({DISCOVERY_SYSTEM.length} sections)</CardTitle></CardHeader>
          <CardContent>
            {DISCOVERY_SYSTEM.map(d => (
              <div key={d.section} className="border-b border-gold/5 py-1">
                <p className="font-sans text-[11px] font-medium text-gold">{d.section}</p>
                <p className="font-sans text-[10px] text-muted-foreground">{d.captureItems.join(" · ")}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><AlertTriangle className="h-4 w-4 text-gold" /> Problem Validation (no premature pitching)</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Sequence:</span> {PROBLEM_VALIDATION.sequence}</p>
            <p className="mt-2 font-sans text-[11px] text-amber-300">{PROBLEM_VALIDATION.rule}</p>
            <p className="mt-1 font-sans text-[11px] text-rose-300">{PROBLEM_VALIDATION.disqualificationRule}</p>
            <div className="mt-2 rounded border border-gold/8 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-gold-light">First Customer Offer</p>
              <p className="font-sans text-[10px] text-muted-foreground">{FIRST_CUSTOMER_OFFER.rule}</p>
              <div className="flex flex-wrap gap-1">
                {FIRST_CUSTOMER_OFFER.offerTypes.map(o => <Badge key={o} variant="outline" className="border-gold/10 font-mono text-[9px]">{o}</Badge>)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Classification + Pilot Conversion */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><DollarSign className="h-4 w-4 text-gold" /> Revenue Classification (only COLLECTED counts)</CardTitle></CardHeader>
          <CardContent>
            {REVENUE_CLASSIFICATION.map(r => (
              <div key={r.classification} className="flex items-center justify-between border-b border-gold/5 py-1">
                <div>
                  <span className="font-sans text-[11px] font-medium">{r.classification}</span>
                  <p className="font-sans text-[10px] text-muted-foreground">{r.definition}</p>
                </div>
                <span className={`font-mono text-[11px] ${r.classification === "Collected" ? "text-rose-300" : "text-muted-foreground"}`}>{r.currentValue}</span>
              </div>
            ))}
            <p className="mt-2 font-sans text-[10px] text-amber-300">{REVENUE_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Rocket className="h-4 w-4 text-gold" /> Pilot Conversion ({PILOT_CONVERSION.stages.length} stages)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {PILOT_CONVERSION.stages.map((s, i) => (
                <Badge key={s} variant="outline" className="border-gold/15 font-mono text-[9px]">{i + 1}. {s}</Badge>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{PILOT_CONVERSION.rule}</p>
            <p className="font-sans text-[10px] text-muted-foreground">{PILOT_CONVERSION.conversionGate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Relationship Map + Introduction Engine */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Share2 className="h-4 w-4 text-gold" /> Relationship Map ({RELATIONSHIP_MAP_SCHEMA.length} fields · {RELATIONSHIPS_RECORDED} recorded)</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-[10px] uppercase text-gold-light">Strength Scale (0-5)</p>
            {RELATIONSHIP_STRENGTH_SCALE.map(s => (
              <div key={s.score} className="border-b border-gold/5 py-0.5">
                <span className={`font-mono text-[10px] ${s.score === 0 ? "text-rose-300" : "text-gold"}`}>{s.score}</span>
                <span className="font-sans text-[10px] font-medium"> — {s.meaning}</span>
                <p className="font-sans text-[9px] text-muted-foreground">Evidence: {s.evidenceRequired}</p>
              </div>
            ))}
            <p className="mt-2 font-sans text-[10px] text-amber-300">{RELATIONSHIP_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Share2 className="h-4 w-4 text-gold" /> Introduction Engine</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Question:</span> {INTRODUCTION_ENGINE.question}</p>
            <p className="font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Method:</span> {INTRODUCTION_ENGINE.method}</p>
            <p className="font-sans text-[11px] text-rose-300"><span className="text-gold-light">Rule:</span> {INTRODUCTION_ENGINE.rule}</p>
            <p className="mt-2 font-sans text-[11px] text-amber-300">{INTRODUCTION_ENGINE.currentStatus}</p>
          </CardContent>
        </Card>
      </div>

      {/* Brain AI Market Agent + Weekly Review */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Brain className="h-4 w-4 text-gold" /> Brain AI — Founder Market Agent</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground">{BRAIN_AI_MARKET_AGENT.role}</p>
            <div className="mt-2 max-h-40 overflow-y-auto">
              {BRAIN_AI_MARKET_AGENT.behaviors.map(b => (
                <div key={b.question} className="border-b border-gold/5 py-1">
                  <p className="font-sans text-[10px] font-medium text-gold-light">Q: {b.question}</p>
                  <p className="font-sans text-[10px] text-muted-foreground">A: {b.response}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-rose-300">{BRAIN_AI_MARKET_AGENT.fabricationProhibition}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><RefreshCw className="h-4 w-4 text-gold" /> Founder Weekly Review ({WEEKLY_REVIEW.length} sections)</CardTitle></CardHeader>
          <CardContent>
            {WEEKLY_REVIEW.map(r => (
              <div key={r.section} className="border-b border-gold/5 py-0.5">
                <span className="font-mono text-[10px] text-gold">{r.section}</span>
                <p className="font-sans text-[10px] text-muted-foreground">{r.content}</p>
              </div>
            ))}
            <p className="mt-2 font-sans text-[10px] text-amber-300">{WEEKLY_REVIEW_RULE}</p>
          </CardContent>
        </Card>
      </div>

      {/* Founder Time Allocation + Weekly Targets */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Clock className="h-4 w-4 text-gold" /> Founder Time Allocation ({FOUNDER_TIME_ALLOCATION.length} priorities)</CardTitle></CardHeader>
          <CardContent>
            {FOUNDER_TIME_ALLOCATION.map(t => (
              <div key={t.activity} className="border-b border-gold/5 py-1">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-medium">{t.activity}</span>
                  <Badge variant="outline" className={`font-mono text-[10px] ${t.priority === "P0" ? "border-rose-400/30 text-rose-300" : t.priority === "P1" ? "border-amber-400/30 text-amber-300" : "border-sky-400/30 text-sky-300"}`}>{t.priority}</Badge>
                </div>
                <p className="font-sans text-[10px] text-muted-foreground">{t.principle}</p>
              </div>
            ))}
            <p className="mt-2 font-sans text-[10px] text-amber-300">{TIME_ALLOCATION_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Target className="h-4 w-4 text-gold" /> Weekly Execution Targets ({WEEKLY_EXECUTION_TARGETS.length} sections)</CardTitle></CardHeader>
          <CardContent>
            {WEEKLY_EXECUTION_TARGETS.map(s => (
              <div key={s.section} className="border-b border-gold/5 py-1">
                <p className="font-sans text-[11px] font-medium text-gold">{s.section}</p>
                <p className="font-sans text-[10px] text-muted-foreground">{s.targets.join(" · ")}</p>
                <p className="font-mono text-[9px] text-rose-300">Current: {s.currentWeek}</p>
              </div>
            ))}
            <p className="mt-2 font-sans text-[10px] text-amber-300">{WEEKLY_TARGET_RULE}</p>
          </CardContent>
        </Card>
      </div>

      {/* Regulatory Activation + Lost Deal Analysis */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><AlertTriangle className="h-4 w-4 text-gold" /> Regulatory Activation + Status Language</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Move:</span> {REGULATORY_ACTIVATION.moveFrom}</p>
            <p className="font-mono text-[10px] uppercase text-gold-light">Before Submission</p>
            <p className="font-sans text-[10px] text-muted-foreground">{REGULATORY_ACTIVATION.beforeSubmission.join(" · ")}</p>
            <p className="mt-1 font-sans text-[10px] text-amber-300">{REGULATORY_ACTIVATION.rule}</p>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">Status Language ({REGULATORY_STATUS_LANGUAGE.length})</p>
            <div className="max-h-32 overflow-y-auto">
              {REGULATORY_STATUS_LANGUAGE.map(s => (
                <div key={s.status} className="border-b border-gold/5 py-0.5">
                  <span className="font-mono text-[10px] text-gold">{s.status}</span>
                  <span className="font-sans text-[10px] text-muted-foreground"> — {s.meaning}</span>
                </div>
              ))}
            </div>
            <p className="mt-1 font-sans text-[10px] text-rose-300">{REGULATORY_LANGUAGE_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><TrendingDown className="h-4 w-4 text-gold" /> Lost Deal Analysis ({LOST_DEAL_REASONS.length} reasons · {LOST_DEAL_RULE.currentLosses} losses)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {LOST_DEAL_REASONS.map(r => <Badge key={r} variant="outline" className="border-gold/10 font-mono text-[9px]">{r}</Badge>)}
            </div>
            <p className="mt-2 font-sans text-[11px] text-muted-foreground">{LOST_DEAL_RULE.rule}</p>
            <p className="font-sans text-[11px] text-amber-300">Escalation: {LOST_DEAL_RULE.escalationThreshold}+ same reason → REPEATED MARKET OBJECTION → Founder review</p>
            <p className="font-sans text-[11px] text-rose-300">{LOST_DEAL_RULE.redesignRule}</p>
          </CardContent>
        </Card>
      </div>

      {/* Next 10 Actions + Blockers + Evidence Gaps */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Rocket className="h-4 w-4 text-gold" /> Next 10 Highest-Value Founder Actions</CardTitle></CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-1">
              {HONEST_CERTIFICATION.next10Actions.map(a => (
                <li key={a} className="font-sans text-[11px] text-emerald-300">→ {a}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><AlertTriangle className="h-4 w-4 text-gold" /> Actual Blockers + Evidence Gaps</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-1 font-mono text-[10px] uppercase text-rose-300">Blockers</p>
            <ul className="mb-2 flex flex-col gap-0.5">{HONEST_CERTIFICATION.actualBlockers.map(b => <li key={b} className="font-sans text-[10px] text-muted-foreground">• {b}</li>)}</ul>
            <p className="mb-1 font-mono text-[10px] uppercase text-amber-300">Evidence Gaps</p>
            <ul className="flex flex-col gap-0.5">{HONEST_CERTIFICATION.evidenceGaps.map(g => <li key={g} className="font-sans text-[10px] text-muted-foreground">• {g}</li>)}</ul>
          </CardContent>
        </Card>
      </div>

      {/* COO Directive — the flywheel */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-gold" />
            <p className="font-serif text-lg font-semibold text-gold-gradient">COO Directive — The Execution Flywheel</p>
          </div>
          <p className="mt-2 font-sans text-sm text-muted-foreground">{COO_DIRECTIVE.rule}</p>
          <p className="mt-2 font-mono text-sm font-semibold text-center text-gold-gradient">{COO_DIRECTIVE.flywheel}</p>
          <p className="mt-2 font-sans text-sm italic text-gold-gradient">{COO_DIRECTIVE.mandate}</p>
        </CardContent>
      </Card>

      {/* Synchronization */}
      <Card className="border-gold/12 glass">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gold" />
            <p className="font-serif text-base font-semibold text-gold-gradient">MAS v{MAS_VERSION} Synchronization</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(MAS_SYNCHRONIZATION).map(([k, v]) => (
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
