import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  CPR_VERSION, CPR_FROZEN_AT, CURRENT_BASELINE,
  EVIDENCE_HIERARCHY_CPR, INVALID_PROMOTION_EXAMPLES, PROMOTION_RULE,
  CUSTOMER_CONVERSION_WORKFLOW, CONVERSION_OPPORTUNITIES,
  PROBLEM_VALIDATION_STRENGTHENED, PROBLEM_VALIDATION_RULE,
  QUALIFICATION_GATE_CRITERIA, QUALIFICATION_GATE,
  COMMERCIAL_OFFER_STATES, COMMERCIAL_OFFER_RULE,
  PILOT_REQUIREMENTS, PILOT_RULE,
  PILOT_SUCCESS_PACKAGE, PILOT_SUCCESS_RULE,
  REVENUE_TRACKING, REVENUE_CRITICAL_RULE,
  REVENUE_EVIDENCE_CHAIN,
  OUTCOME_ENGINE, OUTCOME_METRICS,
  REFERENCE_STATES, REFERENCE_RULE,
  LOST_OPPORTUNITY_REASONS, LOST_DEAL_RULE_CPR,
  CUSTOMER_EVIDENCE_EVENTS, EVIDENCE_RECORD_FIELDS, EVIDENCE_LEDGER_RULE,
  FOUNDER_EXECUTION_SCORE, EXECUTION_SCORE_RULE, CURRENT_EXECUTION_SCORE,
  WEEKLY_COO_REVIEW, WEEKLY_REVIEW_RULE,
  VALIDATION_GATES_CPR, GATE_RULE_CPR,
  BRAIN_AI_CONVERSION_AGENT,
  CLAIM_CONTROL_MATRIX, CLAIM_CONTROL_RULE,
  FOUNDER_DAILY_PRIORITIES,
  HONEST_CERTIFICATION_CPR, FINAL_COO_PRINCIPLE, CPR_SYNCHRONIZATION,
} from "@/lib/aurienta/customer-conversion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy, AlertTriangle, Filter, GitBranch, Rocket, DollarSign,
  Microscope, CheckCircle2, XCircle, TrendingDown, Database, Crown,
  Brain, Crosshair, ShieldCheck,
} from "lucide-react";

export const metadata = { title: "Customer Conversion · AURIENTA" };
export const dynamic = "force-dynamic";

const evidenceColor = (level: string) =>
  level === "E0" ? "text-rose-300" :
  ["E5", "E6", "E7", "E8", "E9"].includes(level) ? "text-emerald-300" :
  "text-amber-300";

export default async function CustomerConversionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/customer-conversion");

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            Customer Conversion, Pilot-to-Paid & Revenue Evidence · CPR v{CPR_VERSION} · Frozen {CPR_FROZEN_AT} · Reality Over Architecture
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Customer Conversion & Revenue Evidence</h1>
        <p className="font-sans text-sm text-muted-foreground">
          {CUSTOMER_CONVERSION_WORKFLOW.length}-stage conversion · Evidence E0-E9 (ceiling {CURRENT_BASELINE.evidenceCeiling}) · {QUALIFICATION_GATE.criteria}-criterion gate · {PILOT_SUCCESS_PACKAGE.length}-element pilot success · Revenue chain · {REFERENCE_STATES.length} reference states. HONEST baseline: {CURRENT_BASELINE.customers} customers · {CURRENT_BASELINE.activePilots} pilots · {CURRENT_BASELINE.collectedRevenue} EGP collected · {CURRENT_BASELINE.signedAgreements} agreements · {CURRENT_BASELINE.measuredOutcomes} outcomes · {CURRENT_BASELINE.references} references
        </p>
      </header>

      {/* HONEST Certification banner */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-gold" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{HONEST_CERTIFICATION_CPR.title}</p>
                <p className="font-serif text-xl font-semibold text-gold-gradient">{HONEST_CERTIFICATION_CPR.verdict}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded border border-emerald-400/20 bg-background/30 p-2 text-center">
                <p className="font-serif text-lg font-semibold text-emerald-300">2</p>
                <p className="font-mono text-[9px] text-muted-foreground">Complete + Ready</p>
              </div>
              <div className="rounded border border-rose-400/20 bg-background/30 p-2 text-center">
                <p className="font-serif text-lg font-semibold text-rose-300">5</p>
                <p className="font-mono text-[9px] text-muted-foreground">NOT validated</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-lg font-semibold text-rose-300">{HONEST_CERTIFICATION_CPR.evidenceScore.split(" ")[0]}</p>
                <p className="font-mono text-[9px] text-muted-foreground">Evidence ceiling</p>
              </div>
              <div className="rounded border border-gold/10 bg-background/30 p-2 text-center">
                <p className="font-serif text-lg font-semibold text-rose-300">0/7</p>
                <p className="font-mono text-[9px] text-muted-foreground">Gates passed</p>
              </div>
            </div>
          </div>
          <p className="mt-3 font-sans text-sm italic text-gold-gradient">{HONEST_CERTIFICATION_CPR.statement}</p>
        </CardContent>
      </Card>

      {/* Evidence Integrity — E0-E9 + invalid promotion rejection */}
      <Card className="mb-6 border-rose-400/20 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <AlertTriangle className="h-4 w-4 text-rose-300" /> Evidence Integrity — E0-E9 Hierarchy (ceiling: {PROMOTION_RULE.currentCeiling})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-5">
            {EVIDENCE_HIERARCHY_CPR.map(e => (
              <div key={e.level} className={`rounded border p-1.5 ${e.level === "E0" ? "border-rose-400/30 bg-rose-400/5" : "border-gold/8 bg-background/30"}`}>
                <p className={`font-mono text-[11px] font-semibold ${evidenceColor(e.level)}`}>{e.level}</p>
                <p className="font-sans text-[10px] font-medium">{e.name}</p>
                <p className="font-sans text-[9px] text-muted-foreground">{e.meaning}</p>
                {e.level === "E0" && <p className="font-mono text-[9px] text-rose-300">← CURRENT CEILING</p>}
              </div>
            ))}
          </div>
          <p className="mt-2 font-sans text-[10px] text-amber-300">{PROMOTION_RULE.rule}</p>
          <p className="mt-1 font-mono text-[10px] uppercase text-rose-300">Invalid Promotion Examples (REJECTED by system)</p>
          <div className="grid gap-1 sm:grid-cols-2">
            {INVALID_PROMOTION_EXAMPLES.map(p => (
              <div key={p.from + p.to} className="rounded border border-rose-400/10 bg-background/30 p-1.5">
                <p className="font-mono text-[10px] text-rose-300">✗ {p.from} → {p.to}</p>
                <p className="font-sans text-[10px] text-muted-foreground">{p.rejectionReason}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Reality + Validation Gates */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Crosshair className="h-4 w-4 text-gold" /> Current Reality (honest)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border border-gold/8 bg-background/30 p-2 text-center"><p className="font-serif text-xl font-semibold text-rose-300">{CURRENT_BASELINE.customers}</p><p className="font-mono text-[9px] text-muted-foreground">Customers</p></div>
              <div className="rounded border border-gold/8 bg-background/30 p-2 text-center"><p className="font-serif text-xl font-semibold text-rose-300">{CURRENT_BASELINE.activePilots}</p><p className="font-mono text-[9px] text-muted-foreground">Active pilots</p></div>
              <div className="rounded border border-gold/8 bg-background/30 p-2 text-center"><p className="font-serif text-xl font-semibold text-rose-300">{CURRENT_BASELINE.signedAgreements}</p><p className="font-mono text-[9px] text-muted-foreground">Signed agreements</p></div>
              <div className="rounded border border-gold/8 bg-background/30 p-2 text-center"><p className="font-serif text-xl font-semibold text-rose-300">{CURRENT_BASELINE.activeDeployments}</p><p className="font-mono text-[9px] text-muted-foreground">Deployments</p></div>
              <div className="rounded border border-gold/8 bg-background/30 p-2 text-center"><p className="font-serif text-xl font-semibold text-rose-300">{CURRENT_BASELINE.measuredOutcomes}</p><p className="font-mono text-[9px] text-muted-foreground">Measured outcomes</p></div>
              <div className="rounded border border-gold/8 bg-background/30 p-2 text-center"><p className="font-serif text-xl font-semibold text-rose-300">{CURRENT_BASELINE.references}</p><p className="font-mono text-[9px] text-muted-foreground">References</p></div>
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{CURRENT_BASELINE.statement}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><CheckCircle2 className="h-4 w-4 text-gold" /> Validation Gates (0/7 passed)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {VALIDATION_GATES_CPR.map(g => (
                <div key={g.gate} className="border-b border-gold/5 py-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium"><span className="font-mono text-[10px] text-gold-light">{g.gate}</span> {g.name}</span>
                    <Badge variant="outline" className="border-rose-400/30 font-mono text-[9px] text-rose-300">{g.status}</Badge>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">Requires: {g.evidenceRequired}</p>
                  <p className="font-sans text-[10px] text-rose-300">Current: {g.currentEvidence}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{GATE_RULE_CPR}</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Conversion Workflow (24 stages) */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <GitBranch className="h-4 w-4 text-gold" /> Customer Conversion Engine ({CUSTOMER_CONVERSION_WORKFLOW.length} stages · {CONVERSION_OPPORTUNITIES} opportunities)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-gold/15">
                  <th className="pb-2 pr-2 font-medium">Stage</th>
                  <th className="pb-2 pr-2 font-medium">Evidence</th>
                  <th className="pb-2 pr-2 font-medium">Exit Criteria</th>
                  <th className="pb-2 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody>
                {CUSTOMER_CONVERSION_WORKFLOW.map(s => (
                  <tr key={s.stageId} className="border-b border-gold/5">
                    <td className="py-1 pr-2"><span className="font-mono text-[10px] text-gold-light">{s.stageId}</span> {s.stage}</td>
                    <td className={`py-1 pr-2 font-mono text-[10px] ${evidenceColor(s.evidenceLevel)}`}>{s.evidenceLevel}</td>
                    <td className="py-1 pr-2 text-muted-foreground">{s.exitCriteria}</td>
                    <td className="py-1 text-muted-foreground">{s.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Problem Validation + Qualification Gate */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Microscope className="h-4 w-4 text-gold" /> Problem Validation ({PROBLEM_VALIDATION_STRENGTHENED.length} fields)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {PROBLEM_VALIDATION_STRENGTHENED.map(f => (
                <div key={f.field} className="border-b border-gold/5 py-1">
                  <span className="font-sans text-[11px] font-medium">{f.field}</span>
                  <p className="font-sans text-[10px] text-muted-foreground">{f.capture}</p>
                  <p className="font-sans text-[9px] text-amber-300">Rule: {f.rule}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-rose-300">{PROBLEM_VALIDATION_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Filter className="h-4 w-4 text-gold" /> Qualification Gate ({QUALIFICATION_GATE_CRITERIA.length} criteria · {QUALIFICATION_GATE.currentQualified} qualified)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {QUALIFICATION_GATE_CRITERIA.map(c => (
                <div key={c.criterion} className="border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px] font-medium">{c.criterion}</span>
                  <p className="font-sans text-[10px] text-muted-foreground">{c.evaluation}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] text-gold-light">Outputs: {QUALIFICATION_GATE.outputs.join(" / ")}</p>
            <p className="font-sans text-[10px] text-amber-300">{QUALIFICATION_GATE.rule}</p>
          </CardContent>
        </Card>
      </div>

      {/* Commercial Offer States + Revenue Tracking */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><DollarSign className="h-4 w-4 text-gold" /> Commercial Offer Validation ({COMMERCIAL_OFFER_STATES.length} states)</CardTitle></CardHeader>
          <CardContent>
            {COMMERCIAL_OFFER_STATES.map(s => (
              <div key={s.state} className="border-b border-gold/5 py-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-gold">{s.state}</span>
                  <span className="font-mono text-[10px] text-rose-300">{s.currentValue}</span>
                </div>
                <p className="font-sans text-[10px] text-muted-foreground">{s.definition}</p>
              </div>
            ))}
            <p className="mt-2 font-sans text-[10px] text-amber-300">{COMMERCIAL_OFFER_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><DollarSign className="h-4 w-4 text-gold" /> Revenue Tracking (only COLLECTED counts)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {REVENUE_TRACKING.map(r => (
                <div key={r.field} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px]">{r.field}</span>
                  <span className={`font-mono text-[10px] ${r.field === "Collected amount" ? "text-rose-300" : "text-muted-foreground"}`}>{r.currentValue}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-rose-300">{REVENUE_CRITICAL_RULE}</p>
            <div className="mt-2 rounded border border-gold/8 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-gold-light">Revenue Evidence Chain</p>
              <p className="font-sans text-[10px] text-muted-foreground">{REVENUE_EVIDENCE_CHAIN.chain}</p>
              <p className="font-sans text-[10px] text-amber-300">Current: {REVENUE_EVIDENCE_CHAIN.currentStatus}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pilot Success Package + Reference Engine */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><CheckCircle2 className="h-4 w-4 text-gold" /> Pilot Success = Measured Outcome ({PILOT_SUCCESS_PACKAGE.length} elements)</CardTitle></CardHeader>
          <CardContent>
            {PILOT_SUCCESS_PACKAGE.map(p => (
              <div key={p.element} className="border-b border-gold/5 py-0.5">
                <span className="font-mono text-[10px] text-gold">{p.element}</span>
                <p className="font-sans text-[10px] text-muted-foreground">{p.requirement}</p>
              </div>
            ))}
            <p className="mt-2 font-sans text-[10px] text-rose-300">{PILOT_SUCCESS_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Database className="h-4 w-4 text-gold" /> Customer Reference Engine ({REFERENCE_STATES.length} states)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {REFERENCE_STATES.map(r => (
                <div key={r.stateId} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px]"><span className="font-mono text-[10px] text-gold-light">{r.stateId}.</span> {r.state}</span>
                  <span className="font-mono text-[9px] text-muted-foreground">{r.requirement}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-rose-300">{REFERENCE_RULE}</p>
          </CardContent>
        </Card>
      </div>

      {/* Founder Execution Score + Weekly COO Review */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Trophy className="h-4 w-4 text-gold" /> Founder Execution Score (outcomes &gt; activity · current: {CURRENT_EXECUTION_SCORE})</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {FOUNDER_EXECUTION_SCORE.map(a => (
                <div key={a.activity} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <div>
                    <span className="font-sans text-[11px]">{a.activity}</span>
                    <span className="ml-1 font-mono text-[9px] text-muted-foreground">(w{a.weight})</span>
                  </div>
                  <span className="font-mono text-[10px] text-rose-300">{a.currentCount}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{EXECUTION_SCORE_RULE}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Crosshair className="h-4 w-4 text-gold" /> Weekly COO Review ({WEEKLY_COO_REVIEW.length} metrics · actual only)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {WEEKLY_COO_REVIEW.map(m => (
                <div key={m.metric} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[11px]">{m.metric}</span>
                  <span className="font-mono text-[10px] text-rose-300">{m.currentValue}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{WEEKLY_REVIEW_RULE}</p>
          </CardContent>
        </Card>
      </div>

      {/* Claim Control + Brain AI Conversion Agent */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><AlertTriangle className="h-4 w-4 text-gold" /> Claim Control Matrix (evidence-backed only)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-56 overflow-y-auto">
              {CLAIM_CONTROL_MATRIX.map(c => (
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
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Brain className="h-4 w-4 text-gold" /> Brain AI — Customer Conversion Chief of Staff</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-muted-foreground">{BRAIN_AI_CONVERSION_AGENT.role}</p>
            <div className="mt-2 max-h-40 overflow-y-auto">
              {BRAIN_AI_CONVERSION_AGENT.behaviors.map(b => (
                <div key={b.question} className="border-b border-gold/5 py-1">
                  <p className="font-sans text-[10px] font-medium text-gold-light">Q: {b.question}</p>
                  <p className="font-sans text-[10px] text-muted-foreground">A: {b.response}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-[10px] text-rose-300">{BRAIN_AI_CONVERSION_AGENT.fabricationProhibition}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Founder Actions + Blockers */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Rocket className="h-4 w-4 text-gold" /> Top 10 Founder Actions (highest-value)</CardTitle></CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-1">
              {HONEST_CERTIFICATION_CPR.top10FounderActions.map(a => (
                <li key={a} className="font-sans text-[11px] text-emerald-300">→ {a}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><AlertTriangle className="h-4 w-4 text-gold" /> Remaining Blockers (evidence-based)</CardTitle></CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-0.5">
              {HONEST_CERTIFICATION_CPR.remainingBlockers.map(b => (
                <li key={b} className="font-sans text-[10px] text-rose-300">• {b}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Architecture Discipline + Blueprint Change Report */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><ShieldCheck className="h-4 w-4 text-gold" /> Architecture Discipline Report</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-emerald-300">{HONEST_CERTIFICATION_CPR.architectureDisciplineReport.statement}</p>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">Reused</p>
            <div className="flex flex-wrap gap-1">
              {HONEST_CERTIFICATION_CPR.architectureDisciplineReport.reused.map(r => <Badge key={r} variant="outline" className="border-emerald-400/20 font-mono text-[9px] text-emerald-300">{r}</Badge>)}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase text-gold-light">Extended</p>
            <div className="flex flex-wrap gap-1">
              {HONEST_CERTIFICATION_CPR.architectureDisciplineReport.extended.map(e => <Badge key={e} variant="outline" className="border-amber-400/20 font-mono text-[9px] text-amber-300">{e}</Badge>)}
            </div>
            <p className="mt-2 font-sans text-[10px] text-rose-300">New architecture created: {HONEST_CERTIFICATION_CPR.architectureDisciplineReport.newArchitectureCreated}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/20 glass-gold">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-gold" />
              <p className="font-serif text-sm font-semibold text-gold-gradient">Blueprint Change Report</p>
            </div>
            <p className="mt-2 font-sans text-[11px] text-rose-300">Decision: {HONEST_CERTIFICATION_CPR.blueprintChangeReport.decision}</p>
            <p className="font-sans text-[11px] text-muted-foreground">{HONEST_CERTIFICATION_CPR.blueprintChangeReport.reason}</p>
            <p className="mt-1 font-sans text-[11px] text-amber-300">{HONEST_CERTIFICATION_CPR.blueprintChangeReport.statement}</p>
          </CardContent>
        </Card>
      </div>

      {/* Final COO Principle */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-gold" />
            <p className="font-serif text-lg font-semibold text-gold-gradient">Final COO Principle</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {FINAL_COO_PRINCIPLE.principles.map(p => <Badge key={p} variant="outline" className="border-gold/30 font-mono text-[10px] text-gold">{p}</Badge>)}
          </div>
          <p className="mt-2 font-sans text-sm italic text-gold-gradient">{FINAL_COO_PRINCIPLE.objective}</p>
          <p className="mt-1 font-sans text-sm text-muted-foreground">{FINAL_COO_PRINCIPLE.mandate}</p>
        </CardContent>
      </Card>

      {/* Synchronization */}
      <Card className="border-gold/12 glass">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <p className="font-serif text-base font-semibold text-gold-gradient">CPR v{CPR_VERSION} Synchronization</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(CPR_SYNCHRONIZATION).map(([k, v]) => (
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
