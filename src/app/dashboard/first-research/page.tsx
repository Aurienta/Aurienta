import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  RESEARCH_DATE, RESEARCH_EVIDENCE_LEVEL, RESEARCH_DISCLAIMER,
  FIRST_25_TARGETS, LAW_FIRM_CANDIDATES, REGULATORY_RESEARCH_RESULTS,
  FIRST_5_OUTREACH_DRAFTS, EXECUTION_REPORT, FINAL_HONEST_STATEMENT,
} from "@/lib/aurienta/first-25-research";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crown, Target, Scale, Landmark, MessageSquare, AlertTriangle,
  Trophy, CheckCircle2, Rocket, Database, FileText,
} from "lucide-react";

export const metadata = { title: "First 25 Research · AURIENTA" };
export const dynamic = "force-dynamic";

const tierColor = (t: string) =>
  t === "P0" ? "text-rose-300" : t === "P1" ? "text-amber-300" : t === "P2" ? "text-sky-300" : "text-muted-foreground";
const confidenceColor = (c: string) =>
  c === "HIGH" ? "text-emerald-300" : c === "MEDIUM" ? "text-amber-300" : c === "LOW" ? "text-rose-300" : "text-muted-foreground";
const classificationColor = (c: string) =>
  c === "FACT" ? "text-emerald-300" : c === "LEGAL QUESTION" ? "text-amber-300" : c === "ASSUMPTION" ? "text-sky-300" : "text-rose-300";

export default async function FirstResearchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/first-research");

  const p0 = FIRST_25_TARGETS.filter(t => t.tier === "P0");
  const p1 = FIRST_25_TARGETS.filter(t => t.tier === "P1");
  const p2 = FIRST_25_TARGETS.filter(t => t.tier === "P2");
  const p3 = FIRST_25_TARGETS.filter(t => t.tier === "P3");

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            First 25 Egypt Target Research · Evidence Level {RESEARCH_EVIDENCE_LEVEL} · Research Date {RESEARCH_DATE} · REAL MARKET DATA
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">First 25 Target Research</h1>
        <p className="font-sans text-sm text-muted-foreground">
          {FIRST_25_TARGETS.length} real Egyptian targets · {LAW_FIRM_CANDIDATES.length} law firms · {REGULATORY_RESEARCH_RESULTS.length} regulatory authorities · {FIRST_5_OUTREACH_DRAFTS.length} outreach drafts (awaiting Founder approval)
        </p>
        <div className="mt-2 rounded border border-amber-400/20 bg-amber-400/5 p-2">
          <p className="font-sans text-[11px] text-amber-300">⚠ {RESEARCH_DISCLAIMER}</p>
        </div>
      </header>

      {/* Founder + Honest Baseline */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-gold" />
              <div>
                <p className="font-mono text-[11px] uppercase text-muted-foreground">Founder & Sole Owner</p>
                <p className="font-serif text-xl font-semibold text-gold-gradient">{FINAL_HONEST_STATEMENT.founder}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded border border-emerald-400/20 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-emerald-300">{RESEARCH_EVIDENCE_LEVEL}</p><p className="font-mono text-[9px] text-muted-foreground">Evidence ceiling</p></div>
              <div className="rounded border border-rose-400/20 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-rose-300">0</p><p className="font-mono text-[9px] text-muted-foreground">Conversations</p></div>
              <div className="rounded border border-rose-400/20 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-rose-300">0</p><p className="font-mono text-[9px] text-muted-foreground">Outreach sent</p></div>
              <div className="rounded border border-rose-400/20 bg-background/30 p-2 text-center"><p className="font-serif text-lg font-semibold text-rose-300">0 EGP</p><p className="font-mono text-[9px] text-muted-foreground">Revenue</p></div>
            </div>
          </div>
          <p className="mt-3 font-sans text-sm italic text-gold-gradient">{FINAL_HONEST_STATEMENT.statement}</p>
        </CardContent>
      </Card>

      {/* Target Distribution */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Target className="h-4 w-4 text-gold" /> Target Distribution ({FIRST_25_TARGETS.length} real Egyptian targets)</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-3 grid grid-cols-4 gap-2">
            <div className="rounded border border-rose-400/20 bg-rose-400/5 p-2 text-center"><p className="font-serif text-2xl font-semibold text-rose-300">{p0.length}</p><p className="font-mono text-[10px] text-muted-foreground">P0 (anchor)</p></div>
            <div className="rounded border border-amber-400/20 bg-amber-400/5 p-2 text-center"><p className="font-serif text-2xl font-semibold text-amber-300">{p1.length}</p><p className="font-mono text-[10px] text-muted-foreground">P1 (high)</p></div>
            <div className="rounded border border-sky-400/20 bg-sky-400/5 p-2 text-center"><p className="font-serif text-2xl font-semibold text-sky-300">{p2.length}</p><p className="font-mono text-[10px] text-muted-foreground">P2 (strategic)</p></div>
            <div className="rounded border border-muted/20 bg-muted/5 p-2 text-center"><p className="font-serif text-2xl font-semibold text-muted-foreground">{p3.length}</p><p className="font-mono text-[10px] text-muted-foreground">P3 (long-term)</p></div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-gold/15">
                  <th className="pb-2 pr-2 font-medium">ID</th><th className="pb-2 pr-2 font-medium">Organization</th>
                  <th className="pb-2 pr-2 font-medium">Sector</th><th className="pb-2 pr-2 font-medium">Tier</th>
                  <th className="pb-2 pr-2 font-medium">Score</th><th className="pb-2 pr-2 font-medium">Confidence</th>
                  <th className="pb-2 font-medium">Decision-maker</th>
                </tr>
              </thead>
              <tbody>
                {FIRST_25_TARGETS.map(t => (
                  <tr key={t.id} className="border-b border-gold/5">
                    <td className="py-1.5 pr-2 font-mono text-[10px] text-gold-light">{t.id}</td>
                    <td className="py-1.5 pr-2 font-medium">{t.organization}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{t.sector}</td>
                    <td className={`py-1.5 pr-2 font-mono text-[10px] ${tierColor(t.tier)}`}>{t.tier}</td>
                    <td className="py-1.5 pr-2 font-mono text-[10px] text-gold">{t.qualificationScore}</td>
                    <td className={`py-1.5 pr-2 font-mono text-[10px] ${confidenceColor(t.sourceConfidence)}`}>{t.sourceConfidence}</td>
                    <td className="py-1.5 font-mono text-[10px] text-rose-300">{t.decisionMaker === "UNKNOWN" ? "UNKNOWN" : t.decisionMaker}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Law Firm Candidates + Regulatory Research */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Scale className="h-4 w-4 text-gold" /> Law Firm Candidates ({LAW_FIRM_CANDIDATES.length} · ALL PARTNER TARGETS — NOT partners)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto">
              {LAW_FIRM_CANDIDATES.map(f => (
                <div key={f.id} className="border-b border-gold/5 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{f.firm}</span>
                    <Badge variant="outline" className="border-rose-400/30 font-mono text-[9px] text-rose-300">{f.status}</Badge>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{f.practiceAreas}</p>
                  <p className="font-sans text-[10px] text-muted-foreground">Source: {f.source} · Confidence: <span className={confidenceColor(f.sourceConfidence)}>{f.sourceConfidence}</span></p>
                  <p className="font-sans text-[9px] text-amber-300">{f.notes}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Landmark className="h-4 w-4 text-gold" /> Regulatory Research ({REGULATORY_RESEARCH_RESULTS.length} authorities · 0 formal engagement)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto">
              {REGULATORY_RESEARCH_RESULTS.map(r => (
                <div key={r.authority} className="border-b border-gold/5 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] font-medium">{r.authority}</span>
                    <Badge variant="outline" className={`font-mono text-[9px] ${r.status === "APPROVED" ? "border-emerald-400/30 text-emerald-300" : "border-amber-400/30 text-amber-300"}`}>{r.status}</Badge>
                  </div>
                  <p className="font-sans text-[10px] text-muted-foreground">{r.mandate}</p>
                  <p className={`font-mono text-[9px] ${classificationColor(r.classification)}`}>{r.classification}</p>
                  <p className="font-sans text-[9px] text-muted-foreground">{r.notes.substring(0, 150)}...</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outreach Drafts (awaiting Founder approval) */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><MessageSquare className="h-4 w-4 text-gold" /> First 5 Outreach Drafts ({FIRST_5_OUTREACH_DRAFTS.length} · ALL DRAFT — awaiting Founder approval)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-2">
            {FIRST_5_OUTREACH_DRAFTS.map(d => (
              <div key={d.draftId} className="rounded border border-gold/10 bg-background/30 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-gold-light">{d.draftId}</span>
                  <Badge variant="outline" className="border-amber-400/30 font-mono text-[9px] text-amber-300">{d.status}</Badge>
                </div>
                <p className="font-sans text-[11px] font-medium">{d.target}</p>
                <p className="font-sans text-[10px] text-muted-foreground">Recipient: {d.recipient}</p>
                <p className="font-sans text-[10px] text-muted-foreground">Why: {d.whyThisOrganization.substring(0, 100)}...</p>
                <p className="font-sans text-[10px] text-emerald-300">Request: {d.request.substring(0, 100)}...</p>
                <p className="font-sans text-[9px] text-rose-300">Claims NOT made: {d.claimsNOTMade.substring(0, 80)}...</p>
              </div>
            ))}
          </div>
          <p className="mt-2 font-sans text-[10px] text-amber-300">⚠ ALL drafts are DRAFT status. NONE have been Founder-approved. NONE have been sent. The Founder (Mohamed Eltonsy) must review and approve each draft before it can be sent.</p>
        </CardContent>
      </Card>

      {/* Execution Report — What We Know / Don't Know / Did / Happened / Learned / Next */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Database className="h-4 w-4 text-gold" /> Honest Execution Report</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded border border-emerald-400/10 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-emerald-300">What We Know</p>
              <ul className="flex flex-col gap-0.5">{EXECUTION_REPORT.whatWeKnow.map(k => <li key={k} className="font-sans text-[10px] text-muted-foreground">✓ {k}</li>)}</ul>
            </div>
            <div className="rounded border border-rose-400/10 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-rose-300">What We Don't Know</p>
              <ul className="flex flex-col gap-0.5">{EXECUTION_REPORT.whatWeDontKnow.map(k => <li key={k} className="font-sans text-[10px] text-muted-foreground">? {k}</li>)}</ul>
            </div>
            <div className="rounded border border-gold/10 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-gold-light">What We Did</p>
              <ul className="flex flex-col gap-0.5">{EXECUTION_REPORT.whatWeDid.map(k => <li key={k} className="font-sans text-[10px] text-muted-foreground">→ {k}</li>)}</ul>
            </div>
            <div className="rounded border border-amber-400/10 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-amber-300">What Happened</p>
              <ul className="flex flex-col gap-0.5">{EXECUTION_REPORT.whatHappened.map(k => <li key={k} className="font-sans text-[10px] text-muted-foreground">• {k}</li>)}</ul>
            </div>
            <div className="rounded border border-sky-400/10 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-sky-300">What We Learned</p>
              <ul className="flex flex-col gap-0.5">{EXECUTION_REPORT.whatWeLearned.map(k => <li key={k} className="font-sans text-[10px] text-muted-foreground">💡 {k}</li>)}</ul>
            </div>
            <div className="rounded border border-emerald-400/10 bg-background/30 p-2">
              <p className="font-mono text-[10px] uppercase text-emerald-300">What We Should Do Next</p>
              <ul className="flex flex-col gap-0.5">{EXECUTION_REPORT.whatWeShouldDoNext.map(k => <li key={k} className="font-sans text-[10px] text-emerald-300">→ {k}</li>)}</ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 Founder Actions */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Rocket className="h-4 w-4 text-gold" /> Top 10 Founder Actions (based on actual research)</CardTitle></CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-1">
            {EXECUTION_REPORT.founderActions.next10.map(a => (
              <li key={a} className="font-sans text-[11px] text-emerald-300">→ {a}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Final Honest Statement */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" />
            <p className="font-serif text-base font-semibold text-gold-gradient">Final Honest Statement</p>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded border border-emerald-400/10 bg-background/30 p-2"><p className="font-mono text-[10px] uppercase text-emerald-300">Evidence Ceiling</p><p className="font-sans text-[11px] text-muted-foreground">{FINAL_HONEST_STATEMENT.evidenceCeiling}</p></div>
            <div className="rounded border border-gold/10 bg-background/30 p-2"><p className="font-mono text-[10px] uppercase text-gold-light">What Changed</p><p className="font-sans text-[11px] text-muted-foreground">{FINAL_HONEST_STATEMENT.whatChanged}</p></div>
            <div className="rounded border border-rose-400/10 bg-background/30 p-2"><p className="font-mono text-[10px] uppercase text-rose-300">What Did NOT Change</p><p className="font-sans text-[11px] text-muted-foreground">{FINAL_HONEST_STATEMENT.whatDidNOTChange}</p></div>
            <div className="rounded border border-amber-400/10 bg-background/30 p-2"><p className="font-mono text-[10px] uppercase text-amber-300">Next Milestone</p><p className="font-sans text-[11px] text-muted-foreground">{FINAL_HONEST_STATEMENT.nextMilestone}</p></div>
          </div>
          <p className="mt-3 font-sans text-sm italic text-gold-gradient">{FINAL_HONEST_STATEMENT.statement}</p>
        </CardContent>
      </Card>
    </div>
  );
}
