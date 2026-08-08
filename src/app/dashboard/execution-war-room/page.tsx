import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  FIEW_VERSION, FIEW_FROZEN_AT, FOUNDER_IDENTITY, FIEW_BASELINE,
  WAR_ROOM_QUESTIONS, ACTION_RANKING_FORMULA, ACTION_FIELDS,
  CUSTOMER_SCOREBOARD, PARTNER_SCOREBOARD, REGULATORY_SCOREBOARD,
  THIRTY_DAY_WEEKLY_PLAN, WEEKLY_RULE,
  FOUNDER_TIME_ALLOCATION, TIME_RULE,
  BLOCKER_FIELDS, BLOCKER_SEVERITY, TOP_5_BLOCKERS_RULE,
  ACTIVITY_VS_OUTCOME,
  OBJECTION_FIELDS, OBJECTION_FREQUENCY, OBJECTION_RULE,
  PRODUCT_CHANGE_FLOW, PRODUCT_CHANGE_RULE,
  COMMERCIAL_TRUTH_MODEL, PARTNER_TRUTH_MODEL, REGULATORY_TRUTH_MODEL,
  EVIDENCE_EVENTS, EVIDENCE_RECORD_FIELDS, EVIDENCE_RULE,
  BRAIN_AI_EXECUTION_COS,
  FOUNDER_EXECUTION_SCORE_FIEW, OVERALL_EXECUTION_SCORE_FIEW, SCORE_RULE_FIEW,
  SUCCESS_CRITERIA, SUCCESS_RULE,
  DAY_30_REVIEW,
  HONEST_CERTIFICATION_FIEW, FINAL_COO_DIRECTIVE_FIEW, FIEW_SYNCHRONIZATION,
} from "@/lib/aurienta/execution-war-room";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crown, Crosshair, Target, Handshake, Landmark, DollarSign,
  AlertTriangle, RefreshCw, Filter, Database, Brain, Trophy,
  CheckCircle2, XCircle, Rocket, ShieldCheck, Clock,
} from "lucide-react";

export const metadata = { title: "Execution War Room · AURIENTA" };
export const dynamic = "force-dynamic";

export default async function ExecutionWarRoomPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/execution-war-room");

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            First 30-Day Institutional Execution & Evidence War Room · FIEW v{FIEW_VERSION} · Frozen {FIEW_FROZEN_AT} · Reality Over Architecture
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Execution War Room</h1>
        <p className="font-sans text-sm text-muted-foreground">
          4-week campaign · {CUSTOMER_SCOREBOARD.length} customer metrics · {PARTNER_SCOREBOARD.length} partner metrics · {REGULATORY_SCOREBOARD.length} regulatory metrics · {SUCCESS_CRITERIA.length} success targets. HONEST baseline: {FIEW_BASELINE.customers} customers · {FIEW_BASELINE.signedPartners} partners · {FIEW_BASELINE.regulatoryApprovals} regulatory approvals · {FIEW_BASELINE.collectedRevenue} EGP · evidence {FIEW_BASELINE.evidenceCeiling}
        </p>
      </header>

      {/* Founder Identity — prominent, first card */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-gold" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Founder Identity — Canonical (Enforced)</p>
              <p className="font-serif text-2xl font-semibold text-gold-gradient">{FOUNDER_IDENTITY.name} — {FOUNDER_IDENTITY.title}</p>
              <p className="font-sans text-sm text-muted-foreground">Ownership: {FOUNDER_IDENTITY.ownership}</p>
            </div>
          </div>
          <p className="mt-2 font-sans text-[11px] text-muted-foreground">{FOUNDER_IDENTITY.statement}</p>
          <p className="mt-1 font-sans text-[11px] text-rose-300">{FOUNDER_IDENTITY.defectRule}</p>
        </CardContent>
      </Card>

      {/* HONEST Certification */}
      <Card className="mb-6 border-gold/12 glass">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-gold" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{HONEST_CERTIFICATION_FIEW.title}</p>
                <p className="font-serif text-xl font-semibold text-gold-gradient">{HONEST_CERTIFICATION_FIEW.verdict}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded border border-rose-400/20 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-rose-300">{HONEST_CERTIFICATION_FIEW.current.customers}</p><p className="font-mono text-[9px] text-muted-foreground">Customers</p></div>
              <div className="rounded border border-rose-400/20 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-rose-300">{HONEST_CERTIFICATION_FIEW.current.partners}</p><p className="font-mono text-[9px] text-muted-foreground">Partners</p></div>
              <div className="rounded border border-rose-400/20 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-rose-300">{HONEST_CERTIFICATION_FIEW.current.revenue}</p><p className="font-mono text-[9px] text-muted-foreground">Revenue</p></div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-rose-300">{HONEST_CERTIFICATION_FIEW.current.evidenceLevel}</p><p className="font-mono text-[9px] text-muted-foreground">Evidence</p></div>
            </div>
          </div>
          <p className="mt-3 font-sans text-sm italic text-gold-gradient">{HONEST_CERTIFICATION_FIEW.statement}</p>
        </CardContent>
      </Card>

      {/* Today's Top 5 — the most practical card */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Crosshair className="h-4 w-4 text-gold" /> Today's Top 5 Actions (starts EMPTY; execution fills)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-sans text-[11px] text-muted-foreground"><span className="text-gold-light">Ranking formula:</span> {ACTION_RANKING_FORMULA.formula}</p>
          <p className="font-sans text-[11px] text-amber-300">{ACTION_RANKING_FORMULA.rule}</p>
          <div className="mt-3">
            <p className="font-mono text-[10px] uppercase text-emerald-300">Current Top 5 (from 30-day plan)</p>
            <ol className="mt-1 flex flex-col gap-1">
              {HONEST_CERTIFICATION_FIEW.top5ActionsToday.map(a => (
                <li key={a} className="font-sans text-[11px] text-emerald-300">→ {a}</li>
              ))}
            </ol>
          </div>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">Action fields: {ACTION_FIELDS.join(" · ")}</p>
        </CardContent>
      </Card>

      {/* Execution Scoreboards — Customer, Partner, Regulatory */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><Target className="h-4 w-4 text-gold" /> Customer ({CUSTOMER_SCOREBOARD.length} metrics · all 0)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {CUSTOMER_SCOREBOARD.map(m => (
                <div key={m.metric} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px]">{m.metric}</span>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-rose-300">{m.current}</span>
                    <span className="ml-1 font-mono text-[9px] text-muted-foreground">/{m.target30Day}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><Handshake className="h-4 w-4 text-gold" /> Partner ({PARTNER_SCOREBOARD.length} metrics · all 0)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {PARTNER_SCOREBOARD.map(m => (
                <div key={m.metric} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px]">{m.metric}</span>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-rose-300">{m.current}</span>
                    <span className="ml-1 font-mono text-[9px] text-muted-foreground">/{m.target30Day}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-sm"><Landmark className="h-4 w-4 text-gold" /> Regulatory ({REGULATORY_SCOREBOARD.length} metrics · all 0)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {REGULATORY_SCOREBOARD.map(m => (
                <div key={m.metric} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px]">{m.metric}</span>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-rose-300">{m.current}</span>
                    <span className="ml-1 font-mono text-[9px] text-muted-foreground">/{m.target30Day}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 30-Day Weekly Plan */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <Clock className="h-4 w-4 text-gold" /> 30-Day Weekly Structure ({THIRTY_DAY_WEEKLY_PLAN.length} weeks · all NOT STARTED)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {THIRTY_DAY_WEEKLY_PLAN.map(w => (
              <div key={w.week} className="rounded border border-gold/10 bg-background/30 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-gold">{w.week}</span>
                  <Badge variant="outline" className="border-rose-400/30 font-mono text-[9px] text-rose-300">{w.status}</Badge>
                </div>
                <p className="font-sans text-[11px] font-medium">{w.title}</p>
                <p className="font-sans text-[10px] text-muted-foreground">Objective: {w.objective}</p>
                <p className="font-mono text-[9px] text-gold-light">Evidence: {w.evidenceTarget}</p>
                <div className="mt-1 max-h-24 overflow-y-auto">
                  {w.activities.map((a, i) => <p key={i} className="font-sans text-[9px] text-muted-foreground">• {a}</p>)}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 font-sans text-[10px] text-rose-300">{WEEKLY_RULE}</p>
        </CardContent>
      </Card>

      {/* Blockers + Execution vs Activity */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><AlertTriangle className="h-4 w-4 text-gold" /> Execution Blocker Engine</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-[10px] uppercase text-gold-light">Severity Levels</p>
            {BLOCKER_SEVERITY.map(s => (
              <div key={s.level} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                <span className={`font-mono text-[10px] ${s.level === "P0" ? "text-rose-300" : s.level === "P1" ? "text-amber-300" : "text-sky-300"}`}>{s.level}</span>
                <span className="font-sans text-[10px] text-muted-foreground">{s.meaning}</span>
              </div>
            ))}
            <p className="mt-2 font-sans text-[10px] text-amber-300">{TOP_5_BLOCKERS_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><RefreshCw className="h-4 w-4 text-gold" /> Execution vs Activity</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-[10px] uppercase text-sky-300">Activity (does NOT equal outcome)</p>
            <p className="font-sans text-[10px] text-muted-foreground">{ACTIVITY_VS_OUTCOME.activity.join(" · ")}</p>
            <p className="mt-2 font-mono text-[10px] uppercase text-emerald-300">Outcome (what matters)</p>
            <p className="font-sans text-[10px] text-muted-foreground">{ACTIVITY_VS_OUTCOME.outcome.join(" · ")}</p>
            <p className="mt-2 font-sans text-[11px] text-rose-300">{ACTIVITY_VS_OUTCOME.warning}</p>
          </CardContent>
        </Card>
      </div>

      {/* Truth Models + Objection Engine */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Filter className="h-4 w-4 text-gold" /> Truth Models (never conflate states)</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-[10px] uppercase text-gold-light">Commercial ({COMMERCIAL_TRUTH_MODEL.states.length} states)</p>
            <p className="font-sans text-[10px] text-muted-foreground">{COMMERCIAL_TRUTH_MODEL.rule}</p>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">Partner ({PARTNER_TRUTH_MODEL.states.length} states)</p>
            <p className="font-sans text-[10px] text-muted-foreground">{PARTNER_TRUTH_MODEL.rule}</p>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">Regulatory ({REGULATORY_TRUTH_MODEL.states.length} states)</p>
            <p className="font-sans text-[10px] text-rose-300">NEVER display: {REGULATORY_TRUTH_MODEL.prohibited.join(", ")}</p>
            <p className="font-sans text-[10px] text-muted-foreground">{REGULATORY_TRUTH_MODEL.rule}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><AlertTriangle className="h-4 w-4 text-gold" /> Market Objection Engine</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-[10px] uppercase text-gold-light">Frequency Escalation</p>
            {OBJECTION_FREQUENCY.map(f => (
              <div key={f.occurrences} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                <span className="font-mono text-[10px] text-gold">{f.occurrences} occurrence(s)</span>
                <span className={`font-sans text-[10px] ${f.occurrences === "5+" ? "text-rose-300" : "text-muted-foreground"}`}>{f.status}</span>
              </div>
            ))}
            <p className="mt-2 font-sans text-[10px] text-amber-300">{OBJECTION_RULE}</p>
            <div className="mt-2 rounded border border-gold/8 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-gold-light">Product Change Control</p>
              <p className="font-sans text-[10px] text-muted-foreground">Flow: {PRODUCT_CHANGE_FLOW.join(" → ")}</p>
              <p className="font-sans text-[10px] text-rose-300">{PRODUCT_CHANGE_RULE}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Criteria + Founder Execution Score */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Target className="h-4 w-4 text-gold" /> 30-Day Success Criteria ({SUCCESS_CRITERIA.length} targets · NOT guarantees)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {SUCCESS_CRITERIA.map(s => (
                <div key={s.target} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <div>
                    <span className="font-sans text-[11px]">{s.target}</span>
                    <span className={`ml-1 font-mono text-[9px] ${s.type === "Stretch" ? "text-amber-300" : "text-sky-300"}`}>[{s.type}]</span>
                  </div>
                  <Badge variant="outline" className="border-rose-400/30 font-mono text-[9px] text-rose-300">{s.status}</Badge>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-rose-300">{SUCCESS_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Trophy className="h-4 w-4 text-gold" /> Founder Execution Score (evidence-driven · current: {OVERALL_EXECUTION_SCORE_FIEW})</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {FOUNDER_EXECUTION_SCORE_FIEW.map(d => (
                <div key={d.dimension} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px]">{d.dimension} <span className="font-mono text-[9px] text-muted-foreground">(w{d.weight}%)</span></span>
                  <span className="font-mono text-[10px] text-rose-300">{d.currentScore}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{SCORE_RULE_FIEW}</p>
          </CardContent>
        </Card>
      </div>

      {/* Founder Time Allocation + Brain AI */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Clock className="h-4 w-4 text-gold" /> Founder Time Allocation</CardTitle></CardHeader>
          <CardContent>
            {FOUNDER_TIME_ALLOCATION.map(t => (
              <div key={t.category} className="border-b border-gold/5 py-1">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-medium">{t.category}</span>
                  <span className="font-mono text-[11px] text-gold">{t.percentage}%</span>
                </div>
                <p className="font-sans text-[10px] text-muted-foreground">{t.rule}</p>
              </div>
            ))}
            <p className="mt-2 font-sans text-[10px] text-amber-300">{TIME_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Brain className="h-4 w-4 text-gold" /> Brain AI — Execution Chief of Staff</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground">{BRAIN_AI_EXECUTION_COS.role}</p>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">Cadence</p>
            {BRAIN_AI_EXECUTION_COS.cadence.map(c => (
              <div key={c.time} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                <span className="font-mono text-[10px] text-gold">{c.time}</span>
                <span className="font-sans text-[10px] text-muted-foreground">{c.question}</span>
              </div>
            ))}
            <p className="mt-2 font-mono text-[10px] uppercase text-amber-300">Identifies</p>
            <p className="font-sans text-[10px] text-muted-foreground">{BRAIN_AI_EXECUTION_COS.identifies.join(" · ")}</p>
            <p className="mt-2 font-sans text-[10px] text-rose-300">{BRAIN_AI_EXECUTION_COS.neverInvents}</p>
          </CardContent>
        </Card>
      </div>

      {/* Day-30 Executive Review + Evidence Repository */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><CheckCircle2 className="h-4 w-4 text-gold" /> Day-30 Executive Review ({DAY_30_REVIEW.length} sections)</CardTitle></CardHeader>
          <CardContent>
            {DAY_30_REVIEW.map(r => (
              <div key={r.section} className="border-b border-gold/5 py-0.5">
                <span className="font-mono text-[10px] text-gold">{r.section}</span>
                <p className="font-sans text-[10px] text-muted-foreground">{r.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Database className="h-4 w-4 text-gold" /> Evidence Repository</CardTitle></CardHeader>
          <CardContent>
            <p className="font-mono text-[10px] uppercase text-gold-light">Evidence Events ({EVIDENCE_EVENTS.length})</p>
            <div className="flex flex-wrap gap-1">
              {EVIDENCE_EVENTS.map(e => <Badge key={e} variant="outline" className="border-gold/10 font-mono text-[9px]">{e}</Badge>)}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">Record Fields ({EVIDENCE_RECORD_FIELDS.length})</p>
            <p className="font-sans text-[10px] text-muted-foreground">{EVIDENCE_RECORD_FIELDS.join(" · ")}</p>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{EVIDENCE_RULE}</p>
          </CardContent>
        </Card>
      </div>

      {/* Final COO Directive + Synchronization */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-gold" />
            <p className="font-serif text-lg font-semibold text-gold-gradient">Final COO Directive</p>
          </div>
          <p className="mt-2 font-sans text-sm text-muted-foreground">{FINAL_COO_DIRECTIVE_FIEW.rule}</p>
          <p className="mt-2 font-mono text-sm font-semibold text-center text-gold-gradient">{FINAL_COO_DIRECTIVE_FIEW.flywheel}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {FINAL_COO_DIRECTIVE_FIEW.principles.map(p => <Badge key={p} variant="outline" className="border-gold/30 font-mono text-[9px] text-gold">{p}</Badge>)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-gold/12 glass">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <p className="font-serif text-base font-semibold text-gold-gradient">FIEW v{FIEW_VERSION} Synchronization</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(FIEW_SYNCHRONIZATION).map(([k, v]) => (
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
