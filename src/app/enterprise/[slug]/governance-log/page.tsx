import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { PublicTrustHeader, PublicTrustFooter } from "@/components/trust/public-shell";
import { AurientaMark, GoldStar } from "@/components/aurienta-logo";
import { CONSTITUTIONAL_HASH, TIER_META, STAGE_META } from "@/lib/aurienta/constants";
import { egp, shortHash, timeAgo } from "@/lib/aurienta/format";
import {
  ArrowLeft,
  ShieldCheck,
  Scale,
  Sparkles,
  CheckCircle2,
  XCircle,
  Cpu,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { PublicCreDecisionLog } from "@/components/transparency/public-cre-decision-log";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ent = await db.enterprise.findUnique({
    where: { slug },
    select: { name: true },
  });
  if (!ent) return { title: "Governance log not found · AURIENTA" };
  return {
    title: `${ent.name} · CRE Decision Log · AURIENTA`,
    description: `Public, anonymized CRE decision log for ${ent.name} — every constitutional policy verdict, signed with Ed25519, hash-chained to the immutable ledger.`,
  };
}

export default async function GovernanceLogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ent = await db.enterprise.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      tier: true,
      stage: true,
      legalForm: true,
      sector: true,
    },
  });

  if (!ent) notFound();

  const tierMeta = TIER_META[ent.tier];
  const stageMeta = STAGE_META[ent.stage] ?? STAGE_META.stage_1;

  // Aggregate counts for the hero (cre_decision events total).
  const totalDecisions = await db.ledgerEvent.count({
    where: { enterpriseId: ent.id, eventType: "cre_decision" },
  });
  const allowedCount = await db.ledgerEvent.count({
    where: {
      enterpriseId: ent.id,
      eventType: "cre_decision",
      // Heuristic: payload contains `"allowed":true` or `"decision":"allowed"`
      payload: { contains: `"allowed":true` },
    },
  });
  const deniedCount = await db.ledgerEvent.count({
    where: {
      enterpriseId: ent.id,
      eventType: "cre_decision",
      payload: { contains: `"allowed":false` },
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicTrustHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 font-sans text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href={`/enterprise/${ent.slug}`} className="transition-colors hover:text-gold">
              <span className="inline-flex items-center gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> {ent.name}
              </span>
            </Link>
            <span aria-hidden>/</span>
            <span className="text-gold-light/85">CRE decision log</span>
          </nav>

          {/* Hero */}
          <section className="mt-6 overflow-hidden rounded-3xl border border-gold/15 glass-gold p-6 sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2.5">
                <AurientaMark className="h-8 w-8" />
                <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-gold-light/85">
                  Tier {ent.tier} · {tierMeta?.legalForm ?? ent.legalForm} · {stageMeta.name}
                </span>
              </div>
              <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.05] sm:text-5xl">
                {ent.name}
                <span className="ml-3 font-sans text-sm font-normal text-muted-foreground">
                  CRE decision log
                </span>
              </h1>
              <p className="mt-3 max-w-3xl font-sans text-sm leading-relaxed text-muted-foreground">
                Every Constitutional Runtime Engine (CRE) decision recorded on the immutable ledger
                for this enterprise. Each decision is signed with Ed25519 and hash-chained — tamper-evident
                and court-admissible. Actor identities are anonymized per Egyptian PDPL Law 151/2020.
              </p>

              {/* Summary stats */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  label="Total decisions"
                  value={totalDecisions.toString()}
                  icon={ShieldCheck}
                />
                <StatCard
                  label="Allowed"
                  value={allowedCount.toString()}
                  icon={CheckCircle2}
                  tone="ok"
                />
                <StatCard
                  label="Denied"
                  value={deniedCount.toString()}
                  icon={XCircle}
                  tone="alert"
                />
                <StatCard
                  label="Policy coverage"
                  value="13 Rego policies"
                  icon={Cpu}
                />
              </div>
            </div>
          </section>

          {/* PDPL notice */}
          <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.04] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <div>
                <div className="font-sans text-xs font-semibold uppercase tracking-wide text-emerald-200/90">
                  PDPL Compliance — Egyptian Law 151/2020
                </div>
                <p className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground/85">
                  Actor identities are anonymized as &quot;Constitutional Partner&quot; or &quot;System&quot;.
                  No personal data is published. Governance decisions are enterprise-level records
                  and are disclosed per constitutional charter Article XIV.
                </p>
              </div>
            </div>
          </div>

          {/* Decision log (client component fetches from public API) */}
          <section className="mt-8">
            <PublicCreDecisionLog slug={ent.slug} enterpriseName={ent.name} />
          </section>

          {/* Disclaimer */}
          <section className="mt-8 rounded-2xl border border-gold/12 bg-foreground/[0.02] p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
              <div className="space-y-2">
                <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                  Every CRE decision references a constitutional Rego policy (e.g.{" "}
                  <code className="rounded bg-foreground/10 px-1 font-mono text-[11px]">zero_custody.rego</code>,{" "}
                  <code className="rounded bg-foreground/10 px-1 font-mono text-[11px]">expense_authority.rego</code>
                  ). The Ed25519 decision token is verifiable — recomputing the signature against the
                  payload hash proves the decision was not tampered with after the fact.
                </p>
                <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                  AURIENTA is a constitutional constitutional infrastructure, not an official government
                  registry. Data is self-reported by enterprises and verified by the CRE.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px] text-muted-foreground/85">
                  <span className="rounded-full border border-gold/15 bg-background/50 px-2.5 py-1">
                    Constitutional Hash: <span className="text-gold-light">{shortHash(CONSTITUTIONAL_HASH, 10, 6)}</span>
                  </span>
                  <a
                    href={`/api/public/enterprise/${ent.slug}/cre-decisions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-gold/15 bg-background/50 px-2.5 py-1 transition-colors hover:text-gold-light"
                  >
                    JSON API <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Quick links */}
          <section className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/enterprise/${ent.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-2 font-sans text-xs text-foreground transition-colors hover:bg-gold/5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Enterprise profile
            </Link>
            <Link
              href={`/enterprise/${ent.slug}/financials`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-2 font-sans text-xs text-foreground transition-colors hover:bg-gold/5"
            >
              Real-time financials <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/enterprise/${ent.slug}/trades`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-2 font-sans text-xs text-foreground transition-colors hover:bg-gold/5"
            >
              Trade log <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/enterprise/${ent.slug}/annual-report`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-4 py-2 font-sans text-xs text-foreground transition-colors hover:bg-gold/5"
            >
              <Sparkles className="h-3.5 w-3.5" /> Annual report
            </Link>
          </section>
        </div>
      </main>

      <PublicTrustFooter />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: "default" | "ok" | "alert";
}) {
  const toneCls =
    tone === "ok"
      ? "border-emerald-400/25 bg-emerald-400/[0.04]"
      : tone === "alert"
      ? "border-red-400/25 bg-red-400/[0.04]"
      : "border-gold/12 bg-foreground/[0.02]";
  const iconCls =
    tone === "ok" ? "text-emerald-300" : tone === "alert" ? "text-red-300" : "text-gold/80";
  return (
    <div className={`rounded-xl border p-4 ${toneCls}`}>
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/85">
        <Icon className={`h-3 w-3 ${iconCls}`} /> {label}
      </div>
      <div className="mt-1.5 font-serif text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}
