"use client";

/**
 * EgyptianLegalClausesViewer — Public page showing all Egyptian-law-specific
 * legal clauses organized by category.
 */

import * as React from "react";
import Link from "next/link";
import { Shield, FileText, AlertTriangle, Lock, Building2, Banknote, Scale, Users, GraduationCap, Coins, Globe } from "lucide-react";
import { ALL_EGYPTIAN_LEGAL_CLAUSES, type EgyptianLegalClause } from "@/lib/aurienta/egyptian-legal-clauses";
import { Badge } from "@/components/ui/badge";

const CATEGORY_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  registration: { icon: Shield, label: "Registration & Identity", color: "text-blue-600" },
  capital_partner: { icon: Banknote, label: "Capital Partner & Investment", color: "text-emerald-600" },
  workforce: { icon: Users, label: "Workforce & Employment", color: "text-amber-600" },
  founder: { icon: Building2, label: "Enterprise Formation", color: "text-purple-600" },
  graduation: { icon: GraduationCap, label: "Graduation (JSC)", color: "text-indigo-600" },
  dividend: { icon: Coins, label: "Dividends & Tax", color: "text-teal-600" },
  data_protection: { icon: Lock, label: "Data Protection (PDPL)", color: "text-red-600" },
  aml: { icon: AlertTriangle, label: "Anti-Money Laundering", color: "text-orange-600" },
  tax: { icon: FileText, label: "Tax Compliance", color: "text-cyan-600" },
  consumer_protection: { icon: Scale, label: "Consumer Protection", color: "text-rose-600" },
};

const CATEGORIES = Object.keys(CATEGORY_META);

export function EgyptianLegalClausesViewer() {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(ALL_EGYPTIAN_LEGAL_CLAUSES.map((c) => c.clauseId)));
  const collapseAll = () => setExpanded(new Set());

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-gold/15 bg-gradient-to-br from-gold/[0.06] to-transparent">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 border border-gold/25">
              <Scale className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-semibold text-foreground">
                Egyptian Legal Clauses
              </h1>
              <p className="font-sans text-sm text-muted-foreground">
                Arab Republic of Egypt · Version 1.0.0
              </p>
            </div>
          </div>
          <p className="font-sans text-base text-muted-foreground max-w-2xl">
            Egypt-specific legal clauses covering every regulated activity on the
            AURIENTA platform. Each clause cites the exact Egyptian law number and
            year. These clauses are mandatory and cannot be overridden by the
            Constitutional Runtime Engine or any platform rule.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Badge variant="outline" className="border-gold/25 text-gold">
              {ALL_EGYPTIAN_LEGAL_CLAUSES.length} total clauses
            </Badge>
            <Badge variant="outline" className="border-gold/25 text-gold">
              {CATEGORIES.length} categories
            </Badge>
            <Badge variant="outline" className="border-gold/25 text-gold">
              All must-accept
            </Badge>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={expandAll}
              className="rounded-lg border border-gold/20 px-3 py-1.5 font-sans text-xs font-medium text-gold transition-colors hover:bg-gold/5"
            >
              Expand all
            </button>
            <button
              onClick={collapseAll}
              className="rounded-lg border border-foreground/15 px-3 py-1.5 font-sans text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5"
            >
              Collapse all
            </button>
          </div>
        </div>
      </header>

      {/* Clauses by category */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {CATEGORIES.map((cat) => {
          const clauses = ALL_EGYPTIAN_LEGAL_CLAUSES.filter((c) => c.category === cat);
          if (clauses.length === 0) return null;
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          return (
            <section key={cat} className="mb-10">
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gold/5 border border-gold/15`}>
                  <Icon className={`h-4 w-4 ${meta.color}`} />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-semibold text-foreground">
                    {meta.label}
                  </h2>
                  <p className="font-sans text-xs text-muted-foreground">
                    {clauses.length} clause{clauses.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {clauses.map((clause) => (
                  <ClauseCard
                    key={clause.clauseId}
                    clause={clause}
                    expanded={expanded.has(clause.clauseId)}
                    onToggle={() => toggle(clause.clauseId)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="border-t border-gold/15 bg-background/60 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <p className="font-sans text-xs text-muted-foreground">
            These clauses are provided for informational purposes and constitute
            the legal framework for AURIENTA's operations in Egypt. They do not
            constitute legal advice. For specific legal questions, consult a
            licensed Egyptian attorney.
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link href="/legal" className="font-sans text-xs text-gold hover:text-gold-light underline">
              Full Platform Terms
            </Link>
            <Link href="/legal/privacy" className="font-sans text-xs text-gold hover:text-gold-light underline">
              Privacy Notice
            </Link>
            <Link href="/legal/constitution" className="font-sans text-xs text-gold hover:text-gold-light underline">
              Constitutional Charter
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ClauseCard({
  clause,
  expanded,
  onToggle,
}: {
  clause: EgyptianLegalClause;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gold/15 bg-background/40">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-gold/[0.02]"
        aria-expanded={expanded}
      >
        <span className="font-mono text-[10px] text-muted-foreground/60 shrink-0">
          {clause.clauseId}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-sm font-semibold text-foreground">
            {clause.title}
          </p>
          <p className="font-sans text-[11px] text-muted-foreground mt-0.5">
            Legal basis: <span className="font-mono text-gold/80">{clause.legalBasis}</span>
          </p>
        </div>
        {clause.mustAccept && (
          <Badge variant="outline" className="border-red-500/20 text-[9px] text-red-500 shrink-0">
            Required
          </Badge>
        )}
      </button>
      {expanded && (
        <div className="border-t border-gold/10 px-4 py-3">
          <p className="font-sans text-xs leading-relaxed text-foreground/80 whitespace-pre-line">
            {clause.text}
          </p>
        </div>
      )}
    </div>
  );
}
