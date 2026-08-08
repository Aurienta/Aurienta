import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  SPRRE_VERSION, SPRRE_FROZEN_AT, CURRENT_BASELINE_SPRRE,
  PARTNER_CATEGORIES, PARTNER_CATEGORY_RULE,
  PARTNER_TARGET_SCHEMA, PARTNER_SCHEMA_RULE,
  PARTNER_SCORING_DIMENSIONS, PARTNER_SCORING_MODEL,
  LAW_FIRM_CAMPAIGN_SCHEMA, LAW_FIRM_CAMPAIGN,
  PARTNER_OUTREACH_SCHEMA, PARTNER_OUTREACH_LIFECYCLE, OUTREACH_RULE,
  INTRODUCTION_PATHS, INTRODUCTION_ENGINE_SPRRE,
  REGULATORY_AUTHORITY_SCHEMA, EGYPT_AUTHORITY_UNIVERSE, REGULATORY_ENGINE_RULE,
  REGULATORY_STATUSES, REGULATORY_STATUS_RULE,
  REGULATORY_BRIEF_SECTIONS, REGULATORY_BRIEF_RULE,
  RELATIONSHIP_GRAPH_ENTITIES, RELATIONSHIP_GRAPH_EDGES, RELATIONSHIP_GRAPH_QUERIES, RELATIONSHIP_GRAPH_RULE,
  PARTNERSHIP_VALUE_TYPES, VALUE_CHAIN_RULE,
  PARTNER_DD_CHECKS, PARTNER_DD_RULE,
  AGREEMENT_TYPES, AGREEMENT_STATE_DISTINCTIONS, AGREEMENT_RULE,
  PARTNER_ACTIVATION_REQUIREMENTS, ACTIVATION_RULE,
  PARTNER_PERFORMANCE_METRICS, PERFORMANCE_RULE,
  DEPENDENCY_MAP,
  FOUNDER_DAILY_COMMAND_SPRRE,
  WEEKLY_REVIEW_SPRRE, WEEKLY_REVIEW_RULE,
  EXECUTION_FUNNEL_SPRRE, FUNNEL_RULE,
  BRAIN_AI_INSTITUTIONAL_AGENT,
  CLAIM_CONTROL_SPRRE, CLAIM_CONTROL_FLOW, CLAIM_CONTROL_RULE,
  EXECUTION_SCORE_SPRRE, OVERALL_EXECUTION_SCORE, SCORE_RULE,
  THIRTY_DAY_PLAN, PLAN_RULE,
  HONEST_CERTIFICATION_SPRRE, FINAL_COO_DIRECTIVE_SPRRE, SPRRE_SYNCHRONIZATION,
} from "@/lib/aurienta/strategic-partners";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Handshake, Scale, Landmark, Share2, Filter, FileText, GitBranch,
  CheckCircle2, AlertTriangle, Trophy, Crown, Brain, Crosshair,
  ShieldCheck, Rocket, Network,
} from "lucide-react";

export const metadata = { title: "Strategic Partners · AURIENTA" };
export const dynamic = "force-dynamic";

const priorityColor = (p: string) =>
  p === "P0" ? "text-rose-300" : p === "P1" ? "text-amber-300" : p === "P2" ? "text-sky-300" : "text-muted-foreground";
const statusColor = (s: string) =>
  s === "APPROVED" ? "text-emerald-300" : s === "NOT RESEARCHED" || s === "NOT STARTED" ? "text-rose-300" : "text-amber-300";
const briefColor = (c: string) =>
  c === "FACT" ? "text-emerald-300" : c === "LEGAL QUESTION" ? "text-amber-300" : c === "ASSUMPTION" ? "text-sky-300" : c === "REQUIRES COUNSEL" ? "text-rose-300" : "text-rose-300";

export default async function StrategicPartnersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/strategic-partners");

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Handshake className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            Strategic Partner, Regulatory & Institutional Relationship Execution · SPRRE v{SPRRE_VERSION} · Frozen {SPRRE_FROZEN_AT} · Relationships Over Plans
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Strategic Partner Command Center</h1>
        <p className="font-sans text-sm text-muted-foreground">
          {PARTNER_CATEGORIES.length} partner categories · {REGULATORY_STATUSES.length} regulatory statuses · {RELATIONSHIP_GRAPH_ENTITIES.length} graph entities · {PARTNER_DD_CHECKS.length} DD checks · {PARTNER_ACTIVATION_REQUIREMENTS.length} activation requirements · {REGULATORY_BRIEF_SECTIONS.length}-section brief. HONEST baseline: {CURRENT_BASELINE_SPRRE.signedStrategicPartners} signed partners · {CURRENT_BASELINE_SPRRE.regulatoryApprovals} regulatory approvals · {CURRENT_BASELINE_SPRRE.formalRegulatoryEngagements} formal engagements · evidence {CURRENT_BASELINE_SPRRE.evidenceCeiling}
        </p>
      </header>

      {/* HONEST Certification banner */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-gold" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{HONEST_CERTIFICATION_SPRRE.title}</p>
                <p className="font-serif text-xl font-semibold text-gold-gradient">{HONEST_CERTIFICATION_SPRRE.verdict}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded border border-rose-400/20 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-rose-300">{CURRENT_BASELINE_SPRRE.signedStrategicPartners}</p><p className="font-mono text-[9px] text-muted-foreground">Signed partners</p></div>
              <div className="rounded border border-rose-400/20 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-rose-300">{CURRENT_BASELINE_SPRRE.regulatoryApprovals}</p><p className="font-mono text-[9px] text-muted-foreground">Regulatory approvals</p></div>
              <div className="rounded border border-rose-400/20 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-rose-300">{CURRENT_BASELINE_SPRRE.formalRegulatoryEngagements}</p><p className="font-mono text-[9px] text-muted-foreground">Formal engagements</p></div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-rose-300">{CURRENT_BASELINE_SPRRE.evidenceCeiling}</p><p className="font-mono text-[9px] text-muted-foreground">Evidence ceiling</p></div>
            </div>
          </div>
          <p className="mt-3 font-sans text-sm italic text-gold-gradient">{HONEST_CERTIFICATION_SPRRE.statement}</p>
        </CardContent>
      </Card>

      {/* Partner Categories (P0-P3) + Law-Firm-First Campaign */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Handshake className="h-4 w-4 text-gold" /> Partner Categories ({PARTNER_CATEGORIES.length} · all 0 signed)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {PARTNER_CATEGORIES.map(c => (
                <div key={c.categoryId} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px]"><span className={`font-mono text-[10px] ${priorityColor(c.priority)}`}>{c.priority}</span> {c.category}</span>
                    <span className="font-mono text-[10px] text-rose-300">{c.signed} signed</span>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{c.status}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{PARTNER_CATEGORY_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Scale className="h-4 w-4 text-gold" /> Law-Firm-First Campaign ({LAW_FIRM_CAMPAIGN_SCHEMA.length} fields)</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Objective:</span> {LAW_FIRM_CAMPAIGN.objective}</p>
            <p className="font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Reason:</span> {LAW_FIRM_CAMPAIGN.reason}</p>
            <p className="mt-1 font-mono text-[10px] text-rose-300">Current candidates researched: {LAW_FIRM_CAMPAIGN.currentCandidatesResearched}</p>
            <div className="mt-2 max-h-40 overflow-y-auto">
              {LAW_FIRM_CAMPAIGN_SCHEMA.map(f => (
                <div key={f.field} className="border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px] font-medium">{f.field}</span>
                  <p className="font-sans text-[9px] text-muted-foreground">Default: {f.defaultIfUnknown}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-rose-300">{LAW_FIRM_CAMPAIGN.rule}</p>
          </CardContent>
        </Card>
      </div>

      {/* Partner Target Schema + Scoring */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Filter className="h-4 w-4 text-gold" /> Partner Target Schema ({PARTNER_TARGET_SCHEMA.length} fields · UNKNOWN default)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {PARTNER_TARGET_SCHEMA.map(f => (
                <div key={f.field} className="border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px] font-medium">{f.field}</span>
                  <p className="font-sans text-[9px] text-muted-foreground">Default: {f.defaultIfUnknown}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{PARTNER_SCHEMA_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Filter className="h-4 w-4 text-gold" /> Partner Scoring ({PARTNER_SCORING_DIMENSIONS.length} dimensions · 0-5 scale)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto">
              {PARTNER_SCORING_DIMENSIONS.map(d => (
                <div key={d.dimension} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px]">{d.dimension}</span>
                  <Badge variant="outline" className="border-gold/20 font-mono text-[10px]">w{d.weight}</Badge>
                </div>
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">Tier Mapping</p>
            {PARTNER_SCORING_MODEL.tierMapping.map(t => (
              <div key={t.range} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                <span className="font-mono text-[10px] text-gold">{t.range}</span>
                <span className={`font-mono text-[10px] ${priorityColor(t.tier)}`}>{t.tier}</span>
                <span className="font-sans text-[10px] text-muted-foreground">{t.meaning}</span>
              </div>
            ))}
            <p className="mt-2 font-sans text-[10px] text-amber-300">Per score: {PARTNER_SCORING_MODEL.perScoreRequired.join(", ")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Regulatory Engagement + Status Model */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Landmark className="h-4 w-4 text-gold" /> Regulatory Engagement ({EGYPT_AUTHORITY_UNIVERSE.length} authorities)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {EGYPT_AUTHORITY_UNIVERSE.map(a => (
                <div key={a.authority} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{a.authority}</span>
                    <Badge variant="outline" className={`font-mono text-[10px] ${a.status === "APPROVED" ? "border-emerald-400/30 text-emerald-300" : "border-rose-400/30 text-rose-300"}`}>{a.status}</Badge>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{a.evidence}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{REGULATORY_ENGINE_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Landmark className="h-4 w-4 text-gold" /> Regulatory Status Model ({REGULATORY_STATUSES.length} explicit statuses)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {REGULATORY_STATUSES.map((s, i) => (
                <Badge key={s} variant="outline" className="border-gold/15 font-mono text-[9px]">{i + 1}. {s}</Badge>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-rose-300">{REGULATORY_STATUS_RULE.rule}</p>
            <p className="mt-1 font-sans text-[10px] text-muted-foreground">{REGULATORY_STATUS_RULE.currentHonestStatus}</p>
          </CardContent>
        </Card>
      </div>

      {/* Regulatory Brief Generator + Relationship Graph */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><FileText className="h-4 w-4 text-gold" /> Regulatory Brief Generator ({REGULATORY_BRIEF_SECTIONS.length} sections)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {REGULATORY_BRIEF_SECTIONS.map(s => (
                <div key={s.section} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px]">{s.section}</span>
                  <span className={`font-mono text-[9px] ${briefColor(s.classification)}`}>{s.classification}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-rose-300">{REGULATORY_BRIEF_RULE.rule}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Network className="h-4 w-4 text-gold" /> Institutional Relationship Graph ({RELATIONSHIP_GRAPH_ENTITIES.length} entities · {RELATIONSHIP_GRAPH_EDGES.length} edges)</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-[10px] uppercase text-gold-light">Entities</p>
            <div className="flex flex-wrap gap-1">
              {RELATIONSHIP_GRAPH_ENTITIES.map(e => <Badge key={e} variant="outline" className="border-gold/10 font-mono text-[9px]">{e}</Badge>)}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">Relationships</p>
            <div className="flex flex-wrap gap-1">
              {RELATIONSHIP_GRAPH_EDGES.map(e => <Badge key={e} variant="outline" className="border-amber-400/20 font-mono text-[9px] text-amber-300">{e}</Badge>)}
            </div>
            <p className="mt-2 font-mono text-[10px] text-rose-300">Current nodes: {RELATIONSHIP_GRAPH_RULE.currentNodes} · edges: {RELATIONSHIP_GRAPH_RULE.currentEdges}</p>
          </CardContent>
        </Card>
      </div>

      {/* Agreement Control + Activation + DD */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><GitBranch className="h-4 w-4 text-gold" /> Agreement Control ({AGREEMENT_TYPES.length} types)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-32 overflow-y-auto">
              {AGREEMENT_TYPES.map(t => <p key={t} className="font-sans text-[10px] text-muted-foreground">• {t}</p>)}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">State Distinctions</p>
            {AGREEMENT_STATE_DISTINCTIONS.map(s => (
              <div key={s.state} className="border-b border-gold/5 py-0.5">
                <span className="font-mono text-[10px] text-gold">{s.state}</span>
                <p className="font-sans text-[9px] text-muted-foreground">{s.meaning}</p>
              </div>
            ))}
            <p className="mt-1 font-sans text-[10px] text-rose-300">{AGREEMENT_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><CheckCircle2 className="h-4 w-4 text-gold" /> Partner Activation ({PARTNER_ACTIVATION_REQUIREMENTS.length} requirements)</CardTitle></CardHeader>
          <CardContent>
            {PARTNER_ACTIVATION_REQUIREMENTS.map((r, i) => (
              <p key={r} className="font-sans text-[10px] text-muted-foreground">{i + 1}. {r}</p>
            ))}
            <p className="mt-2 font-sans text-[10px] text-rose-300">{ACTIVATION_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><ShieldCheck className="h-4 w-4 text-gold" /> Partner DD ({PARTNER_DD_CHECKS.length} checks)</CardTitle></CardHeader>
          <CardContent>
            {PARTNER_DD_CHECKS.map((c, i) => (
              <p key={c} className="font-sans text-[10px] text-muted-foreground">{i + 1}. {c}</p>
            ))}
            <p className="mt-2 font-sans text-[10px] text-rose-300">{PARTNER_DD_RULE}</p>
          </CardContent>
        </Card>
      </div>

      {/* Execution Funnel + Execution Score */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Crosshair className="h-4 w-4 text-gold" /> Execution Funnel ({EXECUTION_FUNNEL_SPRRE.length} stages · all 0)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {EXECUTION_FUNNEL_SPRRE.map((f, i) => (
                <div key={f.stage} className="rounded border border-gold/8 bg-background/30 p-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-gold-light">{i + 1}</span>
                    <span className="font-mono text-[11px] text-rose-300">{f.currentCount}</span>
                  </div>
                  <p className="font-sans text-[10px] font-medium">{f.stage}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{FUNNEL_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Trophy className="h-4 w-4 text-gold" /> Execution Score ({EXECUTION_SCORE_SPRRE.length} dimensions · overall {OVERALL_EXECUTION_SCORE}/100)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {EXECUTION_SCORE_SPRRE.map(d => (
                <div key={d.dimension} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <div>
                    <span className="font-sans text-[11px]">{d.dimension}</span>
                    <p className="font-sans text-[9px] text-muted-foreground">{d.evidence}</p>
                  </div>
                  <span className={`font-mono text-[10px] ${d.score >= 70 ? "text-emerald-300" : d.score >= 40 ? "text-amber-300" : "text-rose-300"}`}>{d.score}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{SCORE_RULE}</p>
          </CardContent>
        </Card>
      </div>

      {/* 30-Day Plan + Founder Daily Command */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Rocket className="h-4 w-4 text-gold" /> First 30-Day Execution Plan ({THIRTY_DAY_PLAN.length} phases · all NOT STARTED)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {THIRTY_DAY_PLAN.map(p => (
                <div key={p.days} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-gold">{p.days}</span>
                    <Badge variant="outline" className="border-rose-400/30 font-mono text-[9px] text-rose-300">{p.status}</Badge>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{p.activities.join(" · ")}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-rose-300">{PLAN_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Crosshair className="h-4 w-4 text-gold" /> Founder Daily Command + Top 10 Actions</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-[10px] uppercase text-gold-light">Daily Sections ({FOUNDER_DAILY_COMMAND_SPRRE.sections.length})</p>
            <div className="flex flex-wrap gap-1">
              {FOUNDER_DAILY_COMMAND_SPRRE.sections.map(s => <Badge key={s} variant="outline" className="border-gold/15 font-mono text-[9px]">{s}</Badge>)}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase text-emerald-300">Top 10 Actions</p>
            <ol className="flex flex-col gap-0.5">
              {FOUNDER_DAILY_COMMAND_SPRRE.currentTopActions.map(a => (
                <li key={a} className="font-sans text-[10px] text-emerald-300">→ {a}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Claim Control + Brain AI */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><AlertTriangle className="h-4 w-4 text-gold" /> Claim Control ({CLAIM_CONTROL_SPRRE.length} institutional claims)</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-[10px] text-gold">Flow: {CLAIM_CONTROL_FLOW.join(" → ")}</p>
            <div className="mt-2 max-h-48 overflow-y-auto">
              {CLAIM_CONTROL_SPRRE.map(c => (
                <div key={c.prohibited} className="border-b border-gold/5 py-1">
                  <p className="font-sans text-[10px] text-rose-300">✗ PROHIBITED: "{c.prohibited}"</p>
                  <p className="font-sans text-[10px] text-emerald-300">✓ CORRECT: "{c.correct}"</p>
                  <p className="font-sans text-[9px] text-muted-foreground">{c.condition}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{CLAIM_CONTROL_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Brain className="h-4 w-4 text-gold" /> Brain AI — Institutional Relationship Chief of Staff</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground">{BRAIN_AI_INSTITUTIONAL_AGENT.role}</p>
            <div className="mt-2 max-h-40 overflow-y-auto">
              {BRAIN_AI_INSTITUTIONAL_AGENT.behaviors.map(b => (
                <div key={b.question} className="border-b border-gold/5 py-1">
                  <p className="font-sans text-[10px] font-medium text-gold-light">Q: {b.question}</p>
                  <p className="font-sans text-[10px] text-muted-foreground">A: {b.response}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-rose-300">Never fabricate: {BRAIN_AI_INSTITUTIONAL_AGENT.neverFabricate.join(", ")}</p>
            <p className="mt-1 font-sans text-[10px] text-amber-300">{BRAIN_AI_INSTITUTIONAL_AGENT.unknownHandling}</p>
          </CardContent>
        </Card>
      </div>

      {/* Dependency Map + Weekly Review */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Network className="h-4 w-4 text-gold" /> Regulatory + Partner Dependency Map</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Structure:</span> {DEPENDENCY_MAP.structure}</p>
            <p className="mt-2 font-sans text-[11px] text-amber-300"><span className="text-gold-light">Blocker example:</span> {DEPENDENCY_MAP.blockerChainExample}</p>
            <p className="mt-2 font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Rule:</span> {DEPENDENCY_MAP.rule}</p>
            <p className="mt-1 font-sans text-[11px] text-rose-300"><span className="text-gold-light">Current blockers:</span> {DEPENDENCY_MAP.currentBlockers}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Crosshair className="h-4 w-4 text-gold" /> Weekly Review ({WEEKLY_REVIEW_SPRRE.length} metrics · ACTUAL/TARGET/FORECAST)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {WEEKLY_REVIEW_SPRRE.map(m => (
                <div key={m.metric} className="border-b border-gold/5 py-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px]">{m.metric}</span>
                    <span className="font-mono text-[10px] text-rose-300">{m.actual}</span>
                  </div>
                  <p className="font-sans text-[9px] text-muted-foreground">Target: {m.target} · Forecast: {m.forecast}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{WEEKLY_REVIEW_RULE}</p>
          </CardContent>
        </Card>
      </div>

      {/* Final COO Directive + Synchronization */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-gold" />
            <p className="font-serif text-lg font-semibold text-gold-gradient">Final COO Directive — The Execution Flywheel</p>
          </div>
          <p className="mt-2 font-sans text-sm text-muted-foreground">{FINAL_COO_DIRECTIVE_SPRRE.rule}</p>
          <p className="mt-2 font-mono text-sm font-semibold text-center text-gold-gradient">{FINAL_COO_DIRECTIVE_SPRRE.flywheel}</p>
          <p className="mt-2 font-sans text-sm italic text-gold-gradient">{FINAL_COO_DIRECTIVE_SPRRE.ultimateRule}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {FINAL_COO_DIRECTIVE_SPRRE.principles.map(p => <Badge key={p} variant="outline" className="border-gold/30 font-mono text-[9px] text-gold">{p}</Badge>)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-gold/12 glass">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <p className="font-serif text-base font-semibold text-gold-gradient">SPRRE v{SPRRE_VERSION} Synchronization</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(SPRRE_SYNCHRONIZATION).map(([k, v]) => (
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
