import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  AUDIT_DATE,
  CONSTITUTIONAL_ALIGNMENT_SCORE, ALIGNMENT_BREAKDOWN,
  VISION_PRESERVATION_SCORE, VISION_FINDINGS,
  DRIFT_SCORE, DRIFT_FINDINGS,
  CONSTITUTIONAL_INTEGRITY, INTEGRITY_FINDINGS,
  CORE_GAPS, DRIFT_DETAILED, PRESERVED_CORE, MISSING_CORE,
  COMMERCIALIZATION_DRIFT, ENTERPRISE_LIFECYCLE, GRADUATION_INTEGRITY,
  TERMINOLOGY_INTEGRITY, BRAIN_AI_ALIGNMENT,
  DO_NOT_CHANGE_LIST, EXECUTION_ONLY_LIST, FINAL_DECISION,
  FEATURE_PRESERVATION_MATRIX,
} from "@/lib/aurienta/constitutional-audit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Trophy,
  Crown, Scale, GitBranch, FileText, Database, Rocket,
} from "lucide-react";

export const metadata = { title: "Constitutional Audit · AURIENTA" };
export const dynamic = "force-dynamic";

const scoreColor = (s: number, threshold = 75) =>
  s >= threshold ? "text-emerald-300" : s >= 60 ? "text-amber-300" : "text-rose-300";
const statusBadge = (s: string) => {
  const cls = s === "PASS" || s === "ALIGNED" || s === "IMPLEMENTED" ? "border-emerald-400/30 text-emerald-300" :
    s === "PARTIAL" || s === "PARTIAL FAIL" || s === "PARTIALLY IMPLEMENTED" ? "border-amber-400/30 text-amber-300" :
    s === "DRIFT RISK" || s === "FAIL" || s === "NOT IMPLEMENTED" || s === "HIGH" ? "border-rose-400/30 text-rose-300" :
    s === "SUPPORTING" || s === "NEUTRAL" || s === "NOT YET ACTIVATED" || s === "DOCUMENTED ONLY" || s === "MEDIUM" ? "border-sky-400/30 text-sky-300" :
    "border-gold/20 text-muted-foreground";
  return <Badge variant="outline" className={`font-mono text-[10px] ${cls}`}>{s}</Badge>;
};

export default async function ConstitutionalAuditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/constitutional-audit");

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-gold" />
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light">
            Constitutional Alignment & Core-Vision Audit · {AUDIT_DATE} · Original Blueprint vs Implemented Platform
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Constitutional Alignment Audit</h1>
        <p className="font-sans text-sm text-muted-foreground">
          Forensic audit of the implemented platform against the ORIGINAL AURIENTA Constitutional Blueprint. Authority: ORIGINAL BLUEPRINT &gt; IMPLEMENTED FEATURE &gt; DASHBOARD CLAIM &gt; AI ASSUMPTION.
        </p>
      </header>

      {/* Final Decision — the most important card */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-gold" />
            <div>
              <p className="font-mono text-[11px] uppercase text-muted-foreground">Final CTO/COO Decision</p>
              <p className="font-serif text-xl font-semibold text-gold-gradient">{FINAL_DECISION.option}</p>
            </div>
          </div>
          <p className="mt-3 font-sans text-sm text-muted-foreground whitespace-pre-line">{FINAL_DECISION.reasoning}</p>
        </CardContent>
      </Card>

      {/* Scores */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gold/12 glass">
          <CardContent className="p-4 text-center">
            <ShieldCheck className="mx-auto h-6 w-6 text-gold" />
            <p className={`mt-1 font-serif text-3xl font-semibold ${scoreColor(CONSTITUTIONAL_ALIGNMENT_SCORE)}`}>{CONSTITUTIONAL_ALIGNMENT_SCORE}</p>
            <p className="font-mono text-[10px] text-muted-foreground">Constitutional Alignment</p>
          </CardContent>
        </Card>
        <Card className="border-gold/12 glass">
          <CardContent className="p-4 text-center">
            <Crown className="mx-auto h-6 w-6 text-gold" />
            <p className={`mt-1 font-serif text-3xl font-semibold ${scoreColor(VISION_PRESERVATION_SCORE)}`}>{VISION_PRESERVATION_SCORE}</p>
            <p className="font-mono text-[10px] text-muted-foreground">Vision Preservation</p>
          </CardContent>
        </Card>
        <Card className="border-gold/12 glass">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-gold" />
            <p className={`mt-1 font-serif text-3xl font-semibold ${scoreColor(100 - DRIFT_SCORE)}`}>{DRIFT_SCORE}</p>
            <p className="font-mono text-[10px] text-muted-foreground">Drift Score (lower = better)</p>
          </CardContent>
        </Card>
        <Card className="border-gold/12 glass">
          <CardContent className="p-4 text-center">
            <Scale className="mx-auto h-6 w-6 text-gold" />
            <p className="mt-1 font-serif text-xl font-semibold text-amber-300">{CONSTITUTIONAL_INTEGRITY}</p>
            <p className="font-mono text-[10px] text-muted-foreground">Constitutional Integrity</p>
          </CardContent>
        </Card>
      </div>

      {/* Alignment Breakdown */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><ShieldCheck className="h-4 w-4 text-gold" /> A. Constitutional Alignment Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(ALIGNMENT_BREAKDOWN).map(([key, val]) => (
              <div key={key} className="rounded border border-gold/8 bg-background/30 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-medium">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className={`font-mono text-[11px] ${scoreColor(val.score)}`}>{val.score}</span>
                </div>
                <p className="font-sans text-[10px] text-muted-foreground">{val.finding}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Core Gaps */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><AlertTriangle className="h-4 w-4 text-gold" /> E. Core Blueprint Gaps (ranked P0-P3)</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            {CORE_GAPS.map((g, i) => (
              <div key={i} className="border-b border-gold/5 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-medium">{g.gap}</span>
                  <Badge variant="outline" className={`font-mono text-[10px] ${g.rank === "P0" ? "border-rose-400/30 text-rose-300" : g.rank === "P1" ? "border-amber-400/30 text-amber-300" : "border-sky-400/30 text-sky-300"}`}>{g.rank}</Badge>
                </div>
                <p className="font-sans text-[10px] text-muted-foreground">Impact: {g.impact}</p>
                <p className="font-sans text-[10px] text-emerald-300">Fix: {g.fix}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preserved Core */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><CheckCircle2 className="h-4 w-4 text-gold" /> G. Preserved Core ({PRESERVED_CORE.length} items correctly aligned)</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            <div className="grid gap-1 sm:grid-cols-2">
              {PRESERVED_CORE.map((item, i) => (
                <p key={i} className="font-sans text-[10px] text-emerald-300"><CheckCircle2 className="mr-1 inline h-3 w-3" />{item}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing Core */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><XCircle className="h-4 w-4 text-gold" /> H. Missing or Weakened Core ({MISSING_CORE.length} items)</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            {MISSING_CORE.map((item, i) => (
              <div key={i} className="border-b border-gold/5 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[11px] font-medium">{item.capability}</span>
                  {statusBadge(item.status)}
                </div>
                <p className="font-sans text-[10px] text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Commercialization Drift */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><GitBranch className="h-4 w-4 text-gold" /> I. Commercialization Drift Assessment</CardTitle></CardHeader>
        <CardContent>
          <p className="font-sans text-[11px] text-amber-300 mb-2">{COMMERCIALIZATION_DRIFT.assessment}</p>
          <div className="max-h-48 overflow-y-auto">
            {COMMERCIALIZATION_DRIFT.perSystem.map(s => (
              <div key={s.system} className="flex items-center justify-between border-b border-gold/5 py-1">
                <span className="font-sans text-[11px]">{s.system}</span>
                <div className="flex items-center gap-2">
                  {statusBadge(s.classification)}
                  <span className="font-sans text-[10px] text-muted-foreground max-w-md">{s.reason}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 font-sans text-[10px] text-rose-300">{COMMERCIALIZATION_DRIFT.conclusion}</p>
        </CardContent>
      </Card>

      {/* Feature Preservation Matrix */}
      <Card className="mb-6 border-gold/12 glass">
        <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Database className="h-4 w-4 text-gold" /> Feature Preservation Matrix ({FEATURE_PRESERVATION_MATRIX.length} capabilities)</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b border-gold/15">
                  <th className="pb-2 pr-2 font-medium">Capability</th>
                  <th className="pb-2 pr-2 font-medium">Status</th>
                  <th className="pb-2 pr-2 font-medium">CRE</th>
                  <th className="pb-2 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_PRESERVATION_MATRIX.map(f => (
                  <tr key={f.capability} className="border-b border-gold/5">
                    <td className="py-1 pr-2">{f.capability}</td>
                    <td className="py-1 pr-2">{statusBadge(f.status)}</td>
                    <td className="py-1 pr-2">{f.constitutionalEnforcement ? <CheckCircle2 className="h-3 w-3 text-emerald-300" /> : <XCircle className="h-3 w-3 text-muted-foreground" />}</td>
                    <td className="py-1"><span className={`font-mono text-[10px] ${f.risk === "HIGH" ? "text-rose-300" : f.risk === "MEDIUM" ? "text-amber-300" : "text-emerald-300"}`}>{f.risk}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Enterprise Lifecycle + Graduation */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><GitBranch className="h-4 w-4 text-gold" /> J. Enterprise Lifecycle Integrity</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-emerald-300">Intact: {ENTERPRISE_LIFECYCLE.intact ? "YES" : "NO"}</p>
            <div className="max-h-48 overflow-y-auto">
              {ENTERPRISE_LIFECYCLE.stages.map((s, i) => (
                <div key={i} className="flex items-center justify-between border-b border-gold/5 py-0.5">
                  <span className="font-sans text-[10px]">{i + 1}. {s.stage}</span>
                  {statusBadge(s.status)}
                </div>
              ))}
            </div>
            <p className="mt-1 font-sans text-[10px] text-amber-300">{ENTERPRISE_LIFECYCLE.assessment}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><CheckCircle2 className="h-4 w-4 text-gold" /> K. Graduation Integrity</CardTitle></CardHeader>
          <CardContent>
            <p className="font-sans text-[11px] text-emerald-300">Intact: {GRADUATION_INTEGRITY.intact ? "YES" : "NO"}</p>
            {GRADUATION_INTEGRITY.implementation.map((item, i) => (
              <p key={i} className="font-sans text-[10px] text-muted-foreground">✓ {item}</p>
            ))}
            <p className="mt-1 font-sans text-[10px] text-emerald-300">No permanent lock-in: {GRADUATION_INTEGRITY.noPermanentLockIn}</p>
            <p className="font-sans text-[10px] text-amber-300">Gap: {GRADUATION_INTEGRITY.gap}</p>
          </CardContent>
        </Card>
      </div>

      {/* Terminology + Brain AI */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><FileText className="h-4 w-4 text-gold" /> L. Terminology Integrity</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-2">{statusBadge(TERMINOLOGY_INTEGRITY.status)}</p>
            <p className="font-mono text-[10px] uppercase text-emerald-300">Pass Areas</p>
            <div className="max-h-24 overflow-y-auto">{TERMINOLOGY_INTEGRITY.passAreas.map((a, i) => <p key={i} className="font-sans text-[10px] text-muted-foreground">✓ {a}</p>)}</div>
            <p className="mt-2 font-mono text-[10px] uppercase text-rose-300">Fail Areas</p>
            <div className="max-h-24 overflow-y-auto">{TERMINOLOGY_INTEGRITY.failAreas.map((a, i) => <p key={i} className="font-sans text-[10px] text-muted-foreground">✗ {a}</p>)}</div>
            <p className="mt-2 font-sans text-[10px] text-amber-300">{TERMINOLOGY_INTEGRITY.assessment}</p>
          </CardContent>
        </Card>

        <Card className="border-gold/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Crown className="h-4 w-4 text-gold" /> M. Brain AI Alignment</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-2">{statusBadge(BRAIN_AI_ALIGNMENT.status)}</p>
            <div className="max-h-48 overflow-y-auto">
              {BRAIN_AI_ALIGNMENT.findings.map((f, i) => <p key={i} className="font-sans text-[10px] text-muted-foreground">{f}</p>)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DO NOT CHANGE + EXECUTE ONLY */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-rose-400/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><ShieldCheck className="h-4 w-4 text-rose-300" /> N. DO NOT CHANGE List ({DO_NOT_CHANGE_LIST.length} immutable concepts)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {DO_NOT_CHANGE_LIST.map((item, i) => (
                <p key={i} className="font-sans text-[10px] text-rose-300">🔒 {item}</p>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-400/12 glass">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-base"><Rocket className="h-4 w-4 text-emerald-300" /> O. EXECUTION ONLY List ({EXECUTION_ONLY_LIST.length} items)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {EXECUTION_ONLY_LIST.map((item, i) => (
                <p key={i} className="font-sans text-[10px] text-emerald-300">→ {item}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Corrections Required */}
      <Card className="mb-6 border-gold/20 glass-gold">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-gold" />
            <p className="font-serif text-base font-semibold text-gold-gradient">Corrections Required Before Full Execution</p>
          </div>
          <div className="mt-3 grid gap-2">
            {FINAL_DECISION.correctionsRequired.map((c, i) => (
              <div key={i} className="rounded border border-gold/8 bg-background/30 p-2">
                <p className="font-sans text-[11px]"><span className="font-mono text-[10px] text-gold-light">{i + 1}.</span> {c}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 font-sans text-sm italic text-gold-gradient">{FINAL_DECISION.afterCorrections}</p>
        </CardContent>
      </Card>
    </div>
  );
}
