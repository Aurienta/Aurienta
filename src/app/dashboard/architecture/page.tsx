import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/aurienta/auth";
import {
  INSTITUTIONAL_ARCHITECTURE,
  RACI_MATRIX,
  IMPLEMENTATION_ROADMAP_90D,
} from "@/lib/aurienta/institutional-architecture";
import {
  ALL_LEGAL_CLAUSES,
  LEGAL_CLAUSES_REGISTRY,
  type LegalClause,
} from "@/lib/aurienta/legal-clauses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GoldStar } from "@/components/aurienta-logo";
import {
  Building2,
  Crown,
  Shield,
  Cpu,
  Layers,
  Network,
  GitBranch,
  Landmark,
  Scale,
  Hash,
  Lock,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { PageTransition } from "@/components/dashboard/page-transition";

export const metadata = { title: "Institutional Architecture · AURIENTA" };
export const dynamic = "force-dynamic";

// ─── Style maps (gold-family only, no indigo/blue) ───────────────────────────
const RACI_COLORS: Record<string, string> = {
  "A/R": "text-gold font-semibold",
  A: "text-gold-light font-semibold",
  R: "text-gold font-medium",
  C: "text-muted-foreground",
  I: "text-muted-foreground/55",
};

const PHASE_STYLES: Record<"Phase 1" | "Phase 2" | "Phase 3" | "Phase 4", string> = {
  "Phase 1": "border-gold/45 bg-gold/15 text-gold",
  "Phase 2": "border-gold/30 bg-gold/10 text-gold-light",
  "Phase 3": "border-gold/22 bg-gold/8 text-gold-light/90",
  "Phase 4": "border-gold/15 bg-gold/5 text-muted-foreground",
};

const AGREEMENT_TYPE_BADGE: Record<LegalClause["agreementType"], string> = {
  MSA: "border-gold/35 text-gold",
  LawFirmPartnership: "border-gold/28 text-gold-light",
  BankTripartite: "border-gold/45 text-gold",
  IntercompanySLA: "border-gold/20 text-gold-light",
};

const AGREEMENT_TYPE_LABEL: Record<LegalClause["agreementType"], string> = {
  MSA: "Master Service Agreement",
  LawFirmPartnership: "Law Firm Partnership",
  BankTripartite: "Bank Tripartite",
  IntercompanySLA: "Intercompany SLA",
};

function truncateHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-5)}`;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function ArchitecturePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/dashboard/architecture");

  const arch = INSTITUTIONAL_ARCHITECTURE;
  const { holding, tech, opco, advisory, middleware } = arch.entities;
  const settlement = arch.settlementArchitecture;
  const regulatory = arch.regulatoryPositioning;

  return (
    <PageTransition className="mx-auto max-w-6xl space-y-8 py-2">
      {/* ─── 1. HEADER ───────────────────────────────────────────────────── */}
      <header className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <GoldStar className="h-4 w-4" />
          <Badge
            variant="outline"
            className="border-gold/35 bg-gold/5 font-mono text-[10px] uppercase tracking-[0.18em] text-gold"
          >
            Egypt-Fortress Production v2.0
          </Badge>
          <Badge
            variant="outline"
            className="border-gold/15 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
          >
            arch.{arch.version}
          </Badge>
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold-light/80">
            Institutional Architecture · Canonical Corporate Structure
          </span>
        </div>

        <h1 className="font-serif text-3xl font-semibold text-gold-gradient sm:text-4xl">
          {arch.group}
        </h1>

        <p className="font-sans text-sm text-muted-foreground">
          Founder & Sole Owner:{" "}
          <span className="text-gold-light">{arch.founder}</span> · {arch.ownership}
        </p>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <Hash className="h-3.5 w-3.5 text-gold/70" />
          <span className="text-muted-foreground/60">constitutionalHash</span>
          <span className="text-muted-foreground/30">·</span>
          <span
            className="text-gold-light"
            title={arch.constitutionalHash}
            aria-label={`Constitutional hash: ${arch.constitutionalHash}`}
          >
            {truncateHash(arch.constitutionalHash)}
          </span>
        </div>
      </header>

      {/* ─── 2. FOUNDER CARD ────────────────────────────────────────────── */}
      <Card className="border-gold/22 glass-gold">
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <Crown className="h-9 w-9 text-gold" aria-hidden />
          <div className="flex-1">
            <p className="font-serif text-lg font-semibold text-gold-light">
              {arch.founder}
            </p>
            <p className="font-sans text-xs text-muted-foreground">
              {arch.founderTitle} · {arch.ownership}
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-gold/40 bg-gold/10 font-mono text-[10px] uppercase tracking-[0.18em] text-gold"
          >
            100% Equity Control
          </Badge>
        </CardContent>
      </Card>

      {/* ─── 3. CORPORATE HIERARCHY ─────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle
          icon={<Building2 className="h-4 w-4" />}
          title="Corporate Hierarchy — The Fortress Chassis"
          sub="Holding JSC owns 4 direct sister LLCs. Bankruptcy-remote isolation by design — OpCo insolvency cannot reach Tech (IP), Advisory (humans), or Middleware (API relay)."
        />

        {/* Holding — top of tree */}
        <Card className="border-gold/28 glass-gold">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gold" aria-hidden />
                <CardTitle className="font-serif text-lg text-gold-light">
                  {holding.name}
                </CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge className="border border-gold/40 bg-gold/15 font-mono text-[10px] uppercase tracking-[0.12em] text-gold">
                  JSC · Law 159/1981
                </Badge>
                <Badge
                  variant="outline"
                  className="border-gold/30 font-mono text-[10px] text-gold-light"
                >
                  Class A · Ordinary
                </Badge>
                <Badge
                  variant="outline"
                  className="border-gold/55 bg-gold/10 font-mono text-[10px] text-gold"
                >
                  Class B · Golden / Constitutional
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-sans text-xs text-muted-foreground">
              {holding.ownership} · Non-operating holding company.
            </p>
            <div className="max-h-32 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-1.5">
                {holding.responsibilities.map((r: string) => (
                  <Badge
                    key={r}
                    variant="outline"
                    className="border-gold/20 font-mono text-[10px] text-gold-light/90"
                  >
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="font-sans text-[11px] text-muted-foreground">
              <span className="text-muted-foreground/60">Does not do:</span>{" "}
              <span className="italic">{holding.doesNotDo}</span>
            </p>
          </CardContent>
        </Card>

        {/* Tree connectors */}
        <div className="flex flex-col items-center" aria-hidden>
          <div className="h-5 w-px bg-gold/30" />
          <div className="h-px w-px bg-gold/30" />
        </div>

        {/* 4 sister subsidiaries */}
        <div className="grid gap-4 md:grid-cols-2">
          <SubsidiaryCard
            icon={<Cpu className="h-4 w-4 text-gold" />}
            name={tech.name}
            legalForm={tech.legalForm}
            parent={tech.parent}
            responsibilities={tech.responsibilities}
            revenueModel={tech.revenueModel}
            doesNotDo={tech.doesNotDo}
          />

          <SubsidiaryCard
            icon={<Layers className="h-4 w-4 text-gold" />}
            name={opco.name}
            legalForm={opco.legalForm}
            parent={opco.parent}
            responsibilities={opco.responsibilities}
            revenueModel={opco.revenueModel}
            doesNotDo={opco.doesNotDo}
            highlightLabel="Regulatory Path"
            highlight={
              <div className="space-y-0.5 font-sans text-[11px]">
                <p>
                  <span className="text-gold">Primary:</span>{" "}
                  <span className="text-muted-foreground">
                    {opco.regulatoryPath.primary}
                  </span>
                </p>
                <p>
                  <span className="text-gold-light">Secondary:</span>{" "}
                  <span className="text-muted-foreground">
                    {opco.regulatoryPath.secondary}
                  </span>
                </p>
                <p className="text-red-400/70">
                  <span className="line-through">
                    {opco.regulatoryPath.avoided}
                  </span>
                </p>
              </div>
            }
          />

          <SubsidiaryCard
            icon={<Network className="h-4 w-4 text-gold" />}
            name={advisory.name}
            legalForm={advisory.legalForm}
            parent={advisory.parent}
            responsibilities={advisory.responsibilities}
            revenueModel={advisory.revenueModel}
            doesNotDo={advisory.doesNotDo}
            highlightLabel="Isolation Purpose"
            highlight={
              <p className="font-sans text-[11px] italic text-muted-foreground">
                {advisory.isolationPurpose}
              </p>
            }
          />

          <SubsidiaryCard
            icon={<GitBranch className="h-4 w-4 text-gold" />}
            name={middleware.name}
            legalForm={middleware.legalForm}
            parent={middleware.parent}
            responsibilities={middleware.responsibilities}
            revenueModel={middleware.revenueModel}
            doesNotDo={middleware.doesNotDo}
            highlightLabel="Non-Custodial Purity"
            highlight={
              <p className="font-sans text-[11px] italic text-gold-light/90">
                {middleware.nonCustodialPurity}
              </p>
            }
            bindingRecordClause={middleware.bindingRecordClause}
          />
        </div>
      </section>

      {/* ─── 4. SHARE CAPITAL ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle
          icon={<Scale className="h-4 w-4" />}
          title="Share Capital Structure"
          sub="Dual-class shares — economic ownership (Class A) is separated from the constitutional veto (Class B)."
        />
        <Card className="border-gold/18 glass-gold">
          <CardContent className="space-y-3 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Class A */}
              <div className="space-y-2 rounded-lg border border-gold/15 bg-gold/5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-gold/30 font-mono text-[10px] text-gold-light"
                  >
                    Class A
                  </Badge>
                  <p className="font-serif text-sm font-semibold text-gold-light">
                    {holding.shareClasses.classA.name}
                  </p>
                </div>
                <p className="font-sans text-[11px] text-muted-foreground">
                  <span className="text-gold-light/60">Holders:</span>{" "}
                  {holding.shareClasses.classA.holders}
                </p>
                <p className="font-sans text-[11px] text-muted-foreground">
                  <span className="text-gold-light/60">Rights:</span>{" "}
                  {holding.shareClasses.classA.rights}
                </p>
              </div>

              {/* Class B */}
              <div className="space-y-2 rounded-lg border border-gold/35 bg-gold/10 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-gold/55 bg-gold/10 font-mono text-[10px] text-gold"
                  >
                    Class B
                  </Badge>
                  <p className="font-serif text-sm font-semibold text-gold">
                    {holding.shareClasses.classB.name}
                  </p>
                </div>
                <p className="font-sans text-[11px] text-muted-foreground">
                  <span className="text-gold/70">Holders:</span>{" "}
                  {holding.shareClasses.classB.holders}
                </p>
                <p className="font-sans text-[11px] text-muted-foreground">
                  <span className="text-gold/70">Rights:</span>{" "}
                  {holding.shareClasses.classB.rights}
                </p>
                <Separator className="bg-gold/15" />
                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-gold/80">
                  Non-Amendable Rules
                </p>
                <ul className="space-y-1">
                  {holding.shareClasses.classB.nonAmendableRules.map(
                    (rule: string) => (
                      <li
                        key={rule}
                        className="flex items-start gap-1.5 font-sans text-[11px] text-muted-foreground"
                      >
                        <Lock
                          className="mt-0.5 h-3 w-3 shrink-0 text-gold/70"
                          aria-hidden
                        />
                        <span>{rule}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>

            <p className="font-mono text-[10px] text-muted-foreground">
              <span className="text-gold-light/70">Legal basis:</span>{" "}
              {holding.shareClasses.classB.legalBasis}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ─── 5. NON-CUSTODIAL SETTLEMENT ARCHITECTURE ───────────────────── */}
      <section className="space-y-3">
        <SectionTitle
          icon={<Hash className="h-4 w-4" />}
          title={settlement.name}
          sub={settlement.purpose}
        />
        <Card className="border-gold/18 glass-gold">
          <CardContent className="space-y-4 p-5">
            {/* 6-step Hash-Only flow */}
            <ol className="space-y-2">
              {settlement.flow.map(
                (s: { step: number; actor: string; action: string }) => (
                  <li key={s.step} className="flex items-start gap-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-mono text-[11px] text-gold"
                      aria-hidden
                    >
                      {s.step}
                    </span>
                    <div className="flex-1">
                      <p className="font-sans text-[12px] font-medium text-gold-light">
                        {s.actor}
                      </p>
                      <p className="font-sans text-[11px] text-muted-foreground">
                        {s.action}
                      </p>
                    </div>
                  </li>
                ),
              )}
            </ol>

            <Separator className="bg-gold/15" />

            {/* 4 legal consequence statements */}
            <div className="space-y-2">
              <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-gold/80">
                Legal Consequence
              </p>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {settlement.legalConsequence.map((c: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 rounded-md border border-gold/12 bg-gold/5 p-2"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-3 w-3 shrink-0 text-gold/80"
                      aria-hidden
                    />
                    <span className="font-sans text-[11px] text-muted-foreground">
                      {c}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Antifragility Vault sub-card */}
            <div className="rounded-lg border border-gold/22 bg-gold/8 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Landmark className="h-4 w-4 text-gold" aria-hidden />
                <p className="font-serif text-sm font-semibold text-gold-light">
                  Antifragility Vault
                </p>
                <Badge
                  variant="outline"
                  className="border-gold/30 font-mono text-[10px] text-gold"
                >
                  0.5% contribution
                </Badge>
              </div>
              <div className="grid gap-2 font-sans text-[11px] sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground/60">Legal:</span>{" "}
                  <span className="text-muted-foreground">
                    {settlement.antifragilityVault.legal}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground/60">Owner:</span>{" "}
                  <span className="text-muted-foreground">
                    {settlement.antifragilityVault.owner}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground/60">
                    AURIENTA claim:
                  </span>{" "}
                  <span className="font-semibold text-red-400/80">
                    {settlement.antifragilityVault.aurientaClaim}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground/60">
                    Contribution:
                  </span>{" "}
                  <span className="text-gold-light">
                    {settlement.antifragilityVault.contribution}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground/60">Purpose:</span>{" "}
                  <span className="italic text-muted-foreground">
                    {settlement.antifragilityVault.purpose}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ─── 6. REGULATORY POSITIONING ──────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle
          icon={<Scale className="h-4 w-4" />}
          title="Regulatory Positioning — FRA-Only Strategy"
          sub="AURIENTA positioned as a software vendor, never as a Payment Initiation Service Provider (PSP)."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {/* Primary Path — positive */}
          <Card className="border-gold/40 bg-gold-gradient-soft">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gold" aria-hidden />
                <CardTitle className="font-serif text-sm text-gold-light">
                  {regulatory.primaryPath.name}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 font-sans text-[11px] text-muted-foreground">
              <p>
                <span className="text-gold/70">Entity:</span>{" "}
                {regulatory.primaryPath.entity}
              </p>
              <p>
                <span className="text-gold/70">Basis:</span>{" "}
                {regulatory.primaryPath.basis}
              </p>
              <p>
                <span className="text-gold/70">Classification:</span>{" "}
                {regulatory.primaryPath.classification}
              </p>
              <p>
                <span className="text-gold/70">Requirement:</span>{" "}
                {regulatory.primaryPath.requirement}
              </p>
              <p className="pt-1 italic text-gold-light/90">
                {regulatory.primaryPath.implication}
              </p>
            </CardContent>
          </Card>

          {/* Secondary Path — neutral */}
          <Card className="border-gold/15 glass-gold">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowRight
                  className="h-4 w-4 text-gold/70"
                  aria-hidden
                />
                <CardTitle className="font-serif text-sm text-gold-light">
                  {regulatory.secondaryPath.name}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 font-sans text-[11px] text-muted-foreground">
              <p>
                <span className="text-gold/70">Entity:</span>{" "}
                {regulatory.secondaryPath.entity}
              </p>
              <p>
                <span className="text-gold/70">Basis:</span>{" "}
                {regulatory.secondaryPath.basis}
              </p>
              <p>
                <span className="text-gold/70">Scope:</span>{" "}
                {regulatory.secondaryPath.scope}
              </p>
              <p className="pt-1 italic text-gold-light/80">
                {regulatory.secondaryPath.framing}
              </p>
            </CardContent>
          </Card>

          {/* CBE Path — AVOIDED */}
          <Card className="border-red-500/25 bg-red-500/5">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <XCircle
                    className="h-4 w-4 text-red-400/70"
                    aria-hidden
                  />
                  <CardTitle className="font-serif text-sm text-muted-foreground line-through decoration-red-400/50">
                    {regulatory.cbePath.name.replace(
                      " — DELIBERATELY AVOIDED",
                      "",
                    )}
                  </CardTitle>
                </div>
                <Badge className="border border-red-500/40 bg-red-500/15 font-mono text-[10px] uppercase tracking-[0.18em] text-red-300">
                  Avoided
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="font-sans text-[11px] text-muted-foreground">
              <p className="italic">{regulatory.cbePath.reason}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── 7. BLUEPRINT MAPPING TABLE ─────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle
          icon={<FileText className="h-4 w-4" />}
          title="Blueprint Mapping"
          sub="Which entity implements which constitutional volume."
        />
        <Card className="border-gold/12 glass">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-gold/15">
                    <th className="px-4 py-2 font-medium text-gold-light">
                      Feature
                    </th>
                    <th className="px-4 py-2 font-medium text-gold-light">
                      Volume
                    </th>
                    <th className="px-4 py-2 font-medium text-gold-light">
                      Implementer
                    </th>
                    <th className="px-4 py-2 font-medium text-gold-light">
                      Legal Entity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {arch.blueprintMapping.map(
                    (row: {
                      feature: string;
                      volume: string;
                      implementer: string;
                      entity: string;
                    }) => (
                      <tr
                        key={row.feature}
                        className="border-b border-gold/5 last:border-0"
                      >
                        <td className="px-4 py-2 font-medium text-gold-light/90">
                          {row.feature}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant="outline"
                            className="border-gold/20 font-mono text-[10px] text-gold-light/80"
                          >
                            {row.volume}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {row.implementer}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {row.entity}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ─── 8. LEGAL CLAUSES ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle
          icon={<FileText className="h-4 w-4" />}
          title="Legal Clauses — Contractual Shield"
          sub="Canonical clauses embedded across MSAs, Law Firm Partnerships, Bank Tripartite Agreements, and Intercompany SLAs."
        />

        {/* Registry summary */}
        <Card className="border-gold/18 glass-gold">
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 font-sans text-[11px]">
            <div>
              <span className="text-muted-foreground/60">Version:</span>{" "}
              <span className="font-mono text-gold">
                {LEGAL_CLAUSES_REGISTRY.version}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground/60">Adopted:</span>{" "}
              <span className="font-mono text-gold-light">
                {LEGAL_CLAUSES_REGISTRY.adopted}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground/60">Total Clauses:</span>{" "}
              <span className="font-mono text-gold">
                {LEGAL_CLAUSES_REGISTRY.totalClauses}
              </span>
            </div>
            <Separator
              orientation="vertical"
              className="hidden h-4 bg-gold/15 sm:block"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground/60">By Agreement Type:</span>
              {(
                Object.keys(
                  LEGAL_CLAUSES_REGISTRY.byAgreementType,
                ) as Array<keyof typeof LEGAL_CLAUSES_REGISTRY.byAgreementType>
              ).map((k) => (
                <Badge
                  key={k}
                  variant="outline"
                  className="border-gold/20 font-mono text-[10px] text-gold-light/80"
                >
                  {k} · {LEGAL_CLAUSES_REGISTRY.byAgreementType[k].length}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Clauses (1-column, long form) */}
        <div className="space-y-4">
          {ALL_LEGAL_CLAUSES.map((clause: LegalClause) => (
            <Card key={clause.clauseId} className="border-gold/15 glass-gold">
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-gold/40 bg-gold/10 font-mono text-[10px] text-gold"
                  >
                    {clause.clauseId}
                  </Badge>
                  <p className="font-serif text-sm font-semibold text-gold-light">
                    {clause.title}
                  </p>
                  <Badge
                    variant="outline"
                    className={`ml-auto font-mono text-[10px] ${AGREEMENT_TYPE_BADGE[clause.agreementType]}`}
                    title={AGREEMENT_TYPE_LABEL[clause.agreementType]}
                  >
                    {clause.agreementType}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 font-sans text-[11px]">
                  <span className="text-muted-foreground/60">Parties:</span>
                  {clause.parties.map((p: string) => (
                    <Badge
                      key={p}
                      variant="outline"
                      className="border-gold/15 font-mono text-[10px] text-muted-foreground"
                    >
                      {p}
                    </Badge>
                  ))}
                </div>

                <p className="font-sans text-[11px] text-muted-foreground">
                  <span className="text-gold/70">Purpose:</span>{" "}
                  <span className="italic">{clause.purpose}</span>
                </p>

                {clause.legalBasis && (
                  <p className="font-mono text-[10px] text-muted-foreground">
                    <span className="text-gold-light/70">Legal basis:</span>{" "}
                    {clause.legalBasis}
                  </p>
                )}

                <blockquote className="max-h-44 overflow-y-auto rounded-md border-l-2 border-gold/40 bg-gold/5 px-4 py-3 font-serif text-[12px] italic leading-relaxed text-muted-foreground">
                  “{clause.text}”
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── 9. RACI MATRIX ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle
          icon={<Network className="h-4 w-4" />}
          title="RACI Responsibility Matrix"
          sub="5-entity responsibility allocation across the constitutional chassis."
        />
        <Card className="border-gold/12 glass">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-gold/15">
                    <th className="px-4 py-2 font-medium text-gold-light">
                      Responsibility
                    </th>
                    <th className="px-2 py-2 text-center font-medium text-gold-light">
                      Holding
                    </th>
                    <th className="px-2 py-2 text-center font-medium text-gold-light">
                      Tech
                    </th>
                    <th className="px-2 py-2 text-center font-medium text-gold-light">
                      OpCo
                    </th>
                    <th className="px-2 py-2 text-center font-medium text-gold-light">
                      Advisory
                    </th>
                    <th className="px-2 py-2 text-center font-medium text-gold-light">
                      Middleware
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(RACI_MATRIX).map(
                    ([key, val]: [
                      string,
                      {
                        holding: string;
                        tech: string;
                        opco: string;
                        advisory: string;
                        middleware: string;
                      },
                    ]) => (
                      <tr
                        key={key}
                        className="border-b border-gold/5 last:border-0"
                      >
                        <td className="px-4 py-1.5 text-muted-foreground">
                          {key}
                        </td>
                        <td
                          className={`px-2 py-1.5 text-center font-mono text-[11px] ${RACI_COLORS[val.holding] ?? "text-muted-foreground"}`}
                        >
                          {val.holding}
                        </td>
                        <td
                          className={`px-2 py-1.5 text-center font-mono text-[11px] ${RACI_COLORS[val.tech] ?? "text-muted-foreground"}`}
                        >
                          {val.tech}
                        </td>
                        <td
                          className={`px-2 py-1.5 text-center font-mono text-[11px] ${RACI_COLORS[val.opco] ?? "text-muted-foreground"}`}
                        >
                          {val.opco}
                        </td>
                        <td
                          className={`px-2 py-1.5 text-center font-mono text-[11px] ${RACI_COLORS[val.advisory] ?? "text-muted-foreground"}`}
                        >
                          {val.advisory}
                        </td>
                        <td
                          className={`px-2 py-1.5 text-center font-mono text-[11px] ${RACI_COLORS[val.middleware] ?? "text-muted-foreground"}`}
                        >
                          {val.middleware}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[10px] text-muted-foreground">
          <span>
            <span className="font-mono text-gold">R</span> = Responsible
          </span>
          <span>
            <span className="font-mono text-gold-light">A</span> = Accountable
          </span>
          <span>
            <span className="font-mono text-muted-foreground">C</span> = Consulted
          </span>
          <span>
            <span className="font-mono text-muted-foreground/55">I</span> =
            Informed
          </span>
          <span className="italic text-muted-foreground/60">
            · A/R = both Accountable and Responsible (sole-owner execution)
          </span>
        </div>
      </section>

      {/* ─── 10. IMPLEMENTATION ROADMAP ─────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle
          icon={<GitBranch className="h-4 w-4" />}
          title="Implementation Roadmap — 90 Days"
          sub="From architecture adoption (2026-09-02) to pilot operational readiness."
        />
        <Card className="border-gold/12 glass">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-gold/15">
                    <th className="px-4 py-2 font-medium text-gold-light">
                      Weeks
                    </th>
                    <th className="px-4 py-2 font-medium text-gold-light">
                      Action
                    </th>
                    <th className="px-4 py-2 font-medium text-gold-light">
                      Responsible
                    </th>
                    <th className="px-4 py-2 font-medium text-gold-light">
                      Phase
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {IMPLEMENTATION_ROADMAP_90D.map(
                    (item: {
                      weeks: string;
                      action: string;
                      responsible: string;
                      phase: "Phase 1" | "Phase 2" | "Phase 3" | "Phase 4";
                    }) => (
                      <tr
                        key={item.weeks}
                        className="border-b border-gold/5 last:border-0 align-top"
                      >
                        <td className="px-4 py-2 font-mono text-[11px] text-gold-light">
                          {item.weeks}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {item.action}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {item.responsible}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant="outline"
                            className={`font-mono text-[10px] ${PHASE_STYLES[item.phase]}`}
                          >
                            {item.phase}
                          </Badge>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ─── 11. SCALABILITY / PHASED STANDUP PRINCIPLE ────────────────── */}
      <section className="space-y-3">
        <SectionTitle
          icon={<GitBranch className="h-4 w-4" />}
          title={arch.scalabilityPrinciple.title}
          sub="Target end-state adopted at architecture-version 2.0. Execution is phased to match scale and capital efficiency."
        />
        <Card className="border-gold/18 glass-gold">
          <CardContent className="space-y-4 p-5">
            <p className="font-sans text-xs leading-relaxed text-muted-foreground">
              {arch.scalabilityPrinciple.text}
            </p>
            <Separator className="bg-gold/15" />
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {arch.scalabilityPrinciple.phases.map(
                (
                  p: {
                    phase: string;
                    entities: readonly string[];
                    note: string;
                  },
                  idx: number,
                ) => (
                  <li
                    key={p.phase}
                    className="rounded-lg border border-gold/15 bg-gold/5 p-3"
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-mono text-[10px] text-gold"
                        aria-hidden
                      >
                        {idx + 1}
                      </span>
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gold-light">
                        {p.phase}
                      </p>
                    </div>
                    <ul className="mb-1.5 space-y-0.5">
                      {p.entities.map((e: string) => (
                        <li
                          key={e}
                          className="font-sans text-[11px] text-muted-foreground"
                        >
                          · {e}
                        </li>
                      ))}
                    </ul>
                    <p className="font-sans text-[10px] italic text-muted-foreground/75">
                      {p.note}
                    </p>
                  </li>
                ),
              )}
            </ol>
          </CardContent>
        </Card>
      </section>

      <footer className="pb-6 pt-2 text-center font-sans text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">
        AURIENTA · Constitutional Enterprise Infrastructure · Egypt-Fortress
        Production v2.0
      </footer>
    </PageTransition>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({
  icon,
  title,
  sub,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="text-gold" aria-hidden>
          {icon}
        </span>
        <h2 className="font-serif text-base font-semibold text-gold-light">
          {title}
        </h2>
      </div>
      {sub && <p className="font-sans text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

type SubsidiaryCardProps = {
  icon: ReactNode;
  name: string;
  legalForm: string;
  parent: string;
  responsibilities: readonly string[];
  revenueModel: string;
  doesNotDo: string;
  highlightLabel?: string;
  highlight?: ReactNode;
  bindingRecordClause?: string;
};

function SubsidiaryCard({
  icon,
  name,
  legalForm,
  parent,
  responsibilities,
  revenueModel,
  doesNotDo,
  highlightLabel,
  highlight,
  bindingRecordClause,
}: SubsidiaryCardProps) {
  return (
    <Card className="border-gold/15 glass-gold">
      <CardHeader>
        <div className="flex items-start gap-2">
          <span className="mt-0.5" aria-hidden>
            {icon}
          </span>
          <div className="flex-1">
            <CardTitle className="font-serif text-base text-gold-light">
              {name}
            </CardTitle>
            <p className="font-sans text-[11px] text-muted-foreground">
              {legalForm}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-mono text-[10px] text-gold/70">← {parent}</p>

        <div className="max-h-28 overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-1.5">
            {responsibilities.slice(0, 5).map((r: string) => (
              <Badge
                key={r}
                variant="outline"
                className="border-gold/20 font-mono text-[10px] text-gold-light/90"
              >
                {r}
              </Badge>
            ))}
          </div>
        </div>

        <p className="font-sans text-[11px]">
          <span className="text-gold/70">Revenue:</span>{" "}
          <span className="text-muted-foreground">{revenueModel}</span>
        </p>

        <p className="font-sans text-[11px]">
          <span className="text-muted-foreground/60">Does not do:</span>{" "}
          <span className="italic text-muted-foreground">{doesNotDo}</span>
        </p>

        {highlight && (
          <div className="rounded-md border border-gold/15 bg-gold/5 p-2.5">
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-gold/80">
              {highlightLabel}
            </p>
            {highlight}
          </div>
        )}

        {bindingRecordClause && (
          <p className="border-l border-gold/15 pl-2 font-sans text-[10px] italic text-muted-foreground/70">
            {bindingRecordClause}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
