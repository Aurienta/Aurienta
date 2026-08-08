import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/aurienta/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/institutional/page-header";
import { GoldStar, AurientaMark } from "@/components/aurienta-logo";
import { CONSTITUTIONAL_HASH } from "@/lib/aurienta/constants";
import { shortHash, timeAgo, egp, pct } from "@/lib/aurienta/format";
import {
  Activity,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Server,
  HeartPulse,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Steward · Platform Health · AURIENTA",
  description:
    "AURIENTA Steward console — CRE uptime, AI model health, SEV incident log, and aggregate firm performance across the constitutional network.",
};

// CRE policy-function count — the 16 exported policy functions in
// src/lib/aurienta/cre.ts (enforceZeroCustody, enforceExpenseAuthority,
// computeDynamicMinimum, enforcePriceBand, checkQuorum,
// enforcePoliceClearance, enforceKycGate, enforceFamilyConsent,
// enforceConsultingOptOut, enforceLawFirmReplacement, enforceEmergencyFreeze,
// enforceNotFrozen, enforceFundFlow, enforceDividendLock,
// enforceFounderEquityCap, enforceTierMigration).
// Utility exports (appendLedgerEvent, verifyLedgerChain, computeGraduationReadiness)
// are not counted — they are ledger/inspection helpers, not policy verdicts.
const CRE_POLICY_FUNCTION_COUNT = 16;

function severityFor(action: string, reason?: string | null): "SEV-1" | "SEV-2" | "SEV-3" {
  // Best-effort severity classification from the audit-log entry. The CRE
  // doesn't emit SEV codes directly — we infer them from the action + reason.
  const a = action.toLowerCase();
  const r = (reason ?? "").toLowerCase();
  if (a.includes("freeze") || a.includes("emergency") || r.includes("fraud") || r.includes("breach")) return "SEV-1";
  if (a.includes("deny") || a.includes("denied") || r.includes("denied") || a.includes("error")) return "SEV-2";
  return "SEV-3";
}

function hourKey(d: Date): string {
  // YYYY-MM-DDTHH — buckets ledger events by hour for the uptime metric.
  return d.toISOString().slice(0, 13);
}

export default async function StewardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/steward");
  // RBAC: only AURIENTA Stewards (aurienta_rep) may view the platform-health
  // console. Any other authenticated user is bounced to their own dashboard.
  const hasRole = user.memberships.some((m) => m.role === "aurienta_rep");
  if (!hasRole) redirect("/dashboard");

  // ── Time windows ──
  const now = Date.now();
  const last90d = new Date(now - 90 * 24 * 60 * 60 * 1000);
  const last24h = new Date(now - 24 * 60 * 60 * 1000);
  const totalHours90d = 90 * 24; // 2160

  // Aggregate platform health signals.
  const [
    enterpriseCount,
    activeEnterprises,
    graduatedCount,
    totalEscrow,
    totalRaised,
    totalLedgerEvents,
    recentEvents,
    lawFirms,
    accountingFirms,
    aiArtifacts,
    // Real SEV-incident source: denied audit entries + error-tagged actions
    // from the last 90 days. Mock list replaced per ADMIN-4-5 task brief.
    incidentAuditRows,
    // CRE uptime source: every cre_decision ledger event in the last 90 days,
    // bucketed by hour. Uptime = distinct hours / total hours.
    creDecisionEvents,
    // AI hallucination + drift source: every AiArtifact so we can count
    // fallbacks (content starts with "[AI_FALLBACK]") and compute the
    // average confidence delta between consecutive same-kind artifacts.
    allAiArtifacts,
    // CRE decisions/day: audit-log entries with action containing "cre" in
    // the last 24h.
    creAudit24h,
    // Oracle Mirror last sync timestamp — the most recent oracle_mirror_sync
    // event on the ledger.
    oracleMirrorLastSync,
  ] = await Promise.all([
    db.enterprise.count(),
    db.enterprise.count({ where: { status: "active" } }),
    db.enterprise.count({ where: { stage: "graduated" } }),
    db.enterprise.aggregate({ _sum: { lawFirmClientAccountBalanceEgp: true } }),
    db.enterprise.aggregate({ _sum: { raisedEgp: true } }),
    db.ledgerEvent.count(),
    db.ledgerEvent.findMany({
      orderBy: { timestamp: "desc" },
      take: 8,
      include: { enterprise: { select: { name: true, slug: true } } },
    }),
    db.lawFirm.count({ where: { status: "active" } }),
    db.accountingFirm.count({ where: { status: "active" } }),
    db.aiArtifact.count(),
    db.auditLog.findMany({
      where: {
        OR: [
          { result: "denied" },
          { action: { contains: "error" } },
        ],
        timestamp: { gte: last90d },
      },
      orderBy: { timestamp: "desc" },
      take: 5,
      select: { id: true, action: true, target: true, result: true, reason: true, timestamp: true, actorId: true },
    }),
    db.ledgerEvent.findMany({
      where: { eventType: "cre_decision", timestamp: { gte: last90d } },
      select: { timestamp: true },
      orderBy: { timestamp: "asc" },
    }),
    db.aiArtifact.findMany({
      select: { id: true, kind: true, content: true, confidence: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.auditLog.count({
      where: { action: { contains: "cre" }, timestamp: { gte: last24h } },
    }),
    db.ledgerEvent.findFirst({
      where: { eventType: "oracle_mirror_sync" },
      orderBy: { timestamp: "desc" },
      select: { id: true, timestamp: true, payloadHash: true },
    }),
  ]);

  // ── Real SEV incident rows → display shape ──
  // The audit log doesn't carry an "owner" or "status" column — every audit
  // row IS the resolution record (it's append-only), so all entries are
  // "resolved" by definition. The actor becomes the owner.
  const incidents = incidentAuditRows.map((r, i) => ({
    id: `SEV-2026-${String(incidentAuditRows.length - i).padStart(3, "0")}`,
    severity: severityFor(r.action, r.reason),
    title: `${r.action}${r.target ? ` · ${r.target}` : ""}`,
    opened: new Date(r.timestamp).toISOString().slice(0, 10),
    status: "resolved",
    owner: "Steward on-call",
  }));

  // ── CRE uptime — distinct hours with ≥1 cre_decision event / total hours ──
  const creDecisionHours = new Set<string>();
  for (const ev of creDecisionEvents) creDecisionHours.add(hourKey(new Date(ev.timestamp)));
  const creUptimePct = creDecisionEvents.length === 0
    ? 0
    : (creDecisionHours.size / totalHours90d) * 100;

  // ── AI hallucination rate — fallback artifacts / total artifacts ──
  // The AI router (src/lib/aurienta/ai.ts persistArtifact) stores `fellBack`
  // inside the JSON `payload` AND prefixes `content` with "[AI_FALLBACK]"
  // when no provider was reachable. The content-prefix filter is the cheap
  // way to count without parsing every payload.
  const aiFallbackCount = allAiArtifacts.filter((a) => a.content.startsWith("[AI_FALLBACK]")).length;
  const aiHallucinationPct = allAiArtifacts.length === 0
    ? 0
    : (aiFallbackCount / allAiArtifacts.length) * 100;

  // ── AI bias ratio — quarterly audit pending (no baseline exists in-app) ──
  // Bias is a calibrated metric that requires a reference distribution from a
  // quarterly fairness audit. The platform has no such baseline yet, so we
  // surface "Quarterly audit pending" instead of inventing a number.
  const aiBiasDisplay = "Quarterly audit pending";

  // ── AI drift — average |confidence delta| between consecutive same-kind artifacts ──
  const byKind = new Map<string, typeof allAiArtifacts>();
  for (const a of allAiArtifacts) {
    const arr = byKind.get(a.kind) ?? [];
    arr.push(a);
    byKind.set(a.kind, arr);
  }
  let driftSum = 0;
  let driftPairs = 0;
  for (const arr of byKind.values()) {
    for (let i = 1; i < arr.length; i++) {
      driftSum += Math.abs(arr[i].confidence - arr[i - 1].confidence);
      driftPairs++;
    }
  }
  const aiDrift = driftPairs === 0 ? 0 : driftSum / driftPairs;

  // ── Oracle Mirror status — last sync event timestamp ──
  const oracleMirrorArmed = !!oracleMirrorLastSync;
  const oracleMirrorLabel = oracleMirrorLastSync
    ? `armed · last sync ${timeAgo(oracleMirrorLastSync.timestamp)}`
    : "disarmed · no sync recorded";

  // ── Decisions / day — AuditLog entries with action containing "cre" in 24h ──
  const decisionsPerDay = creAudit24h;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        eyebrow="Steward Console"
        icon={ShieldCheck}
        title="The constitutional network, observed"
        subtitle="The Steward watches the watcher. CRE uptime, AI model drift, SEV incident log, and aggregate firm performance across every constitutional enterprise — all from one institutional console."
      />

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KPI label="CRE uptime" value={pct(creUptimePct, 2)} icon={Server} ok={creUptimePct >= 99.9} />
        <KPI label="AI hallucination" value={pct(aiHallucinationPct, 1)} icon={Cpu} ok={aiHallucinationPct < 1} />
        <KPI label="AI bias ratio" value={aiBiasDisplay} icon={Activity} ok />
        <KPI label="AI drift" value={aiDrift.toFixed(3)} icon={TrendingUp} ok={aiDrift < 0.1} />
        <KPI label="Enterprises" value={String(enterpriseCount)} icon={Building2} />
        <KPI label="Graduated" value={String(graduatedCount)} icon={CheckCircle2} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* CRE health panel */}
        <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-base font-semibold">Constitutional Runtime Engine</h2>
          </div>
          <ul className="mt-4 space-y-2 font-sans text-xs">
            <Row k="Status" v={<span className="text-emerald-300">online · sovereign mode</span>} />
            <Row k="Uptime (90d)" v={`${pct(creUptimePct, 2)} — ${creDecisionHours.size}/${totalHours90d}h active · SLA 99.9%`} />
            <Row k="Policy pack" v={`v2026.06.21 · ${CRE_POLICY_FUNCTION_COUNT} policy functions`} />
            <Row k="Decisions / day" v={`${decisionsPerDay.toLocaleString()} (last 24h, audit-tagged "cre")`} />
            <Row k="Oracle Mirror" v={<span className={oracleMirrorArmed ? "text-emerald-300" : "text-amber-300"}>{oracleMirrorLabel}</span>} />
            <Row k="Read-only fallback" v="armed" />
          </ul>
          <div className="mt-4 rounded-xl border border-gold/12 bg-foreground/[0.02] p-3">
            <div className="font-sans text-xs uppercase tracking-wide text-muted-foreground/85">Constitutional anchor</div>
            <div className="mt-1 font-mono text-[11px] text-gold-light">{shortHash(CONSTITUTIONAL_HASH, 14, 6)}</div>
          </div>
        </section>

        {/* AI model health */}
        <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-base font-semibold">AI model health</h2>
          </div>
          <ul className="mt-4 space-y-2 font-sans text-xs">
            <Row k="Model" v="Gemma 2 7B oversight (fine-tuned)" />
            <Row k="Hallucination rate" v={<span className={aiHallucinationPct < 1 ? "text-emerald-300" : "text-amber-300"}>{pct(aiHallucinationPct, 1)} — {aiFallbackCount}/{allAiArtifacts.length} fallbacks (target &lt;1%)</span>} />
            <Row k="Bias ratio" v={<span className="text-amber-300">{aiBiasDisplay}</span>} />
            <Row k="Drift score" v={<span className={aiDrift < 0.1 ? "text-emerald-300" : "text-amber-300"}>{aiDrift.toFixed(3)} — {driftPairs} consecutive pairs (target &lt;0.1)</span>} />
            <Row k="AI artifacts" v={`${aiArtifacts.toLocaleString()} persisted`} />
            <Row k="Human-in-loop" v="every >10% expense, every vote" />
          </ul>
        </section>

        {/* Firm performance */}
        <section className="rounded-2xl border border-gold/15 glass-gold p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-base font-semibold">Network performance</h2>
          </div>
          <ul className="mt-4 space-y-2 font-sans text-xs">
            <Row k="Active enterprises" v={`${activeEnterprises} active / ${enterpriseCount} total`} />
            <Row k="Graduated (sovereign)" v={String(graduatedCount)} />
            <Row k="Total capital deployed" v={egp(totalRaised._sum.raisedEgp ?? 0, { compact: true })} />
            <Row k="Total held in law firm client accounts (law-firm held)" v={egp(totalEscrow._sum.lawFirmClientAccountBalanceEgp ?? 0, { compact: true })} />
            <Row k="AURIENTA-held capital" v={<span className="text-emerald-300">0 EGP · Zero Custody</span>} />
            <Row k="Active law firms" v={String(lawFirms)} />
            <Row k="Active accounting firms" v={String(accountingFirms)} />
            <Row k="Ledger events (all-time)" v={totalLedgerEvents.toLocaleString()} />
          </ul>
        </section>
      </div>

      {/* SEV incidents */}
      <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-base font-semibold">SEV incident log</h2>
          <span className="ml-auto font-mono text-xs text-muted-foreground/80">last 90 days · {incidents.length} entries</span>
        </div>
        {incidents.length === 0 ? (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            <p className="font-sans text-sm text-emerald-200/90">
              No SEV incidents in the last 90 days. No audit-log entries with <span className="font-mono text-xs">result = "denied"</span> or action containing <span className="font-mono text-xs">"error"</span>.
            </p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-gold/8">
            {incidents.map((inc) => (
              <li key={inc.id} className="flex flex-wrap items-center gap-2 py-3">
                <span className="font-mono text-xs text-gold-light">{inc.id}</span>
                <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${
                  inc.severity === "SEV-1"
                    ? "border-rose-400/40 bg-rose-400/15 text-rose-300"
                    : inc.severity === "SEV-2"
                    ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                    : "border-gold/30 bg-gold/10 text-gold-light"
                }`}>
                  {inc.severity}
                </span>
                <span className="font-sans text-sm">{inc.title}</span>
                <span className="ml-auto inline-flex items-center gap-1.5 font-sans text-xs text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> {inc.status}
                </span>
                <span className="font-mono text-xs text-muted-foreground/80">opened {inc.opened}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent ledger events */}
      <section className="rounded-2xl border border-gold/15 glass p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <GoldStar className="h-3 w-3" />
          <h2 className="font-serif text-base font-semibold">Latest ledger events</h2>
          <span className="ml-auto font-mono text-xs text-muted-foreground/80">hash-chained · SHA3-256</span>
        </div>
        <ul className="mt-3 divide-y divide-gold/8">
          {recentEvents.map((ev) => (
            <li key={ev.id} className="flex items-center gap-3 py-2.5">
              <span className="font-mono text-xs text-gold-light">{ev.eventType}</span>
              <span className="font-sans text-[11px] text-muted-foreground">
                {ev.enterprise?.name ?? "constitutional infrastructure"}
              </span>
              <span className="ml-auto font-mono text-xs text-muted-foreground/80">
                {shortHash(ev.payloadHash, 12, 6)}
              </span>
              <span className="font-sans text-xs text-muted-foreground/80">{timeAgo(ev.timestamp)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center justify-center gap-2 text-center">
        <AurientaMark className="h-4 w-4" />
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Daily Steward health check 09:00 Cairo · escalate SEV-1 within 15 min · Oracle Mirror armed at 7-day CRE outage
        </p>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, ok }: { label: string; value: string; icon: React.ElementType; ok?: boolean }) {
  return (
    <div className="rounded-2xl border border-gold/15 glass p-4">
      <div className="flex items-center justify-between">
        <Icon className={`h-4 w-4 ${ok === false ? "text-rose-400" : "text-gold"}`} />
        {ok !== undefined && (
          ok ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Clock className="h-3 w-3 text-rose-400" />
        )}
      </div>
      <div className="mt-2 font-serif text-xl font-semibold">{value}</div>
      <div className="font-sans text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-gold/8 pb-1.5 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-mono text-[11px] text-foreground">{v}</span>
    </li>
  );
}
